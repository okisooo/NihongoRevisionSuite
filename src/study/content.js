import { kanjiData } from "../data/kanji.js";
import { grammarData } from "../data/grammar.js";
import { sentencesData } from "../data/sentences.js";
import { toHiragana } from "../utils/kanaConverter.js";
import { contextsFor } from "./characterData.js";
import { primaryMeaning } from "./primaryMeanings.js";

export const characters = kanjiData;
export const lessons = grammarData;
export const sentences = sentencesData;
export const readings = (item) =>
  [...(item.kunyomi || []), ...(item.onyomi || [])]
    .map(toHiragana)
    // Parentheses distinguish the written kana ending from the character part.
    .map((x) => x.replace(/\.(.+)$/, "($1)"));
export const lessonTitle = (lesson) =>
  lesson.title.replace(/^Lesson \d+:\s*/, "");
export const normalize = (text) =>
  toHiragana(String(text)).toLowerCase().normalize("NFKC");

export function contextWords(character) {
  const targets = contextsFor(character)[0]?.targets || [];
  return targets.map(
    (target) =>
      character.examples.find(
        (example) =>
          example.word === target.word && example.reading === target.reading,
      ) || {
        word: target.word,
        reading: target.reading,
        meaning: "from the sentence below",
      },
  );
}

const wordMap = new Map();
for (const character of characters)
  for (const example of character.examples || []) {
    const key = `${example.word}:${example.reading}`;
    if (!wordMap.has(key))
      wordMap.set(key, { ...example, id: key, characterId: character.id });
  }
export const words = [...wordMap.values()];

// Kanji skills are practised in kanji rush (typed and written) and scheduled
// here. `character:` keys are the original reading/meaning cards; `drill:` keys
// are writing, word reading, and the older typed-meaning drill. Retired drill
// skills (recognition, cloze, ...) stay in old backups but are never due.
export const KANJI_SKILLS = { reading: "word reading", meaning: "meaning", writing: "writing" };
export const cards = {};
for (const character of characters) {
  for (const skill of ["meaning", "reading"]) {
    const key = `character:${character.id}:${skill}`;
    cards[key] = {
      key,
      kind: skill,
      character,
      prompt: character.kanji,
      answer:
        skill === "meaning"
          ? primaryMeaning(character)
          : readings(character).join(" / "),
      instruction:
        skill === "meaning"
          ? "Recall the meaning."
          : "Recall one reading, then compare the reference.",
    };
  }
  for (const [skill, kind] of Object.entries(KANJI_SKILLS)) {
    const key = `drill:${character.id}:${skill}`;
    cards[key] = { key, kind, character, prompt: character.kanji };
  }
}
for (const sentence of sentences) {
  const key = `sentence:${sentence.kanjiId}:context`;
  cards[key] = {
    key,
    kind: "context",
    sentence,
    prompt: sentence.sentence,
    answer: sentence.translation,
    instruction: "Read the sentence and recall its meaning.",
  };
}
for (const lesson of lessons)
  lesson.patterns.forEach((pattern, index) => {
    const key = `grammar:${lesson.lesson}:${index}`;
    cards[key] = {
      key,
      kind: "grammar",
      lesson,
      pattern,
      prompt: pattern.pattern,
      answer: pattern.explanation,
      instruction: "form a sentence using this pattern. the model stays hidden until you try.",
    };
  });

export const isKanjiKey = (key) => Boolean(cards[key]?.character);

export function dueKeys(progress, now) {
  return Object.keys(progress.cards)
    .filter((key) => cards[key] && progress.cards[key].due <= now)
    .sort((a, b) => progress.cards[a].due - progress.cards[b].due);
}
export const kanjiDueKeys = (progress, now) => dueKeys(progress, now).filter(isKanjiKey);
export const studyDueKeys = (progress, now) =>
  dueKeys(progress, now).filter((key) => !isKanjiKey(key));

/** Characters met anywhere: kanji rush lessons or any saved kanji review. */
export function metCharacter(progress, id) {
  return (
    Boolean(progress.rush?.kanji?.[id]?.learned) ||
    ["meaning", "reading", "writing"].some(
      (skill) => progress.cards[`character:${id}:${skill}`] || progress.cards[`drill:${id}:${skill}`],
    )
  );
}

/**
 * The card session covers grammar and sentences; kanji are reviewed by typing
 * and writing in kanji rush. "today" adds two new context sentences for kanji
 * already met and the next grammar pattern. "lesson" keeps only that lesson's
 * patterns: no due items from elsewhere and no new sentences.
 */
export function createSession(progress, mode, now, options) {
  const requestedLesson = Number(options?.lessonId);
  const lessonRevision =
    mode === "lesson"
      ? lessons.find((item) => item.lesson === requestedLesson)
      : null;
  let queue;
  if (mode === "lesson") {
    queue = lessonRevision
      ? lessonRevision.patterns
          .map((_, index) => `grammar:${lessonRevision.lesson}:${index}`)
          .filter((key) => cards[key])
      : [];
  } else {
    queue = studyDueKeys(progress, now).slice(0, 20);
    if (mode === "today") {
      queue.push(
        ...characters
          .filter((c) => metCharacter(progress, c.id))
          .map((c) => `sentence:${contextsFor(c)[0]?.kanjiId}:context`)
          .filter((key) => cards[key] && !progress.cards[key])
          .slice(0, 2),
      );
      const lesson = lessons.find((l) => !progress.lessons[l.lesson]);
      if (lesson) {
        const next = lesson.patterns
          .map((_, i) => `grammar:${lesson.lesson}:${i}`)
          .find((key) => !progress.cards[key]);
        if (next) queue.push(next);
      }
    }
  }
  queue = [...new Set(queue)];
  const session = {
    queue,
    variants: Object.fromEntries(
      queue.map((key) => [key, progress.cards[key]?.attempts || 0]),
    ),
    index: 0,
    correct: 0,
    retried: [],
    started: now,
    mode,
  };
  if (lessonRevision) session.lessonId = lessonRevision.lesson;
  return session;
}
