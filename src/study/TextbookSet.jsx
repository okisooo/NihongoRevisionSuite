import { useRef, useState } from "react";
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const change = async action => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await updateProgress(p => changeTextbookPractice(p, { setId: set.id, wordIndex, action }));
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
      <div className="page-heading">
        <Link className="text-link" to="/">← study</Link>
        <p className="eyebrow">your book · 11 kanji · {set.words.length} words</p>
        <h1>{set.title}</h1>
        <p className="lead">the words from your pages, ready to practise.</p>
      </div>

      <nav className="tb-glyphs" aria-label="kanji in this set">
        {[...set.glyphs].map((glyph, index) => (
          <Link key={glyph} to={`/library/characters/${set.from + index}`} aria-label={`reference for ${glyph}`} lang="ja">{glyph}</Link>
        ))}
      </nav>

      <section className="sr-panel sr-now tb-practice" aria-labelledby="tb-title">
        {word ? <>
          <div className="tb-meta"><h2 id="tb-title">read the word</h2><span>{active.known.length} / {set.words.length} checked</span></div>
          <p className="sr-sub">say the reading and meaning, then check.</p>
          <p className="tb-word" lang="ja">{word.word}</p>
          <div className="tb-answer" aria-live="polite">
            {active.revealed ? <>
              <p className="tb-reading" lang="ja">{word.reading}</p>
              <p>{word.meaning}</p>
              {canSpeak() && <button type="button" className="text-button" onClick={() => say(word.reading)}><Volume2 size={16} /> listen</button>}
            </> : <p className="sr-sub">reading hidden</p>}
          </div>
          <div className="sr-actions">
            {active.revealed ? <>
              <button type="button" className="secondary-button" disabled={pending} onClick={() => change("again")}>again</button>
              <button type="button" className="primary-button" disabled={pending} onClick={() => change("known")}>got it <ArrowRight size={17} /></button>
            </> : <button type="button" className="primary-button" disabled={pending} onClick={() => change("reveal")}>show reading & meaning</button>}
          </div>
          <Link className="text-link tb-reference" to={`/library/characters/${word.characterId}`}>kanji #{word.characterId} · reference & stroke order</Link>
        </> : <>
          <h2 id="tb-title">all {set.words.length} words checked</h2>
          <p className="sr-sub">a full self-check round. come back later to see what sticks.</p>
          <div className="sr-actions"><button type="button" className="primary-button" disabled={pending} onClick={() => change("restart")}>practise again</button></div>
        </>}
        {error && <p role="alert" className="save-error sr-error">{error}</p>}
        <p className="tb-save">saved on this device · self-check practice</p>
      </section>

      <section className="sr-panel" aria-labelledby="tb-writing-title">
        <h2 id="tb-writing-title">write them from memory</h2>
        <p className="sr-sub">use the saved study rounds for these 11 characters. two at a time, with reading and writing checks.</p>
        <div className="sr-actions"><Link className="primary-button" to={`/?from=${set.from}&to=${set.to}`}>study & write 180–190 <ArrowRight size={17} /></Link></div>
      </section>

      <details className="sr-panel tb-list"><summary>all {set.words.length} words from the pages</summary>
        {set.words.map(item => <div className="tb-list-row" key={item.word}>
          <span lang="ja">{item.word}<small>{item.reading}</small></span><span>{item.meaning}</span>
        </div>)}
      </details>
    </div>
  );
}
