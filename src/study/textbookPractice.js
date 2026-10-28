import { textbookSetById } from "../data/textbookSets.js";

export function createTextbookPractice(setId) {
  const set = textbookSetById(setId);
  if (!set) throw new Error("This textbook set is not available.");
  return { setId, queue: set.words.map((_, index) => index), known: [], revealed: false };
}

export function getTextbookPractice(progress, setId) {
  const saved = progress.study?.textbookPractice;
  return saved?.setId === setId ? saved : createTextbookPractice(setId);
}

// Self-rated word practice stays separate from measured reading/writing evidence.
export function changeTextbookPractice(progress, { setId, wordIndex, action }) {
  const active = getTextbookPractice(progress, setId);
  let next;
  if (action === "restart" && !active.queue.length) next = createTextbookPractice(setId);
  else {
    if (!active.queue.length || active.queue[0] !== wordIndex) return progress;
    if (action === "reveal" && !active.revealed) next = { ...active, revealed: true };
    else if (active.revealed && action === "again") next = { ...active, queue: [...active.queue.slice(1), wordIndex], revealed: false };
    else if (active.revealed && action === "known") next = { ...active, queue: active.queue.slice(1), known: [...active.known, wordIndex], revealed: false };
    else return progress;
  }
  return { ...progress, study: { ...progress.study, textbookPractice: next } };
}

export function validateTextbookPractice(value) {
  const set = textbookSetById(value?.setId);
  const invalid = () => { throw new Error("This backup contains invalid textbook word practice."); };
  if (!set || !Array.isArray(value.queue) || !Array.isArray(value.known) || typeof value.revealed !== "boolean") invalid();
  const indices = [...value.queue, ...value.known];
  if (indices.length !== set.words.length || new Set(indices).size !== indices.length ||
    indices.some(index => !Number.isInteger(index) || index < 0 || index >= set.words.length) ||
    (!value.queue.length && value.revealed)) invalid();
  return value;
}
