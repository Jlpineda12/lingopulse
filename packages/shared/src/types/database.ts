/**
 * Tipos de dominio correspondientes a `supabase/migrations/202610130001_core.sql`
 */

export type SupportedLocale = 'en-US' | 'en-GB';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type CurriculumTrack = 'progression' | 'fluency_gym';
export type LessonPhase = 'anatomy' | 'input' | 'writing' | 'voice';
export type TargetRole = 'primary' | 'support' | 'review';
export type AudioStatus = 'pending' | 'usable' | 'uncertain' | 'unusable';
export type AssistanceLevel = 'none' | 'contextual' | 'lexical' | 'model_answer';

export interface ProfileRow {
  user_id: string;
  display_name: string;
  preferred_locale: SupportedLocale;
  time_zone: string;
  approximate_level: CefrLevel | null;
  voice_consent_version: string | null;
  voice_consent_at: string | null;
  retain_audio: boolean;
  created_at: string;
}

export interface CurriculumUnitRow {
  id: string;
  slug: string;
  title: string;
  track: CurriculumTrack;
  cefr_level: CefrLevel;
  position: number;
}

export interface LexicalTargetRow {
  id: string;
  canonical_form: string;
  sense_key: string;
  meaning_en: string;
  usage_notes: string | null;
}

export interface LessonTargetRow {
  lesson_id: string;
  target_id: string;
  target_role: TargetRole;
}

export interface LessonAttemptRow {
  id: string;
  user_id: string;
  lesson_id: string;
  request_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  completed_phases: LessonPhase[];
  started_at: string;
  completed_at: string | null;
}

export interface SttWordTimestamp {
  word: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
}

export interface VoiceSessionRow {
  id: string;
  user_id: string;
  attempt_id: string;
  lesson_id: string;
  request_id: string;
  locale: SupportedLocale;
  status: 'created' | 'active' | 'processing' | 'completed' | 'failed' | 'cancelled';
  interaction_budget_ms: number;
  active_interaction_ms: number;
  prompt_version: string;
  rubric_version: string;
  processing_consent_version: string;
  processing_consented_at: string;
  retain_audio: boolean;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface VoiceTurnRow {
  id: string;
  user_id: string;
  session_id: string;
  request_id: string;
  turn_index: number;
  speaker: 'learner' | 'agent';
  transcript: string | null;
  words: SttWordTimestamp[] | null;
  audio_status: AudioStatus;
  response_window_ms: number | null;
  voiced_ms: number | null;
  word_count: number | null;
  stt_provider: string | null;
  stt_model_version: string | null;
  stt_confidence: number | null;
  audio_object_path: string | null;
  audio_expires_at: string | null;
  finalized_at: string | null;
  created_at: string;
}

export interface VoiceEvaluationRow {
  id: string;
  user_id: string;
  session_id: string;
  lesson_id: string;
  evaluation_key: string;
  is_current: boolean;
  status: 'pending' | 'ready' | 'insufficient_audio' | 'failed';
  evaluator_version: string;
  model_version: string;
  rubric_version: string;
  acoustic_algorithm_version: string | null;
  learner_word_count: number | null;
  learner_response_ms: number | null;
  learner_voiced_ms: number | null;
  wpm: number | null;
  filler_count: number | null;
  pause_count: number | null;
  communicative_score: 0 | 1 | 2 | 3 | 4 | null;
  target_score: 0 | 1 | 2 | 3 | 4 | null;
  grammar_score: 0 | 1 | 2 | 3 | 4 | null;
  pronunciation_score: number | null;
  pronunciation_provider: string | null;
  pronunciation_locale: SupportedLocale | null;
  feedback: Record<string, unknown> | null;
  created_at: string;
}

export interface TargetEvidenceRow {
  id: string;
  user_id: string;
  evaluation_id: string;
  session_id: string;
  lesson_id: string;
  target_id: string;
  turn_id: string;
  speaker: 'learner';
  quote: string;
  use_status: 'correct' | 'incorrect' | 'not_observed' | 'uncertain';
  grammar_status: 'correct' | 'incorrect' | 'not_applicable' | 'uncertain';
  assistance: AssistanceLevel;
}

export interface UserTargetMemoryRow {
  user_id: string;
  target_id: string;
  modality: 'speaking' | 'writing';
  scheduler_version: string;
  scheduler_parameters: Record<string, number>;
  state: 'new' | 'learning' | 'review' | 'relearning';
  stability_days: number | null;
  difficulty: number | null;
  desired_retention: number;
  due_at: string;
  last_reviewed_at: string | null;
  review_count: number;
  lapse_count: number;
}

export interface PetRow {
  user_id: string;
  pet_name: string;
  visual_stage: 'starter' | 'confident' | 'fluent_companion';
  cosmetic_config: {
    accessory?: 'uk_beret' | 'us_cap';
    auraColor?: string;
  };
  created_at: string;
}

export interface SpeechFuelEventRow {
  id: string;
  user_id: string;
  turn_id: string;
  speaker: 'learner';
  credited_voiced_ms: number;
  rule_version: string;
  awarded_at: string;
}

export interface ActivityDayRow {
  user_id: string;
  local_date: string;
  time_zone_snapshot: string;
  qualifying_attempt_id: string;
  qualifying_voiced_ms: number;
  rule_version: string;
  qualified_at: string;
}
