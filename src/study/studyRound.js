import { kanjiData } from "../data/kanji.js";
import { commonWords } from "../rush/deck.js";
import { contextsFor, exampleWordsFor } from "./characterData.js";
import { schedule } from "./progress.js";

const DAY = 86400000;
// Prevent same-visit priming without blocking the first 24-hour review merely
// because the last teaching screen appeared a few minutes after the first task.
const RECENT_EXPOSURE = 12 * 3600000;
const characters = new Map(kanjiData.map(character => [character.id, character]));
export const STUDY_CHAPTERS = [[1,17],[18,36],[37,56],[57,74],[75,92],[93,111],[112,130],[131,150],[151,169],[170,187],[188,206],[207,226],[227,243],[244,262],[263,280],[281,300]].map(([from,to],index)=>({id:index+1,from,to}));
// Chapter boundaries are the printed index, not the five-character play stages.

const anchorCache = new Map();
function anchorFor(character) {
  if (!anchorCache.has(character.id)) {
    const candidates = [...commonWords(character, 5), ...exampleWordsFor(character)];
    const word = candidates.find(w => w.word && w.reading && w.meaning);
    anchorCache.set(character.id, word ? { word: word.word, reading: word.reading, meaning: word.meaning } : null);
  }
  return anchorCache.get(character.id);
}
function rangeOptions(progress, options = {}) {
  const from = Number(options.from ?? progress.settings.from);
  const to = Number(options.to ?? progress.settings.to);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > 300 || from > to)
    throw new Error("choose a range between 1 and 300.");
  return { from, to };
}
function dueTask(progress,id,now) {
  const choices=[{kind:"write",due:progress.cards[`drill:${id}:writing`]?.due},{kind:"read",due:progress.cards[`drill:${id}:reading`]?.due}];
  const meaning=progress.study?.evidence?.[`use:${id}`];
  if (meaning) choices.push({kind:"use",due:meaning.review?.due ?? meaning.lastAttempt+DAY});
  return choices.filter(c=>c.due!==undefined&&c.due<=now).sort((a,b)=>a.due-b.due)[0];
}
function rangeIds(progress, options) {
  const {from,to} = rangeOptions(progress,options);
  return kanjiData.filter(c => c.id >= from && c.id <= to && anchorFor(c)).map(c => c.id);
}
export function getStudyOverview(progress, options = {}, now = Date.now()) {
  const ids = rangeIds(progress, options);
  const due = ids.filter(id => dueTask(progress,id,now)).sort((a,b)=>dueTask(progress,a,now).due-dueTask(progress,b,now).due);
  const fresh = ids.filter(id => !progress.study?.introduced?.[id]);
  const rest = ids.filter(id => !fresh.includes(id)).sort((a,b) =>
    (progress.study?.evidence?.[`write:${a}`]?.lastAttempt ?? 0) - (progress.study?.evidence?.[`write:${b}`]?.lastAttempt ?? 0));
  return { dueCount: due.length, nextIds: [...fresh,...rest].slice(0,2), dueIds: due };
}
export function startStudyRound(progress, options = {}, now = Date.now()) {
  const {from,to} = rangeOptions(progress,options);
  const overview = getStudyOverview(progress,{from,to},now);
  const ids = (options.review ? overview.dueIds : overview.nextIds).slice(0,2);
  if (!ids.length) throw new Error(options.review ? "no reviews are due in this range." : "no study items in this range.");
  const review = Boolean(options.review);
  // One skill per character in a cold review avoids showing a word and then
  // calling the immediately following shape/meaning check delayed retention.
  const tasks = review ? ids.map(id=>({kind:dueTask(progress,id,now).kind,id})) : ["meet","read","write","use"].flatMap(kind => ids.map(id => ({kind,id})));
  return {...progress, settings:{...progress.settings,from,to}, study:{...progress.study,
    active:{ids,tasks,index:0,started:now,review,helped:false,feedback:null,results:[]}}};
}
export function getStudyTask(active) {
  const task = active?.tasks[active.index];
  if (!task) return null;
  const character = characters.get(task.id);
  if (!character) return null;
  const word = anchorFor(character);
  if (!word) return null;
  const sentence = contextsFor(character).find(s => s.targets.some(t => t.word === word.word && t.reading === word.reading)) || null;
  return {...task,character:character.kanji,word,sentence};
}
export function revealStudyHelp(progress, now = Date.now()) {
  const active = progress.study?.active;
  if (!active || active.feedback || active.index >= active.tasks.length || active.helped) return progress;
  const task=getStudyTask(active);
  return {...progress,study:{...progress.study,exposed:{...progress.study.exposed,[task.id]:now},active:{...active,helped:true}}};
}
function reviewAfterAttempt(previous,{correct,assisted,method,primed},now) {
  const practice = primed || method !== "screen";
  if (!practice) return schedule(previous,correct&&!assisted,now);
  const success=correct&&!assisted;
  const base=previous || {attempts:0,misses:0,streak:0,due:0,lastReviewed:0,introduced:now,lastSuccess:0};
  return {...base,attempts:base.attempts+(method==="screen"?1:0),lastReviewed:now,
    due:success?Math.max(base.due,now+DAY):now+60000};
}
export function submitStudyTask(progress, outcome = {}, now = Date.now()) {
  const active = progress.study?.active;
  const task = getStudyTask(active);
  if (!task || task.kind === "meet" || active.feedback) return progress;
  const method = task.kind === "write" && active.paperCommitted ? "paper" : task.kind === "use" && active.selfCheck != null ? "self" : ["paper","self"].includes(outcome.method) ? outcome.method : "screen";
  const assisted = Boolean(outcome.assisted || active.helped);
  const correct = Boolean(outcome.correct);
  const mistakes = Number.isSafeInteger(outcome.mistakes) && outcome.mistakes >= 0 ? Math.min(10000,outcome.mistakes) : 0;
  const result = {index:active.index,kind:task.kind,id:task.id,correct,assisted,method,mistakes,at:now};
  const independent = correct && !assisted && method === "screen";
  const primed = active.tasks.slice(0,active.index).some(t=>t.id===task.id) || now-(progress.study.exposed?.[task.id] ?? 0)<RECENT_EXPOSURE;
  const key = `${task.kind}:${task.id}`;
  const evidence = {...progress.study.evidence};
  const existing = evidence[key];
  // A new anchor word must never inherit evidence earned for a different reading.
  const previous = existing?.word === task.word.word && existing?.reading === task.word.reading ? existing : null;
  const lastSuccess = previous?.lastSuccess || 0;
  const lastAttempt = Math.max(now,previous?.lastAttempt||0,lastSuccess,previous?.laterSuccess||0);
  evidence[key] = { word:task.word.word,reading:task.word.reading,lastAttempt,
    lastSuccess:independent && (!primed || !lastSuccess) ? Math.max(now,lastSuccess) : lastSuccess,
    laterSuccess:independent && !primed && active.review && lastSuccess && now-lastSuccess >= DAY ? now : previous?.laterSuccess || 0,
    correct,assisted,method,mistakes,primed,
    ...(task.kind==="use" ? {review:reviewAfterAttempt(previous?.review,{correct,assisted,method,primed},now)} : {}) };
  const cardKey = task.kind === "write" ? `drill:${task.id}:writing` : task.kind === "read" ? `drill:${task.id}:reading` : null;
  const cards = {...progress.cards};
  // Paper comparison is valuable self-report, not a measured screen writing pass.
  if (cardKey) cards[cardKey] = reviewAfterAttempt(cards[cardKey],{correct,assisted,method,primed},now);
  result.primed=primed;
  return {...progress,cards,study:{...progress.study,evidence,exposed:{...progress.study.exposed,[task.id]:now},
    active:{...active,feedback:{correct,assisted,method,mistakes,primed},results:[...active.results,result]}}};
}
export function nextStudyTask(progress,now=Date.now()) {
  const active = progress.study?.active;
  const task = getStudyTask(active);
  if (!task || (task.kind !== "meet" && !active.feedback)) return progress;
  const introduced = {...progress.study.introduced};
  if (task.kind === "meet") introduced[task.id] = active.started;
  const exposed = task.kind === "meet" ? {...progress.study.exposed,[task.id]:now} : progress.study.exposed;
  return {...progress,study:{...progress.study,introduced,exposed,
    active:{...active,index:active.index+1,helped:false,feedback:null,paperCommitted:false,selfCheck:null}}};
}
export function studyRoundSummary(active) {
  const results = active?.results || [];
  const independent = kind => results.filter(r => r.kind===kind && r.correct && !r.assisted && r.method!=="paper").length;
  return {read:independent("read"),write:independent("write"),use:independent("use"),
    helped:results.filter(r=>r.assisted).length,paper:results.filter(r=>r.method==="paper").length,total:results.length};
}
export function getStudyEvidence(progress,id,kind) {
  return progress.study?.evidence?.[`${kind}:${id}`] || null;
}

export function commitStudyPaper(progress) {
  const active=progress.study?.active;
  if (!active || active.feedback || getStudyTask(active)?.kind!=="write") return progress;
  return {...progress,study:{...progress.study,active:{...active,paperCommitted:true}}};
}
export function commitStudySelfCheck(progress,text) {
  const active=progress.study?.active;
  if (!active || active.feedback || getStudyTask(active)?.kind!=="use") return progress;
  return {...progress,study:{...progress.study,active:{...active,selfCheck:String(text).slice(0,5000)}}};
}
