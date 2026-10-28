import test from "node:test";
import assert from "node:assert/strict";
import { textbookSetById } from "../src/data/textbookSets.js";
import { kanjiData } from "../src/data/kanji.js";
import { emptyProgress, validateProgress } from "../src/study/progress.js";
import { createProgressStore } from "../src/study/progressStore.js";
import { createTextbookPractice, getTextbookPractice, changeTextbookPractice } from "../src/study/textbookPractice.js";
import { startStudyRound, getStudyTask } from "../src/study/studyRound.js";

const set = textbookSetById("180-190");
const change = (p, action) => changeTextbookPractice(p, { setId: set.id, wordIndex: getTextbookPractice(p, set.id).queue[0], action });

test("the photo set covers the printed 11 IDs and all 39 words in page order", () => {
  assert.equal(kanjiData.filter(c => c.id >= set.from && c.id <= set.to).map(c => c.kanji).join(""), "住春夏秋冬寒暑晴終紙低");
  assert.equal(set.glyphs, "住春夏秋冬寒暑晴終紙低");
  assert.equal(set.words.map(w => w.word).join(" "), "住む お住まい 住所 住民 住宅 春 春分の日 夏 夏休み 春夏秋冬 秋 秋分の日 冬 冬休み 冬服 冬眠する 寒い 寒さ 寒波 暑い 暑さ 残暑 晴れ 晴れる 晴天 終わる 飲み終わる 終わり 終える 終点 終電 紙 手紙 用紙 表紙 低い 低温 最低気温 低下する");
  for (const word of set.words) {
    const character = kanjiData.find(c => c.id === word.characterId);
    assert.ok(word.word.includes(character.kanji));
    assert.match(word.reading, /^[ぁ-ゖー]+$/);
    assert.ok(word.meaning);
  }
  for (let id = set.from; id <= set.to; id++) {
    const task = getStudyTask(startStudyRound(emptyProgress(), { from: id, to: id }).study.active);
    const anchor = set.words.find(w => w.characterId === id);
    assert.equal(task.word.word, anchor.word);
    assert.equal(task.word.reading, anchor.reading);
  }
});

test("word self-checks save and resume without replacing a study round or awarding recall", () => {
  const initial = startStudyRound(emptyProgress(), { from: 10, to: 11 }, 1700000000000);
  let p = change(initial, "reveal");
  assert.equal(getTextbookPractice(p, set.id).revealed, true);
  p = change(p, "known");
  assert.deepEqual(getTextbookPractice(p, set.id).known, [0]);
  assert.deepEqual(p.study.active, initial.study.active);
  assert.deepEqual(p.cards, initial.cards);
  assert.equal(p.study.evidence, initial.study.evidence);
  const restored = validateProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(getTextbookPractice(restored, set.id).queue[0], 1);
  assert.equal(getTextbookPractice(restored, set.id).revealed, false);
});

test("missed words return and every word must be revealed before a self-check", () => {
  const p = emptyProgress();
  assert.equal(change(p, "known"), p);
  const again = change(change(p, "reveal"), "again");
  assert.deepEqual(getTextbookPractice(again, set.id).known, []);
  assert.equal(getTextbookPractice(again, set.id).queue.at(-1), 0);
  assert.equal(getTextbookPractice(again, set.id).queue[0], 1);
  assert.equal(changeTextbookPractice(again, { setId: set.id, wordIndex: 0, action: "known" }), again);
  validateProgress(again);
});

test("all 39 words complete once and malformed or duplicated backup queues are rejected", () => {
  let p = emptyProgress();
  for (let i = 0; i < 39; i++) p = change(change(p, "reveal"), "known");
  assert.equal(getTextbookPractice(p, set.id).queue.length, 0);
  assert.equal(getTextbookPractice(p, set.id).known.length, 39);
  validateProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(change(p, "known"), p);
  assert.deepEqual(getTextbookPractice(change(p, "restart"), set.id), createTextbookPractice(set.id));
  for (const bad of [
    { ...createTextbookPractice(set.id), queue: Array(39).fill(0) },
    { ...createTextbookPractice(set.id), known: [0] },
    { ...createTextbookPractice(set.id), queue: [...Array(38).keys(), 39] },
    { setId: "missing", queue: [], known: [], revealed: false },
    { ...getTextbookPractice(p, set.id), revealed: true },
  ]) assert.throws(() => validateProgress({ ...p, study: { ...p.study, textbookPractice: bad } }), /textbook word practice/);
});

test("a failed device write does not advance the word, and a retry saves it", async () => {
  let fail = true;
  const initial = change(emptyProgress(), "reveal");
  const store = createProgressStore({ read: async () => JSON.stringify(initial), write: async () => { if (fail) throw new Error("storage full"); } });
  await store.initialize();
  await assert.rejects(store.update(p => change(p, "known")));
  assert.deepEqual(store.getSnapshot(), initial);
  fail = false;
  await store.update(p => change(p, "known"));
  assert.equal(getTextbookPractice(store.getSnapshot(), set.id).queue[0], 1);
});
