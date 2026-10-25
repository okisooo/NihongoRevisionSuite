import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { RotateCcw } from "lucide-react";
import { charDataLoader, strokesFor } from "./strokes";

const THEMES = {
  light: { stroke: "#182d49", drawing: "#2463eb", outline: "#dfe6f1", highlight: "#2f9e44", grid: "#e6ecf5" },
  dark: { stroke: "#eef3fa", drawing: "#6ea8ff", outline: "rgba(255,255,255,0.13)", highlight: "#ffc05c", grid: "rgba(255,255,255,0.08)" },
};

/**
 * Stroke-by-stroke graded writing. Each stroke is checked for shape, direction
 * and order as it is drawn. `trace` shows the outline; `recall` starts blank and
 * only reveals it when `hinted` turns true.
 */
export function WritePad({ kanji, mode = "recall", hinted = false, size = 280, theme = "light", onDone, onAssisted, colors }) {
  const box = useRef(null);
  const writer = useRef(null);
  const strokes = useRef(0);
  const mistakes = useRef(0);
  const assisted = useRef(mode === "trace" || hinted);
  const assist = useRef(onAssisted);
  const outline = useRef(hinted);
  const done = useRef(onDone);
  const [state, setState] = useState("loading");
  const [round, setRound] = useState(0);
  const palette = { ...THEMES[theme], ...colors };

  useEffect(() => {
    done.current = onDone;
    assist.current = onAssisted;
  });

  // Starting over keeps earlier mistakes; only a new character resets them.
  useEffect(() => {
    mistakes.current = 0;
    assisted.current = mode === "trace";
  }, [kanji, mode]);

  useEffect(() => {
    const element = box.current;
    let alive = true;
    element.innerHTML = "";
    strokesFor(kanji)
      .then((data) => {
        if (!alive) return;
        strokes.current = data.strokes.length;
        writer.current = HanziWriter.create(element, kanji, {
          width: size,
          height: size,
          padding: Math.round(size * 0.06),
          showCharacter: false,
          showOutline: mode === "trace" || outline.current,
          strokeColor: palette.stroke,
          radicalColor: palette.stroke,
          outlineColor: palette.outline,
          drawingColor: palette.drawing,
          highlightColor: palette.highlight,
          drawingWidth: Math.max(14, Math.round(size / 16)),
          charDataLoader,
        });
        writer.current.quiz({
          leniency: mode === "trace" ? 1.3 : 1.1,
          showHintAfterMisses: mode === "trace" ? 1 : 2,
          // A hint can teach the stroke, but a miss must never auto-complete it.
          markStrokeCorrectAfterMisses: false,
          acceptBackwardsStrokes: false,
          highlightOnComplete: true,
          onMistake: (result) => {
            mistakes.current++;
            if (mode === "trace" || result.mistakesOnStroke >= 2) {
              assisted.current = true;
              assist.current?.();
            }
          },
          onComplete: () => {
            setState("done");
            setTimeout(
              () => alive && done.current?.({ mistakes: mistakes.current, strokes: strokes.current, assisted: assisted.current }),
              520,
            );
          },
        });
        setState("ready");
      })
      .catch(() => alive && setState("failed"));
    return () => {
      alive = false;
      writer.current?.cancelQuiz?.();
      writer.current = null;
      element.innerHTML = "";
    };
    // Colours and size are fixed for the life of one attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanji, mode, round]);

  useEffect(() => {
    outline.current = hinted;
    if (hinted) {
      assisted.current = true;
      writer.current?.showOutline();
    }
  }, [hinted, kanji, mode]);

  return (
    <div className={`writepad theme-${theme} is-${state}`} style={{ "--pad": `${size}px`, "--grid": palette.grid }}>
      <div className="writepad-square">
        <svg className="writepad-grid" viewBox="0 0 100 100" aria-hidden="true">
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
        <div ref={box} className="writepad-writer" aria-label={mode === "trace" || hinted ? "guided writing surface" : "blank writing surface"} role="img" />
        {state === "loading" && <span className="writepad-status">loading strokes…</span>}
        {state === "failed" && (
          <span className="writepad-status">
            stroke data unavailable
            <button type="button" onClick={() => onDone?.({ mistakes: 99, strokes: 0, failed: true })}>
              skip
            </button>
          </span>
        )}
      </div>
      {state === "ready" && (
        <button type="button" className="writepad-restart" onClick={() => setRound((n) => n + 1)} title="start over">
          <RotateCcw size={14} /> start over
        </button>
      )}
    </div>
  );
}
