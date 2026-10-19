import { EXPERIENCE_BANK_RAW, EXPERIENCE_EXTRA_ISLANDS_RAW, EXPERIENCE_ISLAND_MAP_RAW } from './experience-bank.data.js';
import type { ErrorHuntItem } from './error-hunt.js';
import type { SpanglishTrap } from './placement-test.js';
import type {
  DailyCategory,
  DailyItem,
  ListeningSegment,
  ListeningTrack,
  MultipleChoiceQuestion,
  PracticeLevel,
  SpeakingTopic,
  WritingPrompt,
} from './types.js';

/**
 * Banco de Aprendizaje Experiencial (BancodeVocabulario.txt): islas temáticas por nivel A1–C2
 * con speaking, listening, writing, laboratorio de Spanglish y caja de léxico.
 * Aquí se convierte a los formatos que ya usa la app, para que aparezca en Islas,
 * Cofre Diario y los minijuegos sin pantallas nuevas.
 * Para actualizarlo: reemplaza el .txt y ejecuta packages/shared/scripts/import-experience-bank.mjs.
 */

interface RawIsland {
  island_id: string;
  title: string;
  topic_context: string;
  speaking_module?: {
    prompts: Array<{ id: string; goal: string; instructions: string; target_phrases: string[]; model_response?: string }>;
  };
  listening_module?: {
    id: string;
    audio_script: string;
    comprehension_questions: Array<{ question: string; options: string[]; correct_answer: string; explanation: string }>;
  };
  writing_module?: { id: string; task_type: string; instructions: string; scaffolding_structures: string[] };
  spanglish_error_lab?: Array<{ error_id: string; incorrect_sentence: string; spanish_interference: string; native_correction: string }>;
  lexical_toolbox?: Array<{
    term: string;
    type: string;
    ipa?: string;
    explanation: string;
    how_to_use: string;
    example_1: string;
    example_2?: string;
    /** Traducción corta (solo en islas generadas). */
    translation_es?: string;
  }>;
}

interface RawLevel {
  level_code: PracticeLevel;
  instructional_language: string;
  sample_island: RawIsland;
}

const LEVELS = (EXPERIENCE_BANK_RAW as unknown as { levels: RawLevel[] }).levels;

/**
 * Todas las islas con contenido: la de muestra de cada nivel + las generadas con IA que ya fueron
 * aprobadas (packages/shared/data/generated-islands.json → "approved": true).
 */
const ENTRIES: Array<{ lv: RawLevel; island: RawIsland }> = [
  ...LEVELS.map((lv) => ({ lv, island: lv.sample_island })),
  ...(EXPERIENCE_EXTRA_ISLANDS_RAW as unknown as Array<{ level: PracticeLevel; island: RawIsland }>).flatMap((x) => {
    const lv = LEVELS.find((l) => l.level_code === x.level);
    return lv ? [{ lv, island: x.island }] : [];
  }),
];

const SECONDS: Record<PracticeLevel, number> = { A1: 30, A2: 40, B1: 60, B2: 75, C1: 90, C2: 90 };
const isSpanishLevel = (lv: RawLevel) => lv.instructional_language.toLowerCase().startsWith('span');

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Orden estable pero "mezclado" (la respuesta correcta no siempre queda primera). */
function stableShuffle<T>(items: T[], seed: string): T[] {
  return items
    .map((it, i) => ({ it, k: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.it);
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const islandEmoji = (title: string): string => {
  const t = title.toLowerCase();
  if (/coffee|caf/.test(t)) return '☕';
  if (/shop|retail|consum|spend/.test(t)) return '🛍️';
  if (/gentrif|urban|city/.test(t)) return '🏙️';
  if (/econom|bias|market/.test(t)) return '🧠';
  if (/truth|epistem|philos/.test(t)) return '📜';
  return '🏝️';
};

/** Nombre corto de la isla para la placa del mapa: "The Coffee Shop Exchange" → "Coffee Shop Exchange", "A & B" → "A". */
function shortIslandName(title: string): string {
  const base = title.replace(/^the\s+/i, '').split(/\s+&\s+|:\s+/)[0]!.trim();
  return base.length > 22 ? `${base.slice(0, 21).trim()}…` : base;
}

const lexicalTerms = (island: RawIsland) => (island.lexical_toolbox ?? []).map((l) => l.term);

/* ------------------------------ Speaking ------------------------------ */

export const EXPERIENCE_SPEAKING_TOPICS: SpeakingTopic[] = ENTRIES.flatMap(({ lv, island }) => {
  return (island.speaking_module?.prompts ?? []).map((p, i) => ({
    id: `exp-${p.id}`,
    level: lv.level_code,
    emoji: islandEmoji(island.title),
    title: `${shortIslandName(island.title)} · ${i + 1}`,
    promptEn: p.instructions,
    guidingQuestions: [p.goal],
    usefulPhrases: p.target_phrases,
    targetWords: lexicalTerms(island).slice(0, 4),
    suggestedSeconds: SECONDS[lv.level_code],
    modelAnswer: p.model_response,
  }));
});

/* ------------------------------ Listening ----------------------------- */

const stripOption = (o: string) => o.replace(/^\s*[A-Da-d]\)\s*/, '').trim();

function toSegments(script: string): ListeningSegment[] {
  const order: string[] = [];
  return script
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
      if (!m) return { speaker: 'Narrator' as const, text: line };
      const name = m[1]!.trim();
      if (!order.includes(name)) order.push(name);
      const idx = order.indexOf(name);
      return { speaker: idx === 0 ? ('A' as const) : idx === 1 ? ('B' as const) : ('Narrator' as const), text: m[2]!.trim() };
    });
}

/** Frases cortas del guion para dictado (5–12 palabras). */
function dictationFrom(segments: ListeningSegment[]): string[] {
  const sentences = segments
    .flatMap((s) => s.text.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => {
      const n = s.split(/\s+/).length;
      return n >= 5 && n <= 12;
    });
  return sentences.slice(0, 2);
}

export const EXPERIENCE_LISTENING_TRACKS: ListeningTrack[] = ENTRIES.flatMap(({ lv, island }) => {
  const mod = island.listening_module;
  if (!mod) return [];
  const segments = toSegments(mod.audio_script);
  const questions: MultipleChoiceQuestion[] = mod.comprehension_questions.map((q) => {
    const options = q.options.map(stripOption);
    const answer = stripOption(q.correct_answer);
    return {
      question: q.question,
      options,
      answerIndex: Math.max(0, options.findIndex((o) => o === answer)),
      explanationEn: q.explanation,
    };
  });
  return [
    {
      id: `exp-${mod.id}`,
      level: lv.level_code,
      emoji: islandEmoji(island.title),
      title: island.title,
      contextEs: island.topic_context,
      segments,
      questions,
      dictation: dictationFrom(segments),
    },
  ];
});

/* ------------------------------- Writing ------------------------------ */

function writingType(task: string): WritingPrompt['type'] {
  const t = task.toLowerCase();
  if (/mensaje|message|nota|note|text/.test(t)) return 'message';
  if (/correo|email|e-mail|letter|carta/.test(t)) return 'email';
  if (/review|reseña/.test(t)) return 'review';
  if (/story|historia|narra/.test(t)) return 'story';
  return 'opinion';
}

function wordRange(instructions: string): [number, number] | null {
  const m = instructions.match(/(\d{2,3})\s*[-–]\s*(\d{2,3})\s*(?:palabras|words)/i);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export const EXPERIENCE_WRITING_PROMPTS: WritingPrompt[] = ENTRIES.flatMap(({ lv, island }) => {
  const mod = island.writing_module;
  if (!mod) return [];
  const range = wordRange(mod.instructions);
  return [
    {
      id: `exp-${mod.id}`,
      level: lv.level_code,
      emoji: islandEmoji(island.title),
      type: writingType(mod.task_type),
      title: shortIslandName(island.title),
      promptEn: mod.instructions,
      instructionsEs: isSpanishLevel(lv)
        ? mod.instructions
        : `Escribe en inglés (${mod.task_type}${range ? `, ${range[0]}–${range[1]} palabras` : ''}). Usa las estructuras sugeridas.`,
      minWords: range ? range[0] : SECONDS[lv.level_code],
      targetWords: lexicalTerms(island).slice(0, 4),
      checklist: mod.scaffolding_structures,
    },
  ];
});

/* -------------------------- Léxico → Cofre Diario --------------------- */

/** Traducción corta al español (para minijuegos y "Ver traducción"). Las islas generadas traen la suya. */
const GLOSS_ES: Record<string, string> = {
  "pick up": "recoger",
  "grab": "agarrar / tomar algo rápido",
  "order": "pedir (en un local)",
  "piping hot": "bien caliente, humeante",
  "on the go": "de aquí para allá, sobre la marcha",
  "decaf": "café descafeinado",
  "try on": "probarse (ropa)",
  "rip-off": "estafa, robo (muy caro)",
  "refund": "reembolso / reembolsar",
  "faulty": "defectuoso",
  "cost an arm and a leg": "costar un ojo de la cara",
  "store credit": "saldo a favor en la tienda",
  "splurge on": "darse un lujo, derrochar en",
  "window shopping": "mirar vitrinas (sin comprar)",
  "max out": "agotar el cupo (de la tarjeta)",
  "exorbitant": "exorbitante, desorbitado",
  "burn a hole in one's pocket": "quemarle la plata en el bolsillo",
  "buyer's remorse": "arrepentimiento del comprador",
  "price out": "sacar del mercado por precios altos",
  "bougie": "gomelo, pretencioso (burgués)",
  "displace": "desplazar",
  "homogenized": "homogeneizado, uniforme",
  "change hands": "cambiar de dueño",
  "social fabric": "tejido social",
  "factor out": "excluir (un factor) del análisis",
  "fomo-driven": "impulsado por el miedo a perderse algo",
  "heuristic": "heurístico / atajo mental",
  "paternalistic": "paternalista",
  "throw good money after bad": "seguir perdiendo plata en algo que ya fracasó",
  "loss aversion": "aversión a la pérdida",
  "boil down to": "reducirse a, resumirse en",
  "word salad": "palabrería sin sentido",
  "obfuscate": "ofuscar, enredar a propósito",
  "apodictic": "apodíctico, irrefutable",
  "grasp at straws": "agarrarse de un clavo ardiendo",
  "simulacrum": "simulacro, imitación"
};



function lexicalCategory(type: string): DailyCategory {
  const t = type.toLowerCase();
  if (t.includes('phrasal')) return 'phrasal_verb';
  if (t.includes('idiom')) return 'idiom';
  if (t.includes('slang') || t.includes('colloquial') || t.includes('coloquial')) return 'slang';
  if (t.startsWith('adjective')) return 'adjective';
  if (t.startsWith('verb')) return 'verb';
  return 'vocabulary';
}

/** Hueco "___" en el ejemplo donde aparece el término (acepta formas como "picked up", "splurged on"). */
function blankOut(example: string, term: string): string | null {
  const words = term
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^a-z'-]/g, ''))
    .filter(Boolean);
  if (!words.length) return null;
  const stem = (w: string) => (w.length > 4 ? w.replace(/(e|y)$/, '') : w);
  const pattern = words.map((w) => `${stem(w).replace(/[-']/g, '[-\']?')}\\w*`).join("[\\s-]+(?:\\w+\\s+)?");
  const re = new RegExp(`\\b${pattern}\\b`, 'i');
  return re.test(example) ? example.replace(re, '___') : null;
}

export const EXPERIENCE_DAILY_ITEMS: DailyItem[] = ENTRIES.flatMap(({ lv, island }) => {
  const lex = island.lexical_toolbox ?? [];
  return lex.map((l) => {
    const category = lexicalCategory(l.type);
    const others = lex.filter((o) => o.term !== l.term).map((o) => o.term);
    const distractors = stableShuffle(others, l.term).slice(0, 2);
    const sentence = blankOut(l.example_1, l.term) ?? (l.example_2 ? blankOut(l.example_2, l.term) : null);
    const register: DailyItem['register'] =
      category === 'slang' ? 'informal' : /academic|formal|philosoph/i.test(l.type) || lv.level_code.startsWith('C') ? 'formal' : 'neutral';
    return {
      id: `exp-${lv.level_code.toLowerCase()}-${slug(l.term)}`,
      category,
      term: l.term,
      partOfSpeech: l.type,
      ipa: l.ipa,
      definitionEn: l.explanation,
      usageEn: l.how_to_use,
      examples: [l.example_1, l.example_2].filter((e): e is string => !!e),
      // Traducción corta real; si no hay, queda vacía (los minijuegos en español no la usan).
      spanish: l.translation_es?.trim() || GLOSS_ES[l.term.toLowerCase()] || '',
      register,
      level: lv.level_code,
      quiz: {
        // Si el ejemplo usa una forma que no se puede recortar, se pregunta por la definición.
        sentence: sentence ?? `___ = ${l.explanation.replace(/___/g, '…')}`,
        options: stableShuffle([l.term, ...distractors], `${l.term}-quiz`),
        answer: l.term,
      },
    };
  });
});

/* ---------------------- Laboratorio de Spanglish --------------------- */

const tokens = (s: string) => s.replace(/[.!?]+$/, '').split(/\s+/).filter(Boolean);

/** Diferencia mínima entre la frase con error y la corregida (prefijo/sufijo comunes). */
function diffSpans(wrong: string, right: string) {
  const a = tokens(wrong);
  const b = tokens(right);
  let start = 0;
  while (start < a.length && start < b.length && a[start]!.toLowerCase() === b[start]!.toLowerCase()) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1]!.toLowerCase() === b[endB - 1]!.toLowerCase()) {
    endA--;
    endB--;
  }
  // Si solo se borró o agregó una palabra, se incluye la vecina para que el fragmento tenga sentido.
  if (endA === start || endB === start) {
    start = Math.max(0, start - 1);
    endA = Math.min(a.length, Math.max(endA, start + 2));
    endB = Math.min(b.length, Math.max(endB, start + 2));
  }
  return { wrongSpan: a.slice(start, endA).join(' '), rightSpan: b.slice(start, endB).join(' '), wrongIndex: start };
}

const RAW_SPANGLISH = ENTRIES.flatMap(({ lv, island }) =>
  (island.spanglish_error_lab ?? []).map((e) => ({ level: lv.level_code, ...e }))
);

export const EXPERIENCE_SPANGLISH_TRAPS: SpanglishTrap[] = RAW_SPANGLISH.map((e) => {
  const { wrongSpan, rightSpan } = diffSpans(e.incorrect_sentence, e.native_correction);
  // Dos opciones: lo natural frente al calco del español (un distractor de otra frase sería demasiado obvio).
  const options = stableShuffle([rightSpan, wrongSpan], e.error_id);
  return {
    id: `exp-${e.error_id}`,
    level: e.level,
    spanglishSentence: e.incorrect_sentence,
    trapWord: wrongSpan,
    naturalSentence: e.native_correction,
    naturalReplacement: rightSpan,
    options,
    answerIndex: options.indexOf(rightSpan),
    whyEs: e.spanish_interference,
  };
});

const bare = (w: string) => w.toLowerCase().replace(/[^a-z']/g, '');

/**
 * "Encuentra el error" necesita UNA palabra incorrecta: solo entran las frases donde exactamente
 * una palabra no existe en la corrección (las de varios errores quedan en el mini-reto de Spanglish).
 */
export const EXPERIENCE_ERROR_HUNT_ITEMS: ErrorHuntItem[] = RAW_SPANGLISH.flatMap((e) => {
  const sentence = e.incorrect_sentence.replace(/[.!?]+$/, '');
  const words = sentence.split(' ');
  const correct = new Set(e.native_correction.split(/\s+/).map(bare));
  const wrong = words.map((w, i) => ({ w: bare(w), i })).filter(({ w }) => w && !correct.has(w));
  if (wrong.length !== 1) return [];
  const item = {
    sentence,
    wrongIndex: wrong[0]!.i,
    correction: e.native_correction,
    explanationEs: e.spanish_interference,
    // En B1+ la explicación del banco ya viene en inglés.
    ...(e.level === 'A1' || e.level === 'A2' ? {} : { explanationEn: e.spanish_interference }),
  };
  // Mismo criterio que los ítems manuales: la ventana alrededor del error no debe existir en la corrección.
  const window = words.slice(Math.max(0, item.wrongIndex - 1), item.wrongIndex + 2).join(' ');
  return item.correction.includes(window) ? [] : [item];
});

/** Mapa completo de islas por nivel (15 por nivel); hoy solo una por nivel trae contenido. */
export const EXPERIENCE_ISLAND_MAP = EXPERIENCE_ISLAND_MAP_RAW as Record<PracticeLevel, { theme: string; islands: string[] }>;
