import { addDaysKey, isoWeekKey, localDateKey, weekStartKey } from '@lingopulse/shared';

/**
 * Liga semanal de 20 participantes por división.
 * Mientras no haya backend con cuentas reales, los rivales son SIMULADOS de forma
 * determinista por semana y división (mismo resultado en cada apertura), con ritmos
 * de práctica distintos. Top 5 asciende, últimos 5 descienden.
 */

export interface LeagueTier {
  id: number;
  nameEs: string;
  color: string;
  soft: string;
  glyph: string;
  /** XP semanal típica de un rival medio en esta división. */
  baseXp: number;
}

export const LEAGUE_TIERS: LeagueTier[] = [
  { id: 0, nameEs: 'Liga Bronce', color: '#C27C3A', soft: '#FBEBDD', glyph: 'medal-bronze', baseXp: 90 },
  { id: 1, nameEs: 'Liga Plata', color: '#8F9BB3', soft: '#EEF2FA', glyph: 'medal-silver', baseXp: 150 },
  { id: 2, nameEs: 'Liga Oro', color: '#D99B26', soft: '#FDF3DC', glyph: 'medal-gold', baseXp: 220 },
  { id: 3, nameEs: 'Liga Zafiro', color: '#2563EB', soft: '#E6F0FF', glyph: 'gem', baseXp: 300 },
  { id: 4, nameEs: 'Liga Rubí', color: '#E11D48', soft: '#FFE4EA', glyph: 'gem-ruby', baseXp: 390 },
  { id: 5, nameEs: 'Liga Diamante', color: '#7C3AED', soft: '#F2EEFF', glyph: 'gem-diamond', baseXp: 500 },
];

export const PROMOTE = 5;
export const DEMOTE = 5;
export const LEAGUE_SIZE = 20;

const NAMES = [
  'Valen', 'Mateo', 'Sofi', 'Nico', 'Camila', 'Juanes', 'Isa', 'Tomás', 'Lucía', 'Emi',
  'Dani', 'Sara', 'Leo', 'Maju', 'Santi', 'Ana P.', 'Gabo', 'Vale R.', 'Joaco', 'Mía',
  'Fede', 'Pau', 'Sebas', 'Caro', 'Álex', 'Ximena', 'Rafa', 'Lu', 'Benja', 'Maite',
];
const SPECIES = ['puff', 'cat', 'bear', 'bunny', 'dragon', 'fox', 'shark', 'meeseeks'];

function seeded(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LeagueEntry {
  id: string;
  name: string;
  species: string;
  xp: number;
  isUser: boolean;
}

/** Fracción de la semana transcurrida (0–1) para `now`. */
export function weekElapsed(now = new Date()): number {
  const start = weekStartKey(localDateKey(now));
  const [y, m, d] = start.split('-').map(Number);
  const t0 = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
  return Math.max(0, Math.min(1, (now.getTime() - t0) / (7 * 86_400_000)));
}

export function buildLeague(params: {
  weekKey: string;
  tier: number;
  userXp: number;
  userName: string;
  userSpecies: string;
  elapsed: number;
}): LeagueEntry[] {
  const tier = LEAGUE_TIERS[params.tier] ?? LEAGUE_TIERS[0]!;
  const rand = seeded(`${params.weekKey}-${params.tier}`);
  const names = [...NAMES].sort(() => rand() - 0.5);
  const rivals: LeagueEntry[] = [];
  for (let i = 0; i < LEAGUE_SIZE - 1; i++) {
    const intensity = 0.25 + rand() * 1.5; // unos practican poco, otros mucho
    const target = tier.baseXp * intensity;
    // Cada rival tiene su propio ritmo (algunos arrancan fuerte, otros al final).
    const pace = 0.6 + rand() * 0.9;
    const xp = Math.round(target * Math.pow(params.elapsed, pace));
    rivals.push({
      id: `rival-${i}`,
      name: names[i % names.length]!,
      species: SPECIES[Math.floor(rand() * SPECIES.length)]!,
      xp,
      isUser: false,
    });
  }
  const all = [
    ...rivals,
    { id: 'me', name: params.userName, species: params.userSpecies, xp: params.userXp, isUser: true },
  ];
  return all.sort((a, b) => b.xp - a.xp || (a.isUser ? -1 : 1));
}

export function zoneFor(rank: number): 'promote' | 'stay' | 'demote' {
  if (rank <= PROMOTE) return 'promote';
  if (rank > LEAGUE_SIZE - DEMOTE) return 'demote';
  return 'stay';
}

/** Semana anterior a `weekKey` (a partir de una fecha de esa semana). */
export function previousWeekKey(dateKey: string = localDateKey()): string {
  return isoWeekKey(addDaysKey(weekStartKey(dateKey), -1));
}
