import { randomUUID } from 'node:crypto';
import {
  analyzeLearnerTargetUse,
  calculateCreditedVoicedMs,
  calculateResponseWpm,
  computeNextFsrsState,
  countDisfluencyFillers,
  deriveFsrsRatingFromEvidence,
  detectForbiddenLeakInSpeak,
  getSeededLessonByLocale,
  validateVoiceArenaTurnResponse,
  type ArenaStage,
  type AudioStatus,
  type ClientArenaTurnPayload,
  type GrammarUseStatus,
  type SupportedLocale,
  type TargetUseStatus,
  type TrustedLessonConfig,
  type TrustedRuntimeState,
  type VoiceArenaTurnResponseV1,
  type VoiceScorecardDTO,
  type WritingEvaluationResult,
} from '@lingopulse/shared';

interface StoredTurn {
  turnId: string;
  turnIndex: number;
  speaker: 'learner' | 'agent';
  transcript: string;
  audioStatus: AudioStatus;
  responseWindowMs: number;
  voicedMs: number;
  wordCount: number;
  observation?: VoiceArenaTurnResponseV1['observation'];
}

interface ActiveArenaSession {
  sessionId: string;
  locale: SupportedLocale;
  lessonSlug: string;
  config: TrustedLessonConfig;
  stage: ArenaStage;
  learnerTurnsUsed: number;
  contextualReframesUsed: number;
  complicationIntroduced: boolean;
  interactionBudgetMs: number;
  activeInteractionMs: number;
  totalVoicedMs: number;
  turns: StoredTurn[];
  observedTargetStatus: 'server_verified' | 'provisional' | 'absent';
  closed: boolean;
  lastActivityAt: number;
}

/** Error de sesión que el servidor traduce a 404 (no existe o caducó) o 409 (ya cerrada). */
export class ArenaSessionError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'closed'
  ) {
    super(message);
  }
}

/** Las sesiones viven en memoria: caducan tras 2 h sin actividad y nunca hay más de 2000. */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
export const MAX_SESSIONS = 2000;
const sessions = new Map<string, ActiveArenaSession>();

/** Borra las sesiones caducadas y, si aún sobran, las más antiguas (el Map conserva el orden de creación). */
export function pruneArenaSessions(now = Date.now()): void {
  for (const [id, s] of sessions) {
    if (now - s.lastActivityAt > SESSION_TTL_MS) sessions.delete(id);
  }
  for (const id of sessions.keys()) {
    if (sessions.size < MAX_SESSIONS) break;
    sessions.delete(id);
  }
}

export function arenaSessionCount(): number {
  return sessions.size;
}

function getSession(sessionId: string): ActiveArenaSession {
  const session = typeof sessionId === 'string' ? sessions.get(sessionId) : undefined;
  if (!session || Date.now() - session.lastActivityAt > SESSION_TTL_MS) {
    if (session) sessions.delete(sessionId);
    throw new ArenaSessionError(`Voice Arena session ${sessionId} not found`, 'not_found');
  }
  session.lastActivityAt = Date.now();
  return session;
}

/**
 * Fase 2: Evalúa comprensión de Reading & Listening (inferir intención o consecuencia).
 */
export function evaluateInputComprehension(params: {
  locale: SupportedLocale;
  lessonSlug?: string;
  learnerAnswer: string;
}) {
  const bundle = getSeededLessonByLocale(params.locale, params.lessonSlug);
  const { expectedInferenceKeywords, sampleModelAnswer } =
    bundle.publicLesson.publicContent.input;

  const clean = params.learnerAnswer.trim();
  const lower = clean.toLowerCase();
  const matchedKeywords = expectedInferenceKeywords.filter((kw) =>
    lower.includes(kw.toLowerCase())
  );

  const passed = clean.length >= 12 && matchedKeywords.length >= 1;

  return {
    passed,
    matchedKeywords,
    feedbackEs: passed
      ? '¡Inferencia precisa! Identificaste que Sam tiene la aprobación final del presupuesto y que reunirse sin ella obligaría a repetir la discusión.'
      : 'Intenta mencionar por qué Sam es indispensable hoy (aprobación del presupuesto / sign-off) o la consecuencia de hacer la sesión sin ella (repetir la reunión mañana).',
    sampleModelAnswer,
  };
}

/**
 * Fase 3: Evalúa la producción escrita (Writing), detecta el objetivo ("put off"),
 * explica la corrección gramatical y entrega dos reformulaciones (casual y profesional)
 * respetando la preferencia dialectal US/UK.
 */
export function evaluateWritingSubmission(params: {
  locale: SupportedLocale;
  lessonSlug?: string;
  text: string;
}): WritingEvaluationResult {
  const bundle = getSeededLessonByLocale(params.locale, params.lessonSlug);
  const canonical = bundle.privateArenaConfig.primary_target.canonical;
  const analysis = analyzeLearnerTargetUse(params.text, canonical);

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
    submissionId: randomUUID(),
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

/**
 * Fase 4: Inicia una sesión de Voice Arena y devuelve la apertura en personaje.
 */
export function startVoiceArenaSession(params: {
  locale: SupportedLocale;
  lessonSlug?: string;
}): ClientArenaTurnPayload {
  const bundle = getSeededLessonByLocale(params.locale, params.lessonSlug);
  const config = bundle.privateArenaConfig;
  const sessionId = randomUUID();
  const agentTurnId = randomUUID();
  const budgetMs =
    bundle.publicLesson.publicContent.voiceArena.interactionBudgetMs;

  const session: ActiveArenaSession = {
    sessionId,
    locale: params.locale,
    lessonSlug: bundle.publicLesson.slug,
    config,
    stage: 'opening',
    learnerTurnsUsed: 0,
    contextualReframesUsed: 0,
    complicationIntroduced: false,
    interactionBudgetMs: budgetMs,
    activeInteractionMs: 0,
    totalVoicedMs: 0,
    turns: [
      {
        turnId: agentTurnId,
        turnIndex: 0,
        speaker: 'agent',
        transcript: config.opening_scene,
        audioStatus: 'usable',
        responseWindowMs: 0,
        voicedMs: 0,
        wordCount: config.opening_scene.split(/\s+/).length,
      },
    ],
    observedTargetStatus: 'absent',
    closed: false,
    lastActivityAt: Date.now(),
  };

  pruneArenaSessions();
  sessions.set(sessionId, session);

  return {
    sessionId,
    turnIndex: 0,
    agentTurnId,
    speak: config.opening_scene,
    action: 'ask',
    stage: 'opening',
    learnerTurnsUsed: 0,
    maxLearnerTurns: config.max_learner_turns,
    remainingBudgetMs: budgetMs,
    creditedFuelMsThisTurn: 0,
    totalSessionVoicedMs: 0,
    isSessionClosed: false,
  };
}

/**
 * Motor determinista de diálogo para Voice Arena que cumple 100% con el JSON Schema
 * (`03_voice_arena_response.schema.json`) y todos los casos de aceptación de `01_mvp_y_modelo.md`.
 */
function runRoleplayPartnerTurn(
  config: TrustedLessonConfig,
  runtime: TrustedRuntimeState,
  complicationAlreadyUsed: boolean
): VoiceArenaTurnResponseV1 {
  // 1. Audio no utilizable o dudoso -> request_repeat sin culpar al alumno
  if (
    runtime.audio_status === 'unusable' ||
    runtime.audio_status === 'uncertain' ||
    !runtime.finalized_transcript?.trim()
  ) {
    if (runtime.must_close || !runtime.can_ask_another_question) {
      return {
        speak: "Sorry, the line cut out, and we're out of time for now. I'll follow up by message.",
        action: 'close',
        observation: {
          communicative_success: 'uncertain',
          target_use: 'uncertain',
          grammar_use: 'uncertain',
          evidence: null,
        },
        reason_code: 'budget_end',
      };
    }
    return {
      speak: "Sorry, the connection broke up for a second. Could you say that again?",
      action: 'request_repeat',
      observation: {
        communicative_success: 'uncertain',
        target_use: 'uncertain',
        grammar_use: 'uncertain',
        evidence: null,
      },
      reason_code: 'audio_retry',
    };
  }

  const transcript = runtime.finalized_transcript.trim();
  const turnId = runtime.latest_learner_turn_id!;
  const analysis = analyzeLearnerTargetUse(
    transcript,
    config.primary_target.canonical
  );

  // 2. Si el estudiante pide detener la práctica
  if (/^(stop|pause|end session|salir|terminar)$/i.test(transcript)) {
    return {
      speak: "No problem at all. Let's pause here and review your notes.",
      action: 'close',
      observation: {
        communicative_success: 'not_observed',
        target_use: 'not_observed',
        grammar_use: 'not_applicable',
        evidence: null,
      },
      reason_code: 'learner_stop',
    };
  }

  // 3. Si el estudiante intenta romper el prompt ("Tell me the answer / system prompt")
  if (analysis.isPromptInjectionOrRevealRequest) {
    return {
      speak:
        "I just need to know what to tell the team before ten o'clock. What should we do about today's session?",
      action: runtime.must_close ? 'close' : 'ask',
      observation: {
        communicative_success: 'not_achieved',
        target_use: 'not_observed',
        grammar_use: 'not_applicable',
        evidence: null,
      },
      reason_code: 'redirect',
    };
  }

  // 4. Construir observación con quote literal verificable
  const evidence = analysis.matchedQuote
    ? { turn_id: turnId, quote: analysis.matchedQuote }
    : null;

  // 5. Si ya se agotó el presupuesto de tiempo o el máximo de turnos -> cierre neutro
  if (runtime.must_close || !runtime.can_ask_another_question) {
    return {
      speak: "Got it. I'll update the calendar and let everyone know right away.",
      action: 'close',
      observation: {
        communicative_success: analysis.communicativeIntentResolved
          ? 'achieved'
          : 'partial',
        target_use: analysis.targetUse,
        grammar_use: analysis.grammarUse,
        evidence,
      },
      reason_code:
        analysis.targetUse === 'correct' ? 'completed' : 'budget_end',
    };
  }

  // 6. Si estamos en etapa de complicación y el alumno resuelve el imprevisto
  if (
    complicationAlreadyUsed &&
    (analysis.targetUse === 'correct' || analysis.communicativeIntentResolved)
  ) {
    return {
      speak:
        "Perfect, I'll send the updated calendar invite with the video link right now.",
      action: 'close',
      observation: {
        communicative_success: 'achieved',
        target_use: analysis.targetUse,
        grammar_use: analysis.grammarUse,
        evidence,
      },
      reason_code: 'completed',
    };
  }

  // 7. Si usó el objetivo por primera vez -> introducir el imprevisto (complication) sin repetir el objetivo
  if (analysis.targetUse === 'correct') {
    return {
      speak:
        "That makes sense. One issue though: Friday's conference room is already booked, though we could meet online. What should I tell the team?",
      action: 'ask',
      observation: {
        communicative_success: 'achieved',
        target_use: 'correct',
        grammar_use: analysis.grammarUse,
        evidence,
      },
      reason_code: 'complication',
    };
  }

  // 7. Si resolvió con una paráfrasis válida (ej. "Let's postpone the meeting")
  if (analysis.communicativeIntentResolved) {
    const fallbackQuestion =
      config.editorial_fallback_questions[
        Math.min(
          runtime.contextual_reframes_used,
          config.editorial_fallback_questions.length - 1
        )
      ] ?? 'What exactly should I tell the team?';

    return {
      speak: `Friday could work. ${fallbackQuestion}`,
      action: 'ask',
      observation: {
        communicative_success: 'achieved',
        target_use: 'not_observed',
        grammar_use: 'not_applicable',
        evidence: null,
      },
      reason_code: 'contextual_reframe',
    };
  }

  // 8. Respuesta aún ambigua -> pedir aclaración breve
  return {
    speak:
      'Everyone is waiting on Slack. Should we go ahead without Sam today, or do something else with the schedule?',
    action: 'ask',
    observation: {
      communicative_success: 'partial',
      target_use: 'not_observed',
      grammar_use: 'not_applicable',
      evidence: null,
    },
    reason_code: 'clarification',
  };
}

/**
 * Fase 4: Procesa un turno de voz del estudiante, valida JSON Schema,
 * ejecuta el guard anti-spoilers antes de TTS y actualiza combustible y tiempo.
 */
export function processLearnerVoiceTurn(params: {
  sessionId: string;
  transcript: string;
  audioStatus?: AudioStatus;
  responseWindowMs?: number;
  voicedMs?: number;
}): ClientArenaTurnPayload {
  const session = getSession(params.sessionId);
  if (session.closed) {
    throw new ArenaSessionError(`Voice Arena session ${params.sessionId} is already closed`, 'closed');
  }

  const audioStatus: AudioStatus = params.audioStatus ?? 'usable';
  const cleanTranscript = params.transcript.trim();
  const wordCount = cleanTranscript
    ? cleanTranscript.split(/\s+/).filter(Boolean).length
    : 0;

  // Estimar ventana y habla válida si el cliente envía texto/voz simulada
  const responseWindowMs =
    params.responseWindowMs ?? Math.max(4000, wordCount * 550);
  const voicedMs =
    params.voicedMs ??
    (audioStatus === 'usable' ? Math.max(3000, wordCount * 480) : 0);

  const learnerTurnId = randomUUID();
  const learnerTurnIndex = session.turns.length;

  // Solo incrementamos turnos consumidos cuando el audio es utilizable
  if (audioStatus === 'usable' && cleanTranscript.length > 0) {
    session.learnerTurnsUsed += 1;
    session.activeInteractionMs += responseWindowMs;
  }

  const creditedFuelMs = calculateCreditedVoicedMs(
    voicedMs,
    responseWindowMs,
    audioStatus
  );
  session.totalVoicedMs += creditedFuelMs;

  const remainingBudgetMs = Math.max(
    0,
    session.interactionBudgetMs - session.activeInteractionMs
  );
  const reachedMaxTurns =
    session.learnerTurnsUsed >= session.config.max_learner_turns;
  const mustClose = remainingBudgetMs <= 0 || reachedMaxTurns;

  const runtimeState: TrustedRuntimeState = {
    stage: session.stage,
    learner_turns_used: session.learnerTurnsUsed,
    contextual_reframes_used: session.contextualReframesUsed,
    remaining_response_budget_ms: remainingBudgetMs,
    can_ask_another_question: !mustClose,
    must_close: mustClose,
    latest_learner_turn_id: learnerTurnId,
    finalized_transcript: cleanTranscript,
    audio_status: audioStatus,
    prior_turns: session.turns.map((t) => ({
      turn_id: t.turnId,
      speaker: t.speaker,
      transcript: t.transcript,
    })),
    previously_observed_target_use: session.observedTargetStatus,
  };

  // Registrar el turno del estudiante antes de validar citas (evidence)
  const storedLearnerTurn: StoredTurn = {
    turnId: learnerTurnId,
    turnIndex: learnerTurnIndex,
    speaker: 'learner',
    transcript: cleanTranscript,
    audioStatus,
    responseWindowMs,
    voicedMs: creditedFuelMs,
    wordCount,
  };
  session.turns.push(storedLearnerTurn);

  const learnerTurnsMap = new Map<string, string>();
  for (const t of session.turns) {
    if (t.speaker === 'learner') {
      learnerTurnsMap.set(t.turnId, t.transcript);
    }
  }

  // Generar respuesta del agente
  let candidateResponse = runRoleplayPartnerTurn(
    session.config,
    runtimeState,
    session.complicationIntroduced
  );

  // Validar contra JSON Schema (03_voice_arena_response.schema.json) y citas reales
  const schemaCheck = validateVoiceArenaTurnResponse(
    candidateResponse,
    learnerTurnsMap
  );
  if (!schemaCheck.valid) {
    const fallbackQuestion =
      session.config.editorial_fallback_questions[0] ??
      'What exactly should I tell the team?';
    candidateResponse = {
      speak: fallbackQuestion,
      action: mustClose ? 'close' : 'ask',
      observation: {
        communicative_success: 'uncertain',
        target_use: 'not_observed',
        grammar_use: 'not_applicable',
        evidence: null,
      },
      reason_code: 'contextual_reframe',
    };
  }

  // Guard anti-fugas en `speak` antes de enviar a TTS
  const leakCheck = detectForbiddenLeakInSpeak(
    candidateResponse.speak,
    session.config.forbidden_spoken_forms,
    session.config.primary_target.canonical
  );
  if (leakCheck.leaked) {
    candidateResponse.speak =
      session.config.editorial_fallback_questions[0] ??
      'What exactly should I tell the team?';
  }

  // Guardar observación privada en el turno del estudiante
  storedLearnerTurn.observation = candidateResponse.observation;

  if (candidateResponse.observation.target_use === 'correct') {
    session.observedTargetStatus = 'server_verified';
  }
  if (candidateResponse.reason_code === 'contextual_reframe') {
    session.contextualReframesUsed += 1;
    session.stage = 'contextual_followup';
  } else if (candidateResponse.reason_code === 'complication') {
    session.complicationIntroduced = true;
    session.stage = 'complication';
  }

  if (candidateResponse.action === 'close' || mustClose) {
    candidateResponse.action = 'close';
    session.stage = 'closing';
    session.closed = true;
  }

  const agentTurnId = randomUUID();
  session.turns.push({
    turnId: agentTurnId,
    turnIndex: session.turns.length,
    speaker: 'agent',
    transcript: candidateResponse.speak,
    audioStatus: 'usable',
    responseWindowMs: 0,
    voicedMs: 0,
    wordCount: candidateResponse.speak.split(/\s+/).length,
  });

  // IMPORTANTE: Solo `speak` y metadatos de turno salen al cliente; `observation` queda en servidor
  return {
    sessionId: session.sessionId,
    turnIndex: session.turns.length - 1,
    agentTurnId,
    speak: candidateResponse.speak,
    action: candidateResponse.action,
    stage: session.stage,
    learnerTurnsUsed: session.learnerTurnsUsed,
    maxLearnerTurns: session.config.max_learner_turns,
    remainingBudgetMs,
    creditedFuelMsThisTurn: creditedFuelMs,
    totalSessionVoicedMs: session.totalVoicedMs,
    isSessionClosed: session.closed,
  };
}

/**
 * Fase 4 (Cierre): Genera el Scorecard con evidencia verificada, WPM,
 * combustible de mascota, racha (>=30s de voz válida) y programación FSRS.
 */
export function generateVoiceScorecard(sessionId: string): VoiceScorecardDTO {
  const session = getSession(sessionId);
  session.closed = true;

  const usableLearnerTurns = session.turns.filter(
    (t) => t.speaker === 'learner' && t.audioStatus === 'usable' && t.wordCount > 0
  );

  const totalWords = usableLearnerTurns.reduce((acc, t) => acc + t.wordCount, 0);
  const totalResponseMs = usableLearnerTurns.reduce(
    (acc, t) => acc + t.responseWindowMs,
    0
  );
  const totalVoicedMs = usableLearnerTurns.reduce((acc, t) => acc + t.voicedMs, 0);

  if (usableLearnerTurns.length === 0 || totalVoicedMs < 1500) {
    const fallbackFsrs = computeNextFsrsState(2);
    return {
      sessionId,
      status: 'insufficient_audio',
      communicativeScore: null,
      targetScore: null,
      grammarScore: null,
      wpm: null,
      learnerWordCount: totalWords,
      learnerResponseMs: totalResponseMs,
      learnerVoicedMs: totalVoicedMs,
      fillerCount: null,
      pauseCount: null,
      fuelAwardedSeconds: Math.round(totalVoicedMs / 1000),
      streakQualifiedToday: false,
      evidences: [],
      summaryFeedbackEs:
        'No evaluable por audio insuficiente. Tu progreso previo y tu racha no sufren penalización; puedes repetir la escena cuando quieras.',
      modelUpgradeExampleEn:
        "Since Sam is delayed, let's put the meeting off until Friday and send the team a calendar update.",
      fsrsNextReview: {
        targetExpression: session.config.primary_target.canonical,
        rating: fallbackFsrs.rating,
        ratingLabel: fallbackFsrs.ratingLabel,
        nextDueDays: fallbackFsrs.nextDueDays,
        state: fallbackFsrs.state,
      },
    };
  }

  const evidences: VoiceScorecardDTO['evidences'] = [];
  let bestTargetUse: TargetUseStatus = 'not_observed';
  let bestGrammarUse: GrammarUseStatus = 'not_applicable';
  let achievedCommunicativeCount = 0;

  for (const turn of usableLearnerTurns) {
    const analysis = analyzeLearnerTargetUse(
      turn.transcript,
      session.config.primary_target.canonical
    );
    if (analysis.communicativeIntentResolved) {
      achievedCommunicativeCount += 1;
    }
    if (analysis.targetUse === 'correct') {
      bestTargetUse = 'correct';
      if (analysis.grammarUse === 'correct') {
        bestGrammarUse = 'correct';
      } else if (bestGrammarUse !== 'correct') {
        bestGrammarUse = 'incorrect';
      }
    }

    evidences.push({
      turnId: turn.turnId,
      quote: analysis.matchedQuote ?? turn.transcript,
      useStatus: analysis.targetUse,
      grammarStatus: analysis.grammarUse,
      feedbackEs: analysis.explanationEs,
    });
  }

  const communicativeScore: 0 | 1 | 2 | 3 | 4 =
    achievedCommunicativeCount >= 2
      ? 4
      : achievedCommunicativeCount === 1
        ? 3
        : 1;

  const targetScore: 0 | 1 | 2 | 3 | 4 =
    bestTargetUse === 'correct'
      ? session.contextualReframesUsed === 0
        ? 4
        : 3
      : achievedCommunicativeCount > 0
        ? 1
        : 0;

  const grammarScore: 0 | 1 | 2 | 3 | 4 =
    bestGrammarUse === 'correct'
      ? 4
      : bestGrammarUse === 'incorrect'
        ? 2
        : achievedCommunicativeCount > 0
          ? 3
          : 1;

  const wpm = calculateResponseWpm(totalWords, totalResponseMs);
  const combinedTranscript = usableLearnerTurns.map((t) => t.transcript).join(' ');
  const fillerCount = countDisfluencyFillers(null, combinedTranscript);

  const fsrsRating =
    deriveFsrsRatingFromEvidence(
      bestTargetUse,
      bestGrammarUse,
      session.contextualReframesUsed > 0 ? 'contextual' : 'none',
      session.contextualReframesUsed
    ) ?? 3;
  const fsrsSchedule = computeNextFsrsState(fsrsRating);

  let summaryFeedbackEs = '';
  if (bestTargetUse === 'correct' && bestGrammarUse === 'correct') {
    summaryFeedbackEs =
      '¡Objetivo superado con evidencia verificada! Recuperaste "put off" de forma natural y colocaste el objeto/pronombre en la posición correcta.';
  } else if (bestTargetUse === 'correct' && bestGrammarUse === 'incorrect') {
    summaryFeedbackEs =
      'Recuperaste el objetivo léxico "put off", pero recuerda la regla de separación con pronombres: "put it off", nunca "put off it".';
  } else {
    summaryFeedbackEs =
      'Resolviste la situación comunicativa con paráfrasis válidas, pero quedó pendiente recuperar "put off" espontáneamente. FSRS programó una escena nueva de repaso.';
  }

  return {
    sessionId,
    status: 'ready',
    communicativeScore,
    targetScore,
    grammarScore,
    wpm,
    learnerWordCount: totalWords,
    learnerResponseMs: totalResponseMs,
    learnerVoicedMs: totalVoicedMs,
    fillerCount,
    pauseCount: Math.max(1, Math.floor(totalWords / 12)),
    fuelAwardedSeconds: Math.round(totalVoicedMs / 1000),
    streakQualifiedToday: totalVoicedMs >= 30000,
    evidences,
    summaryFeedbackEs,
    modelUpgradeExampleEn:
      session.locale === 'en-GB'
        ? "Since Sam is stuck at Heathrow, let's put the meeting off until Friday and move it online."
        : "Since Sam's flight is delayed, let's put the meeting off until Friday and meet over Zoom.",
    fsrsNextReview: {
      targetExpression: session.config.primary_target.canonical,
      rating: fsrsSchedule.rating,
      ratingLabel: fsrsSchedule.ratingLabel,
      nextDueDays: fsrsSchedule.nextDueDays,
      state: fsrsSchedule.state,
    },
  };
}
