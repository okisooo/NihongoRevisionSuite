import test from "node:test";
import assert from "node:assert/strict";
import { emptyProgress, validateProgress, schedule, recordSessionAnswer } from "../src/study/progress.js";
import { startStudyRound, nextStudyTask, submitStudyTask, getStudyTask, commitStudyPaper } from "../src/study/studyRound.js";
import { recordReferenceExposure, referenceContext, searchReference } from "../src/study/quickReference.js";
import { createProgressStore } from "../src/study/progressStore.js";
import { buildDeck } from "../src/rush/deck.js";
import { createRun, tick, setPaused, referenceHints } from "../src/rush/engine.js";
import { startRound, currentPrompt, changeRound } from "../src/play/round.js";
import { cards } from "../src/study/content.js";
import { kanjiIdsInText } from "../src/study/quickReference.js";
import { changeTextbookPractice, getTextbookPractice } from "../src/study/textbookPractice.js";

const now = 1792759000000;
const day = 86400000;
const cold = id => startStudyRound({ ...emptyProgress(), cards: { [`drill:${id}:reading`]: schedule(null, true, now - 3 * day) } }, { from:id, to:id, review:true }, now);

test("a lookup preserves the step and results, records help, and cannot award a cold recall", () => {
  const p = cold(180);
  const next = recordReferenceExposure(p, [180], now);
  assert.equal(next.study.active.index, p.study.active.index);
  assert.equal(next.study.active.tasks, p.study.active.tasks);
  assert.equal(next.study.active.results, p.study.active.results);
  assert.equal(next.cards, p.cards);
  assert.equal(next.study.active.helped, true);
  const done = submitStudyTask(next, { correct:true }, now + 1000);
  assert.equal(done.study.active.feedback.assisted, true);
  assert.equal(done.study.evidence["read:180"].laterSuccess, 0);
  assert.equal(done.cards["drill:180:reading"].streak, p.cards["drill:180:reading"].streak);
  validateProgress(done);
});

test("other lookups do not mark the current answer helped, but protect a later cold check", () => {
  const p = recordReferenceExposure(cold(180), [181], now);
  assert.equal(p.study.active.helped, false);
  const review = startStudyRound({ ...p, cards: { ...p.cards, "drill:181:reading":schedule(null,true,now-3*day) } }, { from:181,to:181,review:true }, now+1000);
  const done = submitStudyTask(review, { correct:true }, now+2000);
  assert.equal(done.study.active.feedback.primed, true);
  assert.equal(done.study.evidence["read:181"].laterSuccess, 0);
  assert.equal(done.cards["drill:181:reading"].streak, 1);
  validateProgress(done);
});

test("committed paper and recorded feedback are not retroactively changed by reference", () => {
  let p = startStudyRound(emptyProgress(), { from:180,to:180 }, now);
  p = nextStudyTask(p,now);
  p = nextStudyTask(submitStudyTask(p,{correct:true},now),now);
  assert.equal(getStudyTask(p.study.active).kind, "write");
  p = commitStudyPaper(p);
  const checked = recordReferenceExposure(p,[180],now+1);
  assert.equal(checked.study.active, p.study.active);
  const done = submitStudyTask(checked,{correct:true,method:"paper"},now+2);
  assert.equal(recordReferenceExposure(done,[180],now+3).study.active, done.study.active);
});

test("invalid IDs do nothing and reference timestamps never move backwards", () => {
  const p = emptyProgress();
  assert.equal(recordReferenceExposure(p,[-1,0,301,NaN]),p);
  const shown = recordReferenceExposure(p,[180],now);
  assert.equal(recordReferenceExposure(shown,[180],now-1000).study.exposed[180],now);
  validateProgress(shown);
});

test("legacy self-check sessions keep their place and cannot count a looked-up answer as unaided", () => {
  const key = "character:180:reading";
  const p = { ...emptyProgress(), active:{mode:"review",queue:[key],index:0,correct:0,retried:[],started:now} };
  const shown = recordReferenceExposure(p,[180],now);
  assert.deepEqual(shown.active.hints,[0]);
  assert.equal(shown.active.index,0);
  const done = recordSessionAnswer(shown,key,0,true,now+1);
  assert.equal(done.active.correct,0);
  assert.equal(done.cards[key].streak,0);
  validateProgress(done);
});

test("word practice and saved rounds resolve to the current character rather than the start of a set", () => {
  const p = cold(181);
  assert.deepEqual(referenceContext("/study/round",p),[181]);
  assert.deepEqual(referenceContext("/study/180-190",emptyProgress()),[180]);
  let textbook = emptyProgress();
  for (let i=0;i<5;i++) for (const action of ["reveal","known"])
    textbook = changeTextbookPractice(textbook,{setId:"180-190",wordIndex:getTextbookPractice(textbook,"180-190").queue[0],action});
  assert.deepEqual(referenceContext("/study/180-190",textbook),[181]);
  assert.deepEqual(referenceContext("/library/characters/190",p),[190]);
  assert.deepEqual(referenceContext("/grammar/1",p),[]);
  assert.equal(searchReference("180")[0].id,180);
  assert.ok(searchReference("inhabit").some(c=>c.id===180));
  assert.deepEqual(searchReference("impossible-search-string"),[]);
});

test("grammar lookups mark help only when the reference teaches a character in the tested pattern", () => {
  const card = Object.values(cards).find(c => c.pattern && kanjiIdsInText(c.pattern.pattern).length);
  const id = kanjiIdsInText(card.pattern.pattern)[0];
  const p = { ...emptyProgress(), active:{mode:"lesson",queue:[card.key],index:0,correct:0,retried:[],started:now} };
  const other = Array.from({length:300},(_,i)=>i+1).find(id=>!kanjiIdsInText(card.pattern.pattern).includes(id));
  assert.equal(recordReferenceExposure(p,[other],now).active,p.active);
  const shown = recordReferenceExposure(p,[id],now);
  assert.deepEqual(shown.active.hints,[0]);
  validateProgress(shown);
});

test("a paused arena preserves time and its prompt, and a reference hints only matching kanji once", () => {
  const run = createRun({mode:"practice",deck:buildDeck({ids:[180],kinds:["reading"]}),seed:1});
  tick(run,300);
  assert.equal(run.targets.length,1);
  setPaused(run,true);
  const t = run.t, uid = run.targets[0].uid;
  assert.equal(referenceHints(run,[181]).length,0);
  assert.equal(referenceHints(run,[180]).length,1);
  assert.equal(run.hints,1);
  assert.equal(referenceHints(run,[180]).length,0);
  tick(run,5000);
  assert.equal(run.t,t);
  assert.equal(run.targets[0].uid,uid);
  assert.equal(run.targets[0].hinted,true);
});

test("flow practice looks up an answer without advancing or awarding clean recall", () => {
  let p = startRound(emptyProgress(),"kanji","36",now,()=>.42);
  while (p.flow.queue[0]?.guide) {
    p = changeRound(p,"answer",currentPrompt(p.flow).answers[0],now);
    p = changeRound(p,"next",null,now);
  }
  const id = currentPrompt(p.flow).kanjiIds[0];
  const shown = recordReferenceExposure(p,[id],now);
  assert.equal(shown.flow.queue,p.flow.queue);
  assert.equal(shown.flow.assisted,true);
  const done = changeRound(shown,"answer",currentPrompt(shown.flow).answers[0],now+1);
  assert.equal(done.flow.clean,p.flow.clean);
  assert.equal(done.flow.feedback.kind,"repair");
  validateProgress(done);
});

test("a failed save cannot commit reference exposure or change the active step", async () => {
  const initial = cold(180);
  const store = createProgressStore({read:async()=>JSON.stringify(initial),write:async()=>{throw new Error("storage unavailable");}});
  await store.initialize();
  await assert.rejects(store.update(p=>recordReferenceExposure(p,[180],now)));
  assert.deepEqual(store.getSnapshot(),initial);
});
