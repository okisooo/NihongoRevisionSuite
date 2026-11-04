import { kanjiData } from "../data/kanji.js";
import { textbookSets } from "../data/textbookSets.js";
import { commonWords } from "../rush/deck.js";
import { toHiragana } from "../utils/kanaConverter.js";
import { exampleWordsFor } from "./characterData.js";
import { meaningSenses, normalizeMeaning } from "./meanings.js";
import { primaryMeaning } from "./primaryMeanings.js";

// Teaching content for one character: every useful sense, a short list of
// practical words to show first, and the remaining valid examples to collapse.
// Every word comes from bundled data (textbook sets, standalone words or
// dictionary examples), with explicit corrections for known imported gloss errors.

const byId = new Map(kanjiData.map((character) => [character.id, character]));
const byGlyph = new Map(kanjiData.map((character) => [character.kanji, character]));
const curriculumGlyphs = new Set(kanjiData.map((character) => character.kanji));
const MAIN_LIMIT = 3;
// Lesson gloss corrections: the imported data sometimes kept a secondary sense.
// JMdict-backed dictionary lookup: https://takoboto.jp/?q=<word>
const GLOSS_CORRECTIONS = new Map([
  ["分かる:わかる", "to understand, to be clear"],
  ["働き:はたらき", "work, activity, function"],
  ["正す:ただす", "to correct, to put right, to straighten"],
  ["十代:じゅうだい", "teens, teenage years, tenth generation"],
  ["人口:じんこう", "population"],
  ["会社:かいしゃ", "company, corporation"],
  ["南北:なんぼく", "north and south"],
]);

// Hand-picked everyday/school words for 191-200. The dictionary "common" flag
// is broad, so the first examples are often rare (肉牛, 冬鳥, 古式). Each pair
// must resolve to an existing bundled entry; tests enforce that.
const CURATED = {
  191: [["牛肉", "ぎゅうにく"], ["肉屋", "にくや"], ["筋肉", "きんにく"]],
  192: [["小鳥", "ことり"], ["野鳥", "やちょう"], ["渡り鳥", "わたりどり"]],
  193: [["飼い犬", "かいいぬ"], ["野良犬", "のらいぬ"], ["番犬", "ばんけん"]],
  194: [["洋服", "ようふく"], ["西洋", "せいよう"], ["海洋", "かいよう"]],
  195: [["平和", "へいわ"], ["和食", "わしょく"], ["和室", "わしつ"]],
  196: [["洋服", "ようふく"], ["制服", "せいふく"], ["和服", "わふく"]],
  197: [["正式", "せいしき"], ["形式", "けいしき"], ["方程式", "ほうていしき"]],
  198: [["試験", "しけん"], ["試す", "ためす"], ["入試", "にゅうし"]],
  199: [["経験", "けいけん"], ["試験", "しけん"], ["実験", "じっけん"]],
  200: [["近い", "ちかい"], ["近所", "きんじょ"], ["付近", "ふきん"]],
};

// Bundled glosses that start on a secondary or mis-sliced sense and would
// mislead a learner (e.g. 東洋 glossed only as "Japan"). Hidden, not rewritten.
const MISLEADING = new Set([
  "東洋:とうよう",
  "焼き鳥:やきとり",
  "最近:さいきん",
  "皮肉:ひにく",
  "負け犬:まけいぬ",
  "接近:せっきん",
]);

const UNUSUAL = /derog|\bsens\b|vulg|archaic|obsc|obs\.|abbr/i;
// Proper nouns, eras, taxonomy and species names are poor teaching words.
// Case-sensitive on purpose: "(Fagus japonica)", not "(something ends)".
const BINOMIAL = /\([A-Z][a-z]+ [a-z]+\)/;
const SPECIALIST =
  /\b(?:era|city|prefecture|region|dynasty|ethnic group|species|genus|family containing|class of vertebrates)\b/i;
const HIRAGANA = /^[ぁ-ゖー]+$/;
const KATAKANA = /[ァ-ヺ]/;
const SENSE_NOISE = /radical|\brad\.|\bno\.\s*\d|^\(kokuji\)$/i;

const keyOf = (word, reading) => `${word}:${reading}`;

// Best bundled gloss for each word: textbook (curated for learners), then
// standalone words, then dictionary examples. First non-empty source wins.
const glosses = new Map();
const textbookByCharacter = new Map();
{
  const remember = (word, reading, meaning) => {
    if (!word || !reading || !meaning?.trim()) return;
    const key = keyOf(word, toHiragana(reading));
    if (!glosses.has(key)) glosses.set(key, meaning.trim());
  };
  for (const set of textbookSets)
    for (const word of set.words) {
      remember(word.word, word.reading, word.meaning);
      if (!textbookByCharacter.has(word.characterId)) textbookByCharacter.set(word.characterId, []);
      textbookByCharacter.get(word.characterId).push(word);
    }
  for (const character of kanjiData)
    for (const word of character.standalone || []) remember(word.word, word.reading, word.meaning);
  for (const character of kanjiData)
    for (const word of character.examples || []) remember(word.word, word.reading, word.meaning);
}

const commonFlag = new Map();
for (const character of kanjiData)
  for (const word of [...(character.standalone || []), ...(character.examples || [])])
    if (word.word && word.reading && word.common) commonFlag.set(keyOf(word.word, toHiragana(word.reading)), true);

function resolveCharacter(characterOrId) {
  if (characterOrId && typeof characterOrId === "object")
    return byId.get(Number(characterOrId.id)) || null;
  if (typeof characterOrId === "string" && byGlyph.has(characterOrId)) return byGlyph.get(characterOrId);
  return byId.get(Number(characterOrId)) || null;
}

/** A displayable word: real hiragana reading, contains the glyph, has a gloss. */
function validWord(character, word, reading) {
  if (!word || !reading || KATAKANA.test(reading)) return null;
  if (!word.includes(character.kanji) || word === character.kanji || word.includes("々")) return null;
  const kana = toHiragana(reading);
  if (!HIRAGANA.test(kana)) return null;
  const key = keyOf(word, kana);
  const meaning = GLOSS_CORRECTIONS.get(key) || glosses.get(key);
  if (!meaning || MISLEADING.has(key) || UNUSUAL.test(meaning) || SPECIALIST.test(meaning) || BINOMIAL.test(meaning)) return null;
  return { word, reading: kana, meaning };
}

const curriculumOnly = (word) =>
  [...word].every((glyph) => !/[㐀-鿿]/.test(glyph) || curriculumGlyphs.has(glyph));

function candidates(character) {
  const standalone = character.standalone || [];
  const examples = character.examples || [];
  return [
    ...(textbookByCharacter.get(character.id) || []),
    // Okurigana words, then curriculum-sentence words, then dictionary order
    // (which tracks everyday use better than commonWords' easiest-kanji sort).
    ...standalone.filter((word) => word.common),
    ...exampleWordsFor(character),
    ...commonWords(character, 8),
    ...examples.filter((word) => word.common),
    ...standalone,
    ...examples,
  ];
}

function buildLesson(character) {
  const seen = new Set();
  const pool = [];
  for (const item of candidates(character)) {
    const word = validWord(character, item.word, item.reading);
    if (!word) continue;
    const key = keyOf(word.word, word.reading);
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(word);
  }

  const taken = new Set();
  const words = [];
  const take = (word) => {
    if (words.length >= MAIN_LIMIT || taken.has(word.word)) return;
    taken.add(word.word);
    words.push(word);
  };

  for (const [word, reading] of CURATED[character.id] || []) {
    const resolved = pool.find((item) => item.word === word && item.reading === reading);
    if (resolved) take(resolved);
  }
  // General fallback: common, short, curriculum-only words first, keeping
  // the curriculum/sentence order produced by the candidate list.
  const textbook = new Set((textbookByCharacter.get(character.id) || []).map((word) => word.word));
  const practical = (word) => commonFlag.has(keyOf(word.word, word.reading)) || textbook.has(word.word);
  const tiers = [
    // Textbook-set words were already chosen for learners.
    (word) => textbook.has(word.word),
    (word) => practical(word) && [...word.word].length <= 3 && curriculumOnly(word.word),
    (word) => practical(word) && [...word.word].length <= 4,
    () => true,
  ];
  for (const tier of tiers) for (const word of pool) if (tier(word)) take(word);

  const extraWords = pool
    .filter((word) => !words.includes(word) && !taken.has(word.word))
    .sort(
      (a, b) =>
        Number(commonFlag.has(keyOf(b.word, b.reading))) - Number(commonFlag.has(keyOf(a.word, a.reading))),
    );
  // A word with two readings appears once in the extras too.
  const extraSeen = new Set();
  const extras = extraWords.filter((word) => !extraSeen.has(word.word) && extraSeen.add(word.word));

  return { meanings: lessonMeanings(character), words, extraWords: extras };
}

/** Curated primary senses first, then every legitimate dictionary sense. */
export function lessonMeanings(character) {
  const senses = [...meaningSenses(primaryMeaning(character)), ...meaningSenses(character.meaning || "")];
  const seen = new Set();
  return senses.filter((sense) => {
    const key = normalizeMeaning(sense);
    if (!key || SENSE_NOISE.test(sense) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const cache = new Map();
/**
 * Lesson content for a character object, id or glyph.
 * @returns {{meanings: string[], words: {word,reading,meaning}[], extraWords: {word,reading,meaning}[]} | null}
 */
export function characterLesson(characterOrId) {
  const character = resolveCharacter(characterOrId);
  if (!character) return null;
  if (!cache.has(character.id)) cache.set(character.id, buildLesson(character));
  const lesson = cache.get(character.id);
  // Fresh copies so callers cannot mutate the shared cache.
  return {
    meanings: [...lesson.meanings],
    words: lesson.words.map((word) => ({ ...word })),
    extraWords: lesson.extraWords.map((word) => ({ ...word })),
  };
}
