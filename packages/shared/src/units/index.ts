import type {
  DailyCategory,
  DailyItem,
  ListeningTrack,
  MultipleChoiceQuestion,
  PracticeLevel,
  ReadingPassage,
  SpeakingTopic,
  WritingPrompt,
} from '../practice/types.js';
import { A1_UNITS } from './content/a1.js';
import { A2_UNITS } from './content/a2.js';
import { B1_UNITS } from './content/b1.js';
import { B2_UNITS } from './content/b2.js';
import { C1_UNITS } from './content/c1.js';
import { C2_UNITS } from './content/c2.js';
import { blankTerm, seededShuffle } from './engine.js';
import type { Unit, UnitQuestion } from './types.js';

export * from './types.js';
export * from './engine.js';

export const ALL_UNITS: Unit[] = [...A1_UNITS, ...A2_UNITS, ...B1_UNITS, ...B2_UNITS, ...C1_UNITS, ...C2_UNITS];

export function unitsForLevel(level: PracticeLevel): Unit[] {
  return ALL_UNITS.filter((u) => u.level === level).sort((a, b) => a.n - b.n);
}

export function getUnit(id: string): Unit | undefined {
  return ALL_UNITS.find((u) => u.id === id);
}

/* ------------------------------------------------------------------ */
/* Cada isla también alimenta los bancos de práctica libre              */
/* ------------------------------------------------------------------ */

const toMc = (q: UnitQuestion): MultipleChoiceQuestion => ({
  question: q.q,
  options: q.opts,
  answerIndex: q.a,
  explanationEn: q.why ?? '',
});

/** Id del ejercicio de una isla en los bancos de práctica (lo usa la app para marcar el paso). */
export const unitActivityId = (unitId: string, step: 'speaking' | 'listening' | 'reading' | 'writing') => `unit:${unitId}:${step}`;

export const UNIT_SPEAKING_TOPICS: SpeakingTopic[] = ALL_UNITS.map((u) => ({
  id: unitActivityId(u.id, 'speaking'),
  level: u.level,
  emoji: u.emoji,
  title: u.title,
  promptEn: u.speaking.prompt,
  guidingQuestions: u.speaking.questions,
  usefulPhrases: u.speaking.phrases,
  targetWords: u.vocab.slice(0, 4).map((v) => v.term),
  suggestedSeconds: u.speaking.seconds,
  modelAnswer: u.speaking.model,
}));

export const UNIT_LISTENING_TRACKS: ListeningTrack[] = ALL_UNITS.map((u) => {
  const speakers: string[] = [];
  return {
    id: unitActivityId(u.id, 'listening'),
    level: u.level,
    emoji: u.emoji,
    title: u.title,
    contextEs: u.listening.context,
    segments: u.listening.lines.map(([who, text]) => {
      if (!speakers.includes(who)) speakers.push(who);
      const idx = speakers.indexOf(who);
      return { speaker: idx === 0 ? ('A' as const) : idx === 1 ? ('B' as const) : ('Narrator' as const), text };
    }),
    questions: u.listening.questions.map(toMc),
    dictation: u.listening.dictation,
  };
});

export const UNIT_READING_PASSAGES: ReadingPassage[] = ALL_UNITS.map((u) => ({
  id: unitActivityId(u.id, 'reading'),
  level: u.level,
  emoji: u.emoji,
  title: u.reading.title,
  paragraphs: u.reading.paragraphs,
  glossary: Object.fromEntries(u.vocab.map((v) => [v.term.toLowerCase(), `${v.def} (${v.es})`])),
  questions: u.reading.questions.map(toMc),
  discussionPrompt: u.speaking.questions[0] ?? u.warmUp,
}));

export const UNIT_WRITING_PROMPTS: WritingPrompt[] = ALL_UNITS.map((u) => ({
  id: unitActivityId(u.id, 'writing'),
  level: u.level,
  emoji: u.emoji,
  type: u.writing.type,
  title: u.title,
  promptEn: u.writing.prompt,
  instructionsEs: u.writing.prompt,
  minWords: u.writing.minWords,
  targetWords: u.vocab.slice(0, 4).map((v) => v.term),
  checklist: u.writing.checklist,
}));

function categoryOf(pos: string): DailyCategory {
  const p = pos.toLowerCase();
  if (p.includes('phrasal')) return 'phrasal_verb';
  if (p.includes('idiom')) return 'idiom';
  if (p.includes('slang') || p.includes('informal')) return 'slang';
  if (p.startsWith('adj')) return 'adjective';
  if (p.startsWith('verb')) return 'verb';
  return 'vocabulary';
}

export const UNIT_DAILY_ITEMS: DailyItem[] = ALL_UNITS.flatMap((u) =>
  u.vocab.map((v, i) => {
    const others = u.vocab.filter((o) => o.term !== v.term).map((o) => o.term);
    const options = seededShuffle([v.term, ...seededShuffle(others, `${u.id}-${i}`).slice(0, 2)], `${u.id}-${v.term}`);
    return {
      id: `${u.id}-${v.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      category: categoryOf(v.pos),
      term: v.term,
      partOfSpeech: v.pos,
      ipa: v.ipa,
      definitionEn: v.def,
      usageEn: v.def,
      examples: [v.ex],
      spanish: v.es,
      register: categoryOf(v.pos) === 'slang' ? ('informal' as const) : ('neutral' as const),
      level: u.level,
      quiz: { sentence: blankTerm(v.ex, v.term) ?? `___ = ${v.def}`, options, answer: v.term },
    };
  })
);
