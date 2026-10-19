import { phonemeInfo, type PronunciationReport, type PronunciationWord } from '@lingopulse/shared';
import { splitBySilence, wavDurationSec } from './audio.js';

/**
 * Azure AI Speech · Pronunciation Assessment (REST para audio corto, ≤ 60 s por petición).
 * Configuración: AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (p. ej. eastus).
 * Con frase de referencia (lectura en voz alta) mide precisión, fluidez, completitud y
 * entonación; sin referencia (habla libre) también transcribe lo que se dijo.
 */

export function isAzureSpeechEnabled(): boolean {
  return !!process.env.AZURE_SPEECH_KEY && !!process.env.AZURE_SPEECH_REGION;
}

interface AzureScores {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ProsodyScore?: number;
  ErrorType?: string;
}

interface AzureWord extends AzureScores {
  Word: string;
  Offset?: number;
  Duration?: number;
  PronunciationAssessment?: AzureScores;
  Phonemes?: Array<{ Phoneme: string; AccuracyScore?: number; PronunciationAssessment?: AzureScores }>;
}

interface AzureNBest extends AzureScores {
  Confidence?: number;
  Display?: string;
  Lexical?: string;
  PronunciationAssessment?: AzureScores;
  Words?: AzureWord[];
}

interface AzureResponse {
  RecognitionStatus?: string;
  DisplayText?: string;
  NBest?: AzureNBest[];
}

/** Las versiones de la API ponen los puntajes en el objeto o dentro de PronunciationAssessment. */
function pick(o: AzureScores & { PronunciationAssessment?: AzureScores }, key: keyof AzureScores): number | undefined {
  const v = o.PronunciationAssessment?.[key] ?? o[key];
  return typeof v === 'number' ? v : undefined;
}

function azureLanguage(locale: string): string {
  return locale === 'en-GB' ? 'en-GB' : 'en-US';
}

interface ChunkResult {
  durationSec: number;
  text: string;
  confidence: number | null;
  pron: number;
  accuracy: number;
  fluency: number;
  completeness: number | null;
  prosody: number | null;
  words: PronunciationWord[];
}

async function assessChunk(wav: Buffer, locale: string, referenceText: string, offsetMs: number): Promise<ChunkResult | null> {
  const region = process.env.AZURE_SPEECH_REGION!;
  const scripted = referenceText.trim().length > 0;
  const config = {
    ReferenceText: referenceText.trim(),
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: scripted ? 'True' : 'False',
    EnableProsodyAssessment: 'True',
  };
  const params = new URLSearchParams({ language: azureLanguage(locale), format: 'detailed' });
  const res = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?${params}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': Buffer.from(JSON.stringify(config), 'utf8').toString('base64'),
        Accept: 'application/json',
      },
      body: new Uint8Array(wav),
    }
  );
  if (!res.ok) throw new Error(`Azure Speech HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as AzureResponse;
  if (data.RecognitionStatus !== 'Success') return null;
  const best = data.NBest?.[0];
  if (!best) return null;

  const words: PronunciationWord[] = (best.Words ?? []).map((w) => ({
    word: w.Word,
    accuracy: Math.round(pick(w, 'AccuracyScore') ?? 0),
    errorType: w.PronunciationAssessment?.ErrorType ?? w.ErrorType ?? 'None',
    phonemes: (w.Phonemes ?? []).map((p) => ({
      phoneme: p.Phoneme,
      ipa: phonemeInfo(p.Phoneme).ipa,
      accuracy: Math.round(p.PronunciationAssessment?.AccuracyScore ?? p.AccuracyScore ?? 0),
    })),
    offsetMs: typeof w.Offset === 'number' ? Math.round(w.Offset / 10_000) + offsetMs : undefined,
    durationMs: typeof w.Duration === 'number' ? Math.round(w.Duration / 10_000) : undefined,
  }));

  return {
    durationSec: wavDurationSec(wav),
    text: best.Display ?? data.DisplayText ?? '',
    confidence: typeof best.Confidence === 'number' ? best.Confidence : null,
    pron: pick(best, 'PronScore') ?? 0,
    accuracy: pick(best, 'AccuracyScore') ?? 0,
    fluency: pick(best, 'FluencyScore') ?? 0,
    completeness: scripted ? pick(best, 'CompletenessScore') ?? null : null,
    prosody: pick(best, 'ProsodyScore') ?? null,
    words,
  };
}

export interface AzureAssessment {
  transcript: string;
  confidence: number | null;
  durationSec: number;
  pronunciation: PronunciationReport | null;
}

export async function assessPronunciation(wav: Buffer, locale: string, referenceText = ''): Promise<AzureAssessment> {
  const scripted = referenceText.trim().length > 0;
  // El servicio rápido de Azure solo reconoce la PRIMERA frase de cada petición. En habla libre se
  // divide la grabación por pausas y se evalúa frase por frase (en orden: el plan F0 permite 1 a la vez).
  // Con frase de referencia (lectura corta) va completa para comparar contra el texto.
  const chunks = scripted ? [{ wav, startSec: 0 }] : splitBySilence(wav);
  const results: ChunkResult[] = [];
  for (const chunk of chunks) {
    const r = await assessChunk(chunk.wav, locale, referenceText, Math.round(chunk.startSec * 1000));
    if (r) results.push(r);
  }
  const totalSec = wavDurationSec(wav);
  if (!results.length) return { transcript: '', confidence: null, durationSec: totalSec, pronunciation: null };

  const weight = results.reduce((a, r) => a + r.durationSec, 0) || 1;
  const avg = (f: (r: ChunkResult) => number) => Math.round(results.reduce((a, r) => a + f(r) * r.durationSec, 0) / weight);
  const prosodyChunks = results.filter((r) => r.prosody !== null);
  const confidences = results.map((r) => r.confidence).filter((c): c is number => c !== null);
  const transcript = results.map((r) => r.text).join(' ').trim();

  return {
    transcript,
    confidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null,
    durationSec: totalSec,
    pronunciation: {
      provider: 'azure',
      scripted,
      referenceText: scripted ? referenceText.trim() : undefined,
      recognizedText: transcript,
      pronScore: avg((r) => r.pron),
      accuracy: avg((r) => r.accuracy),
      fluency: avg((r) => r.fluency),
      completeness: scripted ? results[0]!.completeness : null,
      prosody: prosodyChunks.length
        ? Math.round(
            prosodyChunks.reduce((a, r) => a + r.prosody! * r.durationSec, 0) /
              (prosodyChunks.reduce((a, r) => a + r.durationSec, 0) || 1)
          )
        : null,
      words: results.flatMap((r) => r.words),
    },
  };
}
