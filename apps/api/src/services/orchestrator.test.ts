import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateInputComprehension,
  evaluateWritingSubmission,
  generateVoiceScorecard,
  processLearnerVoiceTurn,
  startVoiceArenaSession,
} from './orchestrator.js';

describe('LingoPulse Backend Session Orchestrator (Phases 2, 3, and 4)', () => {
  it('evaluates Phase 2 Input comprehension and Phase 3 Writing with dialect reformulations', () => {
    const inputCheck = evaluateInputComprehension({
      locale: 'en-GB',
      learnerAnswer:
        'Because Sam has the final sign-off on the budget and we would repeat the discussion.',
    });
    assert.equal(inputCheck.passed, true);

    const writingBadPronoun = evaluateWritingSubmission({
      locale: 'en-US',
      text: "Hey Jordan, Sam's flight is delayed so let's put off it until Friday.",
    });
    assert.equal(writingBadPronoun.targetUsed, 'incorrect_grammar');
    assert.ok(writingBadPronoun.correctedSentenceEn.includes('put it off'));
    assert.ok(writingBadPronoun.reformulations.casual.length > 10);
    assert.ok(writingBadPronoun.reformulations.professional.length > 10);
  });

  it('orchestrates a complete Voice Arena session: paraphrase -> reframe -> target use -> complication -> scorecard', () => {
    const opening = startVoiceArenaSession({ locale: 'en-GB' });
    assert.equal(opening.action, 'ask');
    assert.equal(opening.stage, 'opening');

    // Turn 1: Learner uses a valid paraphrase ("postpone") -> agent reframes without leaking "put off"
    const turn1 = processLearnerVoiceTurn({
      sessionId: opening.sessionId,
      transcript: "Let's postpone the meeting until Friday.",
      responseWindowMs: 6000,
      voicedMs: 5000,
    });
    assert.equal(turn1.action, 'ask');
    assert.equal(turn1.stage, 'contextual_followup');
    assert.equal(/put off/i.test(turn1.speak), false);

    // Turn 2: Learner retrieves "put it off" -> agent introduces complication (room booked)
    const turn2 = processLearnerVoiceTurn({
      sessionId: opening.sessionId,
      transcript:
        "Tell the team we have to put it off until Friday morning because we need Sam's decision.",
      responseWindowMs: 14000,
      voicedMs: 13000,
    });
    assert.equal(turn2.action, 'ask');
    assert.equal(turn2.stage, 'complication');
    assert.equal(/put off/i.test(turn2.speak), false);

    // Turn 3: Learner resolves complication -> agent closes session
    const turn3 = processLearnerVoiceTurn({
      sessionId: opening.sessionId,
      transcript:
        "If the room is busy on Friday, let's put the in-person session off and hold it online at 11 a.m.",
      responseWindowMs: 15000,
      voicedMs: 14000,
    });
    assert.equal(turn3.isSessionClosed, true);
    assert.equal(turn3.totalSessionVoicedMs, 32000);

    // Scorecard verification
    const scorecard = generateVoiceScorecard(opening.sessionId);
    assert.equal(scorecard.status, 'ready');
    assert.equal(scorecard.communicativeScore, 4);
    assert.ok((scorecard.targetScore ?? 0) >= 3);
    assert.equal(scorecard.grammarScore, 4);
    assert.equal(scorecard.streakQualifiedToday, true); // 32s >= 30s threshold
    assert.ok(scorecard.wpm && scorecard.wpm > 0);
    assert.equal(scorecard.fsrsNextReview.targetExpression, 'put off');
  });
});
