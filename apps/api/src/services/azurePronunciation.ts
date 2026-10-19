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

/**
 * Peticiones a Azure a la vez. El plan gratuito (F0) admite 1; con S0 pon AZURE_CONCURRENCY=4
 * y el habla libre larga se evalúa varias veces más rápido.
 */
function azureConcurrency(): number {
  return Math.max(1, Math.min(8, Number(process.env.AZURE_CONCURRENCY) || 1));
}

/** Ejecuta `fn` sobre cada elemento con como mucho `limit` a la vez, conservando el orden. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Un reintento corto si Azure responde 429 (cupo por segundo del plan gratuito). */
async function assessWithRetry(wav: Buffer, locale: string, referenceText: string, offsetMs: number) {
  try {
    return await assessChunk(wav, locale, referenceText, offsetMs);
  } catch (err) {
    if (!(err instanceof Error) || !/HTTP 429/.test(err.message)) throw err;
    await new Promise((r) => setTimeout(r, 1200));
    return assessChunk(wav, locale, referenceText, offsetMs);
  }
}

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const isSaid = (w: PronunciationWord) => w.errorType !== 'Omission' && w.errorType !== 'Insertion';

/**
 * Cuántas palabras de la referencia cubre este trozo: hasta la última palabra dicha. Busca esa
 * palabra en la referencia (Azure normaliza mayúsculas y signos) y, si no la encuentra, cuenta.
 */
export function consumedReferenceWords(words: PronunciationWord[], reference: string[]): number {
  let lastSaid = -1;
  let refIdx = 0;
  let lastSaidRefIdx = -1;
  words.forEach((w, i) => {
    if (w.errorType === 'Insertion') return;
    if (isSaid(w)) {
      lastSaid = i;
      lastSaidRefIdx = refIdx;
    }
    refIdx++;
  });
  if (lastSaid < 0) return 0;
  const target = norm(words[lastSaid]!.word);
  for (let d = 0; d <= 3; d++) {
    for (const j of [lastSaidRefIdx + d, lastSaidRefIdx - d]) {
      if (j >= 0 && j < reference.length && norm(reference[j]!) === target) return j + 1;
    }
  }
  return Math.min(reference.length, lastSaidRefIdx + 1);
}

/**
 * Lectura en voz alta en varios trozos. El servicio rápido de Azure deja de escuchar en la primera
 * pausa (y no pasa de 60 s), así que un texto leído con pausas perdía el final. Se evalúa trozo por
 * trozo contra la parte de la referencia que falta por leer.
 */
async function assessScriptedInChunks(
  chunks: Array<{ wav: Buffer; startSec: number }>,
  locale: string,
  referenceText: string
): Promise<{ results: ChunkResult[]; words: PronunciationWord[]; said: number; total: number }> {
  const reference = referenceText.trim().split(/\s+/).filter(Boolean);
  let remaining = reference;
  const results: ChunkResult[] = [];
  const words: PronunciationWord[] = [];
  for (let c = 0; c < chunks.length && remaining.length; c++) {
    const chunk = chunks[c]!;
    const isLast = c === chunks.length - 1;
    const r = await assessWithRetry(chunk.wav, locale, remaining.join(' '), Math.round(chunk.startSec * 1000));
    if (!r) continue;
    const consumed = isLast ? remaining.length : consumedReferenceWords(r.words, remaining);
    if (!consumed) continue;
    // Se guardan las palabras hasta la última dicha (con sus omisiones intermedias); las siguientes
    // quedan para el próximo trozo.
    let kept = 0;
    let refSeen = 0;
    for (const w of r.words) {
      if (w.errorType !== 'Insertion') {
        if (refSeen >= consumed) break;
        refSeen++;
      }
      kept++;
    }
    words.push(...r.words.slice(0, kept));
    results.push(r);
    remaining = remaining.slice(consumed);
  }
  // Lo que nunca se leyó cuenta como omitido.
  for (const w of remaining) words.push({ word: w, accuracy: 0, errorType: 'Omission', phonemes: [] });
  return { results, words, said: words.filter(isSaid).length, total: reference.length };
}

export async function assessPronunciation(wav: Buffer, locale: string, referenceText = ''): Promise<AzureAssessment> {
  const scripted = referenceText.trim().length > 0;
  const totalSec = wavDurationSec(wav);
  // El servicio rápido de Azure solo reconoce la PRIMERA frase de cada petición: se divide la
  // grabación por pausas. En habla libre los trozos van en paralelo (según AZURE_CONCURRENCY);
  // en lectura, en orden, porque cada trozo se compara con lo que falta del texto.
  const chunks = splitBySilence(wav, scripted ? { minSilenceMs: 650 } : undefined);

  if (scripted && chunks.length > 1) {
    const { results, words, said, total } = await assessScriptedInChunks(chunks, locale, referenceText);
    if (!results.length) return { transcript: '', confidence: null, durationSec: totalSec, pronunciation: null };
    const weight = results.reduce((a, r) => a + r.durationSec, 0) || 1;
    const saidWords = words.filter(isSaid);
    const accuracy = saidWords.length ? Math.round(saidWords.reduce((a, w) => a + w.accuracy, 0) / saidWords.length) : 0;
    const fluency = Math.round(results.reduce((a, r) => a + r.fluency * r.durationSec, 0) / weight);
    const completeness = total ? Math.round((said / total) * 100) : null;
    const prosodyChunks = results.filter((r) => r.prosody !== null);
    const prosody = prosodyChunks.length
      ? Math.round(prosodyChunks.reduce((a, r) => a + r.prosody! * r.durationSec, 0) / (prosodyChunks.reduce((a, r) => a + r.durationSec, 0) || 1))
      : null;
    // Aproximación de la fórmula de Azure (precisión pesa más que fluidez, completitud y prosodia).
    const parts: Array<[number, number]> = [
      [accuracy, 0.4],
      [fluency, 0.2],
      [completeness ?? accuracy, 0.2],
      ...(prosody !== null ? ([[prosody, 0.2]] as Array<[number, number]>) : []),
    ];
    const pronScore = Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / parts.reduce((a, [, w]) => a + w, 0));
    const transcript = results.map((r) => r.text).join(' ').trim();
    const confidences = results.map((r) => r.confidence).filter((c): c is number => c !== null);
    return {
      transcript,
      confidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null,
      durationSec: totalSec,
      pronunciation: {
        provider: 'azure',
        scripted: true,
        referenceText: referenceText.trim(),
        recognizedText: transcript,
        pronScore,
        accuracy,
        fluency,
        completeness,
        prosody,
        words,
      },
    };
  }

  const pieces = scripted ? [{ wav, startSec: 0 }] : chunks;
  const settled = await mapLimit(pieces, azureConcurrency(), (chunk) =>
    assessWithRetry(chunk.wav, locale, referenceText, Math.round(chunk.startSec * 1000))
  );
  const results = settled.filter((r): r is ChunkResult => !!r);
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
