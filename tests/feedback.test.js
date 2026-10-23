import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, schedule, recordSessionAnswer, validateProgress } from '../src/study/progress.js';
import { createSession } from '../src/study/content.js';

// Sessions saved by the september 17 build may carry checked-answer feedback.
const now = 1789600000000;
function fixture() {
  const p = emptyProgress();
  p.cards['grammar:1:0'] = schedule(null, true, now - 2 * 86400000);
  p.active = createSession(p, 'review', now);
  return p;
}
const withFeedback = (p) => ({
  ...p,
  active: {
    ...p.active,
    feedback: { text: 'wrong answer', selected: [], correct: false, revealed: false, key: p.active.queue[0], index: 0 },
  },
});

test('saved feedback from older backups validates; malformed feedback is rejected', () => {
  const p = fixture();
  assert.equal(validateProgress(p), p);
  const saved = withFeedback(p);
  assert.doesNotThrow(() => validateProgress(JSON.parse(JSON.stringify(saved))));
  for (const patch of [{ key: 'drill:1:meaning' }, { index: 1 }, { correct: 'yes' },
    { revealed: 1 }, { text: 'a'.repeat(5001) }, { selected: [-1] }]) {
    assert.throws(() => validateProgress({ ...saved, active: { ...saved.active,
      feedback: { ...saved.active.feedback, ...patch } } }));
  }
});
test('advancing a resumed session clears its saved feedback', () => {
  const saved = withFeedback(fixture());
  const next = recordSessionAnswer(saved, saved.active.queue[0], 0, true, now);
  assert.equal(next.active.feedback, null);
  assert.doesNotThrow(() => validateProgress(JSON.parse(JSON.stringify(next))));
});
test('first introduction survives repeats, misses and old-record migration', () => {
  const initial = schedule(null, false, now);
  assert.equal(initial.introduced, now);
  assert.equal(schedule(initial, true, now + 100000).introduced, now);
  const { introduced: ignored, ...old } = initial;
  assert.equal(ignored, now);
  assert.equal(schedule(old, true, now + 100000).introduced, now);
});
test('a device clock correction does not make saved progress unreadable', () => {
  const p = fixture();
  p.cards['drill:4:meaning'] = schedule(schedule(null, true, now), false, now - 60000);
  assert.doesNotThrow(() => validateProgress(JSON.parse(JSON.stringify(p))));
});
