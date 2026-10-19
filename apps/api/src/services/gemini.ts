import { z } from 'zod';
import {
  phonemeInfo,
  type CoachFeedback,
  type CoachRequest,
  type PronunciationReport,
  type PronunciationWord,
  type UiLanguage,
} from '@lingopulse/shared';
import { buildUserMessage, CoachSchema, finalizeFeedback, SYSTEM_PROMPT } from './aiCoach.js';

/**
 * Google Gemini (API de Google AI Studio). Opción barata para:
 *  - corregir Writing y Speaking (LLM_PROVIDER=gemini), con la misma salida estructurada que Claude;
 *  - transcribir el audio del teléfono y ESTIMAR la pronunciación cuando no hay Azure configurado.
 * Configuración: GEMINI_API_KEY y opcionalmente GEMINI_MODEL (por defecto el Flash más reciente).
 *
 * El nivel gratuito a veces responde "high demand" (503) o límite (429): se reintenta y,
 * si sigue fallando, se usa el modelo Flash-Lite.
 */

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
/**
 * Cadena de respaldo. En el nivel gratuito CADA modelo tiene su propio límite diario (p. ej. 20 pedidos/día),
 * así que si uno se agota se pasa al siguiente. Configurable con GEMINI_FALLBACK_MODELS (separados por coma).
 */
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.5-flash,gemini-flash-lite-latest')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

/** Modelos sin cupo diario y hasta cuándo (se reintentan al reiniciarse la cuota). */
const exhaustedUntil = new Map<string, number>();

export function isGeminiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export function isGeminiCoachEnabled(): boolean {
  return (process.env.LLM_PROVIDER ?? '').toLowerCase() === 'gemini' && isGeminiEnabled();
}

function models(override?: string): string[] {
  const primary = override || process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const chain = [primary, ...FALLBACK_MODELS].filter((m, i, arr) => arr.indexOf(m) === i);
  const available = chain.filter((m) => (exhaustedUntil.get(m) ?? 0) < Date.now());
  // Si todos están agotados se intenta igual con la cadena completa (puede que ya se haya reiniciado).
  return available.length ? available : chain;
}

/** Detecta el límite DIARIO (no tiene sentido reintentar ese modelo hoy) y recuerda hasta cuándo. */
function markIfDailyQuota(model: string, body: string): boolean {
  if (!/PerDay/i.test(body)) return false;
  const secs = Number(body.match(/"retryDelay":\s*"(\d+)s"/)?.[1] ?? 3600);
  exhaustedUntil.set(model, Date.now() + secs * 1000);
  console.warn(`[LingoPulse API] Gemini ${model}: cupo diario agotado; se usa el siguiente modelo por ${Math.round(secs / 3600)} h`);
  return true;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

interface GenerateOptions {
  /** 'low' = pensar poco: respuestas más rápidas (transcripción y pronunciación). */
  thinking?: 'low';
  timeoutMs: number;
  /** Modelo para esta tarea (si no, GEMINI_MODEL o Flash). */
  model?: string;
}

const RETRYABLE = new Set([429, 500, 503]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateJson(system: string, parts: Part[], schema: object | null, opts: GenerateOptions): Promise<unknown> {
  const deadline = Date.now() + opts.timeoutMs;
  let lastError: Error = new Error('Gemini: sin respuesta');
  for (const model of models(opts.model)) {
    let thinking = opts.thinking;
    for (let attempt = 0; attempt < 3; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 3000) throw lastError;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);
      try {
        const res = await fetch(`${API}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              ...(schema ? { responseJsonSchema: schema } : {}),
              ...(thinking ? { thinkingConfig: { thinkingLevel: thinking } } : {}),
            },
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text();
          lastError = new Error(`Gemini ${model} HTTP ${res.status}: ${body.slice(0, 300)}`);
          if (res.status === 400 && thinking && /think/i.test(body)) {
            thinking = undefined; // el modelo no acepta ese nivel de razonamiento: se reintenta sin él
            continue;
          }
          if (res.status === 429 && markIfDailyQuota(model, body)) break; // siguiente modelo, sin esperar
          if (RETRYABLE.has(res.status)) {
            await sleep(1200 * (attempt + 1));
            continue;
          }
          throw lastError;
        }
        const data = (await res.json()) as GeminiResponse;
        if (data.promptFeedback?.blockReason) throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
        const text =
          data.candidates?.[0]?.content?.parts
            ?.filter((p) => !p.thought)
            .map((p) => p.text ?? '')
            .join('') ?? '';
        return JSON.parse(text);
      } catch (err) {
        if (err instanceof Error && /HTTP (400|401|403|404)/.test(err.message)) throw err;
        lastError = err instanceof Error ? err : new Error(String(err));
        if (controller.signal.aborted) throw new Error('Gemini: tiempo de espera agotado');
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------------ */
/* Corrección de Writing / Speaking                                    */
/* ------------------------------------------------------------------ */

const COACH_JSON_SCHEMA = z.toJSONSchema(CoachSchema);

/** Razonamiento del corrector: 'low' (por defecto, ~2× más rápido) o 'default' vía GEMINI_COACH_THINKING. */
function coachThinking(): 'low' | undefined {
  return (process.env.GEMINI_COACH_THINKING ?? 'low') === 'default' ? undefined : 'low';
}

export async function generateGeminiFeedback(req: CoachRequest): Promise<CoachFeedback> {
  const user = buildUserMessage(req);
  let raw: unknown;
  try {
    raw = await generateJson(SYSTEM_PROMPT, [{ text: user }], COACH_JSON_SCHEMA, {
      thinking: coachThinking(),
      timeoutMs: 55_000,
      // Flash corrige mejor; GEMINI_COACH_MODEL=gemini-flash-lite-latest es ~3× más rápido pero se le escapan errores.
      model: process.env.GEMINI_COACH_MODEL || undefined,
    });
  } catch (err) {
    // Algunos modelos no aceptan el esquema completo: se reintenta describiéndolo en el texto.
    if (!(err instanceof Error) || !/HTTP 400/.test(err.message)) throw err;
    raw = await generateJson(
      `${SYSTEM_PROMPT}\n\nReturn ONLY a JSON object that matches this JSON Schema:\n${JSON.stringify(COACH_JSON_SCHEMA)}`,
      [{ text: user }],
      null,
      { timeoutMs: 55_000 }
    );
  }
  const parsed = CoachSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Gemini returned feedback in an unexpected shape');
  return finalizeFeedback(parsed.data, req, 'gemini');
}

/* ------------------------------------------------------------------ */
/* Transcripción simple (respaldo de Azure)                            */
/* ------------------------------------------------------------------ */

const TRANSCRIBE_PROMPT = `You transcribe recordings of Spanish-speaking learners practising English.
Write exactly what was said, word for word, in English spelling: keep grammar mistakes, repetitions and fillers (um, uh, like, "este", "o sea").
Do not correct, translate or summarise. If nothing intelligible was said, return an empty transcript.
Only write words you actually hear in THIS recording. Never guess, complete or invent sentences from context or from the reference text. If a stretch is unintelligible write [inaudible]. If the learner speaks Spanish, write those Spanish words as heard.`;

const TranscriptSchema = z.object({ transcript: z.string() });

export async function transcribeWithGemini(wav: Buffer): Promise<string> {
  const raw = await generateJson(
    TRANSCRIBE_PROMPT,
    [{ inlineData: { mimeType: 'audio/wav', data: wav.toString('base64') } }, { text: 'Transcribe this recording.' }],
    z.toJSONSchema(TranscriptSchema),
    { thinking: 'low', timeoutMs: 100_000 }
  );
  return TranscriptSchema.parse(raw).transcript.trim();
}

/* ------------------------------------------------------------------ */
/* Transcripción + pronunciación estimada                              */
/* ------------------------------------------------------------------ */

const PRONUNCIATION_PROMPT = `You are an expert English phonetics coach for Spanish-speaking learners. You LISTEN to one recording and judge pronunciation.

Return:
- transcript: exactly what was said, word for word, keeping grammar mistakes and fillers (um, uh). Do not correct it. Only write words you actually hear in THIS recording. Never guess, complete or invent sentences from context or from the reference text. If a stretch is unintelligible write [inaudible]. If the learner speaks Spanish, write those Spanish words as heard.
- words: one entry per word.
  - If a REFERENCE TEXT is given, use exactly the reference words in order. Mark words that were not said as errorType "Omission" with score 0. Ignore extra words.
  - If there is no reference text, list the words actually spoken (max 120).
  - score 0-100 for how clearly and correctly the word was pronounced: 90-100 clear and natural; 75-89 clearly understandable with a mild accent; 55-74 a noticeable error a listener may notice; below 55 hard to understand or a different word.
  - errorType: "None", "Mispronunciation" (score below 75) or "Omission".
  - issueSound: when score < 75, the IPA symbol of the main problem sound (for example θ, ð, v, b, ɪ, i, æ, ʌ, ʃ, z, h, ŋ, ɹ, ə, oʊ, eɪ, s, t, d). Otherwise null.
  - tipEs: when score < 75, one short practical tip in the feedback language given in the request (max 20 words) about how to fix it. Otherwise null.
- accuracy: overall correctness of the sounds; fluency: smoothness, rhythm and pauses; prosody: stress and intonation; completeness: share of the reference text that was said (null without reference); overall: your global pronunciation score. All 0-100.

Judge ONLY pronunciation, never grammar: a wrong word form such as "buyed" or "I go" (past) is a grammar issue handled elsewhere; score how that word was pronounced as said.
Be honest but conservative: only flag errors you can clearly hear. A typical Spanish accent that stays understandable is NOT an error (score 80+). Do not invent problems. If there is no intelligible speech, return an empty transcript, empty words and zeros.`;

const GeminiPronSchema = z.object({
  transcript: z.string(),
  overall: z.number(),
  accuracy: z.number(),
  fluency: z.number(),
  prosody: z.number(),
  completeness: z.number().nullable(),
  words: z.array(
    z.object({
      word: z.string(),
      score: z.number(),
      errorType: z.enum(['None', 'Mispronunciation', 'Omission']),
      issueSound: z.string().nullable(),
      tipEs: z.string().nullable(),
    })
  ),
});

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export interface GeminiAssessment {
  transcript: string;
  pronunciation: PronunciationReport | null;
}

/** Escucha la grabación y devuelve transcripción + pronunciación estimada (aproximada). */
export async function assessPronunciationWithGemini(
  wav: Buffer,
  locale: string,
  referenceText = '',
  feedbackLanguage: UiLanguage = 'es'
): Promise<GeminiAssessment> {
  const reference = referenceText.trim();
  const accent = locale === 'en-GB' ? 'British English (en-GB)' : 'American English (en-US)';
  const header = `Target accent: ${accent}.\nFeedback language for tips: ${feedbackLanguage === 'en' ? 'simple English' : 'Spanish'}.`;
  const raw = await generateJson(
    PRONUNCIATION_PROMPT,
    [
      { inlineData: { mimeType: 'audio/wav', data: wav.toString('base64') } },
      {
        text: reference
          ? `${header}\nREFERENCE TEXT (what the learner tried to read):\n${reference}`
          : `${header}\nNo reference text: the learner spoke freely.`,
      },
    ],
    z.toJSONSchema(GeminiPronSchema),
    { thinking: 'low', timeoutMs: 120_000 }
  );
  const parsed = GeminiPronSchema.parse(raw);
  const transcript = parsed.transcript.trim();
  if (!transcript || !parsed.words.length) return { transcript, pronunciation: null };

  const words: PronunciationWord[] = parsed.words.map((w) => {
    const accuracy = w.errorType === 'Omission' ? 0 : clampScore(w.score);
    const sound = w.issueSound?.replace(/\//g, '').trim();
    return {
      word: w.word,
      accuracy,
      errorType: w.errorType,
      phonemes: sound && accuracy < 75 ? [{ phoneme: sound, ipa: phonemeInfo(sound).ipa, accuracy }] : [],
      tipEs: w.tipEs?.trim() || undefined,
    };
  });

  return {
    transcript,
    pronunciation: {
      provider: 'gemini',
      approximate: true,
      scripted: !!reference,
      referenceText: reference || undefined,
      recognizedText: transcript,
      pronScore: clampScore(parsed.overall),
      accuracy: clampScore(parsed.accuracy),
      fluency: clampScore(parsed.fluency),
      completeness: reference && parsed.completeness !== null ? clampScore(parsed.completeness) : null,
      prosody: clampScore(parsed.prosody),
      words,
    },
  };
}
