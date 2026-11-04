import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,validateProgress} from '../src/study/progress.js';
import {createProgressStore} from '../src/study/progressStore.js';
import {characterLesson} from '../src/study/characterLesson.js';
import {startStudyRound,getStudyTask,nextStudyTask,submitStudyTask,changeLessonPhase,revisitStudyLesson,studyWordKey,savedStudyRound,resumeStudyRound,getStudyOverview} from '../src/study/studyRound.js';
import {recordReferenceExposure} from '../src/study/quickReference.js';
const now=1700000000000;
const start=(from=191,to=191)=>startStudyRound(emptyProgress(),{from,to,custom:true,phased:true},now);
const json=p=>validateProgress(JSON.parse(JSON.stringify(p)));
function complete(p){
  while(getStudyTask(p.study.active)){
    if(getStudyTask(p.study.active).kind!=='meet') p=submitStudyTask(p,{correct:true},now+p.study.active.index);
    p=json(nextStudyTask(p,now+p.study.active.index));
  }
  return p;
}

test('phased ranges teach every ID and test each of the actual taught words before moving on',()=>{
  const p=start(191,200);json(p);
  assert.deepEqual(p.study.active.ids,Array.from({length:10},(_,i)=>191+i));
  for(const id of p.study.active.ids){
    const tasks=p.study.active.tasks.filter(t=>t.id===id);
    assert.equal(tasks[0].kind,'meet');assert.equal(tasks.at(-1).kind,'write');
    assert.deepEqual(tasks[0].words,characterLesson(id).words);
    assert.deepEqual(tasks.filter(t=>t.kind==='read').map(t=>t.word),tasks[0].words);
    assert.deepEqual(tasks.filter(t=>t.kind==='use').map(t=>t.word),tasks[0].words);
  }
  assert.equal(p.study.active.tasks.length,80);
  const full=start(1,300);assert.ok(full.study.active.tasks.length<=2400);json(full);
});

test('practice phases persist without advancing, scoring, or replacing either saved session',()=>{
  let p=startStudyRound(emptyProgress(),{from:1,to:2},now-10);
  const daily=p.study.active;
  p=startStudyRound(p,{from:191,to:200,custom:true,phased:true},now);
  p=changeLessonPhase(p,'practise',now+1);p=json(p);
  assert.equal(p.study.active.index,0);assert.equal(p.study.active.lessonPhase,'practise');
  assert.deepEqual(p.study.active.results,[]);assert.deepEqual(p.cards,{});assert.equal(p.study.evidence,undefined);
  p=changeLessonPhase(p,'learn',now+2);p=changeLessonPhase(p,'practise',now+3);
  assert.deepEqual(savedStudyRound(p,'daily'),daily);
  p=resumeStudyRound(p,'daily');p=json(p);p=resumeStudyRound(p,'custom');
  assert.equal(p.study.active.lessonPhase,'practise');
});

test('a legacy round still at its first teaching screen upgrades safely; partial answers are preserved',()=>{
  const legacy=startStudyRound(emptyProgress(),{from:191,to:200,custom:true},now);
  assert.equal(legacy.study.active.tasks.length,40);
  const upgraded=changeLessonPhase(legacy,'practise',now+1);json(upgraded);
  assert.equal(upgraded.study.active.tasks.length,80);
  assert.equal(upgraded.study.active.started,legacy.study.active.started);
  assert.deepEqual(upgraded.study.active.ids,legacy.study.active.ids);
  const partial=nextStudyTask(legacy,now+1);
  assert.equal(changeLessonPhase(partial,'practise',now+2),partial);
  json(partial);
});

test('word readings and meanings have separate practice records and cold reviews use that same word',()=>{
  let p=complete(start(191,200));
  const entries=Object.values(p.study.wordEvidence);
  assert.equal(entries.length,60);assert.equal(p.study.active.results.length,70);
  assert.ok(entries.every(e=>e.primed&&!e.laterSuccess&&e.review.streak===0));
  assert.equal(p.cards['drill:191:reading'],undefined,'a compound does not become a generic character reading record');
  const later=now+2*86400000;
  p=startStudyRound(p,{from:191,to:200,review:true},later);json(p);
  assert.equal(p.study.active.tasks.length,2);
  assert.ok(p.study.active.tasks.every(t=>t.kind!=='meet' && t.word));
  const task=getStudyTask(p.study.active);const key=studyWordKey(task);
  assert.deepEqual(task.word,{word:p.study.wordEvidence[key].word,reading:p.study.wordEvidence[key].reading,meaning:p.study.wordEvidence[key].meaning});
  p=submitStudyTask(p,{correct:true},later);json(p);
  assert.equal(p.study.wordEvidence[key].laterSuccess,later);
  assert.equal(p.study.wordEvidence[key].review.streak,1);
});

test('revisiting a missed check keeps the original answer and help, and never awards another result',()=>{
  let p=nextStudyTask(start(),now);
  p=submitStudyTask(p,{correct:false},now+1);const results=structuredClone(p.study.active.results);
  p=revisitStudyLesson(p);p=changeLessonPhase(p,'learn',now+2);p=json(p);
  assert.equal(p.study.active.relearning,true);assert.equal(p.study.active.lessonPhase,'learn');
  p=changeLessonPhase(p,'practise',now+3);p=revisitStudyLesson(p);p=json(p);
  assert.equal(p.study.active.relearning,false);assert.deepEqual(p.study.active.results,results);
  assert.equal(p.study.active.feedback.correct,false);
  assert.equal(submitStudyTask(p,{correct:true},now+4),p);
});

test('help during a word review cannot become later recall',()=>{
  let p=complete(start());p=startStudyRound(p,{from:191,to:191,review:true},now+2*86400000);
  const task=getStudyTask(p.study.active);const key=studyWordKey(task);
  p=recordReferenceExposure(p,[191],now+2*86400000);
  p=submitStudyTask(p,{correct:true},now+2*86400000);json(p);
  assert.equal(p.study.wordEvidence[key].laterSuccess,0);
  assert.equal(p.study.wordEvidence[key].assisted,true);
});

test('malformed phased plans and mismatched word results/evidence cannot be imported',()=>{
  const p=start();
  for(const mutate of [
    x=>x.study.active.tasks[0].words=[],
    x=>x.study.active.tasks[1].word.reading='',
    x=>x.study.active.tasks[1].word.word='invalid',
    x=>x.study.active.tasks.splice(1,1),
    x=>x.study.active.plan=3,
    x=>x.study.active.lessonPhase='other',
    x=>x.study.active.relearning=true,
  ]){const bad=structuredClone(p);mutate(bad);assert.throws(()=>json(bad),/focused study/);}
  const answered=submitStudyTask(nextStudyTask(p,now),{correct:true},now+1);
  const wrongResult=structuredClone(answered);wrongResult.study.active.results[0].word='wrong';assert.throws(()=>json(wrongResult));
  const wrongEvidence=structuredClone(answered);Object.values(wrongEvidence.study.wordEvidence)[0].id=192;assert.throws(()=>json(wrongEvidence));
});

test('failed phase saves preserve the current lesson until retry succeeds',async()=>{
  const initial=start();let fail=true;
  const store=createProgressStore({read:async()=>JSON.stringify(initial),write:async()=>{if(fail)throw Error('full');}});
  await store.initialize();await assert.rejects(store.update(p=>changeLessonPhase(p,'practise',now+1)));
  assert.deepEqual(store.getSnapshot(),initial);fail=false;
  await store.update(p=>changeLessonPhase(p,'practise',now+1));assert.equal(store.getSnapshot().study.active.lessonPhase,'practise');
  assert.equal(getStudyOverview(store.getSnapshot(),{from:191,to:191},now).dueCount,0);
});

test('reading feedback does not reveal a meaning that is still waiting to be checked',async()=>{
  const {studyFeedbackVisibility}=await import('../src/study/studyRound.js');
  let p=nextStudyTask(start(),now);
  assert.equal(getStudyTask(p.study.active).kind,'read');
  assert.deepEqual(studyFeedbackVisibility(p.study.active),{reading:true,meaning:false});
  p=nextStudyTask(submitStudyTask(p,{correct:true},now+1),now+2);
  assert.equal(getStudyTask(p.study.active).kind,'use');
  assert.deepEqual(studyFeedbackVisibility(p.study.active),{reading:true,meaning:true});
  const legacy=startStudyRound(emptyProgress(),{from:191,to:191},now);
  assert.equal(studyFeedbackVisibility(nextStudyTask(legacy,now).study.active).meaning,false);
});

test('a shared compound cannot award later recall for its other character right after feedback',()=>{
  let p=complete(start(198,199));
  const later=now+2*86400000;
  for(const card of Object.values(p.cards))card.due=later+86400000;
  for(const entry of Object.values(p.study.wordEvidence))entry.review.due=later+86400000;
  const shared=Object.values(p.study.wordEvidence).filter(e=>e.kind==='read' && e.word==='試験');
  assert.equal(shared.length,2);
  for(const entry of shared)entry.review.due=later;
  p=startStudyRound(p,{from:198,to:199,review:true},later);
  assert.deepEqual(p.study.active.ids,[198,199]);
  assert.ok(p.study.active.tasks.every(t=>t.word.word==='試験'));
  const firstKey=studyWordKey(getStudyTask(p.study.active));
  p=submitStudyTask(p,{correct:true},later);
  assert.equal(p.study.wordEvidence[firstKey].laterSuccess,later);
  p=nextStudyTask(p,later+1);
  const secondKey=studyWordKey(getStudyTask(p.study.active));
  p=submitStudyTask(p,{correct:true},later+2);json(p);
  assert.equal(p.study.wordEvidence[secondKey].primed,true);
  assert.equal(p.study.wordEvidence[secondKey].laterSuccess,0);
  assert.equal(p.study.wordEvidence[secondKey].review.streak,0);
});
