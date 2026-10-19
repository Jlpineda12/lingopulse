import type { PracticeLevel, WritingPrompt } from '../practice/types.js';

/**
 * Islas por tema (unidades), al estilo de una clase de libro de texto:
 *   1. Vocabulario (teoría: palabra, pronunciación, significado y ejemplo) + repaso rápido
 *   2. Gramática (teoría: explicación, forma, ejemplos y error típico) + práctica
 *   3. Reading → 4. Listening (dificultad según el nivel) → 5. Speaking → 6. Writing
 *   7. Quiz final de la isla (vocabulario + gramática)
 *
 * A1–A2 explican en español; de B1 en adelante, en inglés (con traducción opcional).
 */

/** Pregunta de opción múltiple. `a` es el índice de la opción correcta. */
export interface UnitQuestion {
  q: string;
  opts: string[];
  a: number;
  /** Por qué es la respuesta correcta (se muestra al responder). */
  why?: string;
}

/** Hueco para completar: `q` lleva "___" y `a` es la respuesta; `opts` incluye la respuesta. */
export interface GapItem {
  q: string;
  a: string;
  opts: string[];
  why?: string;
}

export interface UnitVocab {
  term: string;
  /** Categoría gramatical corta: noun, verb, adj, adv, phrase, phrasal verb, idiom… */
  pos: string;
  ipa?: string;
  /** Traducción al español. */
  es: string;
  /** Definición sencilla en inglés. */
  def: string;
  /** Ejemplo que contiene el término (se usa para el quiz de huecos). */
  ex: string;
}

export interface GrammarPoint {
  title: string;
  /** Explicación (español en A1–A2, inglés en B1+). Puede tener varios párrafos. */
  explain: string[];
  /** Filas de la tabla de forma: "I am / I'm", "He + verb-s"… */
  form: string[];
  examples: string[];
  /** Error típico de hispanohablantes. */
  watchOut?: string;
  /** Práctica guiada: las primeras 4 van en la lección, el resto alimenta el quiz. */
  practice: GapItem[];
}

export interface UnitReading {
  title: string;
  /** Tipo de texto: blog, email, article, story, interview, review… */
  genre: string;
  paragraphs: string[];
  questions: UnitQuestion[];
}

export interface UnitListening {
  /** Situación en español o inglés según el nivel. */
  context: string;
  /** Formato: dialogue, voicemail, announcement, podcast, interview, lecture… */
  format: string;
  /** [hablante, texto]. El primer hablante es la voz A, el segundo la voz B. */
  lines: Array<[string, string]>;
  questions: UnitQuestion[];
  dictation: string[];
}

export interface UnitSpeaking {
  prompt: string;
  questions: string[];
  phrases: string[];
  model: string;
  seconds: number;
}

export interface UnitWriting {
  type: WritingPrompt['type'];
  prompt: string;
  minWords: number;
  checklist: string[];
  model: string;
}

/** Expresión clave de una función comunicativa. */
export interface FunctionPhrase {
  en: string;
  es: string;
  /** Cuándo / cómo usarla (registro, matiz). */
  note?: string;
}

/**
 * Función comunicativa de la unidad (como en Passages): una situación de la vida diaria,
 * las expresiones para resolverla, un diálogo modelo, práctica rápida y una mini-tarea oral.
 * Ej.: unidad "Relationships" → definir una amistad, dar opiniones, estar en desacuerdo…
 */
export interface UnitLesson {
  title: string;
  titleEs: string;
  /** Situación cotidiana donde se usa. */
  situation: string;
  phrases: FunctionPhrase[];
  dialogue: Array<[string, string]>;
  practice: UnitQuestion[];
  /** Mini-tarea para decir en voz alta. */
  task: string;
}

export interface Unit {
  /** p. ej. "a1-03" */
  id: string;
  level: PracticeLevel;
  /** Número de la isla dentro del nivel (1…). */
  n: number;
  title: string;
  titleEs: string;
  emoji: string;
  /** Lo que podrás hacer al terminar (can-do). */
  goals: string[];
  /** Pregunta para entrar en calor. */
  warmUp: string;
  vocab: UnitVocab[];
  grammar: GrammarPoint;
  /** Funciones comunicativas (3–5) que se practican antes de las habilidades. */
  lessons?: UnitLesson[];
  reading: UnitReading;
  listening: UnitListening;
  speaking: UnitSpeaking;
  writing: UnitWriting;
  /** Preguntas extra del quiz final (expresiones, cultura, uso). */
  extraQuiz?: UnitQuestion[];
}

export type UnitStep = 'vocab' | 'grammar' | 'functions' | 'reading' | 'listening' | 'speaking' | 'writing' | 'quiz';

export const UNIT_STEPS: UnitStep[] = ['vocab', 'grammar', 'functions', 'reading', 'listening', 'speaking', 'writing', 'quiz'];

/** Pasos obligatorios antes del quiz (speaking y writing dan la tercera estrella). */
export const REQUIRED_BEFORE_QUIZ: UnitStep[] = ['vocab', 'grammar', 'functions', 'reading', 'listening'];

export interface UnitProgress {
  done: UnitStep[];
  /** Mejor puntaje del quiz (0–100). */
  bestQuiz?: number;
  stars?: number;
  completedAt?: number;
}
