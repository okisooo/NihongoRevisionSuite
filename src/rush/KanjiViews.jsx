import { useState } from "react";
import { useReferenceTarget } from "../study/quickReferenceContext.js";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Dumbbell, Flame, Lock, Play, Volume2, VolumeX, Zap } from "lucide-react";
import { useProgress } from "../study/store";
import { primaryMeaning } from "../study/primaryMeanings";
import { kanjiDueKeys } from "../study/content";
import { toHiragana } from "../utils/kanaConverter";
import { Arena } from "./Arena";
import {
  buildDeck,
  characterById,
  characterByKanji,
  commonWords,
  dueDeck,
  pickSession,
  readingAnswers,
  KINDS,
  TYPED,
} from "./deck";
import { summary } from "./engine";
import { say, setSound, canSpeak } from "./audio";
import { PLAY_SOURCES } from "./validate";
import {
  PALETTES,
  STAGE_COUNT,
  TIERS,
  bestKey,
  learnedIds,
  markLearned,
  masteryOf,
  nextPalette,
  nextStage,
  paletteOf,
  rushOf,
  sourceIds,
  stageIds,
  stageStatus,
  streakDays,
  weigher,
} from "./mastery";
import { useSave, saveRun, useKeys, setRushSettings } from "./save";
import { SaveError, Stars, KanjiCard, CopyType, CopyWrite, TrackTabs } from "./KanjiParts";
import "./rush.css";

const SOURCE_LABEL = { learned: "all learned", weak: "weak spots", due: "due reviews" };
const PRACTICE_SIZE = 20;
const DUE_SIZE = 30;

export function Results({ outcome, onRetry, onDrill, retryLabel = "again", home = "kanji" }) {
  const { report, result } = outcome;
  useKeys({ enter: onRetry, d: result.missed.length && onDrill ? onDrill : undefined });
  const title =
    result.mode === "test"
      ? result.won
        ? "stage clear"
        : "not yet — 80% clean on 20 prompts clears it"
      : result.mode === "challenge"
        ? "game over"
        : "practice done";
  return (
    <section className="rush-results" aria-live="polite">
      <p className="eyebrow">{title}</p>
      {result.mode === "test" && result.won && <Stars count={result.stars} />}
      <h1 className="rush-final">
        {result.mode === "practice" ? `${result.clean} / ${result.clears}` : result.score.toLocaleString("en")}
        {report?.newBest && <span className="rush-badge">new best</span>}
      </h1>
      <div className="rush-stat-row">
        {result.mode === "practice" ? (
          <span>clean on the first try</span>
        ) : (
          <>
            <span>
              <strong>{result.clears}</strong> cleared
            </span>
            <span>
              <strong>{Math.round(result.accuracy * 100)}%</strong> clean
            </span>
            <span>
              <strong>{result.maxCombo}</strong> best combo
            </span>
          </>
        )}
        {result.mode === "challenge" && (
          <span>
            <strong>{result.level}</strong> level
          </span>
        )}
        <span>
          <strong>{result.seconds}s</strong>
        </span>
      </div>
      {report?.unlocked.map((palette) => (
        <p className="rush-unlock" key={palette.id}>
          <span className="swatch" style={{ background: palette.accent }} /> palette unlocked: {palette.name}
        </p>
      ))}
      <div className="rush-result-actions">
        <button className="primary-button" onClick={onRetry} autoFocus>
          {retryLabel} <kbd>enter</kbd>
        </button>
        {result.missed.length > 0 && onDrill && (
          <button className="secondary-button" onClick={onDrill}>
            practise {result.missed.length} missed <kbd>d</kbd>
          </button>
        )}
        <Link className="text-link" to={`/${home}`}>
          {home} home
        </Link>
      </div>
      {result.missed.length > 0 && (
        <div className="rush-missed">
          <h2>study these · they come back in your reviews</h2>
          <div className="rush-missed-list">
            {result.missed.map((prompt) => (
              <Link
                key={prompt.id}
                to={prompt.track === "kana" ? "/kana" : `/library/characters/${prompt.characterId}`}
                className="rush-missed-item"
              >
                <span className="glyph" lang="ja">
                  {prompt.text}
                </span>
                <span className="answer" lang="ja">
                  {prompt.reveal.main}
                  <small>{prompt.reveal.sub}</small>
                </span>
                <span className="kind">{prompt.kind === "kana" ? "読" : KINDS.find((k) => k.id === prompt.kind)?.short}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const promptIdsParam = (params) => params.get("prompts")?.split(",").filter(Boolean) || null;
function idsOfPrompts(prompts) {
  return [
    ...new Set(
      prompts.flatMap((id) =>
        id.startsWith("word:")
          ? [...id.slice(5)].map((ch) => characterByKanji(ch)?.id).filter(Boolean)
          : [Number(id.split(":")[1])],
      ),
    ),
  ];
}

/* ---------- rush (timed) and practice (calm) ---------- */

export function KanjiPlay() {
  const progress = useProgress();
  const rush = rushOf(progress);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [now] = useState(() => Date.now());
  const [round, setRound] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [save, error] = useSave();
  const mode = params.get("mode") === "practice" ? "practice" : "challenge";
  const requested = (params.get("kinds") || "").split(",").filter((k) => KINDS.some((x) => x.id === k));
  const allKinds = requested.length ? requested : rush.settings.kinds;
  // Rush is typed under time pressure; writing lives in practice.
  const kinds = mode === "challenge" ? allKinds.filter((k) => TYPED.includes(k)) : allKinds;
  const source = params.get("source") === "due" ? "due" : PLAY_SOURCES.includes(params.get("source")) ? params.get("source") : rush.settings.source;
  const prompts = promptIdsParam(params);
  const explicitIds = params.get("ids")?.split(",").map(Number).filter((id) => characterById(id)) || null;
  const ids = prompts ? idsOfPrompts(prompts) : explicitIds || sourceIds(progress, source);
  const empty =
    source === "due" && !prompts && !explicitIds
      ? kanjiDueKeys(progress, now).length === 0
      : !ids.length || !kinds.length;

  const makeDeck = (at) => {
    const weigh = weigher(progress, at);
    if (prompts)
      return buildDeck({ ids, kinds: KINDS.map((k) => k.id), weigh }).filter((p) => prompts.includes(p.id));
    if (explicitIds) return buildDeck({ ids, kinds: KINDS.map((k) => k.id), weigh });
    if (source === "due") return dueDeck(kanjiDueKeys(progress, at), weigh).slice(0, DUE_SIZE);
    const deck = buildDeck({ ids, kinds, weigh });
    return mode === "practice" ? pickSession(deck, PRACTICE_SIZE) : deck;
  };

  if (empty)
    return (
      <div className="page rush-page">
        <h1>{source === "due" ? "no kanji reviews due" : "nothing to play yet"}</h1>
        <p className="muted">
          {source === "due"
            ? "everything is scheduled for later. learn a new stage, or play rush."
            : !kinds.length
              ? "rush is typed; pick a typed prompt kind (読 意 語) in the kanji tab."
              : "learn a first stage and its kanji become playable."}
        </p>
        <div className="rush-result-actions">
          <Link className="primary-button" to={`/kanji/stage/${nextStage(rush) || 1}`}>
            stage {nextStage(rush) || 1} <ArrowRight size={16} />
          </Link>
          <Link className="text-link" to="/kanji">
            kanji home
          </Link>
        </div>
      </div>
    );

  const what = prompts
    ? `${prompts.length} missed`
    : explicitIds
      ? explicitIds.map((id) => characterById(id).kanji).join("")
      : SOURCE_LABEL[source];
  const label = mode === "practice" ? `practice · ${what}` : `rush · ${what}`;
  const best = rush.best[bestKey("challenge", kinds)] || 0;

  return (
    <div className="page rush-page rush-play">
      <div className="rush-play-top">
        <Link to="/kanji">← kanji</Link>
        <span className="muted">
          {kinds.map((k) => KINDS.find((x) => x.id === k)?.short).join(" ")}
          {mode === "challenge" && best > 0 && ` · best ${best.toLocaleString("en")}`}
        </span>
      </div>
      {outcome ? (
        <Results
          outcome={outcome}
          retryLabel={mode === "practice" ? "another round" : "again"}
          onRetry={() => {
            setOutcome(null);
            setRound((r) => r + 1);
          }}
          onDrill={() =>
            navigate(`/kanji/play?mode=practice&prompts=${encodeURIComponent(outcome.result.missed.map((p) => p.id).join(","))}`)
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
          label={label}
          onExit={() => navigate("/kanji")}
          onFinish={async (run) => {
            const report = await saveRun(save, run, { kinds, srs: true });
            setOutcome({ report, result: summary(run) });
          }}
        />
      )}
      <SaveError error={error} />
    </div>
  );
}

/* ---------- campaign stage: learn → review → test ---------- */

function teachSteps(character) {
  const words = commonWords(character, 12);
  const nativeWords = (character.standalone || []).filter((w) => w.common);
  const kun = nativeWords.find((w) => w.word !== character.kanji) || nativeWords[0];
  const onyomi = (character.onyomi || []).map(toHiragana);
  // Teach the on'yomi that starts the most everyday words (二 → に, not じ).
  const starts = (reading) => words.filter((w) => toHiragana(w.reading).startsWith(reading)).length;
  const on = [...onyomi].sort((a, b) => starts(b) - starts(a))[0];
  const onWord = on && words.find((w) => toHiragana(w.reading).startsWith(on) && w.word.length > 1);
  const steps = [{ type: "card" }];
  if (kun) steps.push({ type: "reading", answer: toHiragana(kun.reading), shown: kun.word, note: "訓 native reading" });
  if (on && on !== toHiragana(kun?.reading || ""))
    steps.push({
      type: "reading",
      answer: on,
      shown: character.kanji,
      note: onWord ? `音 compound reading · ${onWord.word} ${onWord.reading}` : "音 compound reading",
    });
  if (steps.length === 1)
    steps.push({ type: "reading", answer: readingAnswers(character)[0], shown: character.kanji, note: "reading" });
  const meaning = primaryMeaning(character).split(",")[0].trim().toLowerCase().replace(/^to /, "");
  steps.push({ type: "meaning", answer: meaning, shown: character.kanji, note: "meaning" });
  steps.push({ type: "write" });
  return steps;
}

function LearnPhase({ ids, notes, voice, onDone }) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const character = characterById(ids[index]);
  useReferenceTarget([character.id]);
  const steps = teachSteps(character);
  const current = steps[step];
  const advance = () => {
    if (step + 1 < steps.length) setStep(step + 1);
    else if (index + 1 < ids.length) {
      setIndex(index + 1);
      setStep(0);
    } else onDone();
  };
  useKeys({ enter: current.type === "card" ? advance : undefined });
  return (
    <div className="rush-learn">
      <div className="rush-learn-top">
        <span className="rush-dots" aria-label={`kanji ${index + 1} of ${ids.length}`}>
          {ids.map((id, i) => (
            <i key={id} className={i < index ? "done" : i === index ? "now" : ""} />
          ))}
        </span>
        <span className="muted">
          {index + 1} / {ids.length} · step {step + 1} of {steps.length}
        </span>
      </div>
      {current.type !== "write" && <KanjiCard character={character} note={notes[character.id]} />}
      {current.type === "card" ? (
        <button className="primary-button rush-next" onClick={advance} autoFocus>
          got it <kbd>enter</kbd>
        </button>
      ) : current.type === "write" ? (
        <CopyWrite key={`${index}:write`} character={character} onDone={advance} />
      ) : (
        <CopyType key={`${index}:${step}`} step={current} onDone={advance} voice={voice} />
      )}
    </div>
  );
}

export function KanjiStage() {
  const { n } = useParams();
  const stage = Math.min(STAGE_COUNT, Math.max(1, Number(n) || 1));
  return <StageBody key={stage} stage={stage} />;
}

function StageBody({ stage }) {
  const progress = useProgress();
  const rush = rushOf(progress);
  const navigate = useNavigate();
  const ids = stageIds(stage);
  const status = stageStatus(rush, stage);
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [save, error] = useSave();
  const palette = paletteOf(rush);
  const reviewDeck = (at) =>
    buildDeck({ ids, kinds: ["reading", "meaning", "write"], weigh: weigher(progress, at) });
  const testDeck = (at) => {
    const weigh = weigher(progress, at);
    const others = learnedIds(progress).filter((id) => !ids.includes(id));
    // Up to fifteen earlier prompts, weakest first, keep old stages alive.
    const pool = buildDeck({ ids: others, kinds: ["reading", "meaning"], weigh })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15);
    return [...buildDeck({ ids, kinds: ["reading", "meaning"], weigh, focus: ids }), ...pool];
  };

  const header = (
    <div className="rush-stage-head">
      <Link to="/kanji">← kanji</Link>
      <span>
        stage {stage} · kanji {ids[0]}–{ids[ids.length - 1]}
      </span>
      {rush.stages[stage] && <Stars count={rush.stages[stage].stars} />}
    </div>
  );

  if (phase === "intro")
    return (
      <div className="page rush-page">
        {header}
        <h1 className="rush-stage-title">stage {stage}</h1>
        <div className="rush-stage-glyphs" lang="ja">
          {ids.map((id) => (
            <Link key={id} to={`/library/characters/${id}`}>
              <span>{characterById(id).kanji}</span>
              <small>{primaryMeaning(characterById(id))}</small>
            </Link>
          ))}
        </div>
        <ol className="rush-phases">
          <li>
            <b>learn</b> meet each kanji: strokes, readings, meaning, then trace it
          </li>
          <li>
            <b>review</b> read, mean and write each one from memory until clean
          </li>
          <li>
            <b>test</b> clear 20 timed prompts at 80% to unlock the next stage
          </li>
        </ol>
        {status === "locked" && (
          <p className="notice">
            <Lock size={15} /> earlier stages are not cleared. learn this one anyway, or test out if you know it.
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
        <LearnPhase
          ids={ids}
          notes={progress.notes || {}}
          voice={rush.settings.voice}
          onDone={async () => {
            if (await save((p) => markLearned(p, ids, Date.now()))) setPhase("review");
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
          <p className="muted">20 timed prompts from this stage, plus a few older kanji. keep 80% clean to clear it.</p>
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
    const next = stage < STAGE_COUNT ? stage + 1 : null;
    return (
      <div className="page rush-page">
        {header}
        <Results
          outcome={outcome}
          retryLabel={passed ? (next ? `stage ${next}` : "kanji home") : "retry test"}
          onRetry={() => {
            if (passed) navigate(next ? `/kanji/stage/${next}` : "/kanji");
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
        palette={palette}
        sound={rush.settings.sound}
        voice={rush.settings.voice}
        label={phase === "review" ? "review · no timer" : `stage ${stage} test`}
        onExit={() => setPhase("intro")}
        onFinish={async (run) => {
          if (phase === "review") {
            if (await saveRun(save, run, { srs: true })) setPhase("review-done");
            return;
          }
          const report = await saveRun(save, run, { stage, srs: true, kinds: ["reading", "meaning"] });
          setOutcome({ report, result: summary(run) });
        }}
      />
      <SaveError error={error} />
    </div>
  );
}

/* ---------- the kanji tab ---------- */

export function Toggle({ on, onClick, children, label, disabled }) {
  return (
    <button
      type="button"
      className={`rush-toggle ${on ? "on" : ""}`}
      aria-pressed={on}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      {children}
    </button>
  );
}


export function KanjiHub() {
  const progress = useProgress();
  const rush = rushOf(progress);
  const [now] = useState(() => Date.now());
  const [save, error] = useSave();
  const navigate = useNavigate();
  const settings = rush.settings;
  const stage = nextStage(rush);
  const streak = streakDays(rush, now);
  const counts = Object.fromEntries(PLAY_SOURCES.map((s) => [s, sourceIds(progress, s).length]));
  const pool = counts[settings.source];
  const typed = settings.kinds.filter((k) => TYPED.includes(k));
  const best = rush.best[bestKey("challenge", typed)] || 0;
  const tiers = Array.from({ length: 300 }, (_, i) => masteryOf(progress, i + 1));
  const tierCounts = TIERS.map((_, t) => tiers.filter((x) => x === t).length);
  const cleared = Object.keys(rush.stages).length;
  const play = (mode) => navigate(`/kanji/play?mode=${mode}&source=${settings.source}`);

  return (
    <div className="page rush-page rush-hub">
      <TrackTabs current="kanji" />
      <header className="rush-hub-head">
        <h1>kanji</h1>
        <div className="rush-hub-meta">
          <span className={`rush-streak ${streak ? "on" : ""}`} title="days in a row">
            <Flame size={17} /> {streak} day{streak === 1 ? "" : "s"}
          </span>
          <span>
            <strong>{tierCounts[4]}</strong> mastered · <strong>{300 - tierCounts[0]}</strong> met
          </span>
        </div>
      </header>

      <section className="rush-hero">
        {stage ? (
          <>
            <div>
              <p className="eyebrow">{cleared ? `stage ${stage} of ${STAGE_COUNT}` : "start here"}</p>
              <h2>
                new kanji{" "}
                <span lang="ja" className="rush-hero-glyphs">
                  {stageIds(stage).map((id) => characterById(id).kanji).join("")}
                </span>
              </h2>
              <p className="muted">learn → review → timed test. writing is part of every stage.</p>
            </div>
            <Link className="primary-button" to={`/kanji/stage/${stage}`}>
              {cleared ? "continue" : "begin"} <ArrowRight size={17} />
            </Link>
          </>
        ) : (
          <div>
            <h2>all {STAGE_COUNT} stages cleared</h2>
            <p className="muted">keep them sharp with rush and practice.</p>
          </div>
        )}
      </section>

      <section className="rush-play-panel" aria-label="play">
        <div className="rush-modes">
          <button className="rush-mode is-main" onClick={() => play("challenge")} disabled={!pool || !typed.length}>
            <Zap size={22} />
            <span>
              <b>rush</b>
              <small>timed · 3 hearts · speeds up · typing</small>
            </span>
            <em>{best ? `best ${best.toLocaleString("en")}` : "no score yet"}</em>
          </button>
          <button className="rush-mode" onClick={() => play("practice")} disabled={!pool}>
            <Dumbbell size={22} />
            <span>
              <b>practice</b>
              <small>calm · {PRACTICE_SIZE} prompts · typing and writing</small>
            </span>
            <em>{pool} kanji</em>
          </button>
        </div>
        <div className="rush-settings">
          <div>
            <span className="rush-settings-label">prompts</span>
            {KINDS.map((kind) => {
              const on = settings.kinds.includes(kind.id);
              return (
                <Toggle
                  key={kind.id}
                  on={on}
                  label={kind.label}
                  onClick={() => {
                    const kinds = on ? settings.kinds.filter((k) => k !== kind.id) : [...settings.kinds, kind.id];
                    if (kinds.length) setRushSettings(save, { kinds: KINDS.map((k) => k.id).filter((k) => kinds.includes(k)) });
                  }}
                >
                  <b lang="ja">{kind.short}</b> {kind.label}
                </Toggle>
              );
            })}
          </div>
          <div>
            <span className="rush-settings-label">kanji</span>
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

      <section className="rush-section">
        <div className="section-top">
          <h2>stages</h2>
          <span className="muted">
            {cleared} / {STAGE_COUNT} cleared
          </span>
        </div>
        <div className="rush-map">
          {Array.from({ length: STAGE_COUNT }, (_, i) => i + 1).map((n) => {
            const state = stageStatus(rush, n);
            return (
              <Link
                key={n}
                to={`/kanji/stage/${n}`}
                className={`rush-map-tile is-${state} ${n === stage ? "is-next" : ""}`}
                title={`stage ${n}`}
              >
                <span className="num">{n}</span>
                <span className="glyphs" lang="ja">
                  {stageIds(n).map((id) => characterById(id).kanji).join("")}
                </span>
                {state === "cleared" ? (
                  <Stars count={rush.stages[n].stars} />
                ) : state === "locked" ? (
                  <Lock size={12} />
                ) : (
                  <Play size={12} />
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rush-section">
        <div className="section-top">
          <h2>mastery</h2>
          <span className="rush-legend-row">
            {TIERS.map((tier, t) => (
              <span key={tier}>
                <i className={`tier-${t}`} /> {tier} {tierCounts[t]}
              </span>
            ))}
          </span>
        </div>
        <p className="muted rush-grid-note">mastered = reading, meaning and writing all solid.</p>
        <div className="rush-grid" lang="ja">
          {tiers.map((tier, i) => {
            const character = characterById(i + 1);
            return (
              <Link
                key={i}
                to={`/library/characters/${i + 1}`}
                className={`tier-${tier}`}
                title={`${character.kanji} · ${primaryMeaning(character)} · ${TIERS[tier]}`}
              >
                {character.kanji}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---------- preferences, shown on the settings page ---------- */

export function KanjiSettings() {
  const progress = useProgress();
  const rush = rushOf(progress);
  const [save, error] = useSave();
  const settings = rush.settings;
  const upcoming = nextPalette(rush);
  return (
    <section className="settings-section">
      <h2>kanji</h2>
      <div className="rush-settings">
        <div>
          <Toggle
            on={settings.sound}
            label="sound effects"
            onClick={() => {
              setSound(!settings.sound);
              setRushSettings(save, { sound: !settings.sound });
            }}
          >
            {settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />} sound
          </Toggle>
          {canSpeak() && (
            <Toggle
              on={settings.voice}
              label="speak readings"
              onClick={() => {
                if (!settings.voice) say("よみ");
                setRushSettings(save, { voice: !settings.voice });
              }}
            >
              <span lang="ja">声</span> speak readings
            </Toggle>
          )}
        </div>
      </div>
      <p className="muted">
        arena palette · {rush.total.toLocaleString("en")} lifetime points
        {upcoming && ` · next unlock at ${upcoming.at.toLocaleString("en")}`}
      </p>
      <div className="rush-palettes">
        {PALETTES.map((palette, i) => {
          const open = rush.total >= palette.at;
          const on = paletteOf(rush).id === palette.id;
          return (
            <button
              type="button"
              key={palette.id}
              disabled={!open}
              className={`rush-palette ${on ? "on" : ""}`}
              style={{ "--p-bg": palette.bg, "--p-bg2": palette.bg2, "--p-accent": palette.accent, "--p-hot": palette.hot }}
              onClick={() => save((p) => ({ ...p, rush: { ...rushOf(p), palette: i } }))}
              aria-pressed={on}
            >
              <span className="swatch" />
              <span>{palette.name}</span>
              <small>{open ? on ? <Check size={13} /> : "use" : palette.at.toLocaleString("en")}</small>
            </button>
          );
        })}
      </div>
      <SaveError error={error} />
    </section>
  );
}
