import { kanjiData } from "../data/kanji.js";
import { toHiragana } from "../utils/kanaConverter.js";
import { getStudyTask } from "./studyRound.js";
import { textbookSetById } from "../data/textbookSets.js";
import { getTextbookPractice } from "./textbookPractice.js";
import { changeRound, currentPrompt } from "../play/round.js";
import { cards } from "./content.js";

const characters = new Map(kanjiData.map(character => [character.id, character]));
const glyphIds = new Map(kanjiData.map(character => [character.kanji, character.id]));
const normalize = value => toHiragana(String(value)).normalize("NFKC").toLowerCase().trim();
export const referenceCharacter = id => characters.get(Number(id));
export const kanjiIdsInText = text => [...new Set([...String(text)].map(glyph => glyphIds.get(glyph)).filter(Boolean))];
export function searchReference(query) {
  const text = normalize(query);
  if (!text) return [];
  return kanjiData.filter(c => [c.id, c.kanji, c.meaning, ...(c.kunyomi || []), ...(c.onyomi || [])]
    .some(value => normalize(value).includes(text))).slice(0, 8);
}

export function referenceContext(pathname, progress) {
  if (pathname === "/study/round") return [getStudyTask(progress.study?.active)?.id].filter(Boolean);
  const set = textbookSetById(pathname.match(/^\/study\/([^/]+)$/)?.[1]);
  if (set) return [set.words[getTextbookPractice(progress, set.id).queue[0]]?.characterId].filter(Boolean);
  const library = pathname.match(/^\/library\/characters\/(\d+)$/);
  if (library) return [Number(library[1])];
  if (pathname === "/session") {
    const key = progress.active?.queue[progress.active.index];
    return [Number(key?.match(/^(?:character|drill):(\d+):/)?.[1])].filter(Boolean);
  }
  if (pathname === "/play" && progress.flow?.track === "kanji") return currentPrompt(progress.flow)?.kanjiIds || [];
  return [];
}

// A lookup never advances a task or awards a result. Persist exposure before
// showing answers, including search results and other characters in a word.
export function recordReferenceExposure(progress, ids, now = Date.now()) {
  const selected = new Set(ids.map(Number).filter(id => characters.has(id)));
  if (!selected.size) return progress;
  const exposed = { ...progress.study?.exposed };
  for (const id of selected) exposed[id] = Math.max(now, exposed[id] || 0);
  const active = progress.study?.active;
  const task = getStudyTask(active);
  const helped = task && selected.has(task.id) && task.kind !== "meet" && !active.feedback &&
    !active.paperCommitted && active.selfCheck == null;
  let next = { ...progress, study: { ...progress.study, exposed,
    ...(helped ? { active: { ...active, helped: true } } : {}) } };
  const session = progress.active;
  const sessionKey = session?.queue[session.index];
  const sessionId = Number(sessionKey?.match(/^(?:character|drill):(\d+):/)?.[1]);
  const patternIds = kanjiIdsInText(cards[sessionKey]?.pattern?.pattern || "");
  if (selected.has(sessionId) || patternIds.some(id => selected.has(id))) next.active = { ...session, hints: [...new Set([...(session.hints || []), session.index])] };
  if (progress.flow?.track === "kanji" && currentPrompt(progress.flow)?.kanjiIds.some(id => selected.has(id)))
    next = changeRound(next, "reveal", null, now);
  return next;
}
