import { kanjiData } from "../data/kanji.js";
import { contextsFor, compactReadings } from "../study/characterData.js";
import { meaningAnswers } from "../study/meanings.js";
import { primaryMeaning } from "../study/primaryMeanings.js";
import { toHiragana } from "../utils/kanaConverter.js";
import { romajiOf, scriptOf, toHira, writable } from "./kana.js";

export const KINDS = [
  { id: "reading", label: "readings", short: "読" },
  { id: "meaning", label: "meanings", short: "意" },
  { id: "word", label: "words", short: "語" },
  { id: "write", label: "writing", short: "書" },
  { id: "listen", label: "listening", short: "聴" },
];
/** Kana prompts: read (type romaji), write on the pad, listen. */
export const KANA_KINDS = [
  { id: "kana", label: "reading", short: "読" },
  { id: "write", label: "writing", short: "書" },
  { id: "listen", label: "listening", short: "聴" },
];
/** Kinds answered by typing with prompts on screen (rush and timed tests). */
export const TYPED = ["reading", "meaning", "word", "kana"];

const byId = new Map(kanjiData.map((c) => [c.id, c]));
const byKanji = new Map(kanjiData.map((c) => [c.kanji, c]));
export const characterById = (id) => byId.get(id);
export const characterByKanji = (kanji) => byKanji.get(kanji);

/** Every whole reading a learner may type for the bare character. */
export function readingAnswers(character) {
  const values = [...(character.onyomi || []), ...(character.kunyomi || [])]
    // Affix-only readings (-び, もう.し-) are not answers for a bare character.
    .filter((reading) => !reading.startsWith("-") && !reading.endsWith("-"))
    .map((reading) => toHiragana(reading).replaceAll(".", ""));
  return [...new Set(values)].filter(Boolean);
}

/** Senses short enough to type under pressure. */
export function meaningAnswersFor(character) {
  const values = [
    ...meaningAnswers(primaryMeaning(character)),
    ...meaningAnswers(character.meaning),
  ].filter(
    (answer) =>
      /[a-z]/.test(answer) && !/radical|no\.\s*\d/.test(answer) && answer.length <= 28,
  );
  return [...new Set(values)];
}

const HAN = /[㐀-鿿]/g;
const exampleMeaning = new Map();
for (const character of kanjiData)
  for (const example of character.examples || [])
    if (!exampleMeaning.has(example.word) && example.meaning)
      exampleMeaning.set(example.word, example.meaning.split(/[,;]/)[0].trim());

function kanjiIdsIn(word) {
  return [...new Set(word.match(HAN) || [])].map((k) => byKanji.get(k)?.id);
}

// Dictionary examples are noisy (二八, 一々); one listed under both of its
// kanji is more likely an everyday word.
const listedBy = new Map();
for (const character of kanjiData)
  for (const example of character.examples || [])
    listedBy.set(example.word, (listedBy.get(example.word) || 0) + 1);
const UNUSUAL = /derog|\bsens\b|vulg|archaic|obsc|obs\.|abbr/i;

// Built once: every usable word with the characters it needs.
// Priority 3 = okurigana words, 2 = curriculum sentences, 1 = dictionary examples.
const wordIndex = (() => {
  const map = new Map();
  const add = (word, reading, owner, priority) => {
    if (!word || !reading || !/[\u3400-\u9fff]/.test(word)) return;
    const ids = kanjiIdsIn(word);
    if (ids.some((id) => !id)) return;
    const kana = toHiragana(reading);
    if (!/^[\u3041-\u3096\u30fc]+$/.test(kana)) return;
    const entry = map.get(word) || { word, readings: new Set(), ids, owner, priority };
    entry.readings.add(kana);
    entry.priority = Math.max(entry.priority, priority);
    map.set(word, entry);
  };
  for (const character of kanjiData) {
    // Standalone words carry okurigana (休む, 二つ): the best kun'yomi practice.
    for (const item of character.standalone || [])
      if (item.word !== character.kanji) add(item.word, item.reading, character.id, 3);
    for (const sentence of contextsFor(character))
      for (const target of sentence.targets)
        if ([...target.word].length > 1) add(target.word, target.reading, character.id, 2);
    for (const example of character.examples || [])
      if (
        [...example.word].length === 2 &&
        !example.word.includes("々") &&
        listedBy.get(example.word) > 1 &&
        !UNUSUAL.test(example.meaning || "")
      )
        add(example.word, example.reading, character.id, 1);
  }
  return [...map.values()];
})();

const meaningOf = (character) => primaryMeaning(character);

/** Everyday words for one character: curriculum kanji only, simplest first. */
export function commonWords(character, limit = 3) {
  const hardest = (entry) => Math.max(...entry.ids);
  return wordIndex
    .filter((entry) => entry.ids.includes(character.id))
    .sort((a, b) => b.priority - a.priority || hardest(a) - hardest(b) || a.word.length - b.word.length)
    .slice(0, limit)
    .map((entry) => ({
      word: entry.word,
      reading: [...entry.readings][0],
      meaning: exampleMeaning.get(entry.word) || "",
    }));
}

function readingPrompt(character) {
  const answers = readingAnswers(character);
  return {
    id: `reading:${character.id}`,
    kind: "reading",
    text: character.kanji,
    answers,
    kanjiIds: [character.id],
    characterId: character.id,
    srsKeys: [`character:${character.id}:reading`],
    reveal: { main: answers.slice(0, 5).join(" · "), sub: meaningOf(character) },
    say: answers[0],
    length: Math.min(...answers.map((a) => a.length)),
  };
}

function meaningPrompt(character) {
  const answers = meaningAnswersFor(character);
  const main = meaningOf(character);
  return {
    id: `meaning:${character.id}`,
    kind: "meaning",
    text: character.kanji,
    answers,
    kanjiIds: [character.id],
    characterId: character.id,
    // Typed meaning practice from the old drills shares this schedule.
    srsKeys: [`character:${character.id}:meaning`, `drill:${character.id}:meaning`],
    reveal: { main, sub: compactReadings(character) },
    say: readingAnswers(character)[0],
    length: Math.min(12, ...answers.map((a) => a.length)),
  };
}

function wordPrompt(entry) {
  const answers = [...entry.readings];
  return {
    id: `word:${entry.word}`,
    kind: "word",
    text: entry.word,
    answers,
    kanjiIds: entry.ids,
    characterId: entry.owner,
    srsKeys: [`drill:${entry.owner}:reading`],
    reveal: { main: answers.join(" · "), sub: exampleMeaning.get(entry.word) || "" },
    say: answers[0],
    length: Math.min(...answers.map((a) => a.length)),
    priority: entry.priority,
  };
}

function writePrompt(character) {
  const word = commonWords(character, 1)[0];
  return {
    id: `write:${character.id}`,
    kind: "write",
    text: character.kanji,
    answers: [character.kanji],
    kanjiIds: [character.id],
    characterId: character.id,
    srsKeys: [`drill:${character.id}:writing`],
    // Cue with meaning, readings, and a word with the character hidden (○む).
    cue: {
      main: meaningOf(character),
      sub: compactReadings(character),
      word:
        word && word.word !== character.kanji
          ? `${word.word.replaceAll(character.kanji, "○")} ${word.reading}`
          : "",
    },
    reveal: { main: character.kanji, sub: meaningOf(character) },
    say: readingAnswers(character)[0],
    length: 6,
  };
}

/** The best curriculum word owned by a character, for due word reviews. */
function ownedWord(id) {
  const entry = wordIndex
    .filter((item) => item.owner === id && item.priority >= 2)
    .sort((a, b) => b.priority - a.priority || a.word.length - b.word.length)[0];
  return entry ? wordPrompt(entry) : null;
}

/** Curriculum words whose every kanji is in the known set. */
export function wordsFor(ids, limit = 240) {
  const known = new Set(ids);
  return wordIndex
    .filter((entry) => entry.priority >= 2 && entry.ids.every((id) => known.has(id)))
    .sort((a, b) => b.priority - a.priority || a.word.length - b.word.length)
    .slice(0, limit)
    .map(wordPrompt);
}

/**
 * Prompts for a run. `weigh(prompt)` returns { weight, slack } from mastery.
 * `focus` ids get extra weight (the stage being tested).
 */
export function buildDeck({ ids, kinds, weigh = () => ({}), focus = [] }) {
  const characters = [...new Set(ids)].map((id) => byId.get(id)).filter(Boolean);
  const prompts = [];
  if (kinds.includes("reading"))
    prompts.push(...characters.map(readingPrompt).filter((p) => p.answers.length));
  if (kinds.includes("meaning"))
    prompts.push(...characters.map(meaningPrompt).filter((p) => p.answers.length));
  if (kinds.includes("word")) prompts.push(...wordsFor(characters.map((c) => c.id)));
  if (kinds.includes("write")) prompts.push(...characters.map(writePrompt));
  if (kinds.includes("listen"))
    prompts.push(...wordsFor(characters.map((c) => c.id)).map(listenPrompt));
  return weighAll(prompts, weigh, focus);
}

function weighAll(prompts, weigh, focus = []) {
  const focusSet = new Set(focus);
  return prompts.map((prompt) => {
    const { weight = 1, slack = 1 } = weigh(prompt);
    const focused = prompt.kanjiIds.some((id) => focusSet.has(id));
    return {
      ...prompt,
      weight: weight * (focused ? 3 : 1) * (prompt.kind === "word" ? 0.4 + 0.2 * (prompt.priority || 1) : 1),
      slack,
    };
  });
}

/** The same word, heard instead of read. */
function listenPrompt(word) {
  return {
    ...word,
    id: `listen:${word.text}`,
    kind: "listen",
    srsKeys: [],
    reveal: { main: `${word.text} · ${word.answers[0]}`, sub: word.reveal.sub },
  };
}

/** Kana prompts for the given characters (あ, きゃ, カ ...). */
export function buildKanaDeck({ kana, kinds, weigh = () => ({}), focus = [] }) {
  const prompts = [];
  const heard = new Set();
  for (const k of [...new Set(kana)]) {
    const romaji = romajiOf(k);
    const base = { kanjiIds: [k], track: "kana", srsKeys: [], say: toHira(k) };
    if (kinds.includes("kana"))
      prompts.push({
        ...base,
        id: `kana:${k}`,
        kind: "kana",
        text: k,
        answers: [toHira(k)],
        reveal: { main: romaji, sub: scriptOf(k) },
        length: romaji.length,
      });
    if (kinds.includes("write") && writable(k))
      prompts.push({
        ...base,
        id: `kwrite:${k}`,
        kind: "write",
        text: k,
        answers: [k],
        cue: { main: romaji, sub: `in ${scriptOf(k)}`, word: "" },
        reveal: { main: k, sub: romaji },
        length: 4,
      });
    // Both scripts sound the same: one listening prompt per sound.
    if (kinds.includes("listen") && !heard.has(toHira(k))) {
      heard.add(toHira(k));
      prompts.push({
        ...base,
        id: `klisten:${k}`,
        kind: "listen",
        text: k,
        answers: [toHira(k)],
        reveal: { main: `${k} · ${romaji}`, sub: scriptOf(k) },
        length: romaji.length,
      });
    }
  }
  return weighAll(prompts, weigh, focus);
}

/** One prompt per due review card: 読 意 書 for the character, 語 for its words. */
export function dueDeck(keys, weigh = () => ({})) {
  const prompts = new Map();
  for (const key of keys) {
    const [kind, idText, skill] = key.split(":");
    const character = byId.get(Number(idText));
    if (!character) continue;
    let prompt;
    if (skill === "meaning") prompt = meaningPrompt(character);
    else if (skill === "writing") prompt = writePrompt(character);
    else if (kind === "character") prompt = readingPrompt(character);
    else prompt = ownedWord(character.id) || { ...readingPrompt(character), srsKeys: [key] };
    if (prompt && !prompts.has(prompt.id)) prompts.set(prompt.id, prompt);
  }
  return weighAll([...prompts.values()], weigh);
}

/** A practice session: the most useful prompts, with a little shuffle. */
export function pickSession(deck, size = 20, random = Math.random) {
  return deck
    .map((prompt) => [prompt, (prompt.weight ?? 1) * (0.6 + 0.8 * random())])
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([prompt]) => prompt);
}
