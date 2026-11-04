import { validateTextbookPractice } from "./textbookPractice.js";
import { kanjiData } from "../data/kanji.js";

const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const count = value => Number.isSafeInteger(value) && value >= 0;
const id = value => Number.isInteger(value) && value >= 1 && value <= 300;
const kinds = ["meet","read","write","use"];
const outcome = value => record(value) && typeof value.correct === "boolean" && typeof value.assisted === "boolean" && (value.primed===undefined||typeof value.primed==="boolean") && ["screen","paper","self"].includes(value.method) && count(value.mistakes) && value.mistakes <= 10000;
const glyphs = new Map(kanjiData.map(c=>[c.id,c.kanji]));
const wordFor = (word, characterId) => record(word) && ["word","reading","meaning"].every(k=>typeof word[k] === "string" && word[k].length>0 && word[k].length <= (k === "meaning" ? 2000 : 100)) && word.word.includes(glyphs.get(characterId));
const sameWord = (a,b) => record(a) && a.word===b.word && a.reading===b.reading && a.meaning===b.meaning;
function phasedTasks(active) {
  let cursor=0;
  for (const characterId of active.ids) {
    const meet=active.tasks[cursor++];
    if (!record(meet) || meet.kind!=="meet" || meet.id!==characterId || !Array.isArray(meet.words) || meet.words.length<1 || meet.words.length>3 || !meet.words.every(w=>wordFor(w,characterId)) || new Set(meet.words.map(w=>`${w.word}:${w.reading}`)).size!==meet.words.length) return false;
    for (const word of meet.words) for (const kind of ["read","use"]) {
      const task=active.tasks[cursor++];
      if (!record(task) || task.id!==characterId || task.kind!==kind || !sameWord(task.word,word)) return false;
    }
    const write=active.tasks[cursor++];
    if (!record(write) || write.kind!=="write" || write.id!==characterId || !sameWord(write.word,meet.words[0])) return false;
  }
  return cursor===active.tasks.length;
}
export function validateStudy(value) {
  const invalid = () => { throw new Error("This backup contains invalid focused study records."); };
  if (!record(value)) invalid();
  if (value.customRange !== undefined && (!record(value.customRange) || !id(value.customRange.from) || !id(value.customRange.to) || value.customRange.from > value.customRange.to)) invalid();
  if (value.wordEvidence !== undefined) {
    if (!record(value.wordEvidence) || Object.keys(value.wordEvidence).length>6000) invalid();
    for (const [key,entry] of Object.entries(value.wordEvidence)) {
      if (!record(entry) || !id(entry.id) || !["read","use"].includes(entry.kind) || key!==`${entry.kind}:${entry.id}:${entry.word}:${entry.reading}` || !wordFor(entry,entry.id) || !outcome(entry) ||
        !["lastAttempt","lastSuccess","laterSuccess"].every(k=>count(entry[k])) || entry.lastSuccess>entry.lastAttempt || entry.laterSuccess>entry.lastSuccess ||
        !record(entry.review) || !["attempts","misses","streak","due","lastReviewed"].every(k=>count(entry.review[k])) || entry.review.misses>entry.review.attempts || entry.review.streak>entry.review.attempts) invalid();
    }
  }
  if (value.textbookPractice !== undefined) validateTextbookPractice(value.textbookPractice);
  if (value.exposed!==undefined && (!record(value.exposed)||Object.keys(value.exposed).length>300||Object.entries(value.exposed).some(([key,date])=>!/^\d+$/.test(key)||!id(Number(key))||!count(date)))) invalid();
  if (value.introduced !== undefined && (!record(value.introduced) || Object.entries(value.introduced).some(([key,date])=>!/^\d+$/.test(key)||!id(Number(key))||!count(date)))) invalid();
  if (value.evidence !== undefined) {
    if (!record(value.evidence) || Object.keys(value.evidence).length > 900) invalid();
    for (const [key, entry] of Object.entries(value.evidence)) {
      if (!/^(read|write|use):\d+$/.test(key) || !id(Number(key.split(":")[1])) || !outcome(entry) ||
        typeof entry.word !== "string" || entry.word.length < 1 || entry.word.length > 100 ||
        typeof entry.reading !== "string" || entry.reading.length < 1 || entry.reading.length > 100 ||
        !["lastAttempt","lastSuccess","laterSuccess"].every(k=>count(entry[k])) || entry.lastSuccess>entry.lastAttempt || entry.laterSuccess>entry.lastSuccess) invalid();
      if (entry.review!==undefined && (!record(entry.review)||!["attempts","misses","streak","due","lastReviewed"].every(k=>count(entry.review[k]))||entry.review.misses>entry.review.attempts||entry.review.streak>entry.review.attempts||(entry.review.lastSuccess!==undefined&&!count(entry.review.lastSuccess))||(entry.review.introduced!==undefined&&!count(entry.review.introduced)))) invalid();
    }
  }
  for (const active of [value.active,value.paused]) {
    if (active == null) continue;
    const custom = active.mode === "custom";
    if (!record(active) || (active.mode !== undefined && !["custom","daily"].includes(active.mode)) || !Array.isArray(active.ids) || !active.ids.length || active.ids.length>(custom?300:2) || !active.ids.every(id) || new Set(active.ids).size!==active.ids.length ||
      !Array.isArray(active.tasks) || (active.plan===2 && !active.review ? active.tasks.length<active.ids.length*4 || active.tasks.length>active.ids.length*8 : active.tasks.length!==active.ids.length*(active.review?1:4)) || !count(active.index) || active.index>active.tasks.length || !count(active.started) ||
      typeof active.helped!=="boolean" || !Array.isArray(active.results) || active.results.length>active.tasks.length) invalid();
    if (active.review!==undefined && typeof active.review!=="boolean") invalid();
    if (active.plan!==undefined && active.plan!==2) invalid();
    if (active.lessonPhase!==undefined && !["learn","practise"].includes(active.lessonPhase)) invalid();
    if (active.relearning!==undefined && (typeof active.relearning!=="boolean" || (active.relearning && !active.feedback))) invalid();
    if (custom && (active.review || !id(active.from) || !id(active.to) || active.ids.length !== active.to-active.from+1 || !active.ids.every((id,i)=>id===active.from+i))) invalid();
    const expected=custom ? active.ids.flatMap(id=>kinds.map(kind=>({kind,id}))) : kinds.flatMap(kind=>active.ids.map(id=>({kind,id})));
    if (active.plan===2 && !active.review) {
      if (!phasedTasks(active)) invalid();
    } else if (!active.tasks.every((t,i)=>record(t)&&(active.review ? t.id===active.ids[i]&&kinds.slice(1).includes(t.kind) : t.id===expected[i].id&&t.kind===expected[i].kind) && (t.word===undefined || (active.plan===2 && ["read","use"].includes(t.kind) && wordFor(t.word,t.id))))) invalid();
    const seen=new Set();
    for(const result of active.results) {
      const task=active.tasks[result.index];
      if (!outcome(result)||!count(result.index)||result.index>active.index||!task||task.kind==="meet"||result.kind!==task.kind||result.id!==task.id||!count(result.at)||seen.has(result.index)) invalid();
      if (task.word && (result.word!==task.word.word || result.reading!==task.word.reading)) invalid();
      seen.add(result.index);
    }
    if (active.feedback!==null && (!outcome(active.feedback)||!seen.has(active.index))) invalid();
    if (active.index===active.tasks.length && active.feedback!==null) invalid();
    if (active.paperCommitted!==undefined && typeof active.paperCommitted!=="boolean") invalid();
    if (active.selfCheck!=null && (typeof active.selfCheck!=="string" || active.selfCheck.length>5000)) invalid();
    for (let i=0;i<active.index;i++) if (active.tasks[i].kind!=="meet"&&!seen.has(i)) invalid();
    if (active.feedback!==null) {
      const current=active.results.find(r=>r.index===active.index);
      if (!["correct","assisted","method","mistakes","primed"].every(key=>current[key]===active.feedback[key])) invalid();
    } else if (seen.has(active.index)) invalid();
  }
  if (value.active && value.paused && (value.active.mode || "daily") === (value.paused.mode || "daily")) invalid();
  return value;
}
