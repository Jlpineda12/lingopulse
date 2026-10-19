import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  alignWords,
  analyzeSpeechFluency,
  buildLocalFeedback,
  checkGrammar,
  findTargetWordsUsed,
  getDailyDrop,
  DAILY_CATEGORIES,
  DAILY_ITEMS,
  getDailyPractice,
} from './index.js';

test('daily drop: one item per category and deterministic per date', () => {
  const a = getDailyDrop('2026-10-16');
  const b = getDailyDrop('2026-10-16');
  const c = getDailyDrop('2026-10-17');
  assert.equal(a.items.length, DAILY_CATEGORIES.length);
  assert.deepEqual(a.items.map((i) => i.id), b.items.map((i) => i.id));
  assert.notDeepEqual(a.items.map((i) => i.id), c.items.map((i) => i.id));
  assert.ok(a.items.includes(a.featured));
});

test('daily items: every quiz answer is one of its options', () => {
  for (const item of DAILY_ITEMS) {
    assert.ok(item.quiz.options.includes(item.quiz.answer), item.id);
    assert.ok(item.quiz.sentence.includes('___'), item.id);
  }
});

test('daily practice picks one item per skill', () => {
  const p = getDailyPractice('2026-10-16');
  assert.ok(p.speaking.id && p.listening.id && p.reading.id && p.writing.id);
});

test('grammar: typical Spanish-speaker mistakes are corrected', () => {
  const cases: Array<[string, string]> = [
    ['I have 25 years.', 'I am 25 years old.'],
    ['I am agree with you.', 'I agree with you.'],
    ['People is very friendly.', 'People are very friendly.'],
    ['She have a car.', 'She has a car.'],
    ["He don't like coffee.", "He doesn't like coffee."],
    ['Yesterday I didn\'t went to work.', "Yesterday I didn't go to work."],
    ['Is important to practice every day.', 'It is important to practice every day.'],
    ['It depends of the weather.', 'It depends on the weather.'],
    ['Can you explain me the rule?', 'Can you explain to me the rule?'],
    ['I need some informations.', 'I need some information.'],
    ['I live here since 3 years.', 'I live here for 3 years.'],
    ['I look forward to see you.', 'I look forward to seeing you.'],
    ['I can to swim.', 'I can swim.'],
    ['This is more better.', 'This is better.'],
    ['I will assist to the meeting.', 'I will attend the meeting.'],
    ['Is possible to put it off until Friday?', 'Is it possible to put it off until Friday?'],
    ['People are waiting the report.', 'People are waiting for the report.'],
    ["I cant go.", "I can't go."],
  ];
  for (const [input, expected] of cases) {
    assert.equal(checkGrammar(input).correctedText, expected, input);
  }
});

test('grammar: correct sentences are left alone', () => {
  const fine = [
    'Does she have a car?',
    'I have 5 years of experience in marketing.',
    'Let it go.',
    'We met at 9 a.m. tomorrow we will meet again.',
    'I have an idea and a university degree.',
    'He researches climate change.',
  ];
  for (const s of fine) {
    const r = checkGrammar(s);
    assert.equal(r.corrections.filter((c) => c.type === 'grammar').length, 0, s);
  }
});

test('grammar: lowercase i and missing final punctuation', () => {
  const r = checkGrammar("yesterday i went to the park and i'm happy");
  assert.equal(r.correctedText, "Yesterday I went to the park and I'm happy.");
});

test('spoken mode skips punctuation and capitalisation rules', () => {
  const r = checkGrammar('i think people is nice', { spoken: true });
  assert.equal(r.correctedText, 'i think people are nice');
});

test('alignWords handles numbers, contractions and missing words', () => {
  const r = alignWords('The new departure time is 5:15 p.m.', 'the new departure time is five fifteen pm');
  assert.ok(r.accuracy >= 85, String(r.accuracy));
  const miss = alignWords("Let's leave early, around seven.", 'lets leave around seven');
  assert.equal(miss.ops.filter((o) => o.kind === 'missing').length, 1);
});

test('target word detection accepts inflections', () => {
  assert.deepEqual(
    findTargetWordsUsed('We figured it out and ended up staying.', ['figure out', 'end up', 'thrive']),
    ['figure out', 'end up']
  );
});

test('speech fluency rewards a natural pace', () => {
  const transcript = Array.from({ length: 110 }, () => 'word').join(' ');
  const good = analyzeSpeechFluency(transcript, {
    durationMs: 60_000, voicedMs: 48_000, pauseCount: 3, longestPauseMs: 1200,
    recognitionConfidence: 0.9, averageLevel: 0.3,
  });
  const slow = analyzeSpeechFluency('um I think um', {
    durationMs: 30_000, voicedMs: 4_000, pauseCount: 9, longestPauseMs: 6000,
    recognitionConfidence: 0.5, averageLevel: 0.1,
  });
  assert.ok(good.fluencyScore > 80);
  assert.ok(slow.fluencyScore < 40);
  assert.equal(slow.fillers.detail.um, 2);
});

test('local feedback returns a complete, consistent object', () => {
  const fb = buildLocalFeedback({
    skill: 'writing',
    level: 'B1',
    promptEn: 'Is remote work better?',
    text:
      'In my opinion working from home is very good. However people is more isolated. I dont have a commute, so I have more time. Nevertheless my workload is bigger.',
    targetWords: ['commute', 'workload', 'nevertheless'],
    minWords: 30,
  });
  assert.equal(fb.source, 'local');
  assert.ok(fb.overallScore > 0 && fb.overallScore <= 100);
  assert.ok(fb.corrections.some((c) => c.corrected === 'people are'));
  assert.deepEqual(fb.targetWordsUsed, ['commute', 'workload', 'nevertheless']);
  assert.ok(fb.vocabularyUpgrades.some((u) => u.original.toLowerCase() === 'very good'));
});

import { applyActivityToStreak, isoWeekKey, visibleStreak, flameTier, ERROR_HUNT_ITEMS, type StreakState } from './index.js';

const base: StreakState = {
  streak: 5, bestStreak: 5, lastActiveDate: '2026-10-14', shields: 1,
  lastShieldWeek: '2026-W42', protectedDays: [], claimedMilestones: [3],
};

test('streak: consecutive day increases it', () => {
  const r = applyActivityToStreak(base, '2026-10-15');
  assert.equal(r.state.streak, 6);
  assert.equal(r.shieldsUsed, 0);
});

test('streak: a missed day is covered by a shield', () => {
  const r = applyActivityToStreak(base, '2026-10-16');
  assert.equal(r.state.streak, 6);
  assert.equal(r.shieldsUsed, 1);
  assert.deepEqual(r.state.protectedDays, ['2026-10-15']);
});

test('streak: missing more days than shields resets it', () => {
  const r = applyActivityToStreak(base, '2026-10-18');
  assert.equal(r.state.streak, 1);
});

test('streak: weekly shield is granted once per ISO week and milestones pay once', () => {
  const r = applyActivityToStreak({ ...base, streak: 6, lastActiveDate: '2026-10-18' }, '2026-10-19');
  assert.equal(isoWeekKey('2026-10-19'), '2026-W43');
  assert.equal(r.shieldGranted, true);
  assert.equal(r.state.shields, 2);
  assert.equal(r.milestone?.days, 7);
  const again = applyActivityToStreak(r.state, '2026-10-19');
  assert.equal(again.milestone, null);
  assert.equal(again.increased, false);
});

test('visible streak shows risk and loss', () => {
  assert.equal(visibleStreak(base, '2026-10-15').atRisk, true);
  assert.equal(visibleStreak(base, '2026-10-16').shieldsNeeded, 1);
  assert.equal(visibleStreak(base, '2026-10-18').lost, true);
  assert.equal(flameTier(30).id, 'azure');
});

test('error hunt: the words around the marked one change in the correction', () => {
  for (const item of ERROR_HUNT_ITEMS) {
    const words = item.sentence.split(' ');
    assert.ok(item.wrongIndex < words.length, item.sentence);
    const window = words.slice(Math.max(0, item.wrongIndex - 1), item.wrongIndex + 2).join(' ');
    assert.ok(!item.correction.includes(window), item.sentence);
  }
});

import {
  phonemeInfo,
  pronunciationSummaryEn,
  pronunciationTipsEs,
  weakestPhoneme,
  weakWords,
  type PronunciationReport,
} from './pronunciation.js';

const SAMPLE_PRON: PronunciationReport = {
  provider: 'azure',
  scripted: true,
  referenceText: 'I think it is very nice',
  recognizedText: 'I tink it is bery',
  pronScore: 66,
  accuracy: 62,
  fluency: 80,
  completeness: 83,
  prosody: 55,
  words: [
    { word: 'I', accuracy: 97, errorType: 'None', phonemes: [{ phoneme: 'ay', ipa: 'aɪ', accuracy: 97 }] },
    {
      word: 'think',
      accuracy: 41,
      errorType: 'Mispronunciation',
      phonemes: [
        { phoneme: 'th', ipa: 'θ', accuracy: 12 },
        { phoneme: 'ih', ipa: 'ɪ', accuracy: 85 },
      ],
    },
    { word: 'very', accuracy: 55, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'v', ipa: 'v', accuracy: 20 }] },
    { word: 'nice', accuracy: 0, errorType: 'Omission', phonemes: [] },
  ],
};

test('phonemeInfo maps SAPI and IPA symbols to the same Spanish tip', () => {
  const sapi = phonemeInfo('th');
  const ipa = phonemeInfo('θ');
  assert.equal(sapi.ipa, 'θ');
  assert.ok(sapi.tipEs && sapi.tipEs.includes('lengua'));
  assert.equal(ipa.tipEs, sapi.tipEs);
  assert.equal(phonemeInfo('xx').tipEs, null);
});

test('weak words are ordered worst first and include omissions', () => {
  const weak = weakWords(SAMPLE_PRON).map((w) => w.word);
  // "very" tiene /v/ en 20: su puntaje efectivo (20) es peor que el de "think" (41).
  assert.deepEqual(weak, ['nice', 'very', 'think']);
  assert.equal(weakestPhoneme(SAMPLE_PRON.words[1]!)?.phoneme, 'th');
});

test('pronunciation tips explain the weakest sound in Spanish', () => {
  const tips = pronunciationTipsEs(SAMPLE_PRON, 3);
  assert.ok(tips.some((t) => t.includes('Te saltaste "nice"')));
  assert.ok(tips.some((t) => t.includes('"think"') && t.includes('/θ/')));
  assert.ok(tips.some((t) => t.includes('entonación')));
  assert.ok(pronunciationSummaryEn(SAMPLE_PRON).includes('overall 66/100'));
});

test('assessed pronunciation overrides recognizer confidence in fluency analysis', () => {
  const report = analyzeSpeechFluency('I think it is very nice and I like it a lot today', {
    durationMs: 6000,
    voicedMs: 5000,
    pauseCount: 0,
    longestPauseMs: 0,
    recognitionConfidence: 0.95,
    averageLevel: 0.4,
    assessedPronunciation: 66,
  });
  assert.equal(report.pronunciationScore, 66);
});

test('Gemini estimates fall back to the AI tip when the sound has no Spanish tip', () => {
  const report: PronunciationReport = {
    ...SAMPLE_PRON,
    provider: 'gemini',
    approximate: true,
    words: [{ word: 'world', accuracy: 50, errorType: 'Mispronunciation', phonemes: [], tipEs: 'Junta la "r" y la "l" sin vocal entre ellas.' }],
  };
  assert.ok(pronunciationTipsEs(report, 1)[0]!.includes('Junta la "r"'));
  assert.ok(pronunciationSummaryEn(report).startsWith('Approximate AI estimate'));
});

import { effectiveWordAccuracy, mergePronunciation } from './pronunciation.js';

// Datos reales: Azure con la lectura "I tink dis weader is bery nice" contra "I think this weather is very nice".
const AZURE_REAL: PronunciationReport = {
  provider: 'azure',
  scripted: true,
  referenceText: 'I think this weather is very nice',
  recognizedText: 'I think this weather is very nice.',
  pronScore: 90,
  accuracy: 97,
  fluency: 83,
  completeness: 100,
  prosody: 89,
  words: [
    { word: 'i', accuracy: 100, errorType: 'None', phonemes: [{ phoneme: 'ay', ipa: 'aɪ', accuracy: 100 }] },
    { word: 'think', accuracy: 100, errorType: 'None', phonemes: [{ phoneme: 'th', ipa: 'θ', accuracy: 100 }, { phoneme: 'ih', ipa: 'ɪ', accuracy: 100 }] },
    { word: 'this', accuracy: 100, errorType: 'None', phonemes: [{ phoneme: 'dh', ipa: 'ð', accuracy: 100 }] },
    {
      word: 'weather',
      accuracy: 82,
      errorType: 'None',
      phonemes: [
        { phoneme: 'w', ipa: 'w', accuracy: 40 },
        { phoneme: 'eh', ipa: 'ɛ', accuracy: 19 },
        { phoneme: 'dh', ipa: 'ð', accuracy: 0 },
        { phoneme: 'ax', ipa: 'ə', accuracy: 34 },
        { phoneme: 'r', ipa: 'ɹ', accuracy: 100 },
      ],
    },
    { word: 'is', accuracy: 100, errorType: 'None', phonemes: [] },
    { word: 'very', accuracy: 100, errorType: 'None', phonemes: [{ phoneme: 'v', ipa: 'v', accuracy: 100 }] },
    { word: 'nice', accuracy: 100, errorType: 'None', phonemes: [] },
  ],
};

const GEMINI_REVIEW: PronunciationReport = {
  provider: 'gemini',
  approximate: true,
  scripted: true,
  recognizedText: 'I tink dis weeder is berry nice',
  pronScore: 64,
  accuracy: 60,
  fluency: 72,
  completeness: 100,
  prosody: 70,
  words: [
    { word: 'I', accuracy: 95, errorType: 'None', phonemes: [] },
    { word: 'think', accuracy: 62, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'θ', ipa: 'θ', accuracy: 62 }], tipEs: 'Lengua entre los dientes.' },
    { word: 'this', accuracy: 60, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'ð', ipa: 'ð', accuracy: 60 }] },
    { word: 'weather', accuracy: 55, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'ð', ipa: 'ð', accuracy: 55 }] },
    { word: 'is', accuracy: 88, errorType: 'None', phonemes: [] },
    { word: 'very', accuracy: 58, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'v', ipa: 'v', accuracy: 58 }] },
    { word: 'nice', accuracy: 92, errorType: 'None', phonemes: [] },
  ],
};

test('a word with a failed key sound is not shown as good', () => {
  assert.equal(effectiveWordAccuracy(AZURE_REAL.words[3]!), 39);
  assert.ok(weakWords(AZURE_REAL).some((w) => w.word === 'weather'));
});

test('Gemini review adds the substitutions Azure missed and keeps Azure acoustics', () => {
  const merged = mergePronunciation(AZURE_REAL, GEMINI_REVIEW);
  assert.equal(merged.reviewedBy, 'gemini');
  assert.equal(merged.fluency, 83);
  assert.equal(merged.prosody, 89);
  const byWord = Object.fromEntries(merged.words.map((w) => [w.word, w]));
  assert.equal(byWord.think!.accuracy, 62);
  assert.equal(byWord.think!.phonemes.find((p) => p.ipa === 'θ')!.accuracy, 62);
  assert.equal(byWord.think!.tipEs, 'Lengua entre los dientes.');
  assert.equal(byWord.very!.errorType, 'Mispronunciation');
  assert.equal(byWord.nice!.accuracy, 100);
  assert.ok(merged.pronScore < AZURE_REAL.pronScore);
  assert.deepEqual(
    weakWords(merged).map((w) => w.word).sort(),
    ['think', 'this', 'very', 'weather']
  );
});

test('a clean Gemini review does not lower a good Azure result', () => {
  const clean: PronunciationReport = { ...GEMINI_REVIEW, words: GEMINI_REVIEW.words.map((w) => ({ ...w, accuracy: 98, errorType: 'None', phonemes: [] })) };
  const goodAzure: PronunciationReport = { ...AZURE_REAL, pronScore: 96, accuracy: 100, words: AZURE_REAL.words.map((w) => ({ ...w, accuracy: 100, phonemes: [] })) };
  const merged = mergePronunciation(goodAzure, clean);
  assert.equal(merged.pronScore, 96);
  assert.equal(weakWords(merged).length, 0);
});

import {
  EXPERIENCE_DAILY_ITEMS,
  EXPERIENCE_ERROR_HUNT_ITEMS,
  EXPERIENCE_ISLAND_MAP,
  EXPERIENCE_LISTENING_TRACKS,
  EXPERIENCE_SPANGLISH_TRAPS,
  EXPERIENCE_SPEAKING_TOPICS,
  EXPERIENCE_WRITING_PROMPTS,
} from './experience-bank.js';
import { DAILY_ITEMS as ALL_DAILY, SPEAKING_TOPICS as ALL_SPEAKING } from './index.js';

test('experience bank: every level has speaking, listening and writing content', () => {
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
    assert.ok(EXPERIENCE_SPEAKING_TOPICS.some((t) => t.level === level), `speaking ${level}`);
    assert.ok(EXPERIENCE_LISTENING_TRACKS.some((t) => t.level === level), `listening ${level}`);
    assert.ok(EXPERIENCE_WRITING_PROMPTS.some((t) => t.level === level), `writing ${level}`);
    assert.equal(EXPERIENCE_ISLAND_MAP[level].islands.length, 15, `island map ${level}`);
  }
  assert.ok(ALL_SPEAKING.some((t) => t.id.startsWith('exp-')), 'bank merged into SPEAKING_TOPICS');
  assert.ok(ALL_DAILY.some((d) => d.id.startsWith('exp-')), 'bank merged into DAILY_ITEMS');
});

test('experience bank: answers point to real options', () => {
  for (const t of EXPERIENCE_LISTENING_TRACKS) {
    assert.ok(t.segments.length > 0, t.id);
    for (const q of t.questions) assert.ok(q.answerIndex >= 0 && q.answerIndex < q.options.length, `${t.id}: ${q.question}`);
  }
  for (const d of EXPERIENCE_DAILY_ITEMS) assert.ok(d.quiz.options.includes(d.quiz.answer), d.id);
  for (const trap of EXPERIENCE_SPANGLISH_TRAPS) {
    assert.equal(trap.options[trap.answerIndex], trap.naturalReplacement, trap.id);
    assert.notEqual(trap.trapWord, trap.naturalReplacement, trap.id);
  }
  for (const item of EXPERIENCE_ERROR_HUNT_ITEMS) assert.ok(item.wrongIndex < item.sentence.split(' ').length, item.sentence);
  for (const w of EXPERIENCE_WRITING_PROMPTS) assert.ok(w.minWords >= 15 && w.checklist.length > 0, w.id);
});

import { getDailyDrop as dropFor } from './index.js';

test('daily drop respects the learner level (no C1/C2 words for A1)', () => {
  for (const day of ['2026-10-18', '2026-10-19', '2026-10-20', '2026-11-02']) {
    const drop = dropFor(day, 'A1');
    for (const item of drop.items) assert.ok(!item.level || ['A1', 'A2'].includes(item.level), `${item.term} (${item.level})`);
  }
});
