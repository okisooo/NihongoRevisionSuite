import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HanziWriter from "hanzi-writer";
import { PenLine, Eye, Star } from "lucide-react";
import { primaryMeaning } from "../study/primaryMeanings";
import { kanjiDecompositions, componentsDb } from "../data/components";
import { commonWords } from "./deck";
import { matchKana, matchMeaning, romajiFor } from "./romaji";
import { charDataLoader, allowedMistakes } from "./strokes";
import { sfx, say } from "./audio";
import { WritePad } from "./WritePad";
import { useQuickReference } from "../study/quickReferenceContext.js";

export function SaveError({ error }) {
  return error ? (
    <p role="alert" className="save-error">
      {error}
    </p>
  ) : null;
}

export function Stars({ count, of = 3 }) {
  return (
    <span className="rush-stars" aria-label={`${count} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <Star key={i} size={15} className={i < count ? "on" : ""} fill={i < count ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

/** Stroke-order animation from the bundled Japanese data; tap to replay. */
export function Strokes({ kanji, size = 132 }) {
  const box = useRef(null);
  const writer = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = box.current;
    element.innerHTML = "";
    writer.current = HanziWriter.create(element, kanji, {
      width: size,
      height: size,
      padding: Math.round(size * 0.05),
      strokeAnimationSpeed: 1.4,
      delayBetweenStrokes: 140,
      strokeColor: "#2463eb",
      radicalColor: "#6aa0ff",
      outlineColor: "rgba(24, 45, 73, 0.08)",
      showCharacter: false,
      charDataLoader,
      onLoadCharDataError: () => setFailed(true),
    });
    writer.current.animateCharacter();
    return () => {
      writer.current = null;
      element.innerHTML = "";
    };
  }, [kanji, size]);
  return (
    <button
      type="button"
      className={`rush-strokes ${failed ? "is-failed" : ""}`}
      onClick={() => writer.current?.animateCharacter()}
      title="replay stroke order"
      aria-label="replay stroke order"
    >
      <span ref={box} />
      <small>{failed ? "stroke data unavailable" : "stroke order · tap to replay"}</small>
    </button>
  );
}

/** Everything needed to meet a new kanji. */
export function KanjiCard({ character, note }) {
  const parts = (kanjiDecompositions[character.kanji] || []).filter(
    (part) => typeof part === "string" && part !== character.kanji,
  );
  const words = commonWords(character, 3);
  const kun = (character.kunyomi || []).filter((r) => !r.startsWith("-") && !r.endsWith("-"));
  return (
    <div className="rush-card">
      <div className="rush-card-glyphs">
        <span className="rush-card-glyph" lang="ja">
          {character.kanji}
        </span>
        <Strokes kanji={character.kanji} />
      </div>
      <div className="rush-card-body">
        <p className="rush-card-meaning">{primaryMeaning(character)}</p>
        <div className="rush-card-readings" lang="ja">
          {kun.length > 0 && (
            <p>
              <b>訓</b>
              {kun.slice(0, 4).map((r) => (
                <span key={r}>{r.includes(".") ? r.replace(".", "(") + ")" : r}</span>
              ))}
            </p>
          )}
          {character.onyomi?.length > 0 && (
            <p>
              <b>音</b>
              {character.onyomi.slice(0, 3).map((r) => (
                <span key={r}>{r}</span>
              ))}
            </p>
          )}
        </div>
        {parts.length > 1 && (
          <p className="rush-card-parts">
            {parts.map((part, i) => (
              <span key={i}>
                {i > 0 && " + "}
                <b lang="ja">{part}</b> {componentsDb[part]?.meaning?.split(",")[0]}
              </span>
            ))}
            <small> — make a story from the parts</small>
          </p>
        )}
        {note && <p className="rush-card-note">“{note}”</p>}
        {words.length > 0 && (
          <div className="rush-card-words">
            {words.map((w) => (
              <span key={w.word + w.reading}>
                <b lang="ja">{w.word}</b>
                <span lang="ja">{w.reading}</span>
                {w.meaning && <small>{w.meaning}</small>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Type the shown answer once: You Can Kana's "suggested answer" step. */
export function CopyType({ step, onDone, voice }) {
  const { isOpen: referenceOpen } = useQuickReference();
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done || referenceOpen) return;
    const timer = setTimeout(onDone,380);
    return () => clearTimeout(timer);
  }, [done, referenceOpen, onDone]);
  const [bad, setBad] = useState(0);
  const composing = useRef(false);
  const meaning = step.type === "meaning";
  const check = (value) => (meaning ? matchMeaning([step.answer], value) : matchKana(step.answer, value));
  const accept = (value) => {
    if (done) return;
    const result = check(value);
    if (!result.ok && value.length >= text.length) {
      sfx.wrong();
      setBad((n) => n + 1);
      return;
    }
    if (value.length > text.length) sfx.key(value.length);
    setText(value);
    if (result.complete) {
      setDone(true);
      sfx.clear(3, false);
      if (voice && !meaning) say(step.answer);
    }
  };
  return (
    <div className="rush-copy">
      <p className="eyebrow">{step.note}</p>
      <p className="rush-copy-shown" lang="ja">
        {step.shown}
      </p>
      <p className="rush-copy-ghost" lang="ja">
        {step.answer}
        {!meaning && <small>{romajiFor(step.answer)}</small>}
      </p>
      <input
        autoFocus
        className={`rush-copy-input ${done ? "is-done" : ""} ${bad % 2 ? "shake-a" : bad ? "shake-b" : ""}`}
        value={text}
        onChange={(e) => (composing.current ? setText(e.target.value) : accept(e.target.value))}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={(e) => {
          composing.current = false;
          accept(e.currentTarget.value);
        }}
        placeholder={meaning ? "type the meaning" : "type it in romaji or kana"}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label={`type ${step.answer}`}
      />
    </div>
  );
}

/** Trace the character over its outline; strokes are still checked in order. */
export function CopyWrite({ character, onDone }) {
  const { isOpen: referenceOpen } = useQuickReference();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done || referenceOpen) return;
    const timer = setTimeout(onDone,200);
    return () => clearTimeout(timer);
  }, [done, referenceOpen, onDone]);
  return (
    <div className="rush-copy">
      <p className="eyebrow">書 write it · follow the outline in stroke order</p>
      <WritePad kanji={character.kanji} mode="trace" size={260} onDone={() => setDone(true)} />
    </div>
  );
}

/**
 * Free writing practice for the library page: trace with the outline, or
 * write from memory and get graded stroke by stroke.
 */
export function WritePractice({ character }) {
  const [mode, setMode] = useState("recall");
  const [round, setRound] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [result, setResult] = useState(null);
  const restart = (next = mode) => {
    setMode(next);
    setHinted(false);
    setResult(null);
    setRound((n) => n + 1);
  };
  return (
    <section className="write-practice">
      <p className="muted">reference practice · <Link className="text-link" to={`/?from=${character.id}&to=${character.id}`}>study this character with saved recall</Link></p>
      <div className="section-top">
        <h2>write</h2>
        <div className="write-modes" role="group" aria-label="writing mode">
          <button type="button" aria-pressed={mode === "recall"} className={mode === "recall" ? "on" : ""} onClick={() => restart("recall")}>
            <PenLine size={15} /> blank pad
          </button>
          <button type="button" aria-pressed={mode === "trace"} className={mode === "trace" ? "on" : ""} onClick={() => restart("trace")}>
            <Eye size={15} /> trace
          </button>
        </div>
      </div>
      <div className="write-practice-body">
        <WritePad
          key={`${mode}:${round}`}
          kanji={character.kanji}
          mode={mode}
          hinted={hinted}
          onDone={({ mistakes, strokes, assisted }) => setResult({ mistakes, clean: !assisted && mistakes <= allowedMistakes(strokes) })}
        />
        <div className="write-practice-side">
          <Strokes kanji={character.kanji} size={110} />
          {mode === "recall" && !hinted && !result && (
            <button type="button" className="text-button" onClick={() => setHinted(true)}>
              show outline
            </button>
          )}
          {result && (
            <p className={result.clean && !hinted ? "answer-good" : "muted"} role="status">
              {result.clean && !hinted
                ? `clean · ${result.mistakes} slip${result.mistakes === 1 ? "" : "s"}`
                : `${result.mistakes} mistakes · try once more`}
            </p>
          )}
          {result && (
            <button type="button" className="secondary-button" onClick={() => restart()}>
              again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Switch between the kana and kanji halves of the characters tab. */
export function TrackTabs({ current }) {
  return (
    <nav className="library-tabs track-tabs" aria-label="Characters">
      {[
        ["kana", "/kana", "かな kana"],
        ["kanji", "/kanji", "漢字 kanji"],
      ].map(([id, to, label]) => (
        <Link key={id} to={to} className={current === id ? "selected" : ""} aria-current={current === id ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
