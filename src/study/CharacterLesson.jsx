import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { characterLesson } from "./characterLesson.js";
import { changeLessonPhase } from "./studyRound.js";
import { kanjiIdsInText, recordReferenceExposure } from "./quickReference.js";
import { Strokes } from "../rush/KanjiParts";
import { WritePad } from "../rush/WritePad";
import { FreePracticePad } from "./FreePracticePad.jsx";
import { updateProgress } from "./store";

export function LessonPhases({ phase }) {
  return <ol className="sr-phases" aria-label="learning phases">
    {["learn","practise","check"].map((label,i)=><li key={label} aria-current={phase===label ? "step" : undefined} className={phase===label ? "current" : ""}><span>{i+1}</span>{label}</li>)}
  </ol>;
}

function LessonWords({ words }) {
  return <ul className="sr-lesson-words">{words.map(word=><li key={`${word.word}:${word.reading}`}>
    <div><strong lang="ja">{word.word}</strong><span lang="ja">{word.reading}</span></div>
    <p>{word.meaning}</p>
  </li>)}</ul>;
}

function RepeatedTracing({ glyph }) {
  const host=useRef(null);
  const [size,setSize]=useState(0);
  const [attempt,setAttempt]=useState(0);
  const [done,setDone]=useState(false);
  useLayoutEffect(()=>{setSize(Math.max(160,Math.min(280,host.current.clientWidth-2)));},[]);
  return <div className="sr-repeated-trace" ref={host}>
    {size>0 && <WritePad key={attempt} kanji={glyph} mode="trace" size={size} onDone={()=>setDone(true)} />}
    {done && <p role="status" className="sr-sub">traced · practice only</p>}
    <button type="button" className="secondary-button" onClick={()=>{setDone(false);setAttempt(n=>n+1);}}>draw again</button>
  </div>;
}

export function CharacterLesson({ task, active, ctl, onReady }) {
  const lesson=useMemo(()=>characterLesson(task.id),[task.id]);
  const pinned=active.tasks.find(t=>t.id===task.id && t.kind==="meet")?.words;
  const words=pinned || lesson.words;
  const extras=lesson.extraWords.filter(w=>!words.some(main=>main.word===w.word));
  const phase=active.lessonPhase || "learn";
  const [mode,setMode]=useState("free");
  const [extra,setExtra]=useState(false);
  const [ready,setReady]=useState(false);
  const [exposureError,setExposureError]=useState("");
  const [exposurePending,setExposurePending]=useState(false);
  const exposureBusy=useRef(false);
  const owner=useRef({started:active.started,index:active.index});
  const initialExposure=useRef(null);
  const expose=async (shown,commit) => {
    if(exposureBusy.current)return false;
    exposureBusy.current=true;
    setExposurePending(true);
    const ids=kanjiIdsInText(task.character+shown.map(w=>w.word).join(""));
    try {
      await updateProgress(p=>{
        const a=p.study?.active;
        return a && a.started===owner.current.started && a.index===owner.current.index ? recordReferenceExposure(p,ids) : p;
      });
      setExposureError("");
      commit();
      return true;
    } catch {
      setExposureError("could not save this lesson lookup. try again before showing the answers.");
      return false;
    } finally {
      exposureBusy.current=false;
      setExposurePending(false);
    }
  };
  useLayoutEffect(()=>{
    let alive=true;
    initialExposure.current ??= expose(words,()=>{});
    initialExposure.current.then(saved=>{if(alive && saved)setReady(true);});
    return ()=>{alive=false;};
    // One exposure save before displaying this lesson, never on each pen stroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const heading=useRef(null);
  useLayoutEffect(()=>{if(ready)heading.current?.focus({preventScroll:true});},[phase,ready]);
  const changePhase=next=>ctl.run(p=>{
    const a=p.study?.active;
    return a && a.started===owner.current.started && a.index===owner.current.index ? changeLessonPhase(p,next) : p;
  });
  const pending=ctl.pending || exposurePending;
  if(!ready) return <section className="sr-panel sr-task"><p className="sr-sub">{exposureError || "opening lesson…"}</p>{exposureError && <button type="button" className="secondary-button" disabled={pending} onClick={()=>expose(words,()=>setReady(true))}>try again</button>}</section>;
  return <section className="sr-panel sr-task sr-character-lesson" aria-labelledby="sr-title">
    <LessonPhases phase={phase} />
    <div className="sr-lesson-heading">
      <span className="sr-lesson-glyph" lang="ja">{task.character}</span>
      <div><p className="eyebrow">character {task.id}</p><h1 id="sr-title" className="sr-prompt" tabIndex={-1} ref={heading}>{phase === "learn" ? "meaning & useful words" : "make it familiar"}</h1>
        <p className="sr-lesson-meanings">{lesson.meanings.join(" · ")}</p>
      </div>
    </div>
    <div className={`sr-lesson-body ${phase === "practise" ? "is-practising" : ""}`}>
      <div className="sr-lesson-reference">
        <h2>start with these words</h2>
        <LessonWords words={words} />
        {extras.length>0 && <div className="sr-extra-words">
          <button type="button" className="text-button" aria-expanded={extra} aria-controls="sr-extra-word-list" disabled={pending} onClick={()=>extra ? setExtra(false) : expose(extras,()=>setExtra(true))}>{extra ? "hide" : "more words"} · {extras.length} extra examples <span aria-hidden="true">{extra ? "−" : "+"}</span></button>
          {extra && <div id="sr-extra-word-list"><p className="sr-sub">optional examples · learn the main words first</p><LessonWords words={extras} /></div>}
        </div>}
      </div>
      {phase === "practise" ? <div className="sr-lesson-drawing">
        <p className="sr-practice-cue"><strong lang="ja">{task.character}</strong> {lesson.meanings.join(" · ")}</p>
        <div className="sr-modes" role="group" aria-label="practice drawing mode">
          <button type="button" aria-pressed={mode==="free"} className={mode==="free" ? "on" : ""} onClick={()=>setMode("free")}>free drawing</button>
          <button type="button" aria-pressed={mode==="trace"} className={mode==="trace" ? "on" : ""} onClick={()=>setMode("trace")}>guided tracing</button>
        </div>
        {mode==="free" ? <FreePracticePad glyph={task.character} /> : <RepeatedTracing glyph={task.character} />}
        <button type="button" className="primary-button sr-ready-button" disabled={pending} onClick={onReady}>{active.relearning ? "back to my result" : "i’m ready · test me"} <ArrowRight size={18} /></button>
        <p className="sr-sub">draw as much as you like. nothing advances until you’re ready.</p>
        <details><summary>stroke order</summary><Strokes kanji={task.character} size={200} /></details>
      </div> : <div className="sr-lesson-strokes"><Strokes kanji={task.character} size={200} /></div>}
    </div>
    {exposureError && <p role="alert" className="save-error">{exposureError}</p>}
    <div className="sr-actions">
      {phase === "learn" ? <button type="button" className="primary-button" disabled={pending} onClick={()=>changePhase("practise")}>start practising <ArrowRight size={18} /></button> : <>
        <button type="button" className="text-button" disabled={pending} onClick={()=>changePhase("learn")}>back to meanings</button>
      </>}
    </div>
  </section>;
}
