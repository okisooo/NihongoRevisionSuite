import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kanjiData } from "../src/data/kanji.js";
import { textbookSets } from "../src/data/textbookSets.js";
import { toHiragana } from "../src/utils/kanaConverter.js";
import { characterLesson } from "../src/study/characterLesson.js";

const HIRAGANA = /^[ぁ-ゖー]+$/;
const byId = new Map(kanjiData.map((character) => [character.id, character]));

// Every gloss a lesson may show must already exist in the bundle.
const bundled = new Set();
for (const set of textbookSets)
  for (const word of set.words) bundled.add(`${word.word}|${toHiragana(word.reading)}|${word.meaning.trim()}`);
for (const character of kanjiData)
  for (const word of [...(character.standalone || []), ...(character.examples || [])])
    if (word.meaning) bundled.add(`${word.word}|${toHiragana(word.reading)}|${word.meaning.trim()}`);

// Explicit corrections for mistranslated imported glosses (JMdict-backed lookup).
const corrected = new Map([
  ["分かる|わかる", "to understand, to be clear"],
  ["働き|はたらき", "work, activity, function"],
  ["正す|ただす", "to correct, to put right, to straighten"],
  ["十代|じゅうだい", "teens, teenage years, tenth generation"],
  ["人口|じんこう", "population"],
  ["会社|かいしゃ", "company, corporation"],
  ["南北|なんぼく", "north and south"],
]);

test("all 300 characters have a lesson with meanings and 2-3 main words", () => {
  assert.equal(kanjiData.length, 300);
  for (const character of kanjiData) {
    const lesson = characterLesson(character.id);
    assert.ok(lesson, `lesson for ${character.id}`);
    assert.ok(lesson.meanings.length >= 1, `meanings for ${character.kanji}`);
    assert.ok(lesson.words.length >= 2 && lesson.words.length <= 3, `${character.kanji}: ${lesson.words.length} words`);
  }
});

test("lookup accepts a character object, numeric id, string id or glyph", () => {
  const character = byId.get(194);
  const expected = characterLesson(194);
  assert.deepEqual(characterLesson(character), expected);
  assert.deepEqual(characterLesson("194"), expected);
  assert.deepEqual(characterLesson("洋"), expected);
  assert.equal(characterLesson(999), null);
  assert.equal(characterLesson(null), null);
});

test("every selected and extra word is valid, bundled and contains its glyph", () => {
  for (const character of kanjiData) {
    const { words, extraWords } = characterLesson(character.id);
    for (const word of [...words, ...extraWords]) {
      const label = `${character.kanji}: ${word.word}`;
      assert.ok(word.word.includes(character.kanji), `${label} contains glyph`);
      assert.notEqual(word.word, character.kanji, `${label} is a combination, not the bare glyph`);
      assert.match(word.reading, HIRAGANA, `${label} reading ${word.reading}`);
      assert.ok(word.meaning && word.meaning.trim(), `${label} has a meaning`);
      assert.ok(corrected.get(`${word.word}|${word.reading}`) === word.meaning || bundled.has(`${word.word}|${word.reading}|${word.meaning}`), `${label} gloss comes from bundled data`);
    }
  }
});

test("191-200 main words are the practical, hand-picked choices", () => {
  const expected = {
    191: ["牛肉", "肉屋", "筋肉"],
    192: ["小鳥", "野鳥", "渡り鳥"],
    193: ["飼い犬", "野良犬", "番犬"],
    194: ["洋服", "西洋", "海洋"],
    195: ["平和", "和食", "和室"],
    196: ["洋服", "制服", "和服"],
    197: ["正式", "形式", "方程式"],
    198: ["試験", "試す", "入試"],
    199: ["経験", "試験", "実験"],
    200: ["近い", "近所", "付近"],
  };
  for (const [id, words] of Object.entries(expected))
    assert.deepEqual(characterLesson(Number(id)).words.map((word) => word.word), words, `character ${id}`);

  // Rare first-listed "common" examples stay out of the main list.
  const main = (id) => characterLesson(id).words.map((word) => word.word);
  for (const [id, rare] of [[191, "肉牛"], [192, "冬鳥"], [192, "鳥人"], [197, "古式"], [200, "近東"]])
    assert.ok(!main(id).includes(rare), `${rare} is not a main word for ${id}`);
  // Mis-sliced glosses are hidden rather than shown wrong.
  for (const [id, word] of [[194, "東洋"], [192, "焼き鳥"], [200, "最近"]]) {
    const lesson = characterLesson(id);
    assert.ok(![...lesson.words, ...lesson.extraWords].some((item) => item.word === word), `${word} hidden`);
  }
  // Standalone okurigana gloss wins over a secondary example sense.
  assert.equal(characterLesson(200).words[0].meaning, "near, close, short (distance)");
  assert.equal(characterLesson(198).words.find((word) => word.word === "試す").reading, "ためす");
});

test("main meanings keep curated and full senses, without radical labels", () => {
  const meanings = (id) => characterLesson(id).meanings;
  assert.deepEqual(meanings(194), ["ocean", "Western style", "foreign", "sea"]);
  assert.deepEqual(meanings(195), ["harmony", "Japan", "Japanese style", "peace", "soften"]);
  assert.deepEqual(meanings(196), ["clothing", "admit", "discharge", "obey"]);
  assert.deepEqual(meanings(197), ["ceremony", "expression", "form", "function", "method", "rite", "style", "system"]);
  assert.deepEqual(meanings(198), ["attempt", "experiment", "ordeal", "test", "try"]);
  assert.deepEqual(meanings(200), ["near", "akin", "early", "tantamount"]);
  // Parenthesised senses stay whole; literal case is preserved.
  assert.ok(meanings(181).includes("spring (season)"));
  assert.ok(meanings(154).includes("(North) Korea"));
  for (const character of kanjiData)
    for (const sense of meanings(character.id)) {
      assert.doesNotMatch(sense, /radical|\bno\.\s*\d|^\(kokuji\)$/i, `${character.kanji}: ${sense}`);
      assert.equal((sense.match(/\(/g) || []).length, (sense.match(/\)/g) || []).length, `${character.kanji}: balanced ${sense}`);
    }
  assert.deepEqual(meanings(1), ["one"]);
  assert.deepEqual(meanings(53), ["craft", "construction"]);
});

test("extras are deduped and never repeat a main word", () => {
  for (const character of kanjiData) {
    const { meanings, words, extraWords } = characterLesson(character.id);
    assert.equal(new Set(meanings.map((sense) => sense.toLowerCase())).size, meanings.length, `${character.kanji} meanings`);
    const main = new Set(words.map((word) => word.word));
    assert.equal(main.size, words.length, `${character.kanji} main words`);
    const extras = extraWords.map((word) => word.word);
    assert.equal(new Set(extras).size, extras.length, `${character.kanji} extras deduped`);
    assert.ok(extras.every((word) => !main.has(word)), `${character.kanji} extras exclude main words`);
  }
  assert.ok(characterLesson(191).extraWords.length > 5);
});

test("returned lessons are copies, so callers cannot corrupt the cache", () => {
  const first = characterLesson(191);
  first.words.pop();
  first.meanings.push("x");
  first.extraWords[0].meaning = "changed";
  const again = characterLesson(191);
  assert.equal(again.words.length, 3);
  assert.ok(!again.meanings.includes("x"));
  assert.notEqual(again.extraWords[0].meaning, "changed");
});

test("helper does not import round state or validation (no cycles)", () => {
  const source = readFileSync(new URL("../src/study/characterLesson.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /studyRound|studyValidation|progress/);
  const validator = readFileSync(new URL("../src/study/studyValidation.js", import.meta.url), "utf8");
  assert.doesNotMatch(validator, /characterLesson/);
});
