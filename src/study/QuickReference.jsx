import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Search, Volume2, X } from "lucide-react";
import { useProgress, updateProgress } from "./store";
import { primaryMeaning } from "./primaryMeanings";
import { Strokes } from "../rush/KanjiParts";
import { WritePad } from "../rush/WritePad";
import { say, canSpeak } from "../rush/audio";
import { textbookSets } from "../data/textbookSets.js";
import { commonWords } from "../rush/deck";
import { toHiragana } from "../utils/kanaConverter";
import { kanjiIdsInText, recordReferenceExposure, referenceCharacter, referenceContext, searchReference } from "./quickReference.js";
import "./quick-reference.css";
import { QuickReferenceContext, useQuickReference } from "./quickReferenceContext.js";

const tabs = ["meaning", "drawing", "words"];
const wordsFor = character => {
  const all = [...textbookSets.flatMap(s => s.words.filter(w => w.characterId === character.id)), ...commonWords(character, 5)];
  return all.filter((w, i) => all.findIndex(other => other.word === w.word && other.reading === w.reading) === i);
};
const visibleIds = (id, tab) => tab === "words" ? [id, ...kanjiIdsInText(wordsFor(referenceCharacter(id)).map(w => w.word).join(""))] : [id];

export function ReferenceButton({ id, tab = "meaning", children, className = "text-button" }) {
  const { openReference } = useQuickReference();
  return <button type="button" className={className} onClick={() => openReference(id, tab)}>{children}</button>;
}

export function QuickReferenceProvider({ children }) {
  const progress = useProgress();
  const { pathname } = useLocation();
  const target = useRef(null);
  const activity = useRef(null);
  const dialog = useRef(null);
  const searchInput = useRef(null);
  const returnFocus = useRef(null);
  const launcherFocus = useRef(null);
  const request = useRef(0);
  const retry = useRef(null);
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [contextIds, setContextIds] = useState([]);
  const [tab, setTab] = useState("meaning");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const register = useCallback(getTarget => {
    target.current = getTarget;
    return () => { if (target.current === getTarget) target.current = null; };
  }, []);

  const load = async (ids, commit) => {
    retry.current = () => load(ids, commit);
    const token = ++request.current;
    const owner = activity.current;
    const current = () => request.current === token && activity.current === owner;
    setLoading(true);
    setError("");
    try {
      await updateProgress(p => current() ? recordReferenceExposure(p, ids) : p);
      if (!current()) return;
      await owner?.onReveal?.(ids);
      if (current()) commit();
    } catch {
      if (request.current === token) setError("could not save this lookup. try again before opening the reference.");
    } finally {
      if (request.current === token) setLoading(false);
    }
  };
  const close = () => {
    request.current++;
    activity.current?.onClose?.();
    activity.current = null;
    setOpen(false);
  };
  const openReference = (id, nextTab = "meaning") => {
    if (busy.current || open) return;
    busy.current = true;
    returnFocus.current = launcherFocus.current?.isConnected ? launcherFocus.current : document.activeElement;
    launcherFocus.current = null;
    activity.current = target.current?.() || null;
    activity.current?.onOpen?.();
    const ids = [...new Set((id ? [id] : activity.current?.ids || referenceContext(pathname, progress)).map(Number))]
      .filter(referenceCharacter).slice(0, 8);
    setQuery("");
    setResults([]);
    setSelected(null);
    setContextIds([]);
    setTab(tabs.includes(nextTab) ? nextTab : "meaning");
    setOpen(true);
    load(ids.length ? visibleIds(ids[0], nextTab) : [], () => { setContextIds(ids); setSelected(ids[0] || null); }).finally(() => { busy.current = false; });
  };
  const choose = id => load(visibleIds(id, tab), () => { setSelected(id); setQuery(""); setResults([]); });
  const changeTab = name => {
    if (name === "words") return load(visibleIds(selected, name), () => setTab(name));
    request.current++;
    setLoading(false);
    setError("");
    setTab(name);
  };
  const search = value => {
    setQuery(value);
    setResults([]);
    const matches = searchReference(value);
    load(matches.map(c => c.id), () => setResults(matches));
  };

  useEffect(() => {
    if (!open) { returnFocus.current?.focus?.({ preventScroll:true }); return; }
    const element = dialog.current;
    element.showModal();
    searchInput.current?.focus({ preventScroll:true });
    return () => { element.close(); };
  }, [open]);

  const value = { isOpen: open, openReference, register };
  const character = referenceCharacter(selected);
  return <QuickReferenceContext.Provider value={value}>
    {children}
    <button type="button" className="qr-launcher" hidden={open || pathname === "/settings"} onPointerDown={() => { launcherFocus.current = document.activeElement; }} onClick={() => openReference()} aria-haspopup="dialog">
      <BookOpen size={17} aria-hidden="true" /> reference
    </button>
    {open && <dialog className="qr-sheet" ref={dialog} aria-labelledby="qr-title" onCancel={event => { event.preventDefault(); close(); }}
      onKeyDown={event => { event.stopPropagation(); if (event.key === "Escape") { event.preventDefault(); close(); } }}>
      <header className="qr-header"><h2 id="qr-title">quick reference</h2><button type="button" onClick={close} aria-label="close reference and return to study"><X size={20} /></button></header>
      <div className="qr-body">
        <label className="qr-search"><Search size={17} aria-hidden="true" /><span className="sr-only">find a kanji</span>
          <input ref={searchInput} type="search" placeholder="kanji, meaning, reading or number" value={query} onChange={event => search(event.target.value)} autoComplete="off" />
        </label>
        {error && <div className="qr-error" role="alert">{error}<button type="button" onClick={() => retry.current?.()}>retry</button></div>}
        {loading && (!character || query) && <p className="qr-status" role="status">opening reference…</p>}
        {!loading && results.length > 0 && <div className="qr-results" aria-label="search results">{results.map(c => <button key={c.id} type="button" onClick={() => choose(c.id)}><span lang="ja">{c.kanji}</span><span>{primaryMeaning(c)}<small>#{c.id}</small></span></button>)}</div>}
        {!loading && query && !results.length && !error && <p className="qr-status">no matching kanji</p>}
        {!query && contextIds.length > 1 && <div className="qr-context" aria-label="characters in this activity">{contextIds.map(id => <button type="button" key={id} aria-pressed={selected === id} onClick={() => choose(id)} aria-label={`character ${id}`}>#{id}</button>)}</div>}
        {character && !query && <>
          <div className="qr-character"><span lang="ja">{character.kanji}</span><div><strong>{primaryMeaning(character)}</strong><small>character {character.id}</small></div></div>
          <div className="qr-tabs" role="tablist" aria-label="reference sections">{tabs.map((name, index) => <button type="button" role="tab" key={name} id={`qr-tab-${name}`} aria-controls="qr-panel" aria-selected={tab === name} tabIndex={tab === name ? 0 : -1}
            onClick={() => changeTab(name)} onKeyDown={event => {
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next >= 0) { event.preventDefault(); changeTab(tabs[next]); document.getElementById(`qr-tab-${tabs[next]}`)?.focus(); }
            }}>{name}</button>)}</div>
          <section role="tabpanel" id="qr-panel" aria-labelledby={`qr-tab-${tab}`} tabIndex={0} key={`${character.id}:${tab}`}>
            {tab === "meaning" ? <ReferenceMeaning character={character} /> : tab === "drawing" ? <ReferenceDrawing character={character} /> : <ReferenceWords character={character} />}
          </section>
        </>}
        {!character && !loading && !query && !error && <p className="qr-status">search for a kanji to open its reference.</p>}
      </div>
      <footer className="qr-footer"><span>reference practice · no score</span><button type="button" onClick={close}>back to study</button></footer>
    </dialog>}
  </QuickReferenceContext.Provider>;
}

function ReferenceMeaning({ character }) {
  const format = list => (list || []).map(toHiragana).map(r => r.replace(/\.(.+)$/, "($1)"));
  return <div className="qr-meaning"><p>{character.meaning}</p>
    <dl>{[["native readings", format(character.kunyomi)], ["compound readings", format(character.onyomi)]].map(([label, values]) => values.length > 0 && <div key={label}><dt>{label}</dt><dd lang="ja">{values.join(" · ")}</dd></div>)}</dl>
  </div>;
}
function ReferenceWords({ character }) {
  const words = useMemo(() => wordsFor(character), [character]);
  return <div className="qr-words">{words.map(w => <div key={`${w.word}:${w.reading}`}><strong lang="ja">{w.word}</strong><span lang="ja">{w.reading}</span><p>{w.meaning}</p>{canSpeak() && <button type="button" onClick={() => say(w.reading)} aria-label={`listen to ${w.word}`}><Volume2 size={16} /></button>}</div>)}</div>;
}
function ReferenceDrawing({ character }) {
  const [mode, setMode] = useState("trace");
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState(false);
  const size = Math.min(280, window.innerWidth - 76);
  return <div className="qr-drawing"><Strokes kanji={character.kanji} size={window.innerWidth < 480 ? 96 : 120} />
    <div className="qr-modes" role="group" aria-label="drawing practice mode">{["trace", "blank"].map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => { setMode(value); setDone(false); setAttempt(n => n + 1); }}>{value === "trace" ? "trace" : "blank pad"}</button>)}</div>
    <WritePad key={attempt} kanji={character.kanji} mode={mode === "trace" ? "trace" : "recall"} size={size} onDone={() => setDone(true)} />
    {done && <p role="status">practice complete <button type="button" onClick={() => { setDone(false); setAttempt(n => n + 1); }}>again</button></p>}
  </div>;
}
