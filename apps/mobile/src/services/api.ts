import {
  analyzeLearnerTargetUse,
  B1_MODULE_1_SYLLABUS_OVERVIEW,
  calculateCreditedVoicedMs,
  calculateResponseWpm,
  computeNextFsrsState,
  countDisfluencyFillers,
  deriveFsrsRatingFromEvidence,
  detectForbiddenLeakInSpeak,
  getSeededLessonByLocale,
  type AudioStatus,
  type ClientArenaTurnPayload,
  type GrammarUseStatus,
  type PublicLessonDTO,
  type SupportedLocale,
  type TargetUseStatus,
  type VoiceScorecardDTO,
  type WritingEvaluationResult,
} from '@lingopulse/shared';

import { apiHeaders, getApiBaseUrl } from './config';
import { ensureAiConsent } from './aiConsent';

/**
 * Fallback local en memoria por si el usuario abre la app móvil sin haber iniciado `npm run dev:api`.
 * Usa exactamente las mismas reglas de `@lingopulse/shared`.
 */
interface LocalSessionState {
  sessionId: string;
  locale: SupportedLocale;
  stage: ClientArenaTurnPayload['stage'];
  learnerTurnsUsed: number;
  contextualReframesUsed: number;
  complicationIntroduced: boolean;
  remainingBudgetMs: number;
  totalVoicedMs: number;
  turns: Array<{
    turnId: string;
    transcript: string;
    audioStatus: AudioStatus;
    responseWindowMs: number;
    voicedMs: number;
    wordCount: number;
  }>;
  closed: boolean;
}

const localFallbackSessions = new Map<string, LocalSessionState>();

function makeUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function fetchWithFallback<T>(
  path: string,
  options: RequestInit,
  fallbackFn: () => T
): Promise<{ data: T; source: 'api' | 'local_engine' }> {
  try {
    // Los envíos con contenido del jugador (POST) necesitan su permiso; si no, se usa el motor local.
    if ((options.method ?? 'GET') !== 'GET' && !(await ensureAiConsent())) throw new Error('ai_consent_denied');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...apiHeaders(),
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as T;
    return { data, source: 'api' };
  } catch {
    return { data: fallbackFn(), source: 'local_engine' };
  }
}

export async function fetchCurriculumByLocale(locale: SupportedLocale): Promise<{
  unitSyllabus: typeof B1_MODULE_1_SYLLABUS_OVERVIEW;
  activeLesson: PublicLessonDTO;
  source: 'api' | 'local_engine';
}> {
  const { data, source } = await fetchWithFallback(
    `/api/curriculum?locale=${locale}`,
    { method: 'GET' },
    () => ({
      unitSyllabus: B1_MODULE_1_SYLLABUS_OVERVIEW,
      activeLesson: getSeededLessonByLocale(locale).publicLesson,
    })
  );
  return { ...data, source };
}

export async function checkInputComprehension(params: {
  locale: SupportedLocale;
  learnerAnswer: string;
}) {
  const { data } = await fetchWithFallback(
    '/api/input/check',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    () => {
      const bundle = getSeededLessonByLocale(params.locale);
      const { expectedInferenceKeywords, sampleModelAnswer } =
        bundle.publicLesson.publicContent.input;
      const lower = params.learnerAnswer.toLowerCase();
      const matchedKeywords = expectedInferenceKeywords.filter((kw) =>
        lower.includes(kw.toLowerCase())
      );
      const passed =
        params.learnerAnswer.trim().length >= 12 && matchedKeywords.length >= 1;
      return {
        passed,
        matchedKeywords,
        feedbackEs: passed
          ? '¡Inferencia precisa! Identificaste que Sam tiene la aprobación final del presupuesto y que reunirse sin ella obligaría a repetir la discusión.'
          : 'Menciona por qué Sam es clave hoy (aprobación del presupuesto / sign-off) o la consecuencia de reunirse sin ella (repetir la sesión mañana).',
        sampleModelAnswer,
      };
    }
  );
  return data;
}

export async function submitWritingPhase(params: {
  locale: SupportedLocale;
  text: string;
}): Promise<WritingEvaluationResult> {
  const { data } = await fetchWithFallback(
    '/api/writing/evaluate',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    () => {
      const bundle = getSeededLessonByLocale(params.locale);
      const analysis = analyzeLearnerTargetUse(
        params.text,
        bundle.privateArenaConfig.primary_target.canonical
      );
      const isUK = params.locale === 'en-GB';
      let targetUsed: WritingEvaluationResult['targetUsed'] = 'missing';
      let correctedSentenceEn = isUK
        ? "Hi Jordan, since Sam can't make it today, let's put the meeting off until Friday morning."
        : "Hey Jordan, since Sam can't make it today, let's put the meeting off until Friday morning.";

      if (analysis.targetUse === 'correct' && analysis.grammarUse === 'correct') {
        targetUsed = 'correct';
        correctedSentenceEn = params.text.trim();
      } else if (
        analysis.targetUse === 'correct' &&
        analysis.grammarUse === 'incorrect'
      ) {
        targetUsed = 'incorrect_grammar';
        correctedSentenceEn = params.text
          .replace(/\bput\s+off\s+it\b/gi, 'put it off')
          .replace(/\bput\s+off\s+them\b/gi, 'put them off');
      } else if (analysis.communicativeIntentResolved) {
        targetUsed = 'paraphrase_only';
      }

      return {
        submissionId: makeUuid(),
        communicativeGoalMet: analysis.communicativeIntentResolved,
        targetUsed,
        detectedQuote: analysis.matchedQuote,
        explanationEs: analysis.explanationEs,
        correctedSentenceEn,
        reformulations: isUK
          ? {
              casual:
                "Hi Jordan — Sam's train was cancelled, so let's put today's catch-up off until Friday.",
              professional:
                "Dear Jordan, as Sam is unable to join us today, I suggest we put the budget review off until Friday at 11 a.m.",
            }
          : {
              casual:
                "Hey Jordan — Sam's flight is delayed, so let's put today's sync off until Friday.",
              professional:
                "Hi Jordan, since Sam won't have reliable signal before 4 p.m., I recommend putting the Q4 review off until Friday morning.",
            },
        locale: params.locale,
      };
    }
  );
  return data;
}

export async function startArenaSession(
  locale: SupportedLocale
): Promise<ClientArenaTurnPayload> {
  const { data } = await fetchWithFallback<ClientArenaTurnPayload>(
    '/api/voice-arena/start',
    {
      method: 'POST',
      body: JSON.stringify({ locale }),
    },
    (): ClientArenaTurnPayload => {
      const bundle = getSeededLessonByLocale(locale);
      const sessionId = makeUuid();
      const budgetMs =
        bundle.publicLesson.publicContent.voiceArena.interactionBudgetMs;
      localFallbackSessions.set(sessionId, {
        sessionId,
        locale,
        stage: 'opening',
        learnerTurnsUsed: 0,
        contextualReframesUsed: 0,
        complicationIntroduced: false,
        remainingBudgetMs: budgetMs,
        totalVoicedMs: 0,
        turns: [],
        closed: false,
      });
      return {
        sessionId,
        turnIndex: 0,
        agentTurnId: makeUuid(),
        speak: bundle.privateArenaConfig.opening_scene,
        action: 'ask',
        stage: 'opening',
        learnerTurnsUsed: 0,
        maxLearnerTurns: bundle.privateArenaConfig.max_learner_turns,
        remainingBudgetMs: budgetMs,
        creditedFuelMsThisTurn: 0,
        totalSessionVoicedMs: 0,
        isSessionClosed: false,
      };
    }
  );
  return data;
}

export async function sendArenaTurn(params: {
  sessionId: string;
  locale: SupportedLocale;
  transcript: string;
  audioStatus?: AudioStatus;
  responseWindowMs?: number;
  voicedMs?: number;
}): Promise<ClientArenaTurnPayload> {
  const { data } = await fetchWithFallback<ClientArenaTurnPayload>(
    '/api/voice-arena/turn',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    (): ClientArenaTurnPayload => {
      const bundle = getSeededLessonByLocale(params.locale);
      const config = bundle.privateArenaConfig;
      let session = localFallbackSessions.get(params.sessionId);
      if (!session) {
        session = {
          sessionId: params.sessionId,
          locale: params.locale,
          stage: 'opening',
          learnerTurnsUsed: 0,
          contextualReframesUsed: 0,
          complicationIntroduced: false,
          remainingBudgetMs: 75000,
          totalVoicedMs: 0,
          turns: [],
          closed: false,
        };
        localFallbackSessions.set(params.sessionId, session);
      }

      const audioStatus = params.audioStatus ?? 'usable';
      const clean = params.transcript.trim();
      const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
      const responseWindowMs =
        params.responseWindowMs ?? Math.max(4500, wordCount * 550);
      const voicedMs =
        params.voicedMs ??
        (audioStatus === 'usable' ? Math.max(3500, wordCount * 480) : 0);

      if (audioStatus !== 'usable' || !clean) {
        return {
          sessionId: session.sessionId,
          turnIndex: session.turns.length + 1,
          agentTurnId: makeUuid(),
          speak:
            'Sorry, the connection broke up for a second. Could you say that again?',
          action: 'request_repeat',
          stage: session.stage,
          learnerTurnsUsed: session.learnerTurnsUsed,
          maxLearnerTurns: config.max_learner_turns,
          remainingBudgetMs: session.remainingBudgetMs,
          creditedFuelMsThisTurn: 0,
          totalSessionVoicedMs: session.totalVoicedMs,
          isSessionClosed: false,
        };
      }

      const credited = calculateCreditedVoicedMs(
        voicedMs,
        responseWindowMs,
        audioStatus
      );
      session.learnerTurnsUsed += 1;
      session.remainingBudgetMs = Math.max(
        0,
        session.remainingBudgetMs - responseWindowMs
      );
      session.totalVoicedMs += credited;

      session.turns.push({
        turnId: makeUuid(),
        transcript: clean,
        audioStatus,
        responseWindowMs,
        voicedMs: credited,
        wordCount,
      });

      const analysis = analyzeLearnerTargetUse(
        clean,
        config.primary_target.canonical
      );
      const mustClose =
        session.remainingBudgetMs <= 0 ||
        session.learnerTurnsUsed >= config.max_learner_turns;

      let speak = '';
      let action: ClientArenaTurnPayload['action'] = 'ask';

      if (analysis.isPromptInjectionOrRevealRequest) {
        speak =
          "I just need to know what to tell the team before ten o'clock. What should we do about today's session?";
      } else if (mustClose) {
        speak =
          "Got it. I'll update the calendar and let everyone know right away.";
        action = 'close';
        session.stage = 'closing';
        session.closed = true;
      } else if (
        session.complicationIntroduced &&
        (analysis.targetUse === 'correct' || analysis.communicativeIntentResolved)
      ) {
        speak =
          "Perfect, I'll send the updated calendar invite with the video link right now.";
        action = 'close';
        session.stage = 'closing';
        session.closed = true;
      } else if (analysis.targetUse === 'correct') {
        session.complicationIntroduced = true;
        session.stage = 'complication';
        speak =
          "That makes sense. One issue though: Friday's conference room is already booked, though we could meet online. What should I tell the team?";
      } else if (analysis.communicativeIntentResolved) {
        session.contextualReframesUsed += 1;
        session.stage = 'contextual_followup';
        speak = 'Friday could work. What exactly should I tell the team?';
      } else {
        speak =
          'Everyone is waiting on Slack. Should we go ahead without Sam today, or do something else with the schedule?';
      }

      const leak = detectForbiddenLeakInSpeak(
        speak,
        config.forbidden_spoken_forms,
        config.primary_target.canonical
      );
      if (leak.leaked) {
        speak = 'What exactly should I tell the team?';
      }

      return {
        sessionId: session.sessionId,
        turnIndex: session.turns.length,
        agentTurnId: makeUuid(),
        speak,
        action,
        stage: session.stage,
        learnerTurnsUsed: session.learnerTurnsUsed,
        maxLearnerTurns: config.max_learner_turns,
        remainingBudgetMs: session.remainingBudgetMs,
        creditedFuelMsThisTurn: credited,
        totalSessionVoicedMs: session.totalVoicedMs,
        isSessionClosed: session.closed,
      };
    }
  );
  return data;
}

export async function fetchArenaScorecard(params: {
  sessionId: string;
  locale: SupportedLocale;
}): Promise<VoiceScorecardDTO> {
  const { data } = await fetchWithFallback<VoiceScorecardDTO>(
    '/api/voice-arena/scorecard',
    {
      method: 'POST',
      body: JSON.stringify({ sessionId: params.sessionId }),
    },
    (): VoiceScorecardDTO => {
      const session = localFallbackSessions.get(params.sessionId);
      const bundle = getSeededLessonByLocale(params.locale);
      const canonical = bundle.privateArenaConfig.primary_target.canonical;
      const turns = session?.turns ?? [];

      const totalWords = turns.reduce((acc, t) => acc + t.wordCount, 0);
      const totalResponseMs = turns.reduce(
        (acc, t) => acc + t.responseWindowMs,
        0
      );
      const totalVoicedMs = turns.reduce((acc, t) => acc + t.voicedMs, 0);

      let bestTargetUse: TargetUseStatus = 'not_observed';
      let bestGrammarUse: GrammarUseStatus = 'not_applicable';
      let achievedComm = 0;

      const evidences: VoiceScorecardDTO['evidences'] = [];
      for (const t of turns) {
        const analysis = analyzeLearnerTargetUse(t.transcript, canonical);
        if (analysis.communicativeIntentResolved) achievedComm += 1;
        if (analysis.targetUse === 'correct') {
          bestTargetUse = 'correct';
          if (analysis.grammarUse === 'correct') bestGrammarUse = 'correct';
          else if (bestGrammarUse !== 'correct') bestGrammarUse = 'incorrect';
        }
        evidences.push({
          turnId: t.turnId,
          quote: analysis.matchedQuote ?? t.transcript,
          useStatus: analysis.targetUse,
          grammarStatus: analysis.grammarUse,
          feedbackEs: analysis.explanationEs,
        });
      }

      const fsrsRating =
        deriveFsrsRatingFromEvidence(
          bestTargetUse,
          bestGrammarUse,
          (session?.contextualReframesUsed ?? 0) > 0 ? 'contextual' : 'none',
          session?.contextualReframesUsed ?? 0
        ) ?? 3;
      const fsrs = computeNextFsrsState(fsrsRating);

      const communicativeScore: 0 | 1 | 2 | 3 | 4 =
        achievedComm >= 2 ? 4 : achievedComm === 1 ? 3 : 2;
      const targetScore: 0 | 1 | 2 | 3 | 4 =
        bestTargetUse === 'correct' ? 4 : 1;
      const grammarScore: 0 | 1 | 2 | 3 | 4 =
        bestGrammarUse === 'correct'
          ? 4
          : bestGrammarUse === 'incorrect'
            ? 2
            : 3;

      return {
        sessionId: params.sessionId,
        status: totalVoicedMs >= 1500 ? 'ready' : 'insufficient_audio',
        communicativeScore,
        targetScore,
        grammarScore,
        wpm: calculateResponseWpm(totalWords, totalResponseMs),
        learnerWordCount: totalWords,
        learnerResponseMs: totalResponseMs,
        learnerVoicedMs: totalVoicedMs,
        fillerCount: countDisfluencyFillers(
          null,
          turns.map((t) => t.transcript).join(' ')
        ),
        pauseCount: Math.max(1, Math.floor(totalWords / 12)),
        fuelAwardedSeconds: Math.round(totalVoicedMs / 1000),
        streakQualifiedToday: totalVoicedMs >= 30000,
        evidences,
        summaryFeedbackEs:
          bestTargetUse === 'correct' && bestGrammarUse === 'correct'
            ? '¡Objetivo superado con evidencia verificada! Recuperaste "put off" de forma natural y ubicaste el pronombre objeto en la posición correcta.'
            : bestTargetUse === 'correct' && bestGrammarUse === 'incorrect'
              ? 'Recuperaste "put off", pero recuerda que el pronombre objeto va en medio: "put it off", nunca "put off it".'
              : 'Resolviste la situación comunicativa con una paráfrasis válida, pero quedó pendiente recuperar "put off" espontáneamente.',
        modelUpgradeExampleEn:
          params.locale === 'en-GB'
            ? "Since Sam is stuck at Heathrow, let's put the meeting off until Friday and move it online."
            : "Since Sam's flight is delayed, let's put the meeting off until Friday and meet over Zoom.",
        fsrsNextReview: {
          targetExpression: canonical,
          rating: fsrs.rating,
          ratingLabel: fsrs.ratingLabel,
          nextDueDays: fsrs.nextDueDays,
          state: fsrs.state,
        },
      };
    }
  );
  return data;
}
