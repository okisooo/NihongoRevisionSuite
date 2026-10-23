import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Dumbbell, Lock, Play, Zap } from "lucide-react";
import { useProgress } from "../study/store";
import { Arena } from "./Arena";
import { buildKanaDeck, pickSession, KANA_KINDS } from "./deck";
import { summary } from "./engine";
import { KANA_STAGES, SCRIPTS, kanaStage, romajiOf, writable } from "./kana";
import { PLAY_SOURCES } from "./validate";
import {
  TIERS,
  bestKey,
  kanaMastery,
  kanaSource,
  kanaStageStatus,
  markKanaLearned,
  nextKanaStage,
  paletteOf,
  rushOf,
  weigher,
} from "./mastery";
import { useSave, saveRun, useKeys, setRushSettings } from "./save";
import { SaveError, Stars, Strokes, CopyType, CopyWrite, TrackTabs } from "./KanjiParts";
import { Results, Toggle } from "./KanjiViews";
import "./rush.css";

const SOURCE_LABEL = { learned: "all learned", weak: "weak spots" };
const PRACTICE_SIZE = 20;
const kanaOfPrompt = (id) => id.slice(id.indexOf(":") + 1);

/* ---------- rush (timed) and practice (calm) ---------- */

export function KanaPlay() {
  const progress = useProgress();
  const rush = rushOf(progress);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [round, setRound] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [save, error] = useSave();
  const mode = params.get("mode") === "practice" ? "practice" : "challenge";
  // Rush is reading under time pressure; writing and listening are one at a time.
  const kinds = mode === "challenge" ? ["kana"] : rush.settings.kanaKinds;
  const source = PLAY_SOURCES.includes(params.get("source")) ? params.get("source") : rush.settings.source;
  const prompts = params.get("prompts")?.split(",").filter(Boolean) || null;
  const kana = prompts ? [...new Set(prompts.map(kanaOfPrompt))] : kanaSource(progress, source);

  const makeDeck = (at) => {
    const weigh = weigher(progress, at);
    if (prompts)
      return buildKanaDeck({ kana, kinds: KANA_KINDS.map((k) => k.id), weigh }).filter((p) =>
        prompts.includes(p.id),
      );
    const deck = buildKanaDeck({ kana, kinds, weigh });
    return mode === "practice" ? pickSession(deck, PRACTICE_SIZE) : deck;
  };

  if (!kana.length) {
    const first = nextKanaStage(rush) || KANA_STAGES[0];
    return (
      <div className="page rush-page">
        <h1>nothing to play yet</h1>
        <p className="muted">learn a first kana stage and its characters become playable.</p>
        <div className="rush-result-actions">
          <Link className="primary-button" to={`/kana/stage/${first.id}`}>
            {first.script} {first.number} <ArrowRight size={16} />
          </Link>
          <Link className="text-link" to="/kana">
            kana home
          </Link>
        </div>
      </div>
    );
  }

  const what = prompts ? `${prompts.length} missed` : SOURCE_LABEL[source];
  const best = rush.best[bestKey("challenge", kinds)] || 0;
  return (
    <div className="page rush-page rush-play">
      <div className="rush-play-top">
        <Link to="/kana">← kana</Link>
        <span className="muted">
          {kinds.map((k) => KANA_KINDS.find((x) => x.id === k)?.short).join(" ")}
          {mode === "challenge" && best > 0 && ` · best ${best.toLocaleString("en")}`}
        </span>
      </div>
      {outcome ? (
        <Results
          home="kana"
          outcome={outcome}
          retryLabel={mode === "practice" ? "another round" : "again"}
          onRetry={() => {
            setOutcome(null);
            setRound((r) => r + 1);
          }}
          onDrill={() =>
            navigate(`/kana/play?mode=practice&prompts=${encodeURIComponent(outcome.result.missed.map((p) => p.id).join(","))}`)
          }
        />
      ) : (
        <Arena
          key={`${round}:${params.toString()}`}
          mode={mode}
          makeDeck={makeDeck}
          palette={paletteOf(rush)}
          sound={rush.settings.sound}
          voice={rush.settings.voice}
          label={`${mode === "practice" ? "practice" : "rush"} · kana · ${what}`}
          onExit={() => navigate("/kana")}
          onFinish={async (run) => {
            const report = await saveRun(save, run, { kinds, srs: false });
            setOutcome({ report, result: summary(run) });
          }}
        />
      )}
      <SaveError error={error} />
    </div>
  );
}

/* ---------- kana stage: learn → review → test ---------- */

function KanaCard({ kana }) {
  return (
    <div className="rush-card kana-card">
      <div className="rush-card-glyphs">
        <span className="rush-card-glyph" lang="ja">
          {kana}
        </span>
        {writable(kana) && <Strokes kanji={kana} />}
      </div>
      <div className="rush-card-body">
        <p className="rush-card-meaning">{romajiOf(kana)}</p>
        <p className="muted">
          {kanaStage(KANA_STAGES.find((s) => s.kana.includes(kana)).id).script}
          {!writable(kana) && " · a contracted sound: the small ゃ ゅ ょ joins the first character"}
        </p>
      </div>
    </div>
  );
}

function KanaLearn({ list, voice, onDone }) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const kana = list[index];
  const steps = ["card", "type", ...(writable(kana) ? ["write"] : [])];
  const current = steps[step];
  const advance = () => {
    if (step + 1 < steps.length) setStep(step + 1);
    else if (index + 1 < list.length) {
      setIndex(index + 1);
      setStep(0);
    } else onDone();
  };
  useKeys({ enter: current === "card" ? advance : undefined });
  return (
    <div className="rush-learn">
      <div className="rush-learn-top">
        <span className="rush-dots" aria-label={`kana ${index + 1} of ${list.length}`}>
          {list.map((k, i) => (
            <i key={k} className={i < index ? "done" : i === index ? "now" : ""} />
          ))}
        </span>
        <span className="muted">
          {index + 1} / {list.length}
        </span>
      </div>
      {current !== "write" && <KanaCard kana={kana} />}
      {current === "card" ? (
        <button className="primary-button rush-next" onClick={advance} autoFocus>
          got it <kbd>enter</kbd>
        </button>
      ) : current === "write" ? (
        <CopyWrite key={`${index}:write`} character={{ kanji: kana }} onDone={advance} />
      ) : (
        <CopyType
          key={`${index}:type`}
          step={{ type: "reading", answer: kana, shown: kana, note: "読 type its sound" }}
          onDone={advance}
          voice={voice}
        />
      )}
    </div>
  );
}

export function KanaStage() {
  const { id } = useParams();
  const stage = kanaStage(id) || KANA_STAGES[0];
  return <KanaStageBody key={stage.id} stage={stage} />;
}

function KanaStageBody({ stage }) {
  const progress = useProgress();
  const rush = rushOf(progress);
  const navigate = useNavigate();
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [save, error] = useSave();
  const status = kanaStageStatus(rush, stage.id);
  const index = KANA_STAGES.indexOf(stage);
  const next = KANA_STAGES[index + 1];
  const reviewDeck = (at) =>
    buildKanaDeck({ kana: stage.kana, kinds: ["kana", "write", "listen"], weigh: weigher(progress, at) });
  const testDeck = (at) => {
    const weigh = weigher(progress, at);
    const earlier = kanaSource(progress).filter((k) => !stage.kana.includes(k));
    const pool = buildKanaDeck({ kana: earlier, kinds: ["kana"], weigh })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15);
    return [...buildKanaDeck({ kana: stage.kana, kinds: ["kana"], weigh, focus: stage.kana }), ...pool];
  };
  const title = `${stage.script} ${stage.number}`;
  const header = (
    <div className="rush-stage-head">
      <Link to="/kana">← kana</Link>
      <span>{title}</span>
      {rush.kanaStages[stage.id] && <Stars count={rush.kanaStages[stage.id].stars} />}
    </div>
  );

  if (phase === "intro")
    return (
      <div className="page rush-page">
        {header}
        <h1 className="rush-stage-title">{title}</h1>
        <div className="rush-stage-glyphs kana-glyphs" lang="ja">
          {stage.kana.map((k) => (
            <span key={k} className="kana-glyph">
              <span>{k}</span>
              <small>{romajiOf(k)}</small>
            </span>
          ))}
        </div>
        <ol className="rush-phases">
          <li>
            <b>learn</b> see each character, its sound, its strokes; type it once and trace it
          </li>
          <li>
            <b>review</b> read, write and hear each one until clean
          </li>
          <li>
            <b>test</b> clear 20 timed prompts at 80% to unlock the next stage
          </li>
        </ol>
        {status === "locked" && (
          <p className="notice">
            <Lock size={15} /> the previous stage is not cleared. learn this one anyway, or test out.
          </p>
        )}
        <div className="rush-result-actions">
          <button className="primary-button" autoFocus onClick={() => setPhase("learn")}>
            learn <ArrowRight size={16} />
          </button>
          <button className="secondary-button" onClick={() => setPhase("test")}>
            {status === "cleared" ? "retake test" : "test out"}
          </button>
        </div>
      </div>
    );

  if (phase === "learn")
    return (
      <div className="page rush-page">
        {header}
        <KanaLearn
          list={stage.kana}
          voice={rush.settings.voice}
          onDone={async () => {
            if (await save((p) => markKanaLearned(p, stage.kana, Date.now()))) setPhase("review");
          }}
        />
        <SaveError error={error} />
      </div>
    );

  if (phase === "review-done")
    return (
      <div className="page rush-page">
        {header}
        <section className="rush-results">
          <p className="eyebrow">review clean</p>
          <h1>now the test</h1>
          <p className="muted">20 timed prompts from this stage plus a few earlier kana. keep 80% clean to clear it.</p>
          <div className="rush-result-actions">
            <button className="primary-button" autoFocus onClick={() => setPhase("test")}>
              start test <kbd>enter</kbd>
            </button>
          </div>
        </section>
      </div>
    );

  if (outcome) {
    const passed = outcome.result.won;
    return (
      <div className="page rush-page">
        {header}
        <Results
          home="kana"
          outcome={outcome}
          retryLabel={passed ? (next ? `${next.script} ${next.number}` : "kana home") : "retry test"}
          onRetry={() => {
            if (passed) navigate(next ? `/kana/stage/${next.id}` : "/kana");
            else {
              setOutcome(null);
              setRound((r) => r + 1);
            }
          }}
          onDrill={() => {
            setOutcome(null);
            setPhase("review");
            setRound((r) => r + 1);
          }}
        />
        <SaveError error={error} />
      </div>
    );
  }

  return (
    <div className="page rush-page rush-play">
      {header}
      <Arena
        key={`${phase}:${round}`}
        mode={phase === "review" ? "practice" : "test"}
        makeDeck={phase === "review" ? reviewDeck : testDeck}
        palette={paletteOf(rush)}
        sound={rush.settings.sound}
        voice={rush.settings.voice}
        label={phase === "review" ? "review · no timer" : `${title} test`}
        onExit={() => setPhase("intro")}
        onFinish={async (run) => {
          if (phase === "review") {
            if (await saveRun(save, run, { srs: false })) setPhase("review-done");
            return;
          }
          const report = await saveRun(save, run, { kanaStageId: stage.id, srs: false, kinds: ["kana"] });
          setOutcome({ report, result: summary(run) });
        }}
      />
      <SaveError error={error} />
    </div>
  );
}

/* ---------- the kana half of the characters tab ---------- */

export function KanaHub() {
  const progress = useProgress();
  const rush = rushOf(progress);
  const navigate = useNavigate();
  const [save, error] = useSave();
  const settings = rush.settings;
  const stage = nextKanaStage(rush);
  const counts = Object.fromEntries(PLAY_SOURCES.map((s) => [s, kanaSource(progress, s).length]));
  const pool = counts[settings.source];
  const best = rush.best[bestKey("challenge", ["kana"])] || 0;
  const learned = counts.learned;
  const total = new Set(KANA_STAGES.flatMap((s) => s.kana)).size;
  const play = (mode) => navigate(`/kana/play?mode=${mode}&source=${settings.source}`);

  return (
    <div className="page rush-page rush-hub">
      <TrackTabs current="kana" />
      <header className="rush-hub-head">
        <h1>kana</h1>
        <div className="rush-hub-meta">
          <span>
            <strong>{learned}</strong> / {total} learned
          </span>
        </div>
      </header>

      <section className="rush-hero">
        {stage ? (
          <>
            <div>
              <p className="eyebrow">{learned ? "keep going" : "start here"}</p>
              <h2>
                {stage.script} {stage.number}{" "}
                <span lang="ja" className="rush-hero-glyphs">
                  {stage.kana.join("")}
                </span>
              </h2>
              <p className="muted">learn → review → timed test. read, write and hear every character.</p>
            </div>
            <Link className="primary-button" to={`/kana/stage/${stage.id}`}>
              {learned ? "continue" : "begin"} <ArrowRight size={17} />
            </Link>
          </>
        ) : (
          <div>
            <h2>all kana stages cleared</h2>
            <p className="muted">keep them fast with rush, then move on to kanji.</p>
          </div>
        )}
      </section>

      <section className="rush-play-panel" aria-label="play">
        <div className="rush-modes">
          <button className="rush-mode is-main" onClick={() => play("challenge")} disabled={!pool}>
            <Zap size={22} />
            <span>
              <b>rush</b>
              <small>timed · see kana, type romaji</small>
            </span>
            <em>{best ? `best ${best.toLocaleString("en")}` : "no score yet"}</em>
          </button>
          <button className="rush-mode" onClick={() => play("practice")} disabled={!pool}>
            <Dumbbell size={22} />
            <span>
              <b>practice</b>
              <small>calm · {PRACTICE_SIZE} prompts · read, write, listen</small>
            </span>
            <em>{pool} kana</em>
          </button>
        </div>
        <div className="rush-settings">
          <div>
            <span className="rush-settings-label">practice</span>
            {KANA_KINDS.map((kind) => {
              const on = settings.kanaKinds.includes(kind.id);
              return (
                <Toggle
                  key={kind.id}
                  on={on}
                  label={kind.label}
                  onClick={() => {
                    const kinds = on ? settings.kanaKinds.filter((k) => k !== kind.id) : [...settings.kanaKinds, kind.id];
                    if (kinds.length)
                      setRushSettings(save, { kanaKinds: KANA_KINDS.map((k) => k.id).filter((k) => kinds.includes(k)) });
                  }}
                >
                  <b lang="ja">{kind.short}</b> {kind.label}
                </Toggle>
              );
            })}
          </div>
          <div>
            <span className="rush-settings-label">kana</span>
            {PLAY_SOURCES.map((source) => (
              <Toggle
                key={source}
                on={settings.source === source}
                label={SOURCE_LABEL[source]}
                disabled={!counts[source]}
                onClick={() => setRushSettings(save, { source })}
              >
                {SOURCE_LABEL[source]} <small>{counts[source]}</small>
              </Toggle>
            ))}
          </div>
        </div>
        <SaveError error={error} />
      </section>

      {SCRIPTS.map((script) => (
        <section className="rush-section" key={script.id}>
          <div className="section-top">
            <h2>
              {script.name} <span lang="ja">{script.sample}</span>
            </h2>
            <span className="muted">
              {KANA_STAGES.filter((s) => s.script === script.name && rush.kanaStages[s.id]).length} /{" "}
              {KANA_STAGES.filter((s) => s.script === script.name).length} stages
            </span>
          </div>
          <div className="rush-map">
            {KANA_STAGES.filter((s) => s.script === script.name).map((s) => {
              const state = kanaStageStatus(rush, s.id);
              return (
                <Link
                  key={s.id}
                  to={`/kana/stage/${s.id}`}
                  className={`rush-map-tile is-${state} ${stage?.id === s.id ? "is-next" : ""}`}
                >
                  <span className="num">{s.number}</span>
                  <span className="glyphs" lang="ja">
                    {s.kana.slice(0, 5).join("")}
                    {s.kana.length > 5 ? "…" : ""}
                  </span>
                  {state === "cleared" ? (
                    <Stars count={rush.kanaStages[s.id].stars} />
                  ) : state === "locked" ? (
                    <Lock size={12} />
                  ) : (
                    <Play size={12} />
                  )}
                </Link>
              );
            })}
          </div>
          <div className="kana-chart" lang="ja">
            {KANA_STAGES.filter((s) => s.script === script.name).map((s) => (
              <div key={s.id} className="kana-chart-row">
                {s.kana.map((k) => {
                  const tier = kanaMastery(progress, k);
                  return (
                    <span key={k} className={`tier-${tier}`} title={`${k} · ${romajiOf(k)} · ${TIERS[tier]}`}>
                      {k}
                      <small>{romajiOf(k)}</small>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
