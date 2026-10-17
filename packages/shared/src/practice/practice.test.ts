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
