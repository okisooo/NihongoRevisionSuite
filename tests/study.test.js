import test from "node:test";
import assert from "node:assert/strict";
import { kanjiData } from "../src/data/kanji.js";
import { meaningAnswers } from "../src/study/meanings.js";
import { contextsFor } from "../src/study/characterData.js";
import { primaryMeaning } from "../src/study/primaryMeanings.js";
import { emptyProgress, schedule, recordSessionAnswer, validateProgress } from "../src/study/progress.js";
import { cards, dueKeys, contextWords, createSession } from "../src/study/content.js";
import { meaningAnswersFor } from "../src/rush/deck.js";
import { strokeData } from "../src/data/strokes.js";

const now = 1780000000000;

test("context links require the actual character and actual target word", () => {
  for (const character of kanjiData) {
    for (const sentence of contextsFor(character))
      for (const target of sentence.targets) {
        assert(target.word.includes(character.kanji));
        assert(sentence.sentence.includes(target.word));
      }
    for (const word of contextWords(character)) assert(word.word.includes(character.kanji));
  }
});

test("placeholder meanings are repaired and core glosses are accepted", () => {
  assert(kanjiData.every((character) => character.meaning !== "Kanji"));
  assert.equal(primaryMeaning(kanjiData.find((character) => character.id === 6)), "eye");
  for (const character of kanjiData) {
    const accepted = meaningAnswersFor(character);
    for (const answer of meaningAnswers(primaryMeaning(character)))
      // Numeric glosses ("10,000") are not typed; every worded sense is.
      if (answer.length <= 28 && /[a-z]/.test(answer))
        assert(accepted.includes(answer), `${character.kanji} ${answer}`);
  }
});

test("meaning alternatives do not split parenthetical examples into false answers", () => {
  const accepted = meaningAnswers("prime minister, chancellor (Germany, Austria, etc.), premier");
  assert(accepted.includes("chancellor"));
  assert(!accepted.includes("austria"));
  assert(meaningAnswers("radical (of a character)").includes("radical"));
});

test("every curriculum kanji has bundled Japanese stroke data", () => {
  for (const character of kanjiData) {
    const data = strokeData[character.kanji];
    assert(data, character.kanji);
    assert.equal(data.strokes.length, data.medians.length, character.kanji);
  }
  // Japanese forms, not the Chinese ones (步, 每).
  assert(strokeData["歩"] && strokeData["毎"]);
});

test("same-day repetitions do not inflate strength or postpone a due date", () => {
  const first = schedule(null, true, now);
  const second = schedule(first, true, now + 5000);
  assert.equal(second.streak, 1);
  assert.equal(second.due, first.due);
  assert.equal(schedule(second, true, now + 86400000).streak, 2);
});

test("stale submissions cannot double-score and misses retry once", () => {
  const p = emptyProgress();
  p.cards["grammar:1:0"] = schedule(null, true, now - 2 * 86400000);
  p.active = createSession(p, "review", now);
  const key = p.active.queue[0];
  const failed = recordSessionAnswer(p, key, 0, false, now);
  assert.equal(failed.active.queue.length, 2);
  assert.equal(recordSessionAnswer(failed, key, 0, true, now), failed);
  const retried = recordSessionAnswer(failed, key, 1, false, now);
  assert.equal(retried.active.queue.length, 2);
  assert.equal(retried.cards[key].misses, 2);
  assert(dueKeys(retried, now + 60000).includes(key));
});

test("hints remain unearned after reload even if the answer is correct", () => {
  const p = emptyProgress();
  p.cards["sentence:4:context"] = schedule(null, false, now - 120000);
  p.active = createSession(p, "review", now);
  p.active.hints = [0];
  const restored = validateProgress(JSON.parse(JSON.stringify(p)));
  const key = restored.active.queue[0];
  const result = recordSessionAnswer(restored, key, 0, true, now);
  assert.equal(result.active.correct, 0);
  assert.equal(result.cards[key].streak, 0);
});

test("memory notes survive backup and malformed optional data is rejected", () => {
  const p = emptyProgress();
  p.notes[4] = "a personal association";
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p))), p);
  p.notes[4] = Array(2);
  assert.throws(() => validateProgress(p));
});

test("retired practice skills stay in old backups but are never due", () => {
  const p = emptyProgress();
  p.cards["drill:3:recognition"] = schedule(null, false, now - 120000);
  p.cards["drill:3:cloze"] = schedule(null, false, now - 120000);
  assert.doesNotThrow(() => validateProgress(JSON.parse(JSON.stringify(p))));
  assert.deepEqual(dueKeys(p, now), []);
  assert(cards["drill:3:writing"] && cards["drill:3:reading"] && cards["drill:3:meaning"]);
});
