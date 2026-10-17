/**
 * Transcripción de audio grabado en el teléfono (Expo Go no trae reconocimiento
 * de voz en el dispositivo). Proveedor: Deepgram (STT_PROVIDER=deepgram + DEEPGRAM_API_KEY).
 * Se piden las muletillas (`filler_words`) para poder contarlas en el análisis.
 */

export interface TranscriptResult {
  transcript: string;
  confidence: number | null;
  words: Array<{ word: string; start: number; end: number; confidence: number }>;
  durationSec: number | null;
}

export function isSpeechToTextEnabled(): boolean {
  return (process.env.STT_PROVIDER ?? '').toLowerCase() === 'deepgram' && !!process.env.DEEPGRAM_API_KEY;
}

interface DeepgramResponse {
  metadata?: { duration?: number };
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: Array<{ word: string; punctuated_word?: string; start: number; end: number; confidence: number }>;
      }>;
    }>;
  };
}

export async function transcribeAudio(
  audio: Buffer,
  mimeType: string,
  language: string
): Promise<TranscriptResult> {
  const params = new URLSearchParams({
    model: 'nova-3',
    smart_format: 'true',
    punctuate: 'true',
    filler_words: 'true',
    language: language.startsWith('en') ? 'en' : language,
  });
  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      'Content-Type': mimeType,
    },
    body: audio,
  });
  if (!res.ok) {
    throw new Error(`Deepgram HTTP ${res.status}`);
  }
  const data = (await res.json()) as DeepgramResponse;
  const alt = data.results?.channels?.[0]?.alternatives?.[0];
  return {
    transcript: alt?.transcript?.trim() ?? '',
    confidence: typeof alt?.confidence === 'number' ? alt.confidence : null,
    words: (alt?.words ?? []).map((w) => ({
      word: w.punctuated_word ?? w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    })),
    durationSec: data.metadata?.duration ?? null,
  };
}
