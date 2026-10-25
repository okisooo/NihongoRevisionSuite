import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyProgress, validateProgress } from "../src/study/progress.js";
import { createProgressStore } from "../src/study/progressStore.js";
import { kanjiData } from "../src/data/kanji.js";
import { STUDY_CHAPTERS, startStudyRound, getStudyTask, submitStudyTask, nextStudyTask, revealStudyHelp, getStudyEvidence, getStudyOverview, studyRoundSummary } from "../src/study/studyRound.js";

const now=1700000000000;
const started=()=>startStudyRound(emptyProgress(),{from:1,to:17},now);
function atKind(kind,progress=started()) {
  while (getStudyTask(progress.study.active)?.kind!==kind) {
    if (getStudyTask(progress.study.active).kind!=="meet") progress=submitStudyTask(progress,{correct:true},now);
    progress=nextStudyTask(progress,progress.study.active.started);
  }
  return progress;
}
test("school chapter boundaries remain the independently verified printed ranges",()=>{
  const fixture=JSON.parse(readFileSync(new URL("./fixtures/school-book-reference.json",import.meta.url)));
  assert.deepEqual(STUDY_CHAPTERS,fixture.chapters.map(c=>({id:c.chapter,from:c.first,to:c.last})));
});
test("every school character has an existing word and can start a focused round",()=>{
  for(const c of kanjiData){
    const p=startStudyRound(emptyProgress(),{from:c.id,to:c.id},now);
    const task=getStudyTask(p.study.active);
    assert.equal(task.id,c.id);assert.ok(task.word.word.includes(c.kanji));assert.ok(task.word.reading&&task.word.meaning);
    assert.equal(p.study.active.ids.length,1);validateProgress(p);
  }
});
test("introductions earn no recall, and selected rounds stay within two IDs",()=>{
  const p=started();assert.deepEqual(p.study.active.ids,[1,2]);
  assert.equal(submitStudyTask(p,{correct:true},now),p);
  const next=nextStudyTask(p);assert.deepEqual(next.cards,{});assert.equal(next.study.introduced[1],now);
});
test("answers commit once, await explicit next, and survive validated JSON round trips",()=>{
  const p=atKind("read");const next=submitStudyTask(p,{correct:true},now);
  assert.equal(next.study.active.index,p.study.active.index);
  assert.equal(next.cards["drill:1:reading"].streak,0,"guided same-visit practice seeds review without promoting a streak");
  assert.equal(submitStudyTask(next,{correct:true},now+1),next);
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(next))),next);
});
test("outline help cannot become independent writing credit",()=>{
  const p=revealStudyHelp(atKind("write"));const next=submitStudyTask(p,{correct:true,mistakes:0},now);
  assert.equal(next.study.active.feedback.assisted,true);
  assert.equal(next.cards["drill:1:writing"].streak,0);
  assert.equal(getStudyEvidence(next,1,"write").lastSuccess,0);
});
test("screen writing schedules review while paper remains a separate self-check",()=>{
  const p=atKind("write");const screen=submitStudyTask(p,{correct:true},now);
  assert.equal(screen.cards["drill:1:writing"].due,now+86400000);
  const paper=submitStudyTask(p,{correct:true,method:"paper"},now);
  assert.equal(paper.cards["drill:1:writing"].attempts,0);
  assert.equal(getStudyEvidence(paper,1,"write").lastSuccess,0);
  assert.equal(studyRoundSummary(paper.study.active).paper,1);
});
test("same-day repetition does not fabricate later recall; elapsed-day success does",()=>{
  let p=submitStudyTask(atKind("write"),{correct:true},now);
  p=submitStudyTask(atKind("write",startStudyRound(p,{from:1,to:2},now+60000)),{correct:true},now+60000);
  assert.equal(getStudyEvidence(p,1,"write").laterSuccess,0);
  p=submitStudyTask(atKind("write",startStudyRound(p,{from:1,to:2,review:true},now+2*86400000)),{correct:true},now+2*86400000);
  assert.equal(getStudyEvidence(p,1,"write").laterSuccess,now+2*86400000);
});
test("malformed focused backup records and skipped tasks are rejected",()=>{
  const p=started();p.study.active.index=6;
  assert.throws(()=>validateProgress(p),/focused study/);
  const q=atKind("read");q.study.evidence={"write:301":{}};
  assert.throws(()=>validateProgress(q),/focused study/);
  validateProgress(emptyProgress());
});
test("failed writes leave the active task and evidence unchanged, then a retry succeeds",async()=>{
  let reject=true;const initial=atKind("write");
  const store=createProgressStore({read:async()=>JSON.stringify(initial),write:async()=>{if(reject)throw new Error("full");}});
  await store.initialize();
  await assert.rejects(store.update(p=>submitStudyTask(p,{correct:true},now)));
  assert.deepEqual(store.getSnapshot(),initial);
  reject=false;await store.update(p=>submitStudyTask(p,{correct:true},now));
  assert.equal(store.getSnapshot().cards["drill:1:writing"].streak,0);
  assert.equal(store.getSnapshot().study.active.feedback.correct,true);
});
test("due review stays in range and does not throw when all content has been introduced",()=>{
  let p=submitStudyTask(atKind("write"),{correct:true},now);
  assert.equal(getStudyOverview(p,{from:1,to:1},now+86400001).dueCount,1);
  p=startStudyRound(p,{from:1,to:1,review:true},now+86400001);
  assert.deepEqual(p.study.active.ids,[1]);
  assert.notEqual(getStudyTask(p.study.active).kind,"meet");
  assert.equal(p.study.active.tasks.length,p.study.active.ids.length);
  validateProgress(p);
});
test("a corrected device clock never creates an unreadable study backup",()=>{
  let p=submitStudyTask(atKind("write"),{correct:true},now);
  p=submitStudyTask(atKind("write",startStudyRound(p,{from:1,to:2},now-86400000)),{correct:false},now-86400000);
  assert.doesNotThrow(()=>validateProgress(JSON.parse(JSON.stringify(p))));
  assert.equal(getStudyEvidence(p,1,"write").lastSuccess,now);
});
test("a recent answer exposure cannot award spaced success or raise an existing streak",()=>{
  let p=submitStudyTask(atKind("write"),{correct:true},now);
  p.study.exposed[1]=now+2*86400000-1000;
  p=startStudyRound(p,{from:1,to:1,review:true},now+2*86400000);
  p=submitStudyTask(p,{correct:true},now+2*86400000);
  assert.equal(p.study.active.feedback.primed,true);
  assert.equal(getStudyEvidence(p,1,"write").laterSuccess,0);
  assert.equal(p.cards["drill:1:writing"].streak,0);
});
test("paper review defers the due write without claiming screen recall",()=>{
  let p=submitStudyTask(atKind("write"),{correct:true},now);
  p.cards["drill:1:reading"].due=now+100*86400000;
  p=startStudyRound(p,{from:1,to:1,review:true},now+86400000);
  assert.equal(getStudyTask(p.study.active).kind,"write");
  p=submitStudyTask(p,{correct:true,method:"paper"},now+86400000);
  assert.equal(p.cards["drill:1:writing"].streak,0);
  assert.equal(getStudyOverview(p,{from:1,to:1},now+86400000).dueCount,0);
});
test("guided misses repair practice without erasing legacy retention",()=>{
  let p=atKind("write");
  p.cards["drill:1:writing"]={attempts:4,misses:0,streak:4,due:now+86400000,lastReviewed:now-86400000,lastSuccess:now-86400000};
  p=submitStudyTask(p,{correct:false},now);
  assert.equal(p.cards["drill:1:writing"].streak,4);
  assert.equal(p.cards["drill:1:writing"].misses,0);
  assert.equal(p.cards["drill:1:writing"].due,now+60000);
});
test("the first day review is not blocked by the tail of the teaching round",()=>{
  let p=submitStudyTask(atKind("write"),{correct:true},now);
  p.study.exposed[1]=now+120000;
  p=startStudyRound(p,{from:1,to:1,review:true},now+86400000);
  p=submitStudyTask(p,{correct:true},now+86400000);
  assert.equal(p.study.active.feedback.primed,false);
  assert.equal(p.cards["drill:1:writing"].streak,1);
  assert.equal(getStudyEvidence(p,1,"write").laterSuccess,now+86400000);
});
test("word meaning reviews reuse increasing intervals instead of returning forever daily",()=>{
  let p=submitStudyTask(atKind("use",startStudyRound(emptyProgress(),{from:1,to:1},now)),{correct:true},now);
  for(const key of ["drill:1:reading","drill:1:writing"]) p.cards[key].due=now+100*86400000;
  for(const day of [1,2]){
    p=startStudyRound(p,{from:1,to:1,review:true},now+day*86400000);
    assert.equal(getStudyTask(p.study.active).kind,"use");
    p=submitStudyTask(p,{correct:true},now+day*86400000);
  }
  assert.equal(p.study.evidence["use:1"].review.streak,2);
  assert.equal(p.study.evidence["use:1"].review.due,now+5*86400000);
  validateProgress(JSON.parse(JSON.stringify(p)));
});
