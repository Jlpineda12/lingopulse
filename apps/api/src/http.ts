import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { z } from 'zod';
import type { CoachRequest } from '@lingopulse/shared';

/**
 * Utilidades HTTP del servidor: lectura de cuerpos con límite de tamaño, clave de la app,
 * límite de peticiones por IP y validación de la entrada que llega a la IA.
 */

/** Error con código HTTP: el manejador general responde con ese código y ese mensaje. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/** 1 MB para JSON normal; las rutas de audio piden más (base64 de hasta ~40 MB de audio). */
export const JSON_BODY_LIMIT = 1024 * 1024;
export const AUDIO_BODY_LIMIT = 56 * 1024 * 1024;

/**
 * Lee el cuerpo JSON sin pasar de `maxBytes`: corta en cuanto se supera (o si Content-Length
 * ya lo anuncia), así una petición enorme no llena la memoria del servidor.
 */
export async function readJsonBody<T>(req: IncomingMessage, maxBytes = JSON_BODY_LIMIT): Promise<T> {
  const tooLarge = () => new HttpError(413, `body too large (max ${Math.round(maxBytes / 1024)} KB)`);
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > maxBytes) throw tooLarge();
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const onData = (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buf.length;
      if (size > maxBytes) {
        // Se deja de guardar y de leer: el servidor responde 413 y cierra la conexión.
        req.off('data', onData);
        req.pause();
        chunks.length = 0;
        reject(tooLarge());
        return;
      }
      chunks.push(buf);
    };
    req.on('data', onData);
    req.once('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.once('error', reject);
  });
  if (!raw) return {} as T;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return parsed as T;
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
}

/* ------------------------------------------------------------------ */
/* Clave de la app                                                     */
/* ------------------------------------------------------------------ */

/**
 * Clave privada de la app (APP_ACCESS_KEY). Si está configurada, solo responden las peticiones
 * que la traen en la cabecera X-App-Key, así nadie más gasta tus créditos de IA.
 */
export function isAuthorized(req: IncomingMessage, expected = process.env.APP_ACCESS_KEY): boolean {
  if (!expected) return true;
  const given = req.headers['x-app-key'];
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * En producción el servidor no arranca sin APP_ACCESS_KEY: sin ella, cualquiera que encuentre
 * la URL usaría tus créditos de IA. ALLOW_OPEN_API=1 lo permite a propósito.
 */
export function accessKeyProblem(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.NODE_ENV !== 'production' || env.APP_ACCESS_KEY || env.ALLOW_OPEN_API === '1') return null;
  return 'APP_ACCESS_KEY no está configurada. En producción es obligatoria (o pon ALLOW_OPEN_API=1 si de verdad quieres un servidor abierto).';
}

/* ------------------------------------------------------------------ */
/* Límite de peticiones por IP                                         */
/* ------------------------------------------------------------------ */

/** IP del cliente: Cloud Run y otros proxies la ponen primera en X-Forwarded-For. */
export function clientIp(req: IncomingMessage): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

/** Ventana fija por minuto y por IP (en memoria; suficiente para una app familiar). */
export class RateLimiter {
  private hits = new Map<string, { windowStart: number; count: number }>();

  constructor(
    readonly perMinute: number,
    private readonly now: () => number = Date.now
  ) {}

  /** true si la petición entra; false si esa IP ya gastó su cupo de este minuto. */
  allow(key: string): boolean {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || t - entry.windowStart >= 60_000) {
      if (this.hits.size > 10_000) this.prune(t);
      this.hits.set(key, { windowStart: t, count: 1 });
      return true;
    }
    entry.count++;
    return entry.count <= this.perMinute;
  }

  private prune(t: number) {
    for (const [k, v] of this.hits) if (t - v.windowStart >= 60_000) this.hits.delete(k);
  }
}

/* ------------------------------------------------------------------ */
/* Validación de la petición al corrector                              */
/* ------------------------------------------------------------------ */

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const score = z.number().finite().min(0).max(100);
const ms = z.number().finite().min(0).max(30 * 60_000);

const AudioMetricsSchema = z.object({
  durationMs: ms,
  voicedMs: ms,
  pauseCount: z.number().int().min(0).max(10_000),
  longestPauseMs: ms,
  recognitionConfidence: z.number().finite().min(0).max(1).nullable(),
  averageLevel: z.number().finite().min(0).max(1),
  assessedPronunciation: score.nullable().optional(),
});

const PronunciationSchema = z.object({
  provider: z.enum(['azure', 'gemini']),
  approximate: z.boolean().optional(),
  reviewedBy: z.literal('gemini').optional(),
  scripted: z.boolean(),
  referenceText: z.string().max(600).optional(),
  recognizedText: z.string().max(6000),
  pronScore: score,
  accuracy: score,
  fluency: score,
  completeness: score.nullable(),
  prosody: score.nullable(),
  words: z
    .array(
      z.object({
        word: z.string().max(60),
        accuracy: score,
        errorType: z.string().max(40),
        phonemes: z
          .array(z.object({ phoneme: z.string().max(12), ipa: z.string().max(12), accuracy: score }))
          .max(30),
        offsetMs: z.number().finite().optional(),
        durationMs: z.number().finite().optional(),
        tipEs: z.string().max(300).optional(),
      })
    )
    .max(800),
});

export const MAX_COACH_TEXT = 6000;

const CoachRequestSchema = z.object({
  skill: z.string().optional(),
  level: z.string().optional(),
  promptEn: z.string().max(1000).optional(),
  text: z.string().min(1).max(MAX_COACH_TEXT),
  targetWords: z.array(z.string().max(60)).max(40).optional(),
  minWords: z.number().int().min(0).max(2000).optional(),
  audio: AudioMetricsSchema.optional(),
  pronunciation: PronunciationSchema.nullable().optional(),
});

/** Valida y normaliza lo que manda la app antes de que llegue al prompt de la IA. */
export function parseCoachRequest(body: unknown): CoachRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.text === 'string' && b.text.length > MAX_COACH_TEXT) {
    throw new HttpError(413, `text is too long (max ${MAX_COACH_TEXT} characters)`);
  }
  const parsed = CoachRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.') || 'body';
    throw new HttpError(400, field === 'text' ? 'text is required' : `invalid field: ${field}`);
  }
  const r = parsed.data;
  return {
    skill: r.skill === 'speaking' ? 'speaking' : 'writing',
    level: (LEVELS as readonly string[]).includes(r.level ?? '') ? (r.level as CoachRequest['level']) : 'B1',
    promptEn: r.promptEn ?? '',
    text: r.text,
    targetWords: (r.targetWords ?? []).slice(0, 12),
    minWords: r.minWords,
    audio: r.audio,
    pronunciation: r.pronunciation ?? null,
  };
}
