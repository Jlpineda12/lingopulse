import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  B1_MODULE_1_SYLLABUS_OVERVIEW,
  getSeededLessonByLocale,
  buildLocalFeedback,
  type AudioStatus,
  type CoachRequest,
  type SupportedLocale,
} from '@lingopulse/shared';
import {
  describeProviderError,
  generateAiFeedback,
  isAiCoachEnabled,
} from './services/aiCoach.js';
import { isSpeechToTextEnabled, transcribeAudio } from './services/speechToText.js';
import { analyzeLevels, hasUsableSpeech, toWav16k } from './services/audio.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assessPronunciation, isAzureSpeechEnabled } from './services/azurePronunciation.js';
import {
  assessPronunciationWithGemini,
  generateGeminiFeedback,
  isGeminiCoachEnabled,
  isGeminiEnabled,
  transcribeWithGemini,
} from './services/gemini.js';
import {
  evaluateInputComprehension,
  evaluateWritingSubmission,
  generateVoiceScorecard,
  processLearnerVoiceTurn,
  startVoiceArenaSession,
} from './services/orchestrator.js';

const PORT = Number(process.env.PORT ?? 4000);

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Key');
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return (raw ? JSON.parse(raw) : {}) as T;
}

/** Proveedor de voz activo: Azure (transcribe + pronunciación) > Gemini (transcribe) > Deepgram. */
function speechProvider(): 'azure' | 'gemini' | 'deepgram' | 'none' {
  if (isAzureSpeechEnabled()) return 'azure';
  if (isGeminiEnabled()) return 'gemini';
  if (isSpeechToTextEnabled()) return 'deepgram';
  return 'none';
}

function coachProvider(): 'gemini' | 'anthropic' | 'local' {
  if (isGeminiCoachEnabled()) return 'gemini';
  if (isAiCoachEnabled()) return 'anthropic';
  return 'local';
}

/**
 * Clave privada de la app (APP_ACCESS_KEY). Si está configurada, solo responden las peticiones
 * que la traen en la cabecera X-App-Key, así nadie más gasta tus créditos de IA.
 */
function isAuthorized(req: IncomingMessage): boolean {
  const expected = process.env.APP_ACCESS_KEY;
  if (!expected) return true;
  return req.headers['x-app-key'] === expected;
}

/**
 * En desarrollo guarda la última grabación recibida (original + WAV) para poder diagnosticar
 * problemas de micrófono. Desactívalo con SAVE_LAST_AUDIO=0; en producción no se guarda.
 */
async function saveLastAudio(original: Buffer, mimeType: string, wav: Buffer): Promise<string | null> {
  if (process.env.NODE_ENV === 'production' || process.env.SAVE_LAST_AUDIO === '0') return null;
  try {
    const dir = join(tmpdir(), 'lingopulse-last-audio');
    await mkdir(dir, { recursive: true });
    const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.split('/')[1]?.split(';')[0] ?? 'bin';
    await writeFile(join(dir, `original.${ext}`), original);
    await writeFile(join(dir, 'audio-16k.wav'), wav);
    return dir;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

    // 1. Health check
    if (req.method === 'GET' && url.pathname === '/api/health') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'lingopulse-orchestrator-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: 'unauthorized' });
      return;
    }

    // 2. Currículo público B1 (NUNCA expone privateArenaConfig al cliente)
    if (req.method === 'GET' && url.pathname === '/api/curriculum') {
      const localeParam = url.searchParams.get('locale');
      const locale: SupportedLocale =
        localeParam === 'en-US' ? 'en-US' : 'en-GB';
      const slug = url.searchParams.get('slug') ?? 'b1-m1-s1-put-off';
      const bundle = getSeededLessonByLocale(locale, slug);

      sendJson(res, 200, {
        unitSyllabus: B1_MODULE_1_SYLLABUS_OVERVIEW,
        activeLesson: bundle.publicLesson,
      });
      return;
    }

    // 3. Fase 2: Evaluación de Reading & Listening
    if (req.method === 'POST' && url.pathname === '/api/input/check') {
      const body = await readJsonBody<{
        locale?: SupportedLocale;
        lessonSlug?: string;
        learnerAnswer: string;
      }>(req);

      const result = evaluateInputComprehension({
        locale: body.locale === 'en-US' ? 'en-US' : 'en-GB',
        lessonSlug: body.lessonSlug,
        learnerAnswer: body.learnerAnswer ?? '',
      });
      sendJson(res, 200, result);
      return;
    }

    // 4. Fase 3: Evaluación de Writing + 2 reformulaciones (casual y profesional)
    if (req.method === 'POST' && url.pathname === '/api/writing/evaluate') {
      const body = await readJsonBody<{
        locale?: SupportedLocale;
        lessonSlug?: string;
        text: string;
      }>(req);

      const result = evaluateWritingSubmission({
        locale: body.locale === 'en-US' ? 'en-US' : 'en-GB',
        lessonSlug: body.lessonSlug,
        text: body.text ?? '',
      });
      sendJson(res, 200, result);
      return;
    }

    // 5. Fase 4: Iniciar sesión de Voice Arena
    if (req.method === 'POST' && url.pathname === '/api/voice-arena/start') {
      const body = await readJsonBody<{
        locale?: SupportedLocale;
        lessonSlug?: string;
      }>(req);

      const sessionPayload = startVoiceArenaSession({
        locale: body.locale === 'en-US' ? 'en-US' : 'en-GB',
        lessonSlug: body.lessonSlug,
      });
      sendJson(res, 200, sessionPayload);
      return;
    }

    // 6. Fase 4: Enviar turno del estudiante a Voice Arena
    if (req.method === 'POST' && url.pathname === '/api/voice-arena/turn') {
      const body = await readJsonBody<{
        sessionId: string;
        transcript: string;
        audioStatus?: AudioStatus;
        responseWindowMs?: number;
        voicedMs?: number;
      }>(req);

      const turnPayload = processLearnerVoiceTurn({
        sessionId: body.sessionId,
        transcript: body.transcript ?? '',
        audioStatus: body.audioStatus,
        responseWindowMs: body.responseWindowMs,
        voicedMs: body.voicedMs,
      });
      sendJson(res, 200, turnPayload);
      return;
    }

    // 7. Fase 4: Cerrar sesión y obtener Scorecard con evidencia + FSRS
    if (req.method === 'POST' && url.pathname === '/api/voice-arena/scorecard') {
      const body = await readJsonBody<{ sessionId: string }>(req);
      const scorecard = generateVoiceScorecard(body.sessionId);
      sendJson(res, 200, scorecard);
      return;
    }

    // 8a. Transcripción de audio grabado en el teléfono (Expo Go)
    if (req.method === 'GET' && url.pathname === '/api/speech/status') {
      const provider = speechProvider();
      sendJson(res, 200, {
        sttEnabled: provider !== 'none',
        provider,
        pronunciation: provider === 'azure' ? 'precise' : provider === 'gemini' ? 'approximate' : 'none',
      });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/speech/transcribe') {
      const provider = speechProvider();
      if (provider === 'none') {
        sendJson(res, 503, { error: 'stt_disabled' });
        return;
      }
      const body = await readJsonBody<{ audioBase64?: string; mimeType?: string; language?: string; referenceText?: string }>(req);
      if (!body.audioBase64) {
        sendJson(res, 400, { error: 'audioBase64 is required' });
        return;
      }
      const audio = Buffer.from(body.audioBase64, 'base64');
      if (audio.length > 40 * 1024 * 1024) {
        sendJson(res, 413, { error: 'audio too large (max 40 MB)' });
        return;
      }
      const mimeType = body.mimeType ?? 'audio/mp4';
      const language = body.language ?? 'en-US';
      const referenceText = String(body.referenceText ?? '').slice(0, 600);
      try {
        if (provider === 'deepgram') {
          sendJson(res, 200, { ...(await transcribeAudio(audio, mimeType, language)), pronunciation: null, provider });
          return;
        }
        const wav = await toWav16k(audio, mimeType);
        const levels = analyzeLevels(wav);
        const lastDir = await saveLastAudio(audio, mimeType, wav);
        console.log(
          `[LingoPulse API] audio ${levels.durationSec.toFixed(1)} s · pico ${levels.peakDb} dB · medio ${levels.rmsDb} dB · voz ${levels.voicedSec} s` +
            (lastDir ? ` · guardado en ${lastDir}` : '')
        );
        if (!hasUsableSpeech(levels)) {
          // Audio vacío o casi mudo: no se manda a la IA (inventaría un texto).
          sendJson(res, 200, { transcript: '', confidence: null, durationSec: levels.durationSec, pronunciation: null, provider, silent: true, levels });
          return;
        }
        if (provider === 'azure') {
          const result = await assessPronunciation(wav, language, referenceText);
          // Si Azure no entendió nada pero hay Gemini, al menos devolvemos la transcripción.
          if (!result.transcript && isGeminiEnabled()) {
            result.transcript = await transcribeWithGemini(wav).catch(() => '');
          }
          // Respuesta rápida (~2 s). Si hay Gemini, la app pide después /api/speech/review para afinar.
          sendJson(res, 200, { ...result, provider, reviewAvailable: isGeminiEnabled() && !!result.pronunciation });
          return;
        }
        // Solo Google: Gemini escucha y devuelve transcripción + pronunciación estimada (aproximada).
        const result = await assessPronunciationWithGemini(wav, language, referenceText);
        sendJson(res, 200, { ...result, confidence: null, durationSec: null, provider });
      } catch (err) {
        console.warn(`[LingoPulse API] speech (${provider}) failed: ${err instanceof Error ? err.message : err}`);
        sendJson(res, 502, { error: 'stt_failed' });
      }
      return;
    }

    // 8b. Segunda pasada: Gemini escucha la misma grabación y detecta lo que la medición acústica
    // no vio (sustituciones típicas como "tink" por "think") + transcripción literal con errores.
    if (req.method === 'POST' && url.pathname === '/api/speech/review') {
      if (!isGeminiEnabled()) {
        sendJson(res, 503, { error: 'review_disabled' });
        return;
      }
      const body = await readJsonBody<{
        audioBase64?: string;
        mimeType?: string;
        language?: string;
        referenceText?: string;
        feedbackLanguage?: string;
      }>(req);
      if (!body.audioBase64) {
        sendJson(res, 400, { error: 'audioBase64 is required' });
        return;
      }
      const audio = Buffer.from(body.audioBase64, 'base64');
      if (audio.length > 40 * 1024 * 1024) {
        sendJson(res, 413, { error: 'audio too large (max 40 MB)' });
        return;
      }
      try {
        const wav = await toWav16k(audio, body.mimeType ?? 'audio/mp4');
        if (!hasUsableSpeech(analyzeLevels(wav))) {
          sendJson(res, 200, { transcript: '', pronunciation: null, silent: true });
          return;
        }
        const started = Date.now();
        const result = await assessPronunciationWithGemini(
          wav,
          body.language ?? 'en-US',
          String(body.referenceText ?? '').slice(0, 600),
          body.feedbackLanguage === 'en' ? 'en' : 'es'
        );
        console.log(`[LingoPulse API] revisión Gemini en ${((Date.now() - started) / 1000).toFixed(1)} s`);
        sendJson(res, 200, result);
      } catch (err) {
        console.warn(`[LingoPulse API] review failed: ${err instanceof Error ? err.message : err}`);
        sendJson(res, 502, { error: 'review_failed' });
      }
      return;
    }

    // 8. Práctica libre: estado del coach (para que la app muestre "IA activa" o "motor local")
    if (req.method === 'GET' && url.pathname === '/api/coach/status') {
      const provider = coachProvider();
      sendJson(res, 200, { aiEnabled: provider !== 'local', provider });
      return;
    }

    // 9. Práctica libre: feedback de Writing / Speaking (Claude si está activo, motor local si no o si falla)
    if (req.method === 'POST' && url.pathname === '/api/coach/feedback') {
      const body = await readJsonBody<CoachRequest>(req);
      if (!body.text || typeof body.text !== 'string') {
        sendJson(res, 400, { error: 'text is required' });
        return;
      }
      if (body.text.length > 6000) {
        sendJson(res, 413, { error: 'text is too long (max 6000 characters)' });
        return;
      }
      const request: CoachRequest = {
        skill: body.skill === 'speaking' ? 'speaking' : 'writing',
        level: body.level ?? 'B1',
        promptEn: String(body.promptEn ?? ''),
        text: body.text,
        targetWords: Array.isArray(body.targetWords) ? body.targetWords.slice(0, 12).map(String) : [],
        minWords: body.minWords,
        audio: body.audio,
        pronunciation: body.pronunciation ?? null,
      };
      if (isGeminiCoachEnabled()) {
        try {
          sendJson(res, 200, await generateGeminiFeedback(request));
          return;
        } catch (err) {
          console.warn(`[LingoPulse API] Gemini coach unavailable (${err instanceof Error ? err.message : err}); trying next`);
        }
      }
      if (isAiCoachEnabled()) {
        try {
          sendJson(res, 200, await generateAiFeedback(request));
          return;
        } catch (err) {
          console.warn(`[LingoPulse API] AI coach unavailable (${describeProviderError(err)}); using local engine`);
        }
      }
      sendJson(res, 200, buildLocalFeedback(request));
      return;
    }

    sendJson(res, 404, { error: `Route not found: ${req.method} ${url.pathname}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    sendJson(res, 400, { error: message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(
      `[LingoPulse API] Session Orchestrator listening on http://localhost:${PORT}`
    );
  });
}

export { server };
