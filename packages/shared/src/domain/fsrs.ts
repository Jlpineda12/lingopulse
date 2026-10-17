import type { AssistanceLevel } from '../types/database.js';
import type { GrammarUseStatus, TargetUseStatus } from '../types/voice-arena.js';

export type FsrsRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface FsrsScheduleOutput {
  rating: FsrsRating;
  ratingLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
  nextDueDays: number;
  stabilityDays: number;
  difficulty: number;
  state: 'learning' | 'review' | 'relearning';
}

/**
 * Regla documentada para derivar el rating FSRS (1..4) a partir de la evidencia:
 * - Si el audio falló o es incierto (`uncertain`), retorna `null` (un fallo técnico NUNCA genera `Again`).
 * - Si no se observó el objetivo (`not_observed`), p. ej. usó solo una paráfrasis -> `1 (Again)`.
 * - Si usó el objetivo pero con error gramatical o con ayuda léxica -> `2 (Hard)`.
 * - Si usó el objetivo y la gramática correctamente con reencuadre contextual -> `3 (Good)`.
 * - Si usó el objetivo y la gramática espontáneamente a la primera sin ayuda (`assistance === 'none'`) -> `4 (Easy)` o `3 (Good)`.
 */
export function deriveFsrsRatingFromEvidence(
  targetUse: TargetUseStatus,
  grammarUse: GrammarUseStatus,
  assistance: AssistanceLevel,
  contextualReframesUsed: number
): FsrsRating | null {
  if (targetUse === 'uncertain') {
    return null; // Fallo técnico o audio dudoso no penaliza FSRS
  }
  if (targetUse === 'not_observed') {
    return 1; // Again: resolvió con paráfrasis o no recuperó el objetivo
  }
  if (targetUse === 'incorrect' || grammarUse === 'incorrect' || assistance === 'lexical' || assistance === 'model_answer') {
    return 2; // Hard: recuperó la forma pero con error gramatical (ej. "put off it") o ayuda explícita
  }
  if (contextualReframesUsed === 0 && assistance === 'none') {
    return 4; // Easy: recuperación espontánea sin reencuadres
  }
  return 3; // Good: recuperación válida tras oportunidad contextual
}

/**
 * Calcula el siguiente intervalo de revisión FSRS (v4.5 defaults simplificados y estables para el MVP).
 * La definición provisional de dominio exige recuperación diferida en una situación nueva 3–7 días después.
 */
export function computeNextFsrsState(
  rating: FsrsRating,
  previousStabilityDays = 1.0,
  previousDifficulty = 5.0
): FsrsScheduleOutput {
  const labels: Record<FsrsRating, 'Again' | 'Hard' | 'Good' | 'Easy'> = {
    1: 'Again',
    2: 'Hard',
    3: 'Good',
    4: 'Easy',
  };

  const nextDifficulty = Math.min(
    10,
    Math.max(1, Number((previousDifficulty + (3 - rating) * 0.65).toFixed(2)))
  );

  if (rating === 1) {
    return {
      rating,
      ratingLabel: labels[rating],
      nextDueDays: 1,
      stabilityDays: Math.max(0.5, Number((previousStabilityDays * 0.45).toFixed(2))),
      difficulty: nextDifficulty,
      state: 'relearning',
    };
  }

  if (rating === 2) {
    const stability = Math.max(1.5, Number((previousStabilityDays * 1.4).toFixed(2)));
    return {
      rating,
      ratingLabel: labels[rating],
      nextDueDays: 2,
      stabilityDays: stability,
      difficulty: nextDifficulty,
      state: 'learning',
    };
  }

  if (rating === 3) {
    const stability = Math.max(3.5, Number((previousStabilityDays * 3.5).toFixed(2)));
    return {
      rating,
      ratingLabel: labels[rating],
      nextDueDays: 4, // Dentro de la ventana de transferencia diferida de 3–7 días
      stabilityDays: stability,
      difficulty: nextDifficulty,
      state: 'review',
    };
  }

  const stability = Math.max(6.0, Number((previousStabilityDays * 5.5).toFixed(2)));
  return {
    rating,
    ratingLabel: labels[rating],
    nextDueDays: 6, // Dentro de la ventana de transferencia diferida de 3–7 días
    stabilityDays: stability,
    difficulty: nextDifficulty,
    state: 'review',
  };
}
