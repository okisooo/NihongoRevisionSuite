import test from "node:test";
import assert from "node:assert/strict";
import { emptyProgress, schedule, recordSessionAnswer, validateProgress } from "../src/study/progress.js";
import { cards, createSession, lessons } from "../src/study/content.js";
import {
  commitGrammarAttempt,
  completeLessonQuiz,
  openGrammarModel,
  sameLessonSession,
  startLessonSession,
} from "../src/study/grammarPractice.js";

const now = 1789600000000;

test("lesson revision queues only that lesson's patterns", () => {
  const progress = emptyProgress();
  progress.rush = { kanji: { 141: { learned: now } } };
  progress.cards["grammar:2:0"] = schedule(null, false, now - 120000);
  progress.cards["sentence:1:context"] = schedule(null, false, now - 70000);
  progress.lessons[1] = now;
  const today = createSession(progress, "today", now);
  const session = createSession(progress, "lesson", now, { lessonId: 4 });
  const lesson = lessons.find((item) => item.lesson === 4);
  assert.equal(session.mode, "lesson");
  assert.equal(session.lessonId, 4);
  assert.deepEqual(
    session.queue,
    lesson.patterns.map((_, index) => `grammar:4:${index}`),
  );
  assert.ok(session.queue.every((key) => cards[key].lesson.lesson === 4));
  assert.equal(session.queue.some((key) => key.startsWith("sentence:")), false);
  assert.equal(session.queue.some((key) => key.startsWith("grammar:2:")), false);
  assert.ok(today.queue.some((key) => key.startsWith("sentence:141:")));
  assert.equal(session.queue.some((key) => today.queue.includes(key) && !key.startsWith("grammar:4:")), false);
});

test("every lesson revision keeps its own pattern positions", () => {
  const progress = emptyProgress();
  assert.equal(lessons.length, 30);
  for (const lesson of lessons) {
    const session = createSession(progress, "lesson", now, { lessonId: lesson.lesson });
    assert.equal(session.queue.length, lesson.patterns.length);
    session.queue.forEach((key, index) => {
      assert.equal(key, `grammar:${lesson.lesson}:${index}`);
    });
  }
});

test("an unknown lesson adds no cards and does not open a session", () => {
  const progress = emptyProgress();
  const session = createSession(progress, "lesson", now, { lessonId: 99 });
  assert.deepEqual(session.queue, []);
  assert.equal(session.lessonId, undefined);
  assert.equal(startLessonSession(progress, 99, now), progress);
});

test("review and today sessions stay unscoped when no lesson is requested", () => {
  assert.equal(createSession(emptyProgress(), "review", now).queue.length, 0);
  const progress = emptyProgress();
  progress.cards["sentence:1:context"] = schedule(null, false, now - 70000);
  progress.cards["grammar:3:0"] = schedule(null, false, now - 60000);
  assert.deepEqual(createSession(progress, "review", now).queue, ["sentence:1:context", "grammar:3:0"]);
  const lesson = createSession(progress, "lesson", now, { lessonId: "1" });
  assert.equal(lesson.lessonId, 1);
  assert.ok(lesson.queue.every((key) => key.startsWith("grammar:1:")));
});

test("quiz completion does not grant recall and leaves unrelated cards alone", () => {
  const progress = emptyProgress();
  const prior = schedule(null, true, now - 86400000);
  const other = schedule(null, false, now - 60000);
  const sentence = schedule(null, true, now);
  progress.cards["grammar:1:0"] = prior;
  progress.cards["grammar:2:0"] = other;
  progress.cards["sentence:3:context"] = sentence;
  const next = completeLessonQuiz(progress, 1, now);
  assert.equal(next.lessons[1], now);
  assert.equal(next.cards["grammar:1:0"], prior);
  assert.equal(next.cards["grammar:2:0"], other);
  assert.equal(next.cards["sentence:3:context"], sentence);
  assert.equal(next.cards["grammar:3:0"], undefined);
  const lesson = lessons.find((item) => item.lesson === 1);
  for (let index = 1; index < lesson.patterns.length; index += 1) {
    const card = next.cards[`grammar:1:${index}`];
    assert.equal(card.streak, 0);
    assert.equal(card.attempts, 1);
    assert.equal(card.misses, 1);
    assert.equal(card.due, now + 60000);
  }
  const again = completeLessonQuiz(next, 1, now + 5);
  assert.equal(again.cards["grammar:1:0"], prior);
  assert.equal(again.cards["grammar:1:1"], next.cards["grammar:1:1"]);
  assert.equal(again.lessons[1], now + 5);
  assert.equal(completeLessonQuiz(progress, 99, now), progress);
});

test("a different lesson start does not score or borrow unrelated progress", () => {
  const progress = emptyProgress();
  progress.cards["grammar:2:0"] = schedule(null, true, now);
  progress.cards["sentence:1:context"] = schedule(null, false, now - 50000);
  progress.active = createSession(progress, "review", now);
  const next = startLessonSession(progress, 5, now);
  assert.ok(next.active.queue.every((key) => key.startsWith("grammar:5:")));
  assert.equal(next.active.queue.length, lessons.find((item) => item.lesson === 5).patterns.length);
  assert.equal(next.cards["grammar:2:0"], progress.cards["grammar:2:0"]);
  assert.equal(next.cards["sentence:1:context"], progress.cards["sentence:1:context"]);
  assert.equal(next.lessons[5], undefined);
  assert.equal(next.cards["grammar:5:0"], undefined);
  assert.equal(sameLessonSession(progress.active, 5), false);
  assert.equal(sameLessonSession(next.active, 5), true);
  assert.equal(sameLessonSession(next.active, 6), false);
});

test("production is stored before the model and is not scored until the self-check", () => {
  const progress = emptyProgress();
  progress.active = createSession(progress, "lesson", now, { lessonId: 1 });
  const key = progress.active.queue[0];
  const example = cards[key].pattern.exampleJa;
  const committed = commitGrammarAttempt(progress, key, 0, "別の文です。");
  assert.notEqual(committed.active.feedback.text, example);
  assert.equal(committed.cards[key], undefined);
  assert.equal(committed.active.index, 0);
  assert.equal(committed.active.correct, 0);
  assert.equal(committed.active.feedback.revealed, false);
  assert.equal(committed.active.feedback.correct, null);
  assert.equal(commitGrammarAttempt(committed, key, 0, "changed"), committed);
  const restored = validateProgress(JSON.parse(JSON.stringify(committed)));
  const revealed = openGrammarModel(restored, key, 0, "ignored");
  assert.equal(revealed.active.hints, undefined);
  assert.equal(revealed.active.feedback.revealed, true);
  assert.equal(revealed.active.feedback.text, "別の文です。");
  assert.equal(revealed.cards[key], undefined);
  assert.equal(openGrammarModel(revealed, key, 0, "ignored"), revealed);
  const rated = recordSessionAnswer(revealed, key, 0, true, now);
  assert.equal(rated.active.feedback, null);
  assert.equal(rated.active.correct, 1);
  assert.ok(rated.cards[key].streak > 0);
  assert.equal(recordSessionAnswer(rated, key, 0, true, now), rated);
});

test("opening the model before an attempt is help and blocks recall credit", () => {
  const progress = emptyProgress();
  progress.active = createSession(progress, "lesson", now, { lessonId: 2 });
  const key = progress.active.queue[0];
  const helped = openGrammarModel(progress, key, 0, "");
  assert.deepEqual(helped.active.hints, [0]);
  assert.equal(helped.active.feedback.revealed, true);
  assert.equal(helped.active.feedback.text, "");
  assert.equal(commitGrammarAttempt(helped, key, 0, "late answer"), helped);
  const restored = validateProgress(JSON.parse(JSON.stringify(helped)));
  const rated = recordSessionAnswer(restored, key, 0, true, now);
  assert.equal(rated.active.correct, 0);
  assert.equal(rated.cards[key].streak, 0);
  assert.equal(rated.cards[key].misses, 1);
});

test("a late grammar action cannot attach to the next card", () => {
  const progress = emptyProgress();
  progress.active = createSession(progress, "lesson", now, { lessonId: 1 });
  const key = progress.active.queue[0];
  const committed = commitGrammarAttempt(progress, key, 0, "わたしは学生です。");
  const moved = recordSessionAnswer(openGrammarModel(committed, key, 0, ""), key, 0, false, now);
  assert.equal(commitGrammarAttempt(moved, key, 0, "too late"), moved);
  assert.equal(openGrammarModel(moved, key, 0, "too late"), moved);
  assert.equal(moved.active.feedback, null);
});
