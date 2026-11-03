import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,validateProgress} from '../src/study/progress.js';
import {startStudyRound,savedStudyRound,resumeStudyRound,getStudyTask,nextStudyTask,submitStudyTask} from '../src/study/studyRound.js';
import {recordReferenceExposure} from '../src/study/quickReference.js';
import {createProgressStore} from '../src/study/progressStore.js';

const now=1700000000000;
const range={from:191,to:200,custom:true};

test('custom 191–200 includes all ten characters in book order even when already introduced',()=>{
  const initial=emptyProgress();
  initial.study={introduced:{191:now-86400000,193:now-86400000}};
  const p=startStudyRound(initial,range,now);
  assert.deepEqual(p.study.active.ids,Array.from({length:10},(_,i)=>191+i));
  assert.equal(p.study.active.tasks.length,40);
  assert.deepEqual(p.study.active.tasks.slice(0,5),[
    {kind:'meet',id:191},{kind:'read',id:191},{kind:'write',id:191},{kind:'use',id:191},{kind:'meet',id:192},
  ]);
  assert.deepEqual(p.settings,initial.settings);
  assert.deepEqual(p.study.customRange,{from:191,to:200});
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p))),p);
});

test('a whole custom range completes, reloads and repeats the same exact range without recall promotion',()=>{
  let p=startStudyRound(emptyProgress(),range,now);
  for(let i=0;i<40;i++){
    const task=getStudyTask(p.study.active);
    assert.ok(task.word.reading);
    if(task.kind!=='meet') p=submitStudyTask(p,{correct:true},now+i);
    p=nextStudyTask(p,now+i);
    p=validateProgress(JSON.parse(JSON.stringify(p)));
  }
  assert.equal(p.study.active.index,40);
  assert.equal(p.study.active.results.length,30);
  assert.ok(Object.values(p.study.evidence).every(e=>e.primed && !e.laterSuccess));
  assert.ok(Object.values(p.cards).every(c=>c.streak===0));
  const repeated=startStudyRound(p,{from:p.study.active.from,to:p.study.active.to,custom:true},now+100);
  assert.deepEqual(repeated.study.active.ids,p.study.active.ids);
  assert.equal(repeated.study.active.index,0);
  assert.equal(nextStudyTask(repeated,now+101).study.introduced[191],now);
});

test('switching custom and daily preserves each partial round, including feedback, across reload',()=>{
  let p=nextStudyTask(startStudyRound(emptyProgress(),{from:1,to:17},now),now);
  p=submitStudyTask(p,{correct:true},now);
  const daily=p.study.active;
  p=startStudyRound(p,range,now+10);
  assert.deepEqual(savedStudyRound(p,'daily'),daily);
  p=nextStudyTask(p,now+11);
  p=recordReferenceExposure(p,[191],now+12);
  const custom=p.study.active;
  p=validateProgress(JSON.parse(JSON.stringify(p)));
  p=resumeStudyRound(p,'daily');
  assert.deepEqual(p.study.active,daily);
  assert.deepEqual(p.study.paused,custom);
  p=resumeStudyRound(p,'custom');
  assert.deepEqual(p.study.active,custom);
  assert.equal(p.study.active.helped,true);
  p=startStudyRound(p,{from:195,to:197,custom:true},now+20);
  assert.deepEqual(savedStudyRound(p,'daily'),daily);
  assert.deepEqual(p.settings,{from:1,to:17,newCount:5});
  validateProgress(p);
});

test('legacy daily rounds stay supported, and malformed custom or paused backups are rejected',()=>{
  const legacy=startStudyRound(emptyProgress(),{from:1,to:17},now);
  delete legacy.study.active.mode;
  delete legacy.study.active.from;
  delete legacy.study.active.to;
  validateProgress(legacy);
  assert.equal(savedStudyRound(legacy,'daily'),legacy.study.active);
  const p=startStudyRound(legacy,range,now+1);
  for(const mutate of [
    x=>x.study.active.ids.splice(0,1),
    x=>x.study.active.to=201,
    x=>x.study.active.mode='invalid',
    x=>x.study.active.review=true,
    x=>x.study.active.tasks.reverse(),
    x=>x.study.customRange.from=0,
    x=>x.study.paused.index=9,
    x=>x.study.paused.mode='custom',
  ]){
    const bad=structuredClone(p);mutate(bad);
    assert.throws(()=>validateProgress(bad),/focused study/);
  }
  const full=startStudyRound(emptyProgress(),{from:1,to:300,custom:true},now);
  assert.equal(full.study.active.ids.length,300);
  assert.equal(full.study.active.tasks.length,1200);
  validateProgress(full);
});

test('reference help also follows a paused daily answer',()=>{
  let p=nextStudyTask(startStudyRound(emptyProgress(),{from:1,to:2},now),now);
  p=nextStudyTask(p,now);
  assert.equal(getStudyTask(p.study.active).kind,'read');
  p=startStudyRound(p,range,now+1);
  p=recordReferenceExposure(p,[1],now+2);
  p=resumeStudyRound(p,'daily');
  assert.equal(p.study.active.helped,true);
});

test('failed custom start keeps daily progress and settings intact until a successful retry',async()=>{
  const initial=startStudyRound(emptyProgress(),{from:1,to:17},now);
  let fail=true;
  const store=createProgressStore({read:async()=>JSON.stringify(initial),write:async()=>{if(fail)throw Error('full');}});
  await store.initialize();
  await assert.rejects(store.update(p=>startStudyRound(p,range,now+1)));
  assert.deepEqual(store.getSnapshot(),initial);
  fail=false;
  await store.update(p=>startStudyRound(p,range,now+1));
  assert.deepEqual(savedStudyRound(store.getSnapshot(),'daily'),initial.study.active);
  assert.equal(store.getSnapshot().study.active.ids.length,10);
});
