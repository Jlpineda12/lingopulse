import type { AudioStatus, SttWordTimestamp } from '../types/database.js';

/**
 * Calcula WPM de respuesta según la especificación de `01_mvp_y_modelo.md`:
 * `60 × palabras del usuario / segundos de sus ventanas de respuesta`
 * (`60000.0 * learner_word_count / nullif(learner_response_ms, 0)`).
 * Incluye pausas dentro de la respuesta; excluye voz del agente y esperas de red.
 */
export function calculateResponseWpm(
  learnerWordCount: number,
  learnerResponseMs: number
): number | null {
  if (learnerResponseMs <= 0 || learnerWordCount <= 0) {
    return null;
  }
  return Math.round((60000 * learnerWordCount) / learnerResponseMs);
}

/**
 * Calcula el combustible otorgado a la mascota Pip a partir de un turno de voz.
 * Solo audio `usable` suma combustible, y nunca supera la ventana de respuesta ni el tope por turno.
 */
export function calculateCreditedVoicedMs(
  voicedMs: number | null,
  responseWindowMs: number | null,
  audioStatus: AudioStatus
): number {
  if (audioStatus !== 'usable' || !voicedMs || voicedMs <= 0) {
    return 0;
  }
  const boundedByWindow =
    responseWindowMs && responseWindowMs > 0
      ? Math.min(voicedMs, responseWindowMs)
      : voicedMs;
  // Tope razonable por turno individual (30 s)
  return Math.min(boundedByWindow, 30000);
}

/**
 * Cuenta muletillas acústicas ("uh", "um", "er", "ah", "hmm") si el proveedor STT conserva disfluencias.
 * Nota: "like" y "well" no se penalizan automáticamente como error por su función discursiva legítima.
 */
export function countDisfluencyFillers(
  words: SttWordTimestamp[] | null,
  transcript: string | null
): number | null {
  const source =
    words && words.length > 0
      ? words.map((w) => w.word.toLowerCase())
      : transcript
        ? transcript.toLowerCase().split(/\s+/)
        : null;

  if (!source || source.length === 0) return null;

  const fillerTokens = new Set(['uh', 'um', 'er', 'ah', 'hmm', 'uhm']);
  let count = 0;
  for (const token of source) {
    const clean = token.replace(/[^a-z]/g, '');
    if (fillerTokens.has(clean)) {
      count += 1;
    }
  }
  return count;
}

/**
 * Determina el estado de energía estética de Pip según los segundos de habla válida acumulados.
 * Nunca castiga ni muere por ausencias (`01_mvp_y_modelo.md`).
 */
export function derivePipEnergyState(recentVoicedMs: number): {
  level: 'resting' | 'active' | 'radiant';
  labelEs: string;
  progressPercent: number;
} {
  const targetDailyMs = 30000; // 30s para completar el objetivo diario de voz válida
  const progressPercent = Math.min(100, Math.round((recentVoicedMs / targetDailyMs) * 100));

  if (recentVoicedMs >= 30000) {
    return {
      level: 'radiant',
      labelEs: 'Energía radiante · Meta de 30s cumplida',
      progressPercent: 100,
    };
  }
  if (recentVoicedMs >= 10000) {
    return {
      level: 'active',
      labelEs: 'En calentamiento · Sigue hablando en inglés',
      progressPercent,
    };
  }
  return {
    level: 'resting',
    labelEs: 'Listo para practicar · Alimenta a Pip con tu voz',
    progressPercent,
  };
}
