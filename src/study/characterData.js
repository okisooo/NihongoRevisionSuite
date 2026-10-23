import { sentencesData } from "../data/sentences.js";
import { toHiragana } from '../utils/kanaConverter.js';

// Compact reading cues; all readings remain available in the full reference.
export function compactReadings(character) {
  const native = (character.kunyomi || []).filter(reading => !reading.includes('.') && !reading.includes('-'));
  const compound = character.onyomi || [];
  const candidates = [native[0], compound[0], ...native.slice(1), ...compound.slice(1)].filter(Boolean).map(toHiragana);
  return [...new Set(candidates)].slice(0, 2).join(' · ') || (character.kunyomi || []).filter(reading => !reading.includes('-')).slice(0, 1).map(reading => toHiragana(reading).replace('.', '(') + (reading.includes('.') ? ')' : '')).join('');
}

// Historical sentence IDs are not reliable curriculum links. Match actual text.
export function contextsFor(character) {
  return sentencesData.flatMap((sentence) => {
    const targets = sentence.targets.filter(
      (target) =>
        target.word?.includes(character.kanji) &&
        sentence.sentence.includes(target.word) &&
        target.reading,
    );
    return targets.length ? [{ ...sentence, targets }] : [];
  });
}

export function exampleWordsFor(character) {
  const contextual = contextsFor(character).flatMap(
    (sentence) => sentence.targets,
  );
  const references = character.examples.filter(
    (word) =>
      word.word?.includes(character.kanji) && word.reading && word.meaning,
  );
  const ordered = [
    ...references.filter((word) =>
      contextual.some(
        (target) =>
          target.word === word.word && target.reading === word.reading,
      ),
    ),
    ...references,
  ];
  return ordered.filter(
    (word, index) =>
      ordered.findIndex(
        (other) => other.word === word.word && other.reading === word.reading,
      ) === index,
  );
}
