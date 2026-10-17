import { localDateKey } from './daily-drops.js';

/**
 * Reglas de la racha diaria:
 * - Un día cuenta con al menos una actividad completada.
 * - Escudos: se gana 1 por semana (máximo 2). Si faltas días, los escudos los cubren
 *   automáticamente y la racha sigue; si no alcanzan, la racha vuelve a 1.
 * - Hitos (3, 7, 14, 30, 60, 100, 365 días) dan monedas una sola vez.
 */

export const MAX_STREAK_SHIELDS = 2;

export interface StreakMilestone {
  days: number;
  coins: number;
  titleEs: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, coins: 20, titleEs: 'Chispa encendida' },
  { days: 7, coins: 50, titleEs: 'Semana en llamas' },
  { days: 14, coins: 80, titleEs: 'Fuego constante' },
  { days: 30, coins: 150, titleEs: 'Llama azul' },
  { days: 60, coins: 250, titleEs: 'Volcán del inglés' },
  { days: 100, coins: 400, titleEs: 'Fuego cósmico' },
  { days: 365, coins: 1000, titleEs: 'Leyenda eterna' },
];

export interface FlameTier {
  id: 'ember' | 'blaze' | 'inferno' | 'azure' | 'cosmic';
  labelEs: string;
  minDays: number;
  /** [exterior arriba, exterior abajo, núcleo arriba, núcleo abajo, brillo] */
  colors: [string, string, string, string, string];
}

export const FLAME_TIERS: FlameTier[] = [
  { id: 'ember', labelEs: 'Brasa', minDays: 0, colors: ['#FFB547', '#FF6A1A', '#FFF4B0', '#FFC21A', '#FFB547'] },
  { id: 'blaze', labelEs: 'Llama', minDays: 7, colors: ['#FF8A1F', '#FF3B30', '#FFF1A6', '#FFAA00', '#FF7A1A'] },
  { id: 'inferno', labelEs: 'Infierno', minDays: 14, colors: ['#FF5E3A', '#D4145A', '#FFE08A', '#FF6B00', '#FF3B6B'] },
  { id: 'azure', labelEs: 'Llama azul', minDays: 30, colors: ['#5AC8FA', '#2563EB', '#E0F7FF', '#7DD3FC', '#38BDF8'] },
  { id: 'cosmic', labelEs: 'Fuego cósmico', minDays: 100, colors: ['#C084FC', '#6D28D9', '#FDF4FF', '#E879F9', '#A855F7'] },
];

export function flameTier(streak: number): FlameTier {
  let tier = FLAME_TIERS[0]!;
  for (const t of FLAME_TIERS) if (streak >= t.minDays) tier = t;
  return tier;
}

export function nextMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.days > streak) ?? null;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDaysKey(key: string, delta: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + delta);
  return localDateKey(d);
}

/** Días de calendario entre dos fechas locales (b − a). */
export function daysBetweenKeys(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
}

/** Semana ISO (lunes a domingo), p. ej. "2026-W42". */
export function isoWeekKey(dateKey: string = localDateKey()): string {
  const [y, m, day] = dateKey.split('-').map(Number);
  const d = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, day ?? 1));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Lunes (fecha local) de la semana de `dateKey`. */
export function weekStartKey(dateKey: string = localDateKey()): string {
  const d = parseKey(dateKey);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return localDateKey(d);
}

export interface StreakState {
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  shields: number;
  lastShieldWeek: string | null;
  protectedDays: string[];
  claimedMilestones: number[];
}

export interface StreakUpdate {
  state: StreakState;
  increased: boolean;
  from: number;
  shieldsUsed: number;
  shieldGranted: boolean;
  milestone: StreakMilestone | null;
}

/** Aplica una actividad hecha en `todayKey` al estado de la racha. */
export function applyActivityToStreak(prev: StreakState, todayKey: string): StreakUpdate {
  const from = prev.streak;
  let { streak, shields, lastShieldWeek } = prev;
  const protectedDays = [...prev.protectedDays];
  let shieldsUsed = 0;
  let increased = false;

  if (prev.lastActiveDate !== todayKey) {
    increased = true;
    if (!prev.lastActiveDate) {
      streak = 1;
    } else {
      const missed = daysBetweenKeys(prev.lastActiveDate, todayKey) - 1;
      if (missed <= 0) {
        streak = prev.streak + 1;
      } else if (missed <= shields) {
        shieldsUsed = missed;
        shields -= missed;
        for (let i = 1; i <= missed; i++) protectedDays.push(addDaysKey(prev.lastActiveDate, i));
        streak = prev.streak + 1;
      } else {
        streak = 1;
      }
    }
  }

  // Escudo semanal: se entrega con la primera actividad de cada semana.
  let shieldGranted = false;
  const week = isoWeekKey(todayKey);
  if (lastShieldWeek !== week) {
    lastShieldWeek = week;
    if (shields < MAX_STREAK_SHIELDS) {
      shields += 1;
      shieldGranted = true;
    }
  }

  const claimed = [...prev.claimedMilestones];
  const milestone = STREAK_MILESTONES.find((m) => m.days === streak && !claimed.includes(m.days)) ?? null;
  if (milestone) claimed.push(milestone.days);

  return {
    state: {
      streak,
      bestStreak: Math.max(prev.bestStreak, streak),
      lastActiveDate: todayKey,
      shields,
      lastShieldWeek,
      protectedDays: protectedDays.slice(-60),
      claimedMilestones: claimed,
    },
    increased,
    from,
    shieldsUsed,
    shieldGranted,
    milestone,
  };
}

/**
 * Estado visible de la racha HOY sin registrar actividad: si faltaste más días de los que
 * cubren tus escudos, la racha que se muestra es 0 (se perdió).
 */
export function visibleStreak(state: StreakState, todayKey: string = localDateKey()): {
  streak: number;
  atRisk: boolean;
  lost: boolean;
  shieldsNeeded: number;
} {
  if (!state.lastActiveDate) return { streak: 0, atRisk: false, lost: false, shieldsNeeded: 0 };
  const gap = daysBetweenKeys(state.lastActiveDate, todayKey);
  if (gap <= 0) return { streak: state.streak, atRisk: false, lost: false, shieldsNeeded: 0 };
  const missed = gap - 1;
  if (missed === 0) return { streak: state.streak, atRisk: true, lost: false, shieldsNeeded: 0 };
  if (missed <= state.shields) return { streak: state.streak, atRisk: true, lost: false, shieldsNeeded: missed };
  return { streak: 0, atRisk: false, lost: true, shieldsNeeded: missed };
}
