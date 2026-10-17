import type { CefrLevel, SupportedLocale } from './database.js';

export interface AnatomyExample {
  en: string;
  es: string;
}

export interface AnatomyPhaseContent {
  targetExpression: string;
  senseKey: string;
  meaningEn: string;
  ipa: string;
  dialectTip: string;
  functionalRule: string;
  modelSentence: string;
  modelTranslationEs: string;
  examples: AnatomyExample[];
  reviewTargets: Array<{
    expression: string;
    meaningEs: string;
  }>;
}

export interface InputPhaseContent {
  situationTitle: string;
  senderRole: string;
  microText: string;
  comprehensionPrompt: string;
  expectedInferenceKeywords: string[];
  sampleModelAnswer: string;
}

export interface WritingPhaseContent {
  scenarioPrompt: string;
  recipientName: string;
  communicativeGoalEs: string;
  grammarChecklistEs: string;
  placeholderEn: string;
}

export interface VoiceArenaPublicContent {
  interlocutorTitle: string;
  interlocutorRole: string;
  briefingEs: string;
  interactionBudgetMs: number;
  maxLearnerTurns: number;
}

export interface LessonPublicContent {
  anatomy: AnatomyPhaseContent;
  input: InputPhaseContent;
  writing: WritingPhaseContent;
  voiceArena: VoiceArenaPublicContent;
}

export interface PublicLessonDTO {
  id: string;
  unitId: string;
  unitTitle: string;
  slug: string;
  version: number;
  locale: SupportedLocale;
  cefrLevel: CefrLevel;
  title: string;
  realLifeTopic: string;
  communicativeGoal: string;
  grammarFocus: string;
  position: number;
  isCheckpoint: boolean;
  publicContent: LessonPublicContent;
}

/**
 * Configuración confiable EXCLUSIVA de servidor (`private.arena_configs`).
 * Nunca se expone directamente al cliente móvil durante el intento.
 */
export interface TrustedLessonConfig {
  cefr_level: CefrLevel;
  locale: SupportedLocale;
  agent_role: string;
  learner_role: string;
  setting: string;
  communicative_intent: string;
  primary_target: {
    canonical: string;
    sense: string;
    accepted_variants: string[];
  };
  grammar_focus: string;
  acceptance_rules: {
    require_contextual_delay_meaning: boolean;
    accepted_tenses: string[];
    pronoun_must_precede_particle: boolean;
    paraphrase_can_resolve_task: boolean;
    paraphrase_demonstrates_target_recall: boolean;
  };
  forbidden_spoken_forms: string[];
  opening_scene: string;
  editorial_fallback_questions: string[];
  complications: string[];
  max_question_words: number;
  max_learner_turns: number;
  max_contextual_reframes: number;
}
