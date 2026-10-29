import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Volume2 } from "lucide-react";
import { textbookSetById } from "../data/textbookSets.js";
import { say, canSpeak } from "../rush/audio.js";
import { useProgress, updateProgress } from "./store";
import { changeTextbookPractice, getTextbookPractice } from "./textbookPractice.js";
import "./textbook-set.css";

export function TextbookSet() {
  const { setId } = useParams();
  const set = textbookSetById(setId);
  if (!set) return <div className="page sr-home"><h1>this set isn’t available</h1><Link to="/">back to study</Link></div>;
  return <TextbookLesson key={set.id} set={set} />;
}

function TextbookLesson({ set }) {
  const progress = useProgress();
  const active = getTextbookPractice(progress, set.id);
  const wordIndex = active.queue[0];
  const word = set.words[wordIndex];
  const busy = useRef(false);
  const primaryAction = useRef(null);
  const restoreFocus = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!pending && restoreFocus.current) {
      primaryAction.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [pending, wordIndex, active.revealed]);
  const change = async action => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await updateProgress(p => changeTextbookPractice(p, { setId: set.id, wordIndex, action }));
      restoreFocus.current = true;
      setError("");
    } catch {
      setError("your answer could not be saved. free some device storage and try again. this card has not advanced.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <div className="page sr-home tb-page">
      <header className="tb-heading">
        <Link className="text-link tb-back" to="/">← study</Link>
        <div className="tb-set-heading">
          <div><p className="tb-eyebrow">textbook</p><h1>{set.from}–{set.to}</h1></div>
          <p className="tb-set-count">{[...set.glyphs].length} kanji <span aria-hidden="true">·</span> {set.words.length} words</p>
        </div>
      </header>

      <section className="tb-practice" aria-labelledby="tb-title">
        <div className="tb-progress-head">
          <h2 id="tb-title">reading &amp; meaning</h2>
          <span>{active.known.length} / {set.words.length} checked</span>
        </div>
        <progress className="tb-progress" value={active.known.length} max={set.words.length} aria-label="words marked got it" />

        {word ? <>
          <p className="tb-word" lang="ja">{word.word}</p>
          <div className={`tb-answer${active.revealed ? " is-revealed" : ""}`} aria-live="polite" aria-atomic="true">
            {active.revealed ? <>
              <p className="tb-reading" lang="ja">{word.reading}</p>
              <p className="tb-meaning">{word.meaning}</p>
              {canSpeak() && <button type="button" className="tb-listen" onClick={() => say(word.reading)} aria-label="listen to reading">
                <Volume2 size={17} aria-hidden="true" /> listen
              </button>}
            </> : null}
          </div>
          <div className="tb-actions">
            {active.revealed ? <>
              <button type="button" className="secondary-button" disabled={pending} onClick={() => change("again")}>again</button>
              <button ref={primaryAction} type="button" className="primary-button" disabled={pending} onClick={() => change("known")}>got it <ArrowRight size={17} aria-hidden="true" /></button>
            </> : <button ref={primaryAction} type="button" className="primary-button tb-reveal" disabled={pending} onClick={() => change("reveal")}>show answer</button>}
          </div>
          <Link className="tb-word-reference" to={`/library/characters/${word.characterId}`} aria-label={`reference and stroke order for character ${word.characterId}`}>reference &amp; stroke order</Link>
        </> : <div className="tb-complete">
          <h3>round complete</h3>
          <p>all {set.words.length} words marked got it</p>
          <button ref={primaryAction} type="button" className="primary-button" disabled={pending} onClick={() => change("restart")}>practise again</button>
        </div>}
        {error && <p role="alert" className="tb-error">{error}</p>}
      </section>

      <section className="tb-writing" aria-labelledby="tb-writing-title">
        <div>
          <h2 id="tb-writing-title">writing practice</h2>
          <p>{[...set.glyphs].length} characters</p>
        </div>
        <Link className="tb-tool-link" to={`/?from=${set.from}&to=${set.to}`} aria-label={`writing practice for ${set.from} to ${set.to}`}>open <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>

      <div className="tb-references">
        <details>
          <summary>{[...set.glyphs].length} character references</summary>
          <nav className="tb-glyphs" aria-label="kanji references in this set">
            {[...set.glyphs].map((glyph, index) => (
              <Link key={glyph} to={`/library/characters/${set.from + index}`} aria-label={`reference for ${glyph}`} lang="ja">{glyph}</Link>
            ))}
          </nav>
        </details>
        <details className="tb-list">
          <summary>all {set.words.length} words</summary>
          <div className="tb-list-rows">
            {set.words.map(item => <div className="tb-list-row" key={item.word}>
              <span lang="ja">{item.word}<small>{item.reading}</small></span><span>{item.meaning}</span>
            </div>)}
          </div>
        </details>
      </div>
    </div>
  );
}
