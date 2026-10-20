import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { mergePronunciation, type PronunciationReport, type SupportedLocale } from '@lingopulse/shared';
import { apiHeaders, getApiBaseUrl } from './config';
import { getUiLanguage } from '../i18n';
import { ensureAiConsent } from './aiConsent';

export interface ServerTranscript {
  transcript: string;
  confidence: number | null;
  /** Evaluación de pronunciación (Azure precisa o Gemini aproximada). */
  pronunciation: PronunciationReport | null;
  /** El servidor no detectó voz (micrófono tapado, muy lejos o sin permiso). */
  silent?: boolean;
  /** Hay una segunda pasada con IA disponible (ver reviewRecording). */
  reviewAvailable?: boolean;
  /** Id de la grabación en el servidor: la revisión ya empezó allí y se recoge sin reenviar el audio. */
  audioId?: string | null;
}

/** Resultado de la revisión de Gemini: transcripción literal + pronunciación estimada. */
export interface PronunciationReview {
  transcript: string;
  pronunciation: PronunciationReport | null;
}

const MIME_BY_EXT: Record<string, string> = {
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  '3gp': 'audio/3gpp',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  caf: 'audio/x-caf',
};

function mimeFromUri(uri: string): string {
  const ext = uri.split('?')[0]!.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'audio/mp4';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function encodeAudio(source: string | Blob): Promise<{ audioBase64: string; mimeType: string } | null> {
  if (typeof source === 'string') {
    if (Platform.OS === 'web') return null;
    // API nueva de archivos (SDK 54+): la antigua readAsStringAsync ya no existe en el import principal.
    return { audioBase64: await new File(source).base64(), mimeType: mimeFromUri(source) };
  }
  return { audioBase64: await blobToBase64(source), mimeType: source.type || 'audio/webm' };
}

/**
 * Envía la grabación al backend: transcribe (Azure o Gemini) y, si el backend tiene Azure,
 * evalúa la pronunciación palabra por palabra (contra `referenceText` si se lee una frase).
 * Devuelve null si el backend no está disponible o no tiene voz configurada.
 */
export async function transcribeRecording(
  source: string | Blob,
  locale: SupportedLocale,
  referenceText?: string
): Promise<ServerTranscript | null> {
  try {
    if (!(await ensureAiConsent())) return null;
    const encoded = await encodeAudio(source);
    if (!encoded) return null;
    const { audioBase64, mimeType } = encoded;
    const controller = new AbortController();
    // Habla libre de 2+ min: Azure evalúa frase por frase (~20 s por minuto de audio).
    const timer = setTimeout(() => controller.abort(), 150_000);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/speech/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          language: locale,
          referenceText: referenceText ?? '',
          feedbackLanguage: getUiLanguage(),
        }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Partial<ServerTranscript>;
      if (data.silent) return { transcript: '', confidence: null, pronunciation: null, silent: true };
      if (!data.transcript && !data.pronunciation) return null;
      return {
        transcript: data.transcript ?? '',
        confidence: data.confidence ?? null,
        pronunciation: data.pronunciation ?? null,
        reviewAvailable: !!data.reviewAvailable,
        audioId: data.audioId ?? null,
      };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

async function postReview(body: object): Promise<Response> {
  if (!(await ensureAiConsent())) throw new Error('ai_consent_denied');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  try {
    return await fetch(`${getApiBaseUrl()}/api/speech/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Segunda pasada: Gemini escucha la grabación y detecta errores que la medición acústica no vio,
 * además de devolver la transcripción literal con los errores del estudiante.
 * Con `audioId` el servidor ya la empezó al transcribir: se recoge sin volver a subir el audio.
 * Si el servidor ya no la tiene (reinicio u otra instancia), se reenvía la grabación.
 */
export async function reviewRecording(
  source: string | Blob,
  locale: SupportedLocale,
  referenceText?: string,
  audioId?: string | null
): Promise<PronunciationReview | null> {
  try {
    const meta = { language: locale, referenceText: referenceText ?? '', feedbackLanguage: getUiLanguage() };
    let res: Response | null = null;
    if (audioId) {
      res = await postReview({ audioId, ...meta });
      if (res.status === 404) res = null;
    }
    if (!res) {
      const encoded = await encodeAudio(source);
      if (!encoded) return null;
      res = await postReview({ ...encoded, ...meta });
    }
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<PronunciationReview> & { silent?: boolean };
    if (data.silent) return null;
    return { transcript: data.transcript ?? '', pronunciation: data.pronunciation ?? null };
  } catch {
    return null;
  }
}

/** Aplica la revisión de IA sobre el resultado actual (Azure + Gemini, o solo Gemini si no había nada). */
export function applyReview(current: PronunciationReport | null, review: PronunciationReview | null): PronunciationReport | null {
  if (!review?.pronunciation) return current;
  if (!current) return review.pronunciation;
  if (current.provider === 'azure' && !current.reviewedBy) return mergePronunciation(current, review.pronunciation);
  return current;
}
