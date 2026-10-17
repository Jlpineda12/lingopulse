import * as FileSystem from 'expo-file-system';
import type { SupportedLocale } from '@lingopulse/shared';
import { getApiBaseUrl } from './config';

export interface ServerTranscript {
  transcript: string;
  confidence: number | null;
}

/**
 * Envía una grabación del teléfono al backend para transcribirla (Deepgram).
 * Devuelve null si el backend no está disponible o no tiene STT configurado.
 */
export async function transcribeRecording(
  uri: string,
  locale: SupportedLocale
): Promise<ServerTranscript | null> {
  try {
    const audioBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/speech/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType: 'audio/mp4', language: locale }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as ServerTranscript;
      return data.transcript ? data : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
