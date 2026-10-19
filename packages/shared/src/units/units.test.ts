import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_UNITS,
  blankTerm,
  buildUnitQuiz,
  isStepUnlocked,
  isUnitUnlocked,
  LISTENING_PROFILES,
  unitQuestionBank,
  unitStars,
  unitLockState,
  unitsForLevel,
} from './index.js';
import { CEFR_LEVELS } from '../practice/placement-test.js';

describe('Islas por tema: contenido', () => {
  it('cada nivel tiene islas numeradas sin huecos y con ids únicos', () => {
    const ids = new Set<string>();
    for (const level of CEFR_LEVELS) {
      const units = unitsForLevel(level);
      units.forEach((u, i) => {
        assert.equal(u.n, i + 1, `${u.id}: número ${u.n}, esperaba ${i + 1}`);
        assert.ok(u.id.startsWith(level.toLowerCase()), `${u.id} no corresponde a ${level}`);
        assert.ok(!ids.has(u.id), `id repetido ${u.id}`);
        ids.add(u.id);
      });
    }
  });

  for (const u of ALL_UNITS) {
    it(`${u.id} · ${u.title}: preguntas bien formadas`, () => {
      assert.ok(u.vocab.length >= 8, 'mínimo 8 palabras de vocabulario');
      const terms = new Set(u.vocab.map((v) => v.term.toLowerCase()));
      assert.equal(terms.size, u.vocab.length, 'vocabulario repetido');
      for (const v of u.vocab) {
        assert.ok(v.es && v.def && v.ex, `${v.term}: falta traducción, definición o ejemplo`);
        assert.ok(blankTerm(v.ex, v.term), `${v.term}: el ejemplo "${v.ex}" no contiene el término`);
      }
      assert.ok(u.grammar.practice.length >= 8, 'mínimo 8 ejercicios de gramática');
      for (const g of u.grammar.practice) {
        assert.ok(g.q.includes('___') || /[?:]\s*$/.test(g.q), `gramática sin hueco ni pregunta: ${g.q}`);
        assert.ok(g.opts.includes(g.a), `la respuesta "${g.a}" no está en las opciones de "${g.q}"`);
        assert.equal(new Set(g.opts).size, g.opts.length, `opciones repetidas en "${g.q}"`);
      }
      const questions = [...u.reading.questions, ...u.listening.questions, ...(u.extraQuiz ?? [])];
      for (const q of questions) {
        assert.ok(q.a >= 0 && q.a < q.opts.length, `índice fuera de rango en "${q.q}"`);
        assert.equal(new Set(q.opts).size, q.opts.length, `opciones repetidas en "${q.q}"`);
      }
      assert.ok(u.reading.questions.length >= 4, 'reading con al menos 4 preguntas');
      assert.ok(u.listening.questions.length >= 4, 'listening con al menos 4 preguntas');
      assert.ok(u.listening.lines.length >= 5, 'listening con al menos 5 intervenciones');
      assert.ok(u.listening.dictation.length >= 2, 'al menos 2 dictados');
      assert.ok((u.lessons?.length ?? 0) >= 3, `${u.id}: necesita al menos 3 funciones comunicativas`);
      for (const l of u.lessons ?? []) {
        assert.ok(l.phrases.length >= 3 && l.dialogue.length >= 3 && l.practice.length >= 2, `${u.id} · ${l.title}: función incompleta`);
        for (const q of l.practice) {
          assert.ok(q.a >= 0 && q.a < q.opts.length, `${u.id} · ${l.title}: índice fuera de rango en "${q.q}"`);
          assert.equal(new Set(q.opts).size, q.opts.length, `${u.id} · ${l.title}: opciones repetidas en "${q.q}"`);
        }
      }
      assert.ok(u.writing.minWords > 0 && u.writing.model.split(/\s+/).length >= u.writing.minWords * 0.8, 'el modelo de writing es muy corto');
    });
  }

  it('el quiz final tiene 10 preguntas válidas y cambia entre intentos', () => {
    for (const u of ALL_UNITS) {
      const bank = unitQuestionBank(u);
      assert.ok(bank.length >= 20, `${u.id}: banco de quiz con solo ${bank.length} preguntas`);
      const quiz = buildUnitQuiz(u, 0);
      assert.equal(quiz.length, 10);
      for (const q of quiz) {
        assert.ok(q.a >= 0 && q.a < q.opts.length && q.opts.length >= 2, `${u.id}: pregunta inválida "${q.q}"`);
        assert.equal(new Set(q.opts).size, q.opts.length, `${u.id}: opciones repetidas en "${q.q}"`);
      }
      assert.notDeepEqual(
        buildUnitQuiz(u, 0).map((q) => q.q),
        buildUnitQuiz(u, 1).map((q) => q.q),
        `${u.id}: el quiz no cambia entre intentos`
      );
    }
  });
});

describe('Islas por tema: progreso', () => {
  it('los pasos se abren en orden y el quiz exige la parte obligatoria', () => {
    assert.equal(isStepUnlocked('vocab', undefined), true);
    assert.equal(isStepUnlocked('grammar', undefined), false);
    assert.equal(isStepUnlocked('grammar', { done: ['vocab'] }), true);
    assert.equal(isStepUnlocked('quiz', { done: ['vocab', 'grammar', 'reading'] }), false);
    assert.equal(isStepUnlocked('reading', { done: ['vocab', 'grammar'] }), false);
    assert.equal(isStepUnlocked('quiz', { done: ['vocab', 'grammar', 'functions', 'reading', 'listening'] }), true);
    assert.equal(isStepUnlocked('writing', { done: ['vocab', 'grammar', 'functions', 'reading', 'listening'] }), true);
  });

  it('estrellas: aprobar, sacar 90+ y hacer speaking + writing', () => {
    assert.equal(unitStars({ done: [], bestQuiz: 60 }), 0);
    assert.equal(unitStars({ done: [], bestQuiz: 70 }), 1);
    assert.equal(unitStars({ done: [], bestQuiz: 95 }), 2);
    assert.equal(unitStars({ done: ['speaking', 'writing'], bestQuiz: 95 }), 3);
  });

  it('una isla por día: la siguiente se abre al día siguiente de conquistar la anterior', () => {
    const units = unitsForLevel('A1');
    const first = units[0]!.id;
    const second = units[1]!.id;
    const today = new Date(2026, 9, 20, 15, 0).getTime();
    const yesterday = new Date(2026, 9, 19, 22, 0).getTime();
    assert.equal(unitLockState(units, first, {}, '2026-10-20'), 'open');
    assert.equal(unitLockState(units, second, {}, '2026-10-20'), 'previous_not_done');
    assert.equal(unitLockState(units, second, { [first]: { done: [], bestQuiz: 80, completedAt: today } }, '2026-10-20'), 'tomorrow');
    assert.equal(unitLockState(units, second, { [first]: { done: [], bestQuiz: 80, completedAt: yesterday } }, '2026-10-20'), 'open');
    assert.equal(isUnitUnlocked(units, second, { [first]: { done: [], bestQuiz: 80, completedAt: yesterday } }, '2026-10-20'), true);
    // Una isla ya empezada no se vuelve a bloquear.
    assert.equal(unitLockState(units, second, { [second]: { done: ['vocab'] } }, '2026-10-20'), 'open');
  });

  it('el listening se vuelve más difícil con el nivel', () => {
    const rates = CEFR_LEVELS.map((l) => LISTENING_PROFILES[l].rate);
    assert.deepEqual([...rates].sort((a, b) => a - b), rates);
    assert.equal(LISTENING_PROFILES.A1.maxPlays, null);
    assert.equal(LISTENING_PROFILES.C2.maxPlays, 1);
  });
});
