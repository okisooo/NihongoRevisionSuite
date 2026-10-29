import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Eye } from "lucide-react";
import { useProgress, updateProgress } from "./store";
import { primaryMeaning } from "./primaryMeanings";
import { characterById } from "../rush/deck";
import { textbookSets } from "../data/textbookSets.js";
import { matchKana, matchMeaning, romajiFor } from "../rush/romaji";
import { allowedMistakes } from "../rush/strokes";
import { Strokes } from "../rush/KanjiParts";
import { WritePad } from "../rush/WritePad";
import {
  STUDY_CHAPTERS,
  getStudyOverview,
  startStudyRound,
  getStudyTask,
  submitStudyTask,
  revealStudyHelp,
  nextStudyTask,
  commitStudyPaper,
  commitStudySelfCheck,
} from "./studyRound.js";
import "./study-round.css";

const MAX_ID = 300;
const SAVE_FAILED =
  "progress could not be saved. free some device storage and try again. nothing was counted or advanced.";

/* ---------- shared helpers ---------- */

/** One save at a time; the screen only changes after the write has finished. */
function useSave() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const run = useCallback(async (change) => {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    try {
      await updateProgress(change);
      setError("");
      return true;
    } catch {
      setError(SAVE_FAILED);
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }, []);
  return { run, pending, error, clear: () => setError("") };
}

function SaveNote({ error }) {
  return error ? (
    <p role="alert" className="save-error sr-error">
      {error}
    </p>
  ) : null;
}

/** The active task, only while it still waits for an answer at this index. */
const waiting = (progress, index, started) => {
  const active = progress.study?.active;
  return active && active.index === index && active.started === started && !active.feedback ? active : null;
};
const finished = (active) => Boolean(active) && active.index >= active.tasks.length;
const unfinished = (active) => Boolean(active) && active.index < active.tasks.length;

const glyphOf = (id) => characterById(id)?.kanji ?? "";
const meaningOf = (id) => {
  const character = characterById(id);
  return character ? primaryMeaning(character) : "";
};

/** Accepted English senses taken from the taught word's gloss. */
function meaningAnswers(meaning) {
  const text = String(meaning || "").toLowerCase();
  const parts = text
    .replace(/\([^)]*\)/g, " ")
    .split(/[,;/]/)
    .map((part) => part.replace(/\s+/g, " ").trim().replace(/^to /, ""))
    .filter(Boolean);
  return [...new Set([...parts, text.replace(/\s+/g, " ").trim()])];
}

/** Pad size is measured once so a drawing in progress is never torn down. */
function usePadSize(ref) {
  const [size, setSize] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => {
      const width = element.clientWidth;
      if (!width) return;
      const wanted = width >= 560 ? 360 : 280;
      const room = Math.max(220, window.innerHeight - 340);
      setSize((previous) => previous || Math.max(200, Math.min(wanted, width, room)));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/** The sentence with the taught word marked; readings only when asked for. */
function SentenceText({ context, word, readings = false }) {
  const text = context.sentence;
  const at = word ? text.indexOf(word.word) : -1;
  if (at < 0) return <span lang="ja">{text}</span>;
  const target = (context.targets || []).find((t) => t.word === word.word && t.reading === word.reading);
  const inside =
    readings && target?.segments?.length
      ? target.segments.map((part, i) =>
          part.rt ? (
            <ruby key={i}>
              {part.ruby}
              <rt>{part.rt}</rt>
            </ruby>
          ) : (
            <span key={i}>{part.ruby}</span>
          ),
        )
      : word.word;
  return (
    <span lang="ja">
      {text.slice(0, at)}
      <mark className="sr-mark">{inside}</mark>
      {text.slice(at + word.word.length)}
    </span>
  );
}

/** The word with the target glyph left empty; the glyph never reaches the label. */
function BlankedWord({ word, glyph }) {
  const label = [...word].map((c) => (c === glyph ? "blank" : c)).join(" ");
  return (
    <span className="sr-blanked" lang="ja" role="img" aria-label={label}>
      {[...word].map((c, i) =>
        c === glyph ? <span key={i} className="sr-blank" aria-hidden="true" /> : <span key={i} aria-hidden="true">{c}</span>,
      )}
    </span>
  );
}

/* ---------- home ---------- */

const clampId = (value) => Math.min(MAX_ID, Math.max(1, Math.round(Number(value))));
function parseRange(from, to) {
  const a = Number(from);
  const b = Number(to);
  if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
  if (a < 1 || b > MAX_ID || a > b) return null;
  return { from: a, to: b };
}

export function StudyHome() {
  const progress = useProgress();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { run, pending, error, clear } = useSave();
  const active = progress.study?.active ?? null;
  const settings = progress.settings || {};
  const [fromText, setFromText] = useState(String(clampId(params.get("from") || settings.from || 1)));
  const [toText, setToText] = useState(String(clampId(params.get("to") || settings.to || MAX_ID)));
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null);
  const range = parseRange(fromText, toText);
  const overview = useMemo(
    () => (range ? getStudyOverview(progress, range) : { dueCount: 0, nextIds: [] }),
    [progress, range?.from, range?.to], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const choose = (from, to) => {
    setFromText(String(from));
    setToText(String(to));
    setNote("");
    setConfirm(null);
  };

  // Starting writes the chosen range as the default and the round in one save.
  const begin = async (options) => {
    const { from, to, review = false } = options;
    let probe;
    try {
      probe = startStudyRound(progress, { from, to, review });
    } catch (error) {
      setNote(error.message);
      return;
    }
    if (!probe.study?.active?.tasks?.length) {
      setNote(
        review
          ? "nothing is due in this range right now."
          : "everything in this range has already been met. choose another range, or review what is due.",
      );
      return;
    }
    setNote("");
    const saved = await run((p) =>
      startStudyRound({ ...p, settings: { ...p.settings, from, to } }, { from, to, review }, Date.now()),
    );
    if (saved) {
      setConfirm(null);
      navigate("/study/round");
    }
  };
  // A round in progress is never replaced until the learner says so.
  const ask = (options) => {
    clear();
    if (unfinished(active) && confirm?.key !== options.key) setConfirm(options);
    else begin(options);
  };

  const hasRange = Boolean(range);
  const startOptions = hasRange ? { ...range, key: "begin" } : null;
  const reviewOptions = hasRange ? { ...range, review: true, key: "review" } : null;
  const firstChapter = STUDY_CHAPTERS[0];
  const smallOptions = firstChapter ? { from: firstChapter.from, to: firstChapter.to, key: "small" } : null;
  const played = active ? Math.min(active.index, active.tasks.length) : 0;
  const textbook = (
    <section className="sr-textbook" aria-labelledby="sr-textbook-title">
      <h2 id="sr-textbook-title">textbook</h2>
      {textbookSets.map(set => (
        <Link className="sr-set-link" key={set.id} to={`/study/${set.id}`}>
          <span>
            <strong>{set.from}–{set.to}</strong>
            <small>{[...set.glyphs].length} kanji · {set.words.length} words</small>
          </span>
          <span className="sr-set-action">word practice <ArrowRight size={18} aria-hidden="true" /></span>
        </Link>
      ))}
    </section>
  );

  return (
    <div className="page sr-home sr-study-home">
      <header className="sr-home-heading"><h1>study</h1></header>
      {!unfinished(active) && textbook}

      <section className={`sr-panel sr-now${unfinished(active) ? " sr-resume" : ""}`} aria-labelledby="sr-now-title">
        {unfinished(active) ? (
          <>
            <h2 id="sr-now-title">your round</h2>
            <p className="sr-sub">
              step {played + 1} of {active.tasks.length}
              {active.ids?.length > 0 && (
                <>
                  {" · "}
                  <span>{`${active.ids.length} characters`}</span>
                </>
              )}
            </p>
            <div className="sr-actions">
              <Link className="primary-button" to="/study/round">
                continue round <ArrowRight size={18} />
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 id="sr-now-title">read &amp; write</h2>
            {overview.nextIds.length > 0 && (
              <div className="sr-next" role="group" aria-label={`${overview.nextIds.length} characters up next`}>
                {overview.nextIds.slice(0, 8).map((id) => (
                  <span key={id} lang={progress.study?.introduced?.[id] ? "en" : "ja"}>{progress.study?.introduced?.[id] ? `#${id}` : glyphOf(id)}</span>
                ))}
              </div>
            )}
            <p className="sr-sub">
              {hasRange
                ? `range ${range.from}–${range.to} · two characters per round`
                : "choose a range below"}
            </p>
            <div className="sr-actions">
              <button
                type="button"
                className="primary-button"
                disabled={pending || !hasRange}
                onClick={() => ask(startOptions)}
              >
                start round <ArrowRight size={18} />
              </button>
              {overview.dueCount > 0 && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={pending || !hasRange}
                  onClick={() => ask(reviewOptions)}
                >
                  review {overview.dueCount} due
                </button>
              )}
            </div>
            {finished(active) && (
              <p className="sr-sub">
                <Link className="text-link" to="/study/round">
                  last round
                </Link>
              </p>
            )}
          </>
        )}
        {unfinished(active) && (
          <div className="sr-actions sr-secondary-row">
            <button
              type="button"
              className="text-button"
              disabled={pending || !hasRange}
              onClick={() => ask(startOptions)}
            >
              start a different round
            </button>
            {overview.dueCount > 0 && (
              <button
                type="button"
                className="text-button"
                disabled={pending || !hasRange}
                onClick={() => ask(reviewOptions)}
              >
                review {overview.dueCount} due
              </button>
            )}
          </div>
        )}
        {confirm && (
          <div className="sr-confirm" role="alertdialog" aria-labelledby="sr-confirm-title">
            <p id="sr-confirm-title">
              replace this round? {played} of {active.tasks.length} steps done. saved results are kept.
            </p>
            <div className="sr-actions">
              <button type="button" className="primary-button" disabled={pending} onClick={() => ask(confirm)}>
                replace it
              </button>
              <button type="button" className="secondary-button" disabled={pending} onClick={() => setConfirm(null)}>
                keep my round
              </button>
            </div>
          </div>
        )}
        {note && (
          <p role="status" className="sr-note">
            {note}
          </p>
        )}
        <SaveNote error={error} />
      </section>

      {unfinished(active) && textbook}

      <details className="sr-range-picker">
        <summary>change range <span>{range ? `${range.from}–${range.to}` : "choose a valid range"}</span></summary>
        <div className="sr-chapters" role="group" aria-label="school character ranges">
          {STUDY_CHAPTERS.map((chapter) => {
            const on = range && range.from === chapter.from && range.to === chapter.to;
            return (
              <button
                key={chapter.id}
                type="button"
                className={`sr-chip ${on ? "on" : ""}`}
                aria-pressed={Boolean(on)}
                onClick={() => choose(chapter.from, chapter.to)}
              >
                {chapter.from}–{chapter.to}
              </button>
            );
          })}
        </div>
        <div className="sr-range">
          <label>
            <span>from</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={MAX_ID}
              value={fromText}
              onChange={(e) => {
                setFromText(e.target.value);
                setConfirm(null);
              }}
            />
          </label>
          <label>
            <span>to</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={MAX_ID}
              value={toText}
              onChange={(e) => {
                setToText(e.target.value);
                setConfirm(null);
              }}
            />
          </label>
        </div>
        {!hasRange && (
          <p role="alert" className="sr-note">
            use whole numbers from 1 to 300, with the start no later than the end.
          </p>
        )}
        {smallOptions && !unfinished(active) && (
          <p className="sr-small">
            <button type="button" className="text-button" disabled={pending} onClick={() => {
              choose(smallOptions.from, smallOptions.to);
              ask(smallOptions);
            }}>
              start at 1
            </button>
          </p>
        )}
      </details>

      <div className="sr-home-footer">
        <Link to="/play-room">practice games</Link>
        <Link to="/settings">backup &amp; settings</Link>
      </div>
    </div>
  );
}

/* ---------- round ---------- */

const KIND_LABEL = { meet: "meet", read: "read", write: "write", use: "use" };

export function StudyRound() {
  const progress = useProgress();
  const active = progress.study?.active ?? null;
  if (!active) {
    return (
      <div className="page sr-round">
        <div className="sr-panel sr-empty">
          <h1>no round in progress</h1>
          <Link className="primary-button" to="/study">
            choose a range <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }
  if (finished(active)) return <RoundSummary progress={progress} active={active} />;
  return <RoundStep key={`${active.started}:${active.index}`} active={active} />;
}

function RoundStep({ active }) {
  const task = getStudyTask(active);
  const ctl = useSave();
  const total = active.tasks.length;
  return (
    <div className="page sr-round">
      <header className="sr-top">
        <Link className="text-link" to="/study">
          ← study
        </Link>
        <span className="sr-count">
          step {active.index + 1} of {total}
        </span>
      </header>
      <ol className="sr-steps" aria-label="round progress">
        {active.tasks.map((item, i) => (
          <li
            key={i}
            className={i < active.index ? "done" : i === active.index ? "current" : ""}
            aria-current={i === active.index ? "step" : undefined}
          >
            <span className="sr-visually-hidden">
              {KIND_LABEL[item.kind]} {i < active.index ? "done" : i === active.index ? "now" : "later"}
            </span>
          </li>
        ))}
      </ol>
      {!task ? (
        <div className="sr-panel sr-empty">
          <h1>this step can’t be loaded</h1>
          <p className="sr-sub">the saved round is missing a step. you can pick a new set from the study page.</p>
          <Link className="primary-button" to="/study">
            go to study <ArrowRight size={18} />
          </Link>
        </div>
      ) : active.feedback ? (
        <Feedback task={task} active={active} ctl={ctl} />
      ) : task.kind === "meet" ? (
        <MeetTask task={task} active={active} ctl={ctl} />
      ) : task.kind === "read" ? (
        <ReadTask task={task} active={active} ctl={ctl} />
      ) : task.kind === "write" ? (
        <WriteTask task={task} active={active} ctl={ctl} />
      ) : (
        <UseTask task={task} active={active} ctl={ctl} />
      )}
      <SaveNote error={ctl.error} />
    </div>
  );
}

const submit = (index, started, result) => (p) => {
  const a = waiting(p, index, started);
  return a ? submitStudyTask(p, { assisted: Boolean(a.helped), method: "screen", mistakes: 0, ...result }) : p;
};
const reveal = (index, started) => (p) => (waiting(p, index, started) ? revealStudyHelp(p) : p);

/* meet: guided exposure, no credit */

function TraceBox({ glyph }) {
  const host = useRef(null);
  const size = usePadSize(host);
  const [traced, setTraced] = useState(false);
  return (
    <div className="sr-pad-host" ref={host}>
      {size > 0 && !traced && <WritePad kanji={glyph} mode="trace" size={size} onDone={() => setTraced(true)} />}
      {traced && <p className="sr-sub" role="status">traced · practice only</p>}
    </div>
  );
}

function MeetTask({ task, active, ctl }) {
  const [tracing, setTracing] = useState(false);
  const { word, sentence } = task;
  const next = () =>
    ctl.run((p) => {
      const a = p.study?.active;
      return a && a.started === active.started && a.index === active.index && !a.feedback ? nextStudyTask(p) : p;
    });
  return (
    <section className="sr-panel sr-task" aria-labelledby="sr-title">
      <p className="eyebrow">meet</p>
      <h1 id="sr-title" className="sr-visually-hidden">
        meet a new character
      </h1>
      <div className="sr-meet">
        <div className="sr-meet-glyph">
          <span className="sr-glyph" lang="ja">
            {task.character}
          </span>
          <p className="sr-meaning">{meaningOf(task.id)}</p>
        </div>
        <Strokes kanji={task.character} />
      </div>
      <div className="sr-word-card">
        <span className="sr-word" lang="ja">
          {word.word}
        </span>
        <span className="sr-reading" lang="ja">
          {word.reading}
        </span>
        {word.meaning && <span className="sr-gloss">{word.meaning}</span>}
      </div>
      {sentence && (
        <p className="sr-sentence">
          <SentenceText context={sentence} word={word} readings />
          {sentence.translation && <small>{sentence.translation}</small>}
        </p>
      )}
      {tracing ? (
        <TraceBox glyph={task.character} />
      ) : (
        <button type="button" className="text-button" onClick={() => setTracing(true)}>
          trace character
        </button>
      )}
      <div className="sr-actions">
        <button type="button" className="primary-button" disabled={ctl.pending} onClick={next}>
          continue <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

/* read: type the hidden reading */

function useTyped() {
  const [value, setValue] = useState("");
  const composing = useRef(false);
  const props = {
    value,
    onChange: (e) => setValue(e.target.value),
    onCompositionStart: () => {
      composing.current = true;
    },
    onCompositionEnd: (e) => {
      composing.current = false;
      setValue(e.currentTarget.value);
    },
    onKeyDown: (e) => {
      // Enter that confirms an IME conversion must not submit the answer.
      if (e.key === "Enter" && (composing.current || e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
    },
  };
  return [value, props, setValue];
}

function ReadTask({ task, active, ctl }) {
  const [value, inputProps] = useTyped();
  const { word, sentence } = task;
  const helped = Boolean(active.helped);
  const typed = value.trim();
  const check = (event) => {
    event.preventDefault();
    if (!typed) return;
    ctl.run(submit(active.index, active.started, { correct: matchKana(word.reading, typed).complete }));
  };
  return (
    <section className="sr-panel sr-task" aria-labelledby="sr-title">
      <p className="eyebrow">reading</p>
      <h1 id="sr-title" className="sr-prompt">
        read this word
      </h1>
      <div className="sr-word-card">
        <span className="sr-word big" lang="ja">
          {word.word}
        </span>
      </div>
      {sentence && (
        <p className="sr-sentence">
          <SentenceText context={sentence} word={word} />
        </p>
      )}
      {helped && (
        <p className="sr-model" role="status">
          answer shown: <b lang="ja">{word.reading}</b> <small>{romajiFor(word.reading)}</small>
          <br />
          <small>practice · answer shown</small>
        </p>
      )}
      <form onSubmit={check} className="sr-form">
        <label className="sr-input-label">
          <span className="sr-visually-hidden">your reading</span>
          <input
            {...inputProps}
            className="sr-input"
            lang="ja"
            autoFocus
            placeholder="type in romaji or kana"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="type the reading in romaji or kana"
          />
        </label>
        <div className="sr-actions">
          <button type="submit" className="primary-button" disabled={ctl.pending || !typed}>
            check <Check size={18} />
          </button>
          {!helped ? (
            <button type="button" className="secondary-button" disabled={ctl.pending} onClick={() => ctl.run(reveal(active.index, active.started))}>
              <Eye size={17} /> show answer
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              disabled={ctl.pending}
              onClick={() => ctl.run(submit(active.index, active.started, { correct: false }))}
            >
              move on
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

/* use: what does the taught word mean here */

function UseTask({ task, active, ctl }) {
  const [value, inputProps] = useTyped();
  const self = active.selfCheck ?? null;
  const { word, sentence } = task;
  const helped = Boolean(active.helped);
  const typed = value.trim();
  const answers = useMemo(() => meaningAnswers(word.meaning), [word.meaning]);
  const check = (event) => {
    event.preventDefault();
    if (!typed) return;
    if (matchMeaning(answers, typed).complete) ctl.run(submit(active.index, active.started, { correct: true }));
    else ctl.run(p => waiting(p,active.index,active.started) ? commitStudySelfCheck(p,typed) : p);
  };
  return (
    <section className="sr-panel sr-task" aria-labelledby="sr-title">
      <p className="eyebrow">use · {sentence ? "meaning in context" : "word meaning"}</p>
      <h1 id="sr-title" className="sr-prompt">
        what does <span lang="ja">{word.word}</span> mean{sentence ? " here" : ""}?
      </h1>
      {sentence && (
        <p className="sr-sentence big">
          <SentenceText context={sentence} word={word} />
        </p>
      )}
      {helped && (
        <p className="sr-model" role="status">
          answer shown: <b>{word.meaning}</b>
          <br />
          <small>practice · answer shown</small>
        </p>
      )}
      {self === null ? (
        <form onSubmit={check} className="sr-form">
          <label className="sr-input-label">
            <span className="sr-visually-hidden">your answer</span>
            <input
              {...inputProps}
              className="sr-input"
              autoFocus
              placeholder="type the meaning in english"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              aria-label="type the meaning in english"
            />
          </label>
          <div className="sr-actions">
            <button type="submit" className="primary-button" disabled={ctl.pending || !typed}>
              check <Check size={18} />
            </button>
            {!helped ? (
              <button type="button" className="secondary-button" disabled={ctl.pending} onClick={() => ctl.run(reveal(active.index, active.started))}>
                <Eye size={17} /> show answer
              </button>
            ) : (
              <button
                type="button"
                className="secondary-button"
                disabled={ctl.pending}
                onClick={() => ctl.run(submit(active.index, active.started, { correct: false }))}
              >
                move on
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="sr-selfcheck">
          <p>
            your answer: <b>{self}</b><br />
            meaning: <b>{word.meaning}</b>
          </p>
          <p>is your answer the same idea?</p>
          <div className="sr-actions">
            <button
              type="button"
              className="primary-button"
              disabled={ctl.pending}
              onClick={() => ctl.run(submit(active.index, active.started, { correct: true, method: "self" }))}
            >
              yes, same idea
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={ctl.pending}
              onClick={() => ctl.run(submit(active.index, active.started, { correct: false, method: "self" }))}
            >
              no, i missed it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* write: produce the blanked character */

function WriteTask({ task, active, ctl }) {
  const host = useRef(null);
  const size = usePadSize(host);
  const [mode, setMode] = useState(active.paperCommitted ? "paper" : "screen");
  const committed = Boolean(active.paperCommitted);
  const [lastResult, setLastResult] = useState(null);
  // A saved outline is already visible when a reload restores the round.
  const [startedHelped] = useState(Boolean(active.helped));
  const helped = Boolean(active.helped);
  const { word } = task;

  const finish = (outcome) => {
    setLastResult(outcome);
    return ctl.run(
      (p) => {
        const a = waiting(p, active.index, active.started);
        return a
          ? submitStudyTask(p, {
              correct: outcome.correct,
              assisted: outcome.assisted || Boolean(a.helped),
              method: outcome.method,
              mistakes: outcome.mistakes,
            })
          : p;
      },
    );
  };
  const onDone = ({ mistakes = 0, strokes = 0, assisted = false, failed = false }) =>
    finish({
      correct: !failed && mistakes <= allowedMistakes(strokes),
      assisted: Boolean(assisted) || Boolean(failed),
      method: "screen",
      mistakes,
    });
  const showOutline = () => ctl.run(reveal(active.index, active.started));
  const showModel = mode === "paper" && (committed || helped);

  return (
    <section className="sr-panel sr-task" aria-labelledby="sr-title">
      <p className="eyebrow">write · from the cue</p>
      <h1 id="sr-title" className="sr-prompt">
        write the missing character
      </h1>
      <div className="sr-cue">
        <p className="sr-meaning">{meaningOf(task.id)}</p>
        <div className="sr-word-card">
          <BlankedWord word={word.word} glyph={task.character} />
          <span className="sr-reading" lang="ja">
            {word.reading}
          </span>
          {word.meaning && <span className="sr-gloss">{word.meaning}</span>}
        </div>
      </div>
      <div className="sr-modes" role="group" aria-label="where will you write">
        <button
          type="button"
          className={mode === "screen" ? "on" : ""}
          aria-pressed={mode === "screen"}
          disabled={ctl.pending || committed}
          onClick={() => setMode("screen")}
        >
          on screen
        </button>
        <button
          type="button"
          className={mode === "paper" ? "on" : ""}
          aria-pressed={mode === "paper"}
          disabled={ctl.pending}
          onClick={() => setMode("paper")}
        >
          on paper
        </button>
      </div>

      {mode === "screen" ? (
        <div className="sr-pad-host" ref={host}>
          {size > 0 && (
            <WritePad
              kanji={task.character}
              mode={startedHelped ? "trace" : "recall"}
              hinted={helped}
              size={size}
              onDone={onDone}
              onAssisted={() => ctl.run(reveal(active.index, active.started))}
            />
          )}
        </div>
      ) : (
        <div className="sr-paper">
          {!committed ? (
            <>
              <p className="sr-sub">
                write from memory on paper, then check against the model.
              </p>
              {showModel && <PaperModel task={task} />}
              <div className="sr-actions">
                <button type="button" className="primary-button" disabled={ctl.pending} onClick={() => ctl.run(p => waiting(p,active.index,active.started) ? commitStudyPaper(p) : p)}>
                  check my writing
                </button>
              </div>
            </>
          ) : (
            <>
              <PaperModel task={task} />
              <p className="sr-sub">compare your writing · self-check</p>
              <div className="sr-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={ctl.pending}
                  onClick={() => finish({ correct: true, assisted: false, method: "paper", mistakes: 0 })}
                >
                  i remembered it
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={ctl.pending}
                  onClick={() => finish({ correct: false, assisted: false, method: "paper", mistakes: 0 })}
                >
                  again
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {!helped && !committed && (
        <div className="sr-help">
          <button type="button" className="text-button" disabled={ctl.pending} onClick={showOutline}>
            <Eye size={16} /> {mode === "screen" ? "show the outline" : "show me the character"}
          </button>
          <small>showing help counts as practice</small>
        </div>
      )}
      {helped && !committed && (
        <p className="sr-sub" role="status">
          practice · help shown
        </p>
      )}
      {lastResult && mode === "screen" && (
        <button type="button" className="secondary-button" disabled={ctl.pending} onClick={() => finish(lastResult)}>
          try saving again
        </button>
      )}
    </section>
  );
}

function PaperModel({ task }) {
  return (
    <div className="sr-model-glyph">
      <span className="sr-glyph" lang="ja">
        {task.character}
      </span>
      <Strokes kanji={task.character} size={120} />
    </div>
  );
}

/* feedback after a saved answer */

function Feedback({ task, active, ctl }) {
  const fb = active.feedback;
  const last = active.index === active.tasks.length - 1;
  const { word, sentence } = task;
  const next = () =>
    ctl.run((p) => {
      const a = p.study?.active;
      return a && a.started === active.started && a.index === active.index && a.feedback ? nextStudyTask(p) : p;
    });
  const paper = fb.method === "paper";
  let verdict;
  if (paper || fb.method === "self") verdict = fb.correct ? "you said you remembered it." : "you said you need another go.";
  else if (fb.correct) verdict = fb.assisted ? "right, with help." : "right.";
  else verdict = "not yet.";
  const slips = task.kind === "write" && !paper && fb.mistakes > 0 && fb.mistakes < 99;
  return (
    <section className={`sr-panel sr-task sr-feedback ${fb.correct ? "good" : "again"}`} aria-labelledby="sr-title">
      <p className="eyebrow">{KIND_LABEL[task.kind]} · result</p>
      <h1 id="sr-title" className="sr-prompt" role="status">
        {verdict}
      </h1>
      {fb.assisted && (
        <p className="sr-sub">
          {task.kind === "write"
            ? "practice · writing help shown"
            : "practice · answer shown"}
        </p>
      )}
      {slips && (
        <p className="sr-sub">
          {fb.mistakes} slip{fb.mistakes === 1 ? "" : "s"} along the way.
        </p>
      )}
      {paper && <p className="sr-sub">paper · self-checked</p>}
      {fb.primed && !fb.assisted && <p className="sr-sub">session practice · recently seen</p>}
      {fb.method === "self" && <p className="sr-sub">meaning · self-checked</p>}

      {task.kind === "write" ? (
        <div className="sr-answer">
          <PaperModel task={task} />
          <div className="sr-word-card">
            <span className="sr-word" lang="ja">
              {word.word}
            </span>
            <span className="sr-reading" lang="ja">
              {word.reading}
            </span>
            {word.meaning && <span className="sr-gloss">{word.meaning}</span>}
          </div>
        </div>
      ) : (
        <div className="sr-answer">
          <div className="sr-word-card">
            <span className="sr-word" lang="ja">
              {word.word}
            </span>
            <span className="sr-reading" lang="ja">
              {word.reading}
              {task.kind === "read" && <small> {romajiFor(word.reading)}</small>}
            </span>
            {word.meaning && <span className="sr-gloss">{word.meaning}</span>}
          </div>
          {sentence && (
            <p className="sr-sentence">
              <SentenceText context={sentence} word={word} readings />
              {sentence.translation && <small>{sentence.translation}</small>}
            </p>
          )}
        </div>
      )}
      <div className="sr-actions">
        <button type="button" className="primary-button" disabled={ctl.pending} onClick={next} autoFocus>
          {last ? "see summary" : "next"} <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

/* summary */

function outcomeLabel(r) {
  if (r.method === "self") return `self-check · ${r.correct ? "remembered" : "again"}`;
  if (r.method === "paper") return `paper · ${r.correct ? "remembered" : "again"}${r.assisted ? " · model shown first" : ""}`;
  if (r.assisted) return r.correct ? "right, with help" : "needed help";
  if (r.primed) return r.correct ? "practised without help" : "needs practice";
  return r.correct ? "on your own" : "not yet";
}

function RoundSummary({ progress, active }) {
  const ctl = useSave();
  const navigate = useNavigate();
  const settings = progress.settings || {};
  const range = {
    from: clampId(settings.from ?? 1),
    to: clampId(settings.to ?? MAX_ID),
  };
  const overview = useMemo(() => getStudyOverview(progress, range), [progress, range.from, range.to]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = useMemo(() => {
    const byIndex = new Map();
    for (const r of active.results || []) byIndex.set(r.index, r);
    return [...byIndex.values()].sort((a, b) => a.index - b.index);
  }, [active.results]);
  const of = (kind) => results.filter((r) => r.kind === kind);
  const solid = (list) => list.filter((r) => r.correct && !r.assisted && r.method === "screen").length;
  const reads = of("read");
  const uses = of("use");
  const writes = of("write");
  const screen = writes.filter((r) => r.method !== "paper");
  const paper = writes.filter((r) => r.method === "paper");
  const helped = results.filter((r) => r.assisted).length;
  const returned = results.filter(r => progress.study?.evidence?.[`${r.kind}:${r.id}`]?.laterSuccess === r.at).length;
  const met = active.tasks.filter((t) => t.kind === "meet").length;
  const lines = [
    reads.length && [`read without the reading shown`, `${solid(reads)} of ${reads.length}`],
    screen.length && [`wrote on screen without help`, `${solid(screen)} of ${screen.length}`],
    paper.length && [
      `wrote on paper (your own check)`,
      `${paper.filter((r) => r.correct).length} of ${paper.length} remembered`,
    ],
    uses.length && [`word meaning, checked unaided`, `${solid(uses)} of ${uses.length}`],
    uses.some(r=>r.method==="self") && [`meaning self-checks`, String(uses.filter(r=>r.method==="self").length)],
    helped > 0 && [`steps that needed help`, String(helped)],
    returned > 0 && [`recalled again after a day`, String(returned)],
    met > 0 && [`characters met (no score)`, String(met)],
  ].filter(Boolean);

  const again = (review) =>
    ctl.run((p) => {
      const a = p.study?.active;
      return finished(a) && a.started === active.started
        ? startStudyRound(p, { from: range.from, to: range.to, review }, Date.now())
        : p;
    }).then((saved) => saved && window.scrollTo?.(0, 0));

  return (
    <div className="page sr-round">
      <header className="sr-top">
        <Link className="text-link" to="/study">
          ← study
        </Link>
        <span className="sr-count">round finished</span>
      </header>
      <section className="sr-panel sr-task" aria-labelledby="sr-title">
        <h1 id="sr-title" className="sr-prompt">
          round complete
        </h1>
        <dl className="sr-tally">
          {lines.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <ul className="sr-results">
          {results.map((r) => (
            <li key={r.index} className={r.correct ? "good" : "again"}>
              <span lang="ja" className="sr-result-glyph">
                {glyphOf(r.id)}
              </span>
              <span>{KIND_LABEL[r.kind] ?? r.kind}</span>
              <span className="sr-result-out">{outcomeLabel(r)}</span>
            </li>
          ))}
        </ul>
        <p className="sr-sub">
          session results · later recall is checked in review.
        </p>
        <div className="sr-actions">
          <button type="button" className="primary-button" disabled={ctl.pending} onClick={() => again(false)}>
            another round <ArrowRight size={18} />
          </button>
          {overview.dueCount > 0 && (
            <button type="button" className="secondary-button" disabled={ctl.pending} onClick={() => again(true)}>
              review {overview.dueCount} due
            </button>
          )}
          <button type="button" className="text-button" onClick={() => navigate("/study")}>
            finish for now
          </button>
        </div>
        <SaveNote error={ctl.error} />
      </section>
    </div>
  );
}
