import type { PracticeLevel } from '../practice/types.js';
import { REQUIRED_BEFORE_QUIZ, type Unit, type UnitProgress, type UnitQuestion, type UnitStep } from './types.js';

/* ------------------------------------------------------------------ */
/* Listening: la dificultad cambia de verdad con el nivel               */
/* ------------------------------------------------------------------ */

export interface ListeningProfile {
  /** Velocidad base de la voz (1 = normal del sistema). */
  rate: number;
  /** Velocidad del botón "lento". */
  slowRate: number;
  /** Escuchas permitidas antes de responder (null = sin límite). */
  maxPlays: number | null;
  /** Cuándo se puede ver la transcripción. */
  transcript: 'always' | 'after_first_play' | 'after_answers';
  /** Pausa entre intervenciones (ms): frases separadas en A1, habla seguida en C1+. */
  gapMs: number;
  /** Se alternan acentos US/UK entre hablantes (B2+). */
  mixAccents: boolean;
  /** Se puede pedir la versión lenta. */
  allowSlow: boolean;
  labelEs: string;
}

export const LISTENING_PROFILES: Record<PracticeLevel, ListeningProfile> = {
  A1: { rate: 0.72, slowRate: 0.58, maxPlays: null, transcript: 'always', gapMs: 900, mixAccents: false, allowSlow: true, labelEs: 'Lento y claro · escuchas ilimitadas · transcripción disponible' },
  A2: { rate: 0.82, slowRate: 0.66, maxPlays: null, transcript: 'after_first_play', gapMs: 650, mixAccents: false, allowSlow: true, labelEs: 'Pausado · transcripción después de la primera escucha' },
  B1: { rate: 0.92, slowRate: 0.74, maxPlays: 3, transcript: 'after_answers', gapMs: 400, mixAccents: false, allowSlow: true, labelEs: 'Ritmo natural · 3 escuchas · transcripción al responder' },
  B2: { rate: 1.0, slowRate: 0.82, maxPlays: 2, transcript: 'after_answers', gapMs: 250, mixAccents: true, allowSlow: false, labelEs: 'Velocidad real · 2 escuchas · acentos US y UK' },
  C1: { rate: 1.06, slowRate: 0.9, maxPlays: 2, transcript: 'after_answers', gapMs: 120, mixAccents: true, allowSlow: false, labelEs: 'Rápido y continuo · 2 escuchas · varios acentos' },
  C2: { rate: 1.14, slowRate: 0.95, maxPlays: 1, transcript: 'after_answers', gapMs: 60, mixAccents: true, allowSlow: false, labelEs: 'Nativo rápido · 1 escucha · sin ayudas' },
};

/* ------------------------------------------------------------------ */
/* Quiz final de la isla                                                */
/* ------------------------------------------------------------------ */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Mezcla estable: la misma semilla da el mismo orden (y cambia entre intentos). */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  return items
    .map((it, i) => ({ it, k: hash(`${seed}:${i}:${JSON.stringify(it).length}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.it);
}

/** Pone la respuesta en una posición mezclada y devuelve la pregunta lista. */
function mc(q: string, correct: string, wrong: string[], seed: string, why?: string): UnitQuestion {
  const opts = seededShuffle([correct, ...wrong.filter((w) => w !== correct).slice(0, 3)], seed);
  return { q, opts, a: opts.indexOf(correct), why };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Formas irregulares frecuentes (pasado y participio) para encontrar el término conjugado. */
const IRREGULAR: Record<string, string[]> = {
  be: ['was', 'were', 'been', 'is', 'are', 'am'], become: ['became'], begin: ['began', 'begun'], break: ['broke', 'broken'],
  bring: ['brought'], build: ['built'], buy: ['bought'], catch: ['caught'], choose: ['chose', 'chosen'], come: ['came'],
  cost: ['cost'], cut: ['cut'], deal: ['dealt'], do: ['did', 'done', 'does'], draw: ['drew', 'drawn'], drink: ['drank', 'drunk'],
  drive: ['drove', 'driven'], eat: ['ate', 'eaten'], fall: ['fell', 'fallen'], feel: ['felt'], fight: ['fought'], find: ['found'],
  fly: ['flew', 'flown'], forget: ['forgot', 'forgotten'], get: ['got', 'gotten'], give: ['gave', 'given'], go: ['went', 'gone'],
  grow: ['grew', 'grown'], have: ['had', 'has'], hear: ['heard'], hide: ['hid', 'hidden'], hold: ['held'], hurt: ['hurt'],
  keep: ['kept'], know: ['knew', 'known'], lead: ['led'], leave: ['left'], lend: ['lent'], let: ['let'], lie: ['lay', 'lain'],
  lose: ['lost'], make: ['made'], mean: ['meant'], meet: ['met'], pay: ['paid'], put: ['put'], quit: ['quit'], read: ['read'],
  ride: ['rode', 'ridden'], ring: ['rang', 'rung'], rise: ['rose', 'risen'], run: ['ran'], say: ['said'], see: ['saw', 'seen'],
  seek: ['sought'], sell: ['sold'], send: ['sent'], set: ['set'], shake: ['shook', 'shaken'], shut: ['shut'], sing: ['sang', 'sung'],
  sit: ['sat'], sleep: ['slept'], speak: ['spoke', 'spoken'], spend: ['spent'], stand: ['stood'], steal: ['stole', 'stolen'],
  stick: ['stuck'], strike: ['struck'], swim: ['swam', 'swum'], take: ['took', 'taken'], teach: ['taught'], tear: ['tore', 'torn'],
  tell: ['told'], think: ['thought'], throw: ['threw', 'thrown'], understand: ['understood'], wake: ['woke', 'woken'],
  wear: ['wore', 'worn'], win: ['won'], write: ['wrote', 'written'], undertake: ['undertook', 'undertaken'],
  overcome: ['overcame'], withdraw: ['withdrew', 'withdrawn'], forgive: ['forgave', 'forgiven'], mislead: ['misled'],
  bear: ['bore', 'borne'], weave: ['wove', 'woven'], shed: ['shed'], spread: ['spread'], upset: ['upset'], bet: ['bet'],
};

/** Variantes conjugadas de una palabra (works, worked, working, studied, stopped, irregulares…). */
function wordForms(word: string): string[] {
  const w = word.toLowerCase();
  const forms = new Set<string>([w, `${w}s`, `${w}es`, `${w}ed`, `${w}d`, `${w}ing`]);
  if (/[^aeiou]y$/.test(w)) {
    forms.add(`${w.slice(0, -1)}ies`);
    forms.add(`${w.slice(0, -1)}ied`);
  }
  if (/e$/.test(w)) forms.add(`${w.slice(0, -1)}ing`);
  if (/[aeiou][bdgklmnprt]$/.test(w)) {
    forms.add(`${w}${w.slice(-1)}ed`);
    forms.add(`${w}${w.slice(-1)}ing`);
  }
  for (const f of IRREGULAR[w] ?? []) forms.add(f);
  return [...forms];
}

/**
 * Busca el término dentro del ejemplo, aceptando la primera palabra conjugada
 * ("take photos" → "took photos", "apply for" → "applied for") y plurales al final.
 * Devuelve el texto tal como aparece en el ejemplo.
 */
export function findTerm(example: string, term: string): string | null {
  const exact = new RegExp(`\\b${escapeRe(term)}\\b`, 'i');
  const hit = example.match(exact);
  if (hit) return hit[0];
  const words = term.trim().split(/\s+/);
  const first = words[0]!.replace(/[^a-zA-Z'-]/g, '');
  if (!first) return null;
  // "someone / something / one's" del término aceptan cualquier palabra ("stand someone up" → "stood me up").
  const PLACEHOLDER = /^(someone|somebody|something|sb|sth|one's|your)$/i;
  const rest = words.slice(1).map((w) => (PLACEHOLDER.test(w) ? '\\S+' : escapeRe(w)));
  const head = `(?:${wordForms(first).map(escapeRe).join('|')})`;
  if (!rest.length) {
    const m = example.match(new RegExp(`\\b${head}\\b`, 'i'));
    return m ? m[0] : null;
  }
  // Primero la frase seguida; si no, se permite un objeto en medio (phrasal verbs separables:
  // "pick me up", "asked her out", "take the internet for granted").
  for (const gap of ['\\s+', '(?:\\s+\\S+){1,3}?\\s+']) {
    const m = example.match(new RegExp(`\\b${head}${gap}${rest.join('\\s+')}(?:s|es)?\\b`, 'i'));
    if (m) return m[0];
  }
  return null;
}

/** Frase de ejemplo con el término en hueco ("___"), o null si el ejemplo no lo contiene. */
export function blankTerm(example: string, term: string): string | null {
  const found = findTerm(example, term);
  return found ? example.replace(found, '___') : null;
}

const SPANISH_SUPPORT: PracticeLevel[] = ['A1', 'A2'];

/**
 * Banco de preguntas de la isla (todas las posibles). El quiz toma 10 al azar
 * de aquí, así cada intento es distinto.
 */
export function unitQuestionBank(unit: Unit): UnitQuestion[] {
  const spanish = SPANISH_SUPPORT.includes(unit.level);
  const vocab = unit.vocab;
  const bank: UnitQuestion[] = [];

  vocab.forEach((v, i) => {
    const others = vocab.filter((o) => o.term !== v.term);
    const pick = (f: (o: (typeof vocab)[number]) => string) =>
      seededShuffle(others, `${unit.id}-${v.term}-${i}`)
        .map(f)
        .filter((x, j, arr) => x && arr.indexOf(x) === j);
    // 1) Significado
    if (spanish) {
      bank.push(mc(`¿Qué significa "${v.term}"?`, v.es, pick((o) => o.es), `${unit.id}-m-${i}`, `${v.term} = ${v.es}. ${v.ex}`));
    } else {
      bank.push(mc(`Which word matches this definition? "${v.def}"`, v.term, pick((o) => o.term), `${unit.id}-d-${i}`, v.ex));
    }
    // 2) Hueco en contexto: la respuesta es la forma que aparece en la frase (took photos, applied for…)
    const used = findTerm(v.ex, v.term);
    if (used) {
      const gap = v.ex.replace(used, '___');
      const answer = used === used.toLowerCase() || /^[A-Z]/.test(v.term) ? used : used.toLowerCase();
      bank.push(
        mc(
          spanish ? `Completa: ${gap}` : `Complete: ${gap}`,
          answer,
          pick((o) => o.term),
          `${unit.id}-g-${i}`,
          spanish ? `${v.term} = ${v.es}` : v.def
        )
      );
    }
    // 3) Al revés (traducción → inglés) solo con apoyo en español
    if (spanish) {
      bank.push(mc(`¿Cómo se dice "${v.es}" en inglés?`, v.term, pick((o) => o.term), `${unit.id}-r-${i}`));
    }
  });

  unit.grammar.practice.forEach((g, i) => {
    const lead = g.q.includes('___') ? (spanish ? 'Completa: ' : 'Complete: ') : '';
    bank.push(mc(`${spanish ? 'Gramática' : 'Grammar'} · ${lead}${g.q}`, g.a, g.opts, `${unit.id}-gr-${i}`, g.why));
  });

  bank.push(...(unit.extraQuiz ?? []));
  return bank;
}

/**
 * Quiz final: 10 preguntas (4 de gramática, el resto vocabulario y extras), en orden
 * distinto en cada intento.
 */
export function buildUnitQuiz(unit: Unit, attempt = 0, size = 10): UnitQuestion[] {
  const seed = `${unit.id}-quiz-${attempt}`;
  const bank = unitQuestionBank(unit);
  const grammar = bank.filter((q) => /^(Gramática|Grammar) ·/.test(q.q));
  const rest = bank.filter((q) => !grammar.includes(q));
  // Las primeras 4 de gramática ya se practicaron en la lección: el quiz prefiere las demás.
  const fresh = grammar.slice(4);
  const grammarPick = seededShuffle(fresh.length >= 4 ? fresh : grammar, seed).slice(0, 4);
  const restPick = seededShuffle(rest, `${seed}-v`).slice(0, size - grammarPick.length);
  return seededShuffle([...grammarPick, ...restPick], `${seed}-all`);
}

export const QUIZ_PASS = 70;

/** Estrellas de la isla: 1 = quiz aprobado, 2 = quiz ≥ 90, 3 = además speaking y writing. */
export function unitStars(progress: UnitProgress | undefined): number {
  if (!progress?.bestQuiz || progress.bestQuiz < QUIZ_PASS) return 0;
  let stars = 1;
  if (progress.bestQuiz >= 90) stars++;
  if (progress.done.includes('speaking') && progress.done.includes('writing')) stars++;
  return stars;
}

export function isStepUnlocked(step: UnitStep, progress: UnitProgress | undefined): boolean {
  const done = progress?.done ?? [];
  if (step === 'vocab') return true;
  if (step === 'quiz') return REQUIRED_BEFORE_QUIZ.every((s) => done.includes(s));
  // Cada paso se abre al terminar el anterior (speaking y writing tras el listening).
  const order: UnitStep[] = ['vocab', 'grammar', 'reading', 'listening', 'speaking', 'writing'];
  const prev = order[order.indexOf(step) - 1];
  return !prev || done.includes(prev) || (step === 'writing' && done.includes('listening'));
}

/** La isla n se abre cuando la anterior del mismo nivel tiene al menos 1 estrella. */
export function isUnitUnlocked(units: Unit[], unitId: string, all: Record<string, UnitProgress | undefined>): boolean {
  const idx = units.findIndex((u) => u.id === unitId);
  if (idx <= 0) return true;
  return unitStars(all[units[idx - 1]!.id]) > 0;
}
