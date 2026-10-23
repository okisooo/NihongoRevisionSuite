import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, validateProgress } from '../src/study/progress.js';
import { romajiFor } from '../src/rush/romaji.js';
import { rushOf } from '../src/rush/mastery.js';
import { createRound, currentPrompt, answerRound, revealRound, advanceRound, startRound, changeRound, recommendedSet, roundDeck } from '../src/play/round.js';

const now = 1792759000000;
const random = () => .42;
const answer = flow => {
  const p = currentPrompt(flow);
  return p.kind === 'meaning' ? p.answers[0] : romajiFor(p.answers[0]);
};
function finish(progress) {
  let p = progress;
  for (let i = 0; i < 100 && !p.flow.finished; i++) {
    p = changeRound(p, 'answer', answer(p.flow), now + i);
    validateProgress(JSON.parse(JSON.stringify(p)));
    p = changeRound(p, 'next', null, now + i);
  }
  assert.equal(p.flow.finished, true);
  return p;
}

test('a beginner starts with a short teach-then-recall round, without prior study', () => {
  const flow = createRound(emptyProgress(), 'kana', 'h1', now, random);
  assert.equal(flow.ids.length, 5);
  assert.equal(flow.queue.filter(q => q.guide).length, 5);
  assert.equal(flow.queue.filter(q => !q.guide).length, 10);
  assert.notEqual(flow.queue.at(-6).id, flow.queue.at(-5).id);
});

test('guided copying awards neither score nor successful recall', () => {
  const flow = createRound(emptyProgress(), 'kana', 'h1', now, random);
  const done = answerRound(flow, answer(flow));
  assert.equal(done.clean, 0);
  assert.equal(done.clears, 0);
  assert.equal(done.score, 0);
  assert.deepEqual(done.results, {});
  assert.equal(done.feedback.kind, 'learn');
});

test('wrong and partial answers cannot advance a prompt or award points', () => {
  const flow = createRound(emptyProgress(), 'kanji', '1', now, random);
  assert.equal(answerRound(flow, 'definitely incorrect'), flow);
  assert.equal(advanceRound(flow), flow);
});

test('a helped recall returns after other prompts and still requires two clean recalls', () => {
  let flow = createRound(emptyProgress(), 'kana', 'h1', now, random);
  while (flow.queue[0].guide) flow = advanceRound(answerRound(flow, answer(flow)));
  const id = flow.queue[0].id;
  flow = revealRound(flow);
  assert.equal(revealRound(flow), flow);
  flow = answerRound(flow, answer(flow));
  assert.equal(flow.score, 0);
  assert.equal(flow.results[id].hints, 1);
  flow = advanceRound(flow);
  assert.equal(flow.queue.length, 10);
  assert.notEqual(flow.queue[0].id, id);
  assert.equal(flow.clean, 0);
});

test('one round completes only after ten independent recalls and commits once', () => {
  const p = finish(startRound(emptyProgress(), 'kana', 'h1', now, random));
  assert.equal(p.flow.clean, 10);
  assert.equal(p.flow.maxCombo, 10);
  assert.ok(p.flow.score > 200);
  assert.equal(rushOf(p).runs, 1);
  assert.equal(rushOf(p).total, p.flow.score);
  assert.equal(changeRound(p, 'next', null, now), p);
  for (const entry of Object.values(rushOf(p).kana)) {
    assert.equal(entry.kana.hits, 2);
    assert.equal(entry.write, undefined);
  }
  assert.equal(recommendedSet(p, 'kana').id, 'h2');
});

test('an assisted round keeps the real failures while returning to all ten clean recalls', () => {
  let p = startRound(emptyProgress(), 'kana', 'h1', now, random);
  while (p.flow.queue[0].guide) {
    p = changeRound(p, 'answer', answer(p.flow), now);
    p = changeRound(p, 'next', null, now);
  }
  p = changeRound(p, 'reveal', null, now);
  const key = currentPrompt(p.flow).kanjiIds[0];
  p = finish(p);
  assert.equal(p.flow.clean, 10);
  assert.equal(p.flow.clears, 11);
  assert.equal(rushOf(p).kana[key].kana.hits, 2);
  assert.equal(rushOf(p).kana[key].kana.misses, 1);
});

test('saved answer feedback survives backup/reload without scoring it twice', () => {
  let p = startRound(emptyProgress(), 'kana', 'h1', now, random);
  p = changeRound(p, 'answer', answer(p.flow), now);
  const restored = validateProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(changeRound(restored, 'answer', answer(restored.flow), now), restored);
  const next = changeRound(restored, 'next', null, now);
  assert.equal(next.flow.queue.length, restored.flow.queue.length - 1);
});

test('switching sets keeps real recall from a partly finished round', () => {
  let p = startRound(emptyProgress(), 'kana', 'h1', now, random);
  while (p.flow.queue[0].guide) {
    p = changeRound(p, 'answer', answer(p.flow), now);
    p = changeRound(p, 'next', null, now);
  }
  p = changeRound(p, 'answer', answer(p.flow), now);
  const key = currentPrompt(p.flow).kanjiIds[0];
  const switched = startRound(p, 'kanji', '1', now + 1, random);
  assert.equal(rushOf(switched).kana[key].kana.hits, 1);
  assert.equal(rushOf(switched).runs, 1);
  assert.equal(switched.flow.track, 'kanji');
});

test('kanji rounds update the existing per-skill review schedule without claiming writing mastery', () => {
  const p = finish(startRound(emptyProgress(), 'kanji', '1', now, random));
  assert.ok(Object.keys(p.cards).length > 0);
  for (const key of Object.keys(p.cards)) assert.match(key, /^character:\d+:(reading|meaning)$/);
  assert.equal(Object.values(rushOf(p).kanji).some(v => v.write), false);
  validateProgress(p);
});

test('replaying a set starts with its less-practiced skills', () => {
  const first = finish(startRound(emptyProgress(), 'kanji', '1', now, random));
  const next = startRound(first, 'kanji', '1', now + 1, random);
  assert.equal(next.flow.ids.some(id => first.flow.ids.includes(id)), false);
});

test('all kana groups and kanji sets supply valid, answerable rounds', () => {
  for (const [track, sets] of [['kana', ['h1', 'h14', 'k1', 'k14']], ['kanji', ['1', '30', '60']]]) {
    for (const set of sets) {
      assert.ok(roundDeck(track, set).length >= 5);
      const p = finish(startRound(emptyProgress(), track, set, now, random));
      assert.equal(p.flow.clean, 10);
    }
  }
});

test('old backups stay valid and malformed saved rounds cannot fake completion', () => {
  validateProgress(emptyProgress());
  const p = startRound(emptyProgress(), 'kana', 'h1', now, random);
  for (const bad of [
    { ...p.flow, queue: [], finished: true },
    { ...p.flow, set: 'h99' },
    { ...p.flow, ids: ['kana:invalid'] },
    { ...p.flow, feedback: { kind: 'clean', points: -2 } },
    { ...p.flow, score: Infinity },
  ]) assert.throws(() => validateProgress({ ...p, flow: bad }), /invalid play round/);
});
