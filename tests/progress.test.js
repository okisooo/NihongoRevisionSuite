import test from "node:test";
import assert from "node:assert/strict";
import { romajiToHiragana, checkMatch } from '../src/utils/romajiConverter.js';

test('reading input distinguishes contracted vowel sounds and accepts prefixes', () => {
  assert.equal(romajiToHiragana('ryu'), '\u308a\u3085');
  assert.equal(romajiToHiragana('ryo'), '\u308a\u3087');
  assert.equal(checkMatch('\u308a\u3085', 'ry').isError, false);
  assert.equal(checkMatch('\u308a\u3085', 'ryu').isComplete, true);
});
import {
  emptyProgress,
  schedule,
  validateProgress,
} from "../src/study/progress.js";
import {
  cards,
  createSession,
  dueKeys,
  kanjiDueKeys,
  characters,
  contextWords,
} from "../src/study/content.js";
import { emptyRush } from "../src/rush/validate.js";

const now = 1000000000;
test("successful recall grows intervals and caps at sixty days", () => {
  let card;
  let reviewedAt = now;
  for (const days of [1, 3, 7, 14, 30, 60, 60]) {
    card = schedule(card, true, reviewedAt);
    assert.equal(card.due, reviewedAt + days * 86400000);
    reviewedAt = card.due;
  }
  assert.equal(card.attempts, 7);
});
test("a miss resets the streak and becomes due in one minute", () => {
  const card = schedule({ attempts: 9, misses: 2, streak: 5 }, false, now);
  assert.equal(card.due, now + 60000);
  assert.equal(card.streak, 0);
  assert.equal(card.misses, 3);
  assert.equal(schedule(card, true, now).due, now + 86400000);
});
test("card sessions hold due grammar and sentences, oldest first; kanji go to rush", () => {
  const p = emptyProgress();
  p.cards["grammar:2:0"] = schedule(null, false, now - 60001);
  p.cards["sentence:1:context"] = schedule(null, false, now - 70000);
  p.cards["grammar:3:0"] = schedule(null, true, now);
  p.cards["character:1:reading"] = schedule(null, false, now - 80000);
  assert.deepEqual(dueKeys(p, now), ["character:1:reading", "sentence:1:context", "grammar:2:0"]);
  assert.deepEqual(kanjiDueKeys(p, now), ["character:1:reading"]);
  assert.deepEqual(createSession(p, "review", now).queue, ["sentence:1:context", "grammar:2:0"]);
});
test("empty review does not introduce new material", () => {
  assert.equal(createSession(emptyProgress(), "review", now).queue.length, 0);
});
test("daily sessions add context sentences only for kanji already met", () => {
  const p = emptyProgress();
  assert(!createSession(p, "today", now).queue.some((key) => key.startsWith("sentence:")));
  p.rush = { ...emptyRush(), kanji: { 141: { learned: now } } };
  const queue = createSession(p, "today", now).queue;
  assert(queue.includes("sentence:141:context"));
  assert(!queue.some((key) => key.startsWith("character:") || key.startsWith("drill:")));
  assert.equal(new Set(queue).size, queue.length);
  assert(queue.every((key) => cards[key]));
});
test("grammar advances through patterns and does not repeat future reviews", () => {
  const p = emptyProgress();
  p.cards["grammar:1:0"] = schedule(null, true, now);
  assert(createSession(p, "today", now).queue.includes("grammar:1:1"));
  p.cards["grammar:1:1"] = schedule(null, true, now);
  assert(
    !createSession(p, "today", now).queue.some((key) =>
      key.startsWith("grammar:"),
    ),
  );
});
test("backup round trip keeps an active session and per-skill progress", () => {
  const p = emptyProgress();
  p.active = createSession(p, "today", now);
  p.cards["character:1:meaning"] = schedule(null, true, now);
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p))), p);
});
test("malformed backups reject invalid settings and review records", () => {
  assert.throws(() => validateProgress({}));
  const p = emptyProgress();
  p.settings.from = 301;
  assert.throws(() => validateProgress(p));
  const q = emptyProgress();
  q.cards["character:1:meaning"] = { due: "tomorrow" };
  assert.throws(() => validateProgress(q));
});
test("every character has usable context words and review answers", () => {
  for (const character of characters) {
    assert(cards[`character:${character.id}:meaning`].answer);
    assert(cards[`character:${character.id}:reading`].answer);
    assert(
      contextWords(character).every(
        (word) => word.word && word.reading && word.meaning,
      ),
    );
  }
});
test("backup validation rejects arrays in place of objects and impossible counts", () => {
  const p = emptyProgress();
  p.cards = [];
  assert.throws(() => validateProgress(p));
  const q = emptyProgress();
  q.active = { ...createSession(q, "today", now), correct: -1 };
  assert.throws(() => validateProgress(q));
  const r = emptyProgress();
  r.sessions = [{ finished: now, total: 2, correct: 5 }];
  assert.throws(() => validateProgress(r));
});
