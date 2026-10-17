import type { AudioStatus, SupportedLocale } from './database.js';

/**
 * Contrato JSON Schema obligatorio (`docs/03_voice_arena_response.schema.json`).
 * IMPORTANTE: Solo `speak` se envía al cliente / TTS durante el intento activo.
 */
export type VoiceArenaAction = 'ask' | 'request_repeat' | 'close';

export type CommunicativeSuccessStatus =
  | 'achieved'
  | 'partial'
  | 'not_achieved'
  | 'uncertain'
  | 'not_observed';

export type TargetUseStatus = 'correct' | 'incorrect' | 'not_observed' | 'uncertain';

export type GrammarUseStatus = 'correct' | 'incorrect' | 'not_applicable' | 'uncertain';

export type VoiceArenaReasonCode =
  | 'opening'
  | 'contextual_reframe'
  | 'complication'
  | 'clarification'
  | 'audio_retry'
  | 'redirect'
  | 'budget_end'
  | 'learner_stop'
  | 'completed';

export interface VoiceArenaEvidence {
  turn_id: string;
  quote: string;
}

export interface VoiceArenaObservation {
  communicative_success: CommunicativeSuccessStatus;
  target_use: TargetUseStatus;
  grammar_use: GrammarUseStatus;
  evidence: VoiceArenaEvidence | null;
}

export interface VoiceArenaTurnResponseV1 {
  speak: string;
  action: VoiceArenaAction;
  observation: VoiceArenaObservation;
  reason_code: VoiceArenaReasonCode;
}

export type ArenaStage = 'opening' | 'contextual_followup' | 'complication' | 'closing';

export interface TrustedRuntimeState {
  stage: ArenaStage;
  learner_turns_used: number;
  contextual_reframes_used: number;
  remaining_response_budget_ms: number;
  can_ask_another_question: boolean;
  must_close: boolean;
  latest_learner_turn_id: string | null;
  finalized_transcript: string | null;
  audio_status: AudioStatus;
  prior_turns: Array<{
    turn_id: string;
    speaker: 'learner' | 'agent';
    transcript: string;
  }>;
  previously_observed_target_use: 'server_verified' | 'provisional' | 'absent';
}

/**
 * Respuesta pública filtrada que el servidor envía al móvil en cada turno de Voice Arena.
 * Nunca incluye `observation` ni el objetivo oculto durante la arena activa.
 */
export interface ClientArenaTurnPayload {
  sessionId: string;
  turnIndex: number;
  agentTurnId: string;
  speak: string;
  action: VoiceArenaAction;
  stage: ArenaStage;
  learnerTurnsUsed: number;
  maxLearnerTurns: number;
  remainingBudgetMs: number;
  creditedFuelMsThisTurn: number;
  totalSessionVoicedMs: number;
  isSessionClosed: boolean;
}

/**
 * Evaluación de la Fase 3: Writing
 */
export interface WritingEvaluationResult {
  submissionId: string;
  communicativeGoalMet: boolean;
  targetUsed: 'correct' | 'incorrect_grammar' | 'paraphrase_only' | 'missing';
  detectedQuote: string | null;
  explanationEs: string;
  correctedSentenceEn: string;
  reformulations: {
    casual: string;
    professional: string;
  };
  locale: SupportedLocale;
}

/**
 * Scorecard con evidencia al finalizar Voice Arena (Fase 4)
 */
export interface VoiceScorecardDTO {
  sessionId: string;
  status: 'ready' | 'insufficient_audio';
  communicativeScore: 0 | 1 | 2 | 3 | 4 | null;
  targetScore: 0 | 1 | 2 | 3 | 4 | null;
  grammarScore: 0 | 1 | 2 | 3 | 4 | null;
  wpm: number | null;
  learnerWordCount: number;
  learnerResponseMs: number;
  learnerVoicedMs: number;
  fillerCount: number | null;
  pauseCount: number | null;
  fuelAwardedSeconds: number;
  streakQualifiedToday: boolean;
  evidences: Array<{
    turnId: string;
    quote: string;
    useStatus: TargetUseStatus;
    grammarStatus: GrammarUseStatus;
    feedbackEs: string;
  }>;
  summaryFeedbackEs: string;
  modelUpgradeExampleEn: string;
  fsrsNextReview: {
    targetExpression: string;
    rating: 1 | 2 | 3 | 4;
    ratingLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
    nextDueDays: number;
    state: 'learning' | 'review' | 'relearning';
  };
}
