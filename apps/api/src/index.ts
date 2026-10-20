import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  B1_MODULE_1_SYLLABUS_OVERVIEW,
  getSeededLessonByLocale,
  buildLocalFeedback,
  type AudioStatus,
  type SupportedLocale,
} from '@lingopulse/shared';
import {
  describeProviderError,
  generateAiFeedback,
  isAiCoachEnabled,
} from './services/aiCoach.js';
import { isSpeechToTextEnabled, transcribeAudio } from './services/speechToText.js';
import { analyzeLevels, hasUsableSpeech, normalizeGain, toWav16k } from './services/audio.js';
import { AudioCache } from './services/audioCache.js';
import {
  accessKeyProblem,
  AUDIO_BODY_LIMIT,
  clientIp,
  HttpError,
  isAuthorized,
  parseCoachRequest,
  RateLimiter,
  readJsonBody,
} from './http.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assessPronunciation, isAzureSpeechEnabled } from './services/azurePronunciation.js';
import { isAzureTtsEnabled, synthesizeSpeech } from './services/azureTts.js';
import { fastTranscribe, isFastSttEnabled } from './services/fastStt.js';
import {
  assessPronunciationWithGemini,
  generateGeminiFeedback,
  isGeminiCoachEnabled,
  isGeminiEnabled,
  isGeminiFastTranscriptEnabled,
  transcribeWithGemini,
  type GeminiAssessment,
} from './services/gemini.js';
import {
  ArenaSessionError,
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

/** Límites por IP y minuto: las rutas de IA cuestan dinero, las demás son baratas. */
const aiLimiter = new RateLimiter(Number(process.env.RATE_LIMIT_AI_PER_MIN) || 30);
const generalLimiter = new RateLimiter(Number(process.env.RATE_LIMIT_PER_MIN) || 240);
const AI_ROUTES = new Set(['/api/speech/transcribe', '/api/speech/review', '/api/coach/feedback', '/api/tts', '/api/voice-arena/turn-audio']);

/** Grabaciones convertidas y revisiones de pronunciación en curso (ver audioCache.ts). */
const audioCache = new AudioCache<GeminiAssessment>();

function feedbackLanguageOf(value: unknown): 'es' | 'en' {
  return value === 'en' ? 'en' : 'es';
}

/** Decodifica el audio en base64 que manda la app y comprueba el tamaño. */
function decodeAudio(audioBase64: unknown): Buffer {
  if (typeof audioBase64 !== 'string' || !audioBase64) throw new HttpError(400, 'audioBase64 is required');
  const audio = Buffer.from(audioBase64, 'base64');
  if (audio.length > 40 * 1024 * 1024) throw new HttpError(413, 'audio too large (max 40 MB)');
  return audio;
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

    const limiter = AI_ROUTES.has(url.pathname) ? aiLimiter : generalLimiter;
    if (!limiter.allow(`${AI_ROUTES.has(url.pathname) ? 'ai' : 'all'}:${clientIp(req)}`)) {
      res.setHeader('Retry-After', '60');
      sendJson(res, 429, { error: 'too_many_requests' });
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

    // 6b. Fase 4 en un solo viaje (baja latencia): audio → transcripción rápida → turno →
    // respuesta de la mascota ya sintetizada con voz neuronal. La app no espera tres peticiones.
    if (req.method === 'POST' && url.pathname === '/api/voice-arena/turn-audio') {
      const body = await readJsonBody<{
        sessionId: string;
        transcript?: string;
        audioBase64?: string;
        mimeType?: string;
        language?: string;
        responseWindowMs?: number;
        voicedMs?: number;
        withSpeech?: boolean;
        voice?: { pitch?: number; rate?: number };
      }>(req, AUDIO_BODY_LIMIT);
      const started = Date.now();
      const language = body.language === 'en-GB' ? 'en-GB' : 'en-US';
      let transcript = String(body.transcript ?? '').trim().slice(0, 2000);
      let audioStatus: AudioStatus = 'usable';
      let sttMs = 0;
      if (!transcript && body.audioBase64) {
        if (!isFastSttEnabled()) {
          sendJson(res, 503, { error: 'stt_disabled' });
          return;
        }
        try {
          const fast = await fastTranscribe(decodeAudio(body.audioBase64), String(body.mimeType ?? 'audio/mp4'), language);
          transcript = fast.transcript;
          if (fast.silent || !transcript) audioStatus = 'unusable';
        } catch (err) {
          console.warn(`[LingoPulse API] transcripción rápida falló: ${err instanceof Error ? err.message : err}`);
          sendJson(res, 502, { error: 'stt_failed' });
          return;
        }
        sttMs = Date.now() - started;
      }
      const turn = processLearnerVoiceTurn({
        sessionId: body.sessionId,
        transcript,
        audioStatus,
        responseWindowMs: body.responseWindowMs,
        voicedMs: body.voicedMs,
      });
      let speechAudioBase64: string | null = null;
      const ttsStarted = Date.now();
      if (body.withSpeech && isAzureTtsEnabled() && turn.speak) {
        speechAudioBase64 = await synthesizeSpeech(turn.speak, {
          locale: language,
          style: 'cheerful',
          pitch: body.voice?.pitch,
          rate: body.voice?.rate,
        })
          .then((b) => b.toString('base64'))
          .catch(() => null);
      }
      const totalMs = Date.now() - started;
      console.log(`[LingoPulse API] turno de voz en ${totalMs} ms (stt ${sttMs} ms · voz ${Date.now() - ttsStarted} ms)`);
      sendJson(res, 200, { transcript, audioStatus, turn, speechAudioBase64, timings: { sttMs, totalMs } });
      return;
    }

    // 7. Fase 4: Cerrar sesión y obtener Scorecard con evidencia + FSRS
    if (req.method === 'POST' && url.pathname === '/api/voice-arena/scorecard') {
      const body = await readJsonBody<{ sessionId: string }>(req);
      const scorecard = generateVoiceScorecard(body.sessionId);
      sendJson(res, 200, scorecard);
      return;
    }

    // Voz neuronal expresiva (Azure SSML, estilo cheerful) para la mascota y la retroalimentación.
    if (req.method === 'GET' && url.pathname === '/api/tts/status') {
      sendJson(res, 200, { enabled: isAzureTtsEnabled(), provider: isAzureTtsEnabled() ? 'azure' : 'none' });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/tts') {
      if (!isAzureTtsEnabled()) {
        sendJson(res, 503, { error: 'tts_disabled' });
        return;
      }
      const body = await readJsonBody<{ text?: string; locale?: string; style?: string; pitch?: number; rate?: number }>(req);
      const text = String(body.text ?? '').trim();
      if (!text) {
        sendJson(res, 400, { error: 'empty_text' });
        return;
      }
      try {
        const audio = await synthesizeSpeech(text, { locale: body.locale, style: body.style, pitch: body.pitch, rate: body.rate });
        setCorsHeaders(res);
        res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'private, max-age=86400' });
        res.end(audio);
      } catch (err) {
        console.warn(`[LingoPulse API] voz neuronal falló: ${err instanceof Error ? err.message : err}`);
        sendJson(res, 502, { error: 'tts_failed' });
      }
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
      const body = await readJsonBody<{
        audioBase64?: string;
        mimeType?: string;
        language?: string;
        referenceText?: string;
        feedbackLanguage?: string;
      }>(req, AUDIO_BODY_LIMIT);
      const audio = decodeAudio(body.audioBase64);
      const mimeType = String(body.mimeType ?? 'audio/mp4');
      const language = body.language === 'en-GB' ? 'en-GB' : 'en-US';
      const referenceText = String(body.referenceText ?? '').slice(0, 600);
      const feedbackLanguage = feedbackLanguageOf(body.feedbackLanguage);
      const started = Date.now();
      try {
        if (provider === 'deepgram') {
          sendJson(res, 200, { ...(await transcribeAudio(audio, mimeType, language)), pronunciation: null, provider });
          return;
        }
        const rawWav = await toWav16k(audio, mimeType);
        const levels = analyzeLevels(rawWav);
        const lastDir = await saveLastAudio(audio, mimeType, rawWav);
        console.log(
          `[LingoPulse API] audio ${levels.durationSec.toFixed(1)} s · pico ${levels.peakDb} dB · medio ${levels.rmsDb} dB · voz ${levels.voicedSec} s` +
            (lastDir ? ` · guardado en ${lastDir}` : '')
        );
        if (!hasUsableSpeech(levels)) {
          // Audio vacío o casi mudo: no se manda a la IA (inventaría un texto).
          sendJson(res, 200, { transcript: '', confidence: null, durationSec: levels.durationSec, pronunciation: null, provider, silent: true, levels });
          return;
        }
        // Grabaciones bajas (teléfono lejos): se sube el volumen para no perder las últimas palabras.
        const wav = normalizeGain(rawWav);

        // La revisión de Gemini (pronunciación + transcripción literal) arranca YA, en paralelo,
        // y la app la recoge luego con el audioId sin volver a subir el audio.
        let audioId: string | null = null;
        if (isGeminiEnabled()) {
          audioId = audioCache.put(wav, { language, referenceText });
          audioCache.startReview(audioId, (e) => assessPronunciationWithGemini(e.wav, e.language, e.referenceText, feedbackLanguage));
        }

        if (provider === 'azure') {
          const result = await assessPronunciation(wav, language, referenceText);
          // Si Azure no entendió nada pero hay Gemini, al menos devolvemos la transcripción.
          if (!result.transcript && isGeminiEnabled()) {
            result.transcript = await transcribeWithGemini(wav, { fast: true }).catch(() => '');
          }
          console.log(`[LingoPulse API] Azure en ${((Date.now() - started) / 1000).toFixed(1)} s`);
          sendJson(res, 200, { ...result, provider, audioId, reviewAvailable: !!audioId });
          return;
        }

        // Solo Google: transcripción rápida (Flash-Lite, ~3 s) mientras la pronunciación sigue en paralelo.
        if (audioId && isGeminiFastTranscriptEnabled()) {
          const transcript = await transcribeWithGemini(wav, { fast: true }).catch((err) => {
            console.warn(`[LingoPulse API] transcripción rápida falló: ${err instanceof Error ? err.message : err}`);
            return null;
          });
          if (transcript !== null) {
            console.log(`[LingoPulse API] transcripción rápida en ${((Date.now() - started) / 1000).toFixed(1)} s`);
            sendJson(res, 200, {
              transcript,
              confidence: null,
              durationSec: levels.durationSec,
              pronunciation: null,
              provider,
              audioId,
              reviewAvailable: true,
            });
            return;
          }
        }
        // Sin transcripción rápida: se espera la evaluación completa (transcripción + pronunciación).
        const result = audioId
          ? await audioCache.startReview(audioId, (e) => assessPronunciationWithGemini(e.wav, e.language, e.referenceText, feedbackLanguage))
          : null;
        if (!result) throw new Error('Gemini no devolvió resultado');
        sendJson(res, 200, { ...result, confidence: null, durationSec: levels.durationSec, provider });
      } catch (err) {
        console.warn(`[LingoPulse API] speech (${provider}) failed: ${err instanceof Error ? err.message : err}`);
        sendJson(res, 502, { error: 'stt_failed' });
      }
      return;
    }

    // 8b. Segunda pasada: Gemini escucha la misma grabación y detecta lo que la medición acústica
    // no vio (sustituciones típicas como "tink" por "think") + transcripción literal con errores.
    // Con audioId se recoge la revisión que ya empezó en /transcribe; si caducó, la app reenvía el audio.
    if (req.method === 'POST' && url.pathname === '/api/speech/review') {
      if (!isGeminiEnabled()) {
        sendJson(res, 503, { error: 'review_disabled' });
        return;
      }
      const body = await readJsonBody<{
        audioId?: string;
        audioBase64?: string;
        mimeType?: string;
        language?: string;
        referenceText?: string;
        feedbackLanguage?: string;
      }>(req, AUDIO_BODY_LIMIT);
      const feedbackLanguage = feedbackLanguageOf(body.feedbackLanguage);
      const started = Date.now();
      try {
        if (body.audioId && !body.audioBase64) {
          const pending = audioCache.get(body.audioId)
            ? audioCache.startReview(body.audioId, (e) => assessPronunciationWithGemini(e.wav, e.language, e.referenceText, feedbackLanguage))
            : null;
          if (!pending) {
            sendJson(res, 404, { error: 'audio_expired' });
            return;
          }
          const result = await pending;
          if (!result) {
            sendJson(res, 502, { error: 'review_failed' });
            return;
          }
          console.log(`[LingoPulse API] revisión recogida tras ${((Date.now() - started) / 1000).toFixed(1)} s de espera`);
          sendJson(res, 200, result);
          return;
        }
        const audio = decodeAudio(body.audioBase64);
        const rawWav = await toWav16k(audio, String(body.mimeType ?? 'audio/mp4'));
        if (!hasUsableSpeech(analyzeLevels(rawWav))) {
          sendJson(res, 200, { transcript: '', pronunciation: null, silent: true });
          return;
        }
        const result = await assessPronunciationWithGemini(
          normalizeGain(rawWav),
          body.language === 'en-GB' ? 'en-GB' : 'en-US',
          String(body.referenceText ?? '').slice(0, 600),
          feedbackLanguage
        );
        console.log(`[LingoPulse API] revisión Gemini en ${((Date.now() - started) / 1000).toFixed(1)} s`);
        sendJson(res, 200, result);
      } catch (err) {
        if (err instanceof HttpError) throw err;
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
      const request = parseCoachRequest(await readJsonBody<unknown>(req));
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
    if (res.headersSent) {
      res.end();
      return;
    }
    if (err instanceof HttpError) {
      // 413: el cliente aún puede estar enviando; se cierra la conexión tras responder.
      if (err.status === 413) res.setHeader('Connection', 'close');
      sendJson(res, err.status, { error: err.message });
      return;
    }
    if (err instanceof ArenaSessionError) {
      sendJson(res, err.code === 'not_found' ? 404 : 409, { error: err.code === 'not_found' ? 'session_not_found' : 'session_closed' });
      return;
    }
    console.error('[LingoPulse API] error interno:', err);
    sendJson(res, 500, { error: 'internal_error' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  const keyProblem = accessKeyProblem();
  if (keyProblem) {
    console.error(`[LingoPulse API] ${keyProblem}`);
    process.exit(1);
  }
  if (!process.env.APP_ACCESS_KEY) {
    console.warn('[LingoPulse API] Aviso: APP_ACCESS_KEY vacía; cualquiera en tu red puede usar el servidor.');
  }
  server.listen(PORT, () => {
    console.log(
      `[LingoPulse API] Session Orchestrator listening on http://localhost:${PORT}`
    );
  });
}

export { server };
