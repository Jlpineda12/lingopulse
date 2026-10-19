import type { PronunciationReport } from './pronunciation.js';
/**
 * Tipos del modo práctica libre (Daily Drop + Speaking/Listening/Reading/Writing).
 * Son independientes del currículo B1 versionado: aquí vive el contenido de práctica diaria.
 */

export type PracticeLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type DailyCategory =
  | 'phrasal_verb'
  | 'verb'
  | 'slang'
  | 'adjective'
  | 'idiom'
  | 'vocabulary';

export interface DailyQuiz {
  /** Frase con "___" donde va la respuesta. */
  sentence: string;
  options: string[];
  answer: string;
}

export interface DailyItem {
  id: string;
  category: DailyCategory;
  term: string;
  partOfSpeech: string;
  ipa?: string;
  /** Definición en inglés (estilo diccionario para learners). */
  definitionEn: string;
  /** Explicación en inglés sencillo de cuándo y cómo se usa. */
  usageEn: string;
  examples: string[];
  spanish: string;
  register: 'informal' | 'neutral' | 'formal';
  region?: 'US' | 'UK' | 'Global';
  synonyms?: string[];
  /** Aviso útil para hispanohablantes (falsos amigos, errores típicos). */
  watchOutEs?: string;
  quiz: DailyQuiz;
  /** Nivel CEFR del término (los ítems sin nivel sirven para todos). */
  level?: PracticeLevel;
}

export interface SpeakingTopic {
  id: string;
  level: PracticeLevel;
  emoji: string;
  title: string;
  promptEn: string;
  guidingQuestions: string[];
  usefulPhrases: string[];
  targetWords: string[];
  suggestedSeconds: number;
  /** Respuesta modelo (opcional) para comparar al final. */
  modelAnswer?: string;
}

export interface ListeningSegment {
  speaker: 'A' | 'B' | 'Narrator';
  text: string;
}

export interface MultipleChoiceQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanationEn: string;
}

export interface ListeningTrack {
  id: string;
  level: PracticeLevel;
  emoji: string;
  title: string;
  contextEs: string;
  segments: ListeningSegment[];
  questions: MultipleChoiceQuestion[];
  dictation: string[];
}

export interface ReadingPassage {
  id: string;
  level: PracticeLevel;
  emoji: string;
  title: string;
  paragraphs: string[];
  glossary: Record<string, string>;
  questions: MultipleChoiceQuestion[];
  discussionPrompt: string;
}

export interface WritingPrompt {
  id: string;
  level: PracticeLevel;
  emoji: string;
  type: 'message' | 'email' | 'opinion' | 'story' | 'review';
  title: string;
  promptEn: string;
  instructionsEs: string;
  minWords: number;
  targetWords: string[];
  checklist: string[];
}

/* ------------------------------------------------------------------ */
/* Feedback del coach (mismo contrato para motor local y para Claude)  */
/* ------------------------------------------------------------------ */

export type CorrectionType =
  | 'grammar'
  | 'spelling'
  | 'vocabulary'
  | 'punctuation'
  | 'style';

export interface CoachCorrection {
  original: string;
  corrected: string;
  type: CorrectionType;
  explanationEn: string;
  explanationEs: string;
}

export interface VocabularyUpgrade {
  original: string;
  better: string;
  why: string;
}

export interface CoachScores {
  grammar: number;
  vocabulary: number;
  coherence: number;
  task: number;
  /** Solo speaking: fluidez calculada a partir del audio. */
  fluency?: number;
  /** Solo speaking: claridad/inteligibilidad (confianza del reconocedor o lectura en voz alta). */
  pronunciation?: number;
}

export interface CoachFeedback {
  source: 'claude' | 'gemini' | 'local';
  overallScore: number;
  cefrEstimate: PracticeLevel | 'A1' | 'C2';
  scores: CoachScores;
  summaryEs: string;
  correctedText: string;
  corrections: CoachCorrection[];
  strengths: string[];
  improvements: string[];
  vocabularyUpgrades: VocabularyUpgrade[];
  targetWordsUsed: string[];
  modelAnswer: string;
  followUpQuestion: string;
}

export interface SpeechAudioMetrics {
  /** Duración total de la grabación. */
  durationMs: number;
  /** Tiempo con voz detectada (análisis RMS del micrófono). */
  voicedMs: number;
  /** Pausas de más de 700 ms dentro de la respuesta. */
  pauseCount: number;
  longestPauseMs: number;
  /** Confianza media del reconocedor de voz (0–1) si está disponible. */
  recognitionConfidence: number | null;
  /** Volumen medio normalizado (0–1). */
  averageLevel: number;
  /** Puntaje de pronunciación medido sobre el audio (Azure), si está disponible. Tiene prioridad sobre la confianza. */
  assessedPronunciation?: number | null;
}

export interface CoachRequest {
  skill: 'writing' | 'speaking';
  level: PracticeLevel;
  promptEn: string;
  text: string;
  targetWords: string[];
  minWords?: number;
  audio?: SpeechAudioMetrics;
  /** Evaluación de pronunciación del audio (Azure), para que la corrección la tenga en cuenta. */
  pronunciation?: PronunciationReport | null;
}
