import { useEffect, useRef, useState } from "react";
import { Heart, Pause, Play, Lightbulb, Flame, X, Volume2 } from "lucide-react";
import {
  createRun,
  tick,
  input,
  confirm,
  hint,
  drain,
  completeWrite,
  setPaused,
  quit,
  matchTarget,
  multiplier,
  accuracy,
  FEVER_COMBO,
} from "./engine.js";
import { previewKana } from "./romaji.js";
import { sfx, say, setSound } from "./audio.js";
import { WritePad } from "./WritePad.jsx";
import { allowedMistakes } from "./strokes.js";

const ROWS = 3;
const colsFor = (width) => (width >= 860 ? 4 : width >= 520 ? 3 : 2);
const KIND_MARK = { reading: "読", kana: "読", meaning: "意", word: "語", write: "書", listen: "聴" };
const KIND_TIP = {
  reading: "type a reading in romaji or kana",
  kana: "type its romaji",
  meaning: "type an English meaning",
  word: "type the word’s reading",
  write: "write it, stroke by stroke",
  listen: "listen, then type what you hear",
};
const FX_MS = { pop: 900, miss: 1700, banner: 1100 };
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function place(slot, uid, cols, single) {
  // One-at-a-time practice keeps the prompt centre stage.
  if (single) return { left: "50%", top: "46%" };
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  const jx = (((uid * 53) % 9) - 4) * 1.1;
  const jy = (((uid * 29) % 7) - 3) * 1.8;
  return {
    left: `${((col + 0.5) / cols) * 100 + jx}%`,
    // Rows sit between 20% and 72% so answers never collide with the HUD or input.
    top: `${8 + ((row + 0.5) / ROWS) * 78 + jy}%`,
  };
}

function typedPreview(run) {
  if (!run.buffer) return "";
  let best = null;
  for (const target of run.targets) {
    const match = matchTarget(target.prompt, run.buffer);
    if (!match.ok) continue;
    if (target.prompt.kind === "meaning") best ??= { text: run.buffer, matched: 0 };
    else if (!best || match.matched > best.matched)
      best = { text: previewKana(match.answer, run.buffer), matched: match.matched };
  }
  return best?.text || run.buffer;
}

function snapshot(run, fx, now) {
  const targets = run.targets.map((target) => {
    const match = run.buffer ? matchTarget(target.prompt, run.buffer) : null;
    const left = target.born + target.life - run.t;
    return {
      uid: target.uid,
      slot: target.slot,
      text: target.prompt.text,
      kind: target.prompt.kind,
      reveal: target.prompt.reveal,
      cue: target.prompt.cue,
      say: target.prompt.say,
      frac: Number.isFinite(target.life) ? Math.max(0, Math.min(1, left / target.life)) : 1,
      hinted: target.hinted,
      typing: Boolean(match?.ok),
      pending: run.pending === target.uid,
    };
  });
  return {
    targets,
    writing: targets.length > 0 && targets.every((t) => t.kind === "write"),
    kinds: run.kinds,
    preview: typedPreview(run),
    score: run.score,
    combo: run.combo,
    mult: multiplier(run.combo),
    fever: run.combo >= FEVER_COMBO,
    lives: run.lives,
    maxLives: run.rules.maxLives,
    level: run.level,
    clears: run.clears,
    goal: run.goal,
    left: run.queue ? run.queue.length + run.targets.length : null,
    accuracy: accuracy(run),
    timed: run.rules.timed,
    paused: run.paused,
    over: run.over,
    won: run.won,
    fx: fx.map((item) => ({ ...item, age: (now - item.born) / FX_MS[item.kind] })),
  };
}

/**
 * The play field. `makeDeck(now)` runs once at mount, so the deck reflects the
 * latest progress. `onFinish(run)` fires once, shortly after the run ends.
 * Remount with a new key to start a fresh run.
 */
export function Arena({ mode, makeDeck, goal, palette, sound = true, voice = false, onFinish, onExit, label }) {
  const [cols] = useState(() => colsFor(window.innerWidth));
  const [padSize] = useState(() =>
    Math.round(Math.max(200, Math.min(300, window.innerWidth - 110, window.innerHeight * 0.42))),
  );
  const [view, setView] = useState(null);
  const [text, setText] = useState("");
  const [started, setStarted] = useState(false);
  const [shake, setShake] = useState(0);
  const [inputShake, setInputShake] = useState(0);
  const runRef = useRef(null);
  const fxRef = useRef([]);
  const inputRef = useRef(null);
  const composing = useRef(false);
  const finished = useRef(false);
  const handlers = useRef({});
  const single = mode === "practice";

  useEffect(() => {
    handlers.current = { finish: onFinish, voice };
    setSound(sound);
  });

  useEffect(() => {
    const run = createRun({
      mode,
      deck: makeDeck(Date.now()),
      goal,
      seed: (performance.now() * 1000) >>> 0,
      slots: cols * ROWS,
    });
    run.paused = true;
    run.kinds = [...new Set(run.deck.map((p) => p.kind))];
    runRef.current = run;
    fxRef.current = [];
    finished.current = false;
    let frame;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(100, now - last);
      last = now;
      tick(run, dt);
      react(drain(run));
      fxRef.current = fxRef.current.filter((item) => now - item.born < FX_MS[item.kind]);
      setView(snapshot(run, fxRef.current, now));
      if (run.over && !finished.current) {
        finished.current = true;
        setTimeout(() => handlers.current.finish?.(run), 900);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const away = () => {
      if (!run.over && !run.paused && document.visibilityState !== "visible") setPaused(run, true);
    };
    const blur = () => {
      if (!run.over && !run.paused && run.t > 0 && run.rules.timed) setPaused(run, true);
    };
    document.addEventListener("visibilitychange", away);
    window.addEventListener("blur", blur);
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", away);
      window.removeEventListener("blur", blur);
    };
    // A run lives for the life of this component; remount to restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function react(events) {
    const now = performance.now();
    const quiet = reducedMotion();
    for (const event of events) {
      if (event.type === "spawn" && event.target.prompt.kind === "listen") say(event.target.prompt.say, { rate: 0.85 });
      else if (event.type === "clear") {
        sfx.clear(runRef.current.combo, event.fever);
        if (handlers.current.voice)
          say(event.target.prompt.kind === "meaning" || event.target.prompt.kind === "write"
            ? event.target.prompt.say
            : event.answer || event.target.prompt.say);
        fxRef.current.push({
          id: `p${event.target.uid}`,
          kind: "pop",
          slot: event.target.slot,
          uid: event.target.uid,
          text: event.target.prompt.text,
          reveal: event.target.prompt.reveal,
          points: event.points,
          mult: event.mult,
          clean: event.clean,
          born: now,
        });
        if (event.fever && runRef.current.combo === FEVER_COMBO)
          fxRef.current.push({ id: `f${now}`, kind: "banner", text: "fever ×2", born: now });
      } else if (event.type === "miss") {
        sfx.miss();
        fxRef.current.push({
          id: `m${event.target.uid}`,
          kind: "miss",
          slot: event.target.slot,
          uid: event.target.uid,
          text: event.target.prompt.text,
          reveal: event.target.prompt.reveal,
          born: now,
        });
        if (!quiet) setShake((n) => n + 1);
      } else if (event.type === "wrong") {
        sfx.wrong();
        setInputShake((n) => n + 1);
      } else if (event.type === "hint") sfx.hint();
      else if (event.type === "heart") {
        sfx.heart();
        fxRef.current.push({ id: `h${now}`, kind: "banner", text: "+1 heart", born: now });
      } else if (event.type === "level") {
        sfx.level();
        fxRef.current.push({ id: `l${now}`, kind: "banner", text: `level ${event.level}`, born: now });
      } else if (event.type === "over") sfx.over(event.won);
    }
  }

  const run = () => runRef.current;
  const begin = () => {
    if (!run() || started) return;
    setStarted(true);
    setPaused(run(), false);
    inputRef.current?.focus({ preventScroll: true });
  };
  const togglePause = () => {
    if (!run() || !started || run().over) return;
    setPaused(run(), !run().paused);
    inputRef.current?.focus({ preventScroll: true });
  };
  const feed = (value) => {
    const current = run();
    if (!current || !started || current.paused || current.over) {
      setText(current?.buffer || "");
      return;
    }
    const before = current.buffer;
    input(current, value);
    if (current.buffer.length > before.length) sfx.key(current.buffer.length);
    react(drain(current));
    setText(current.buffer);
  };
  const wrote = ({ mistakes, strokes, failed }) => {
    const current = run();
    if (!current || current.paused || current.over) return;
    completeWrite(current, { clean: !failed && mistakes <= allowedMistakes(strokes), hinted: failed });
    react(drain(current));
    inputRef.current?.focus({ preventScroll: true });
  };
  const askHint = () => {
    if (!run() || !started || run().paused) return;
    hint(run());
    react(drain(run()));
    inputRef.current?.focus({ preventScroll: true });
  };

  const onKeyDown = (event) => {
    if (!started) {
      if (event.key.length === 1 || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        begin();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      togglePause();
    } else if (event.key === "Tab") {
      event.preventDefault();
      askHint();
    } else if (event.key === "Enter") {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      if (run()?.paused) togglePause();
      else {
        confirm(run());
        react(drain(run()));
        setText(run().buffer);
      }
    }
  };

  const hearts =
    view && Number.isFinite(view.lives)
      ? Array.from({ length: Math.max(view.maxLives, view.lives) }, (_, i) => i < view.lives)
      : null;
  const style = palette
    ? {
        "--r-bg": palette.bg,
        "--r-bg2": palette.bg2,
        "--r-ink": palette.ink,
        "--r-accent": palette.accent,
        "--r-hot": palette.hot,
        "--r-warn": palette.warn,
      }
    : undefined;

  return (
    <div
      className={`rush-arena mode-${mode} ${view?.fever ? "is-fever" : ""} ${shake % 2 ? "shake-a" : shake ? "shake-b" : ""}`}
      style={style}
      onPointerDown={(event) => {
        // Buttons and the writing pad need their own pointer events.
        if (event.target.closest("button, .writepad")) return;
        event.preventDefault();
        inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <div className="rush-hud">
        <div className="rush-hud-left">
          {hearts ? (
            <span className="rush-hearts" aria-label={`${view.lives} hearts`}>
              {hearts.map((full, i) => (
                <Heart key={i} size={20} className={full ? "full" : ""} fill={full ? "currentColor" : "none"} />
              ))}
            </span>
          ) : (
            <span className="rush-mode-label">{label}</span>
          )}
          {view?.goal && (
            <span className="rush-goal">
              {Math.min(view.clears, view.goal)} / {view.goal}
              <small>{Math.round(view.accuracy * 100)}% · need 80%</small>
            </span>
          )}
          {view?.left !== null && view?.left !== undefined && (
            <span className="rush-goal">
              {view.left}
              <small>left</small>
            </span>
          )}
        </div>
        <div className="rush-score" aria-live="off">
          <strong>{(view?.score || 0).toLocaleString("en")}</strong>
          {view?.timed && <small>level {view.level}</small>}
        </div>
        <div className="rush-hud-right">
          <span className={`rush-combo ${view?.combo >= 5 ? "hot" : ""}`}>
            {view?.fever && <Flame size={16} />}
            <strong>×{(view?.mult || 1).toFixed(1).replace(".0", "")}</strong>
            <small>{view?.combo || 0} combo</small>
          </span>
          <button className="rush-icon-button" onClick={askHint} aria-label="hint (tab)" title="hint (tab)">
            <Lightbulb size={18} />
          </button>
          <button className="rush-icon-button" onClick={togglePause} aria-label="pause (esc)" title="pause (esc)">
            {view?.paused && started ? <Play size={18} /> : <Pause size={18} />}
          </button>
          {onExit && (
            <button className="rush-icon-button rush-exit" onClick={onExit} aria-label="leave" title="leave">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="rush-field">
        {view?.targets.map((target) =>
          target.kind === "write" ? (
            <div key={target.uid} className="rush-write">
              <p className="rush-write-cue">
                <b>{target.cue.main}</b>
                <span lang="ja">{target.cue.sub}</span>
                {target.cue.word && <span lang="ja">{target.cue.word}</span>}
              </p>
              <WritePad
                kanji={target.text}
                hinted={target.hinted}
                size={padSize}
                theme="dark"
                colors={palette ? { drawing: palette.accent, highlight: palette.warn } : undefined}
                onDone={wrote}
              />
            </div>
          ) : (
            <div
              key={target.uid}
              className={[
                "rush-target",
                `kind-${target.kind}`,
                target.typing && "is-typing",
                target.pending && "is-pending",
                target.hinted && "is-hinted",
                view.timed && target.frac < 0.3 && "is-urgent",
                target.kind !== "listen" && [...target.text].length > 1 && "is-wide",
              ]
                .filter(Boolean)
                .join(" ")}
              style={place(target.slot, target.uid, cols, single)}
            >
              {view.timed && [...target.text].length === 1 && (
                <svg className="rush-ring" viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="track" cx="50" cy="50" r="45" />
                  <circle
                    className="time"
                    cx="50"
                    cy="50"
                    r="45"
                    style={{ strokeDashoffset: (1 - target.frac) * 282.7 }}
                  />
                </svg>
              )}
              {target.kind === "listen" ? (
                <button
                  type="button"
                  className="rush-listen"
                  onClick={() => say(target.say, { rate: 0.85 })}
                  aria-label="play again"
                  title="play again"
                >
                  <Volume2 size={single ? 54 : 34} />
                </button>
              ) : (
                <span className="rush-glyph" lang="ja">
                  {target.text}
                </span>
              )}
              {view.timed && target.kind !== "listen" && [...target.text].length > 1 && (
                <span className="rush-bar" aria-hidden="true">
                  <span style={{ transform: `scaleX(${target.frac})` }} />
                </span>
              )}
              <span className="rush-kind" title={KIND_TIP[target.kind]} lang="ja">
                {KIND_MARK[target.kind]}
              </span>
              {target.hinted && (
                <span className="rush-hint" lang="ja">
                  {target.reveal.main}
                </span>
              )}
            </div>
          ),
        )}

        {view?.fx.map((item) =>
          item.kind === "banner" ? (
            <div key={item.id} className="rush-banner" style={{ opacity: 1 - item.age }}>
              {item.text}
            </div>
          ) : (
            <div
              key={item.id}
              className={`rush-fx fx-${item.kind}`}
              style={{ ...place(item.slot, item.uid, cols, single), "--age": item.age }}
            >
              {item.kind === "pop" && (
                <>
                  <span className="burst" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, i) => (
                      <i key={i} style={{ "--a": `${i * 45}deg` }} />
                    ))}
                  </span>
                  <span className="fx-points">
                    +{item.points}
                    {item.mult > 1 && <small> ×{item.mult}</small>}
                  </span>
                </>
              )}
              <span className="fx-glyph" lang="ja">
                {item.text}
              </span>
              <span className="fx-answer" lang="ja">
                {item.reveal.main}
                {item.reveal.sub && <small>{item.reveal.sub}</small>}
              </span>
            </div>
          ),
        )}

        {!started && view && (
          <div className="rush-overlay">
            <p className="rush-overlay-title">{label}</p>
            <ul className="rush-legend">
              {view.kinds.map((kind) => (
                <li key={kind} className={`legend-${kind}`}>
                  <b lang="ja">{KIND_MARK[kind]}</b> {KIND_TIP[kind]}
                </li>
              ))}
            </ul>
            <button className="rush-start" onClick={begin}>
              start <kbd>any key</kbd>
            </button>
            <p className="rush-keys">tab hint · esc pause · enter confirm</p>
          </div>
        )}
        {started && view?.paused && !view.over && (
          <div className="rush-overlay">
            <p className="rush-overlay-title">paused</p>
            <button className="rush-start" onClick={togglePause}>
              resume <kbd>esc</kbd>
            </button>
            {single && (
              <button className="rush-link" onClick={() => quit(run())}>
                finish now
              </button>
            )}
          </div>
        )}
        {view?.over && (
          <div className="rush-overlay is-over">
            <p className="rush-overlay-title">
              {mode === "test" ? (view.won ? "stage clear" : "not yet") : mode === "challenge" ? "game over" : "done"}
            </p>
          </div>
        )}
      </div>

      <label
        className={`rush-typebar ${inputShake % 2 ? "shake-a" : inputShake ? "shake-b" : ""} ${
          view?.writing ? "is-idle" : ""
        }`}
      >
        <span className="sr-only">answer</span>
        <span className="rush-typed" lang="ja" aria-hidden="true">
          {view?.writing ? (
            <span className="rush-placeholder">write it above · the hint button shows the outline</span>
          ) : (
            view?.preview || <span className="rush-placeholder">{started ? "type…" : ""}</span>
          )}
          {!view?.writing && <span className="rush-caret" />}
        </span>
        <input
          ref={inputRef}
          value={text}
          onChange={(event) => {
            if (composing.current) setText(event.target.value);
            else feed(event.target.value);
          }}
          onCompositionStart={() => (composing.current = true)}
          onCompositionEnd={(event) => {
            composing.current = false;
            feed(event.currentTarget.value);
          }}
          onKeyDown={onKeyDown}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          inputMode={view?.writing ? "none" : "text"}
          aria-label="type the reading or meaning"
        />
      </label>
    </div>
  );
}
