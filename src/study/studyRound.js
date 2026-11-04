import { kanjiData } from "../data/kanji.js";
import { textbookAnchorFor } from "../data/textbookSets.js";
import { commonWords } from "../rush/deck.js";
import { contextsFor, exampleWordsFor } from "./characterData.js";
import { schedule } from "./progress.js";
import { characterLesson } from "./characterLesson.js";

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
    const candidates = [textbookAnchorFor(character.id), ...commonWords(character, 5), ...exampleWordsFor(character)].filter(Boolean);
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
function dueTask(progress,id,now,wordReviews) {
  const choices=[{kind:"write",due:progress.cards[`drill:${id}:writing`]?.due},{kind:"read",due:progress.cards[`drill:${id}:reading`]?.due}];
  const meaning=progress.study?.evidence?.[`use:${id}`];
  if (meaning) choices.push({kind:"use",due:meaning.review?.due ?? meaning.lastAttempt+DAY});
  for (const entry of wordReviews || Object.values(progress.study?.wordEvidence || {})) {
    if (entry.id === id) choices.push({kind:entry.kind,due:entry.review.due,word:{word:entry.word,reading:entry.reading,meaning:entry.meaning}});
  }
  return choices.filter(c=>c.due!==undefined&&c.due<=now).sort((a,b)=>a.due-b.due)[0];
}
function rangeIds(progress, options) {
  const {from,to} = rangeOptions(progress,options);
  return kanjiData.filter(c => c.id >= from && c.id <= to && anchorFor(c)).map(c => c.id);
}
function lessonTasks(ids) {
  return ids.flatMap(id => {
    const words = characterLesson(id).words.map(({word,reading,meaning})=>({word,reading,meaning}));
    return [{kind:"meet",id,words}, ...words.flatMap(word=>[{kind:"read",id,word},{kind:"use",id,word}]), {kind:"write",id,word:words[0]}];
  });
}
export function getStudyOverview(progress, options = {}, now = Date.now()) {
  const ids = rangeIds(progress, options);
  const byId = new Map();
  for (const entry of Object.values(progress.study?.wordEvidence || {})) {
    if (!byId.has(entry.id)) byId.set(entry.id,[]);
    byId.get(entry.id).push(entry);
  }
  const dueById = new Map(ids.map(id=>[id,dueTask(progress,id,now,byId.get(id) || [])]));
  const due = ids.filter(id => dueById.get(id)).sort((a,b)=>dueById.get(a).due-dueById.get(b).due);
  const fresh = ids.filter(id => !progress.study?.introduced?.[id]);
  const rest = ids.filter(id => !fresh.includes(id)).sort((a,b) =>
    (progress.study?.evidence?.[`write:${a}`]?.lastAttempt ?? 0) - (progress.study?.evidence?.[`write:${b}`]?.lastAttempt ?? 0));
  return { dueCount: due.length, nextIds: [...fresh,...rest].slice(0,2), dueIds: due };
}
export function startStudyRound(progress, options = {}, now = Date.now()) {
  const {from,to} = rangeOptions(progress,options);
  const custom = options.custom === true;
  const overview = getStudyOverview(progress,{from,to},now);
  const ids = custom ? rangeIds(progress,{from,to}) : (options.review ? overview.dueIds : overview.nextIds).slice(0,2);
  if (custom && ids.length !== to-from+1) throw new Error("this range has missing study content. choose another range.");
  if (!ids.length) throw new Error(options.review ? "no reviews are due in this range." : "no study items in this range.");
  const review = !custom && Boolean(options.review);
  // One skill per character in a cold review avoids showing a word and then
  // calling the immediately following shape/meaning check delayed retention.
  const kinds = ["meet","read","write","use"];
  const phased = !review && options.phased === true;
  const tasks = phased ? lessonTasks(ids) : custom ? ids.flatMap(id=>kinds.map(kind=>({kind,id}))) : review ? ids.map(id=>{
    const {kind,word}=dueTask(progress,id,now);
    return {kind,id,...(word ? {word} : {})};
  }) : kinds.flatMap(kind => ids.map(id => ({kind,id})));
  const mode = custom ? "custom" : "daily";
  const current = progress.study?.active;
  const paused = current && (current.mode || "daily") !== mode ? current : progress.study?.paused ?? null;
  return {...progress, settings:custom ? progress.settings : {...progress.settings,from,to}, study:{...progress.study, paused,
    ...(custom ? {customRange:{from,to}} : {}),
    active:{ids,tasks,index:0,started:now,mode,from,to,review,...(phased || tasks.some(t=>t.word) ? {plan:2} : {}),helped:false,feedback:null,results:[]}}};
}
export function savedStudyRound(progress, mode) {
  return [progress.study?.active, progress.study?.paused].find(active=>active && (active.mode || "daily") === mode) ?? null;
}
export function resumeStudyRound(progress, mode) {
  const active = savedStudyRound(progress,mode);
  if (!active || active === progress.study?.active) return progress;
  return {...progress,study:{...progress.study,active,paused:progress.study?.active ?? null}};
}
export function getStudyTask(active) {
  const task = active?.tasks[active.index];
  if (!task) return null;
  const character = characters.get(task.id);
  if (!character) return null;
  const word = task.word || task.words?.[0] || anchorFor(character);
  if (!word) return null;
  const sentence = contextsFor(character).find(s => s.targets.some(t => t.word === word.word && t.reading === word.reading)) || null;
  return {...task,character:character.kanji,word,sentence};
}
export function studyFeedbackVisibility(active) {
  const task=getStudyTask(active);
  const pending=new Set();
  for(let index=active.index+1;index<active.tasks.length;index++) {
    const next=active.tasks[index];
    if(next.id!==task.id || !["read","use"].includes(next.kind)) continue;
    const word=getStudyTask({...active,index}).word;
    if(word.word===task.word.word && word.reading===task.word.reading) pending.add(next.kind);
  }
  return {reading:!pending.has("read"),meaning:!pending.has("use")};
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
  const pinnedWord = active.tasks[active.index].word;
  const wordCheck = Boolean(pinnedWord && ["read","use"].includes(task.kind));
  const result = {index:active.index,kind:task.kind,id:task.id,correct,assisted,method,mistakes,at:now,...(pinnedWord ? {word:task.word.word,reading:task.word.reading} : {})};
  const independent = correct && !assisted && method === "screen";
  const primed = active.tasks.slice(0,active.index).some(t=>t.id===task.id) || now-(progress.study.exposed?.[task.id] ?? 0)<RECENT_EXPOSURE;
  const key = `${task.kind}:${task.id}`;
  const evidence = {...progress.study.evidence};
  const wordEvidence = {...progress.study.wordEvidence};
  const wordKey = studyWordKey(task);
  const existing = wordCheck ? wordEvidence[wordKey] : evidence[key];
  // A new anchor word must never inherit evidence earned for a different reading.
  const previous = existing?.word === task.word.word && existing?.reading === task.word.reading && (!wordCheck || existing.meaning===task.word.meaning) ? existing : null;
  const lastSuccess = previous?.lastSuccess || 0;
  const lastAttempt = Math.max(now,previous?.lastAttempt||0,lastSuccess,previous?.laterSuccess||0);
  const entry = { word:task.word.word,reading:task.word.reading,lastAttempt,
    lastSuccess:independent && (!primed || !lastSuccess) ? Math.max(now,lastSuccess) : lastSuccess,
    laterSuccess:independent && !primed && active.review && lastSuccess && now-lastSuccess >= DAY ? now : previous?.laterSuccess || 0,
    correct,assisted,method,mistakes,primed,
    ...(task.kind==="use" || wordCheck ? {review:reviewAfterAttempt(previous?.review,{correct,assisted,method,primed},now)} : {}) };
  if (wordCheck) wordEvidence[wordKey] = {...entry,id:task.id,kind:task.kind,meaning:task.word.meaning};
  else evidence[key] = entry;
  const cardKey = task.kind === "write" ? `drill:${task.id}:writing` : task.kind === "read" && !wordCheck ? `drill:${task.id}:reading` : null;
  const cards = {...progress.cards};
  // Paper comparison is valuable self-report, not a measured screen writing pass.
  if (cardKey) cards[cardKey] = reviewAfterAttempt(cards[cardKey],{correct,assisted,method,primed},now);
  result.primed=primed;
  const exposed={...progress.study.exposed,[task.id]:now};
  // A compound's answer also primes its other curriculum characters.
  for(const character of characters.values()) if(task.word.word.includes(character.kanji)) exposed[character.id]=Math.max(now,exposed[character.id] || 0);
  return {...progress,cards,study:{...progress.study,evidence,...(wordCheck ? {wordEvidence} : {}),exposed,
    active:{...active,feedback:{correct,assisted,method,mistakes,primed},results:[...active.results,result]}}};
}
export function nextStudyTask(progress,now=Date.now()) {
  const active = progress.study?.active;
  const task = getStudyTask(active);
  if (!task || (task.kind !== "meet" && !active.feedback)) return progress;
  const introduced = {...progress.study.introduced};
  if (task.kind === "meet") introduced[task.id] ??= active.started;
  const exposed = task.kind === "meet" ? {...progress.study.exposed,[task.id]:now} : progress.study.exposed;
  return {...progress,study:{...progress.study,introduced,exposed,
    active:{...active,index:active.index+1,helped:false,feedback:null,paperCommitted:false,selfCheck:null,lessonPhase:"learn",relearning:false}}};
}
export function studyWordKey(task) {
  return `${task.kind}:${task.id}:${task.word.word}:${task.word.reading}`;
}
export function changeLessonPhase(progress, phase, now=Date.now()) {
  const active=progress.study?.active;
  if (!active || !["learn","practise"].includes(phase) || (getStudyTask(active)?.kind !== "meet" && !active.relearning)) return progress;
  // A round still at its first teaching screen can adopt the richer plan safely.
  const upgrade = phase==="practise" && !active.plan && active.index===0 && !active.results.length && !active.review;
  return {...progress,study:{...progress.study,exposed:{...progress.study.exposed,[getStudyTask(active).id]:now},active:{...active,...(upgrade ? {plan:2,tasks:lessonTasks(active.ids)} : {}),lessonPhase:phase}}};
}
export function revisitStudyLesson(progress) {
  const active=progress.study?.active;
  if (!active?.feedback) return progress;
  return {...progress,study:{...progress.study,active:{...active,relearning:!active.relearning,lessonPhase:"practise"}}};
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
