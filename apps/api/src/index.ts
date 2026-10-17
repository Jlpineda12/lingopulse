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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
      sendJson(res, 200, { sttEnabled: isSpeechToTextEnabled(), provider: isSpeechToTextEnabled() ? 'deepgram' : 'none' });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/speech/transcribe') {
      if (!isSpeechToTextEnabled()) {
        sendJson(res, 503, { error: 'stt_disabled' });
        return;
      }
      const body = await readJsonBody<{ audioBase64?: string; mimeType?: string; language?: string }>(req);
      if (!body.audioBase64) {
        sendJson(res, 400, { error: 'audioBase64 is required' });
        return;
      }
      const audio = Buffer.from(body.audioBase64, 'base64');
      if (audio.length > 15 * 1024 * 1024) {
        sendJson(res, 413, { error: 'audio too large (max 15 MB)' });
        return;
      }
      try {
        const result = await transcribeAudio(audio, body.mimeType ?? 'audio/mp4', body.language ?? 'en');
        sendJson(res, 200, result);
      } catch (err) {
        console.warn(`[LingoPulse API] STT failed: ${err instanceof Error ? err.message : err}`);
        sendJson(res, 502, { error: 'stt_failed' });
      }
      return;
    }

    // 8. Práctica libre: estado del coach (para que la app muestre "IA activa" o "motor local")
    if (req.method === 'GET' && url.pathname === '/api/coach/status') {
      sendJson(res, 200, { aiEnabled: isAiCoachEnabled(), provider: isAiCoachEnabled() ? 'anthropic' : 'local' });
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
      };
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
