import { contextsFor } from "./characterData";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, Flame, RotateCcw, Download, Upload, Zap } from "lucide-react";
import { useProgress, updateProgress, getWarning, getRawProgress } from "./store";
import { exportBackup } from "./backup";
import {
  cards,
  lessons,
  readings,
  lessonTitle,
  kanjiDueKeys,
  createSession,
  contextWords,
} from "./content";
import { schedule, validateProgress, recordSessionAnswer } from "./progress";
import {
  STAGE_COUNT,
  bestKey,
  localDay,
  masteryOf,
  nextStage,
  rushOf,
  stageIds,
  streakDays,
  nextKanaStage,
} from "../rush/mastery";
import { characterById, dueDeck, TYPED } from "../rush/deck";
import { KanjiSettings } from "../rush/KanjiViews";

function SaveError({ error }) {
  return error ? (
    <p role="alert" className="save-error">
      {error}
    </p>
  ) : null;
}
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
function useSave() {
  const [error, setError] = useState("");
  const save = async (change) => {
    try {
      await updateProgress(change);
      setError("");
      return true;
    } catch {
      setError(
        "Progress could not be saved. Free some device storage and try again. Your current answer has not been advanced.",
      );
      return false;
    }
  };
  return [save, error];
}
function PageHeading({ title }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
    </div>
  );
}
function StartButton({ mode = "today", children = "start" }) {
  const progress = useProgress();
  const navigate = useNavigate();
  const [save, error] = useSave();
  return (
    <>
      <button
        className="primary-button"
        onClick={async () => {
          if (progress.active) {
            navigate("/session");
            return;
          }
          const active = createSession(progress, mode, Date.now());
          if (active.queue.length && (await save((p) => (p.active ? p : { ...p, active }))))
            navigate("/session");
        }}
      >
        {progress.active ? "continue" : children}
        <ArrowRight size={18} />
      </button>
      <SaveError error={error} />
    </>
  );
}

const when = (time) =>
  new Date(time).toLocaleString("en", { weekday: "short", hour: "numeric", minute: "2-digit" });

/** Today: one short plan. Kanji reviews, new kanji, grammar. */
export function Today() {
  const progress = useProgress();
  const now = useNow();
  const rush = rushOf(progress);
  const kanjiDue = dueDeck(kanjiDueKeys(progress, now)).length;
  const nextKanjiDue = Object.entries(progress.cards)
    .filter(([key, card]) => cards[key]?.character && card.due > now)
    .reduce((soonest, [, card]) => Math.min(soonest, card.due), Infinity);
  const stage = nextStage(rush);
  const clearedToday = Object.values(rush.stages).some((s) => localDay(s.cleared) === localDay(now));
  const study = createSession(progress, "today", now).queue;
  const grammarCount = progress.active ? progress.active.queue.length - progress.active.index : study.length;
  const nextLesson = lessons.find((l) => !progress.lessons[l.lesson]);
  const streak = streakDays(rush, now);
  const playedToday = rush.days[0] === localDay(now);
  const mastered = Array.from({ length: 300 }, (_, i) => masteryOf(progress, i + 1));
  // Beginners (no kanji yet) and anyone partway through kana learn kana first.
  const kanaNext = nextKanaStage(rush);
  const kanaFirst =
    kanaNext && (Object.keys(rush.kanaStages).length > 0 || !mastered.some((tier) => tier > 0));
  const kanaClearedToday = Object.values(rush.kanaStages).some((s) => localDay(s.cleared) === localDay(now));
  const best = rush.best[bestKey("challenge", rush.settings.kinds.filter((k) => TYPED.includes(k)))] || 0;

  const steps = [
    {
      title: "review kanji",
      done: kanjiDue === 0,
      detail: kanjiDue
        ? `${kanjiDue} due · typed and written`
        : Number.isFinite(nextKanjiDue)
          ? `all caught up · next ${when(nextKanjiDue)}`
          : "nothing to review yet",
      action: kanjiDue > 0 && (
        <Link className="primary-button" to="/kanji/play?mode=practice&source=due">
          start <ArrowRight size={17} />
        </Link>
      ),
    },
    kanaFirst ? {
      title: "new kana",
      done: kanaClearedToday,
      detail: (
        <>
          {kanaNext.script} {kanaNext.number} ·{" "}
          <span lang="ja" className="plan-glyphs">
            {kanaNext.kana.join("")}
          </span>
          {kanaClearedToday && " · a stage is cleared today"}
        </>
      ),
      action: (
        <Link className={kanaClearedToday ? "secondary-button" : "primary-button"} to={`/kana/stage/${kanaNext.id}`}>
          learn <ArrowRight size={17} />
        </Link>
      ),
    } : {
      title: "new kanji",
      done: clearedToday,
      detail: stage ? (
        <>
          stage {stage} ·{" "}
          <span lang="ja" className="plan-glyphs">
            {stageIds(stage).map((id) => characterById(id).kanji).join("")}
          </span>
          {clearedToday && " · a stage is cleared today"}
        </>
      ) : (
        `all ${STAGE_COUNT} stages cleared`
      ),
      action: stage && (
        <Link className={clearedToday ? "secondary-button" : "primary-button"} to={`/kanji/stage/${stage}`}>
          learn <ArrowRight size={17} />
        </Link>
      ),
    },
    {
      title: "grammar",
      done: grammarCount === 0,
      detail: grammarCount
        ? `${grammarCount} card${grammarCount === 1 ? "" : "s"} · patterns and sentences`
        : nextLesson
          ? `next lesson ${nextLesson.lesson}: ${lessonTitle(nextLesson)}`
          : "all lessons complete",
      action: grammarCount ? (
        <StartButton />
      ) : (
        nextLesson && (
          <Link className="secondary-button" to={`/grammar/${nextLesson.lesson}`}>
            lesson <ArrowRight size={17} />
          </Link>
        )
      ),
    },
  ];

  return (
    <div className="page today-page">
      <div className="today-head">
        <PageHeading title="today" />
        <span className={`rush-streak ${streak ? "on" : ""}`} title="days in a row">
          <Flame size={17} /> {streak}-day streak
          {!playedToday && streak > 0 && <small> · play today to keep it</small>}
        </span>
      </div>
      {getWarning() && (
        <p role="alert" className="save-error">
          {getWarning()} <Link to="/settings">backups</Link>
        </p>
      )}
      <ol className="plan">
        {steps.map((step, i) => (
          <li key={step.title} className={step.done ? "done" : ""}>
            <span className="plan-step">{step.done ? <Check size={18} /> : i + 1}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.detail}</p>
            </div>
            <div className="plan-action">{step.action}</div>
          </li>
        ))}
      </ol>
      <Link className="plan-bonus" to="/kanji/play?mode=challenge">
        <Zap size={18} />
        <span>
          <b>rush</b> · timed kanji typing{best ? ` · best ${best.toLocaleString("en")}` : ""}
        </span>
        <ArrowRight size={16} />
      </Link>
      <div className="study-stats">
        <Link to="/kanji">
          <strong>
            {mastered.filter((t) => t > 0).length}
            <small> / 300</small>
          </strong>
          <span>kanji met</span>
        </Link>
        <Link to="/kanji">
          <strong>{mastered.filter((t) => t === 4).length}</strong>
          <span>mastered</span>
        </Link>
        <Link to="/kanji">
          <strong>
            {Object.keys(rush.stages).length}
            <small> / {STAGE_COUNT}</small>
          </strong>
          <span>stages</span>
        </Link>
        <Link to="/grammar">
          <strong>
            {Object.keys(progress.lessons).length}
            <small> / 30</small>
          </strong>
          <span>lessons</span>
        </Link>
      </div>
      {progress.sessions.length > 0 && (
        <details className="reference-details">
          <summary>grammar history · {progress.sessions.length} sessions</summary>
          {progress.sessions.slice(0, 7).map((session, i) => (
            <div className="review-row" key={i}>
              <span>
                {new Date(session.finished).toLocaleDateString("en", { month: "short", day: "numeric" })}
              </span>
              <span>
                {session.correct} / {session.total} remembered
              </span>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

export function GrammarTabs({ current }) {
  return (
    <nav className="library-tabs" aria-label="Grammar">
      <Link className={current === "lessons" ? "selected" : ""} aria-current={current === "lessons" ? "page" : undefined} to="/grammar">
        lessons
      </Link>
      <Link
        className={current === "reading" ? "selected" : ""}
        aria-current={current === "reading" ? "page" : undefined}
        to="/grammar/reading"
      >
        sentence reading
      </Link>
    </nav>
  );
}

export function Grammar() {
  const progress = useProgress();
  const [query, setQuery] = useState("");
  const matches = lessons.filter((l) =>
    `${l.lesson} ${l.title} ${l.patterns.map((p) => p.explanation).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <PageHeading title="grammar" />
      <GrammarTabs current="lessons" />
      <div className="library-toolbar">
        <label className="search-field">
          <span>search lessons</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search topic or lesson number" />
        </label>
        <span className="muted">{Object.keys(progress.lessons).length} / 30 complete</span>
      </div>
      <div className="lesson-path">
        {matches.map((l) => (
          <Link className="lesson-row" to={`/grammar/${l.lesson}`} key={l.lesson}>
            <span className={`lesson-step ${progress.lessons[l.lesson] ? "done" : ""}`}>
              {progress.lessons[l.lesson] ? <Check size={20} /> : String(l.lesson).padStart(2, "0")}
            </span>
            <span>
              <h2>{lessonTitle(l)}</h2>
              <p>
                {l.patterns.length} patterns · {l.quiz.length} questions
              </p>
            </span>
            <ArrowRight size={19} />
          </Link>
        ))}
      </div>
      {!matches.length && <p className="empty-state">no lessons match. try a different topic.</p>}
    </div>
  );
}

export function Lesson() {
  const { id } = useParams();
  return <LessonBody key={id} id={Number(id)} />;
}
function LessonBody({ id }) {
  const lesson = lessons.find((l) => l.lesson === id);
  const progress = useProgress();
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [save, error] = useSave();
  if (!lesson)
    return (
      <div className="page">
        <h1>lesson not found</h1>
        <Link to="/grammar">all lessons</Link>
      </div>
    );
  const passed = lesson.quiz.every((q, i) => answers[i] === q.answer);
  return (
    <div className="page reading-page">
      <Link className="back-link" to="/grammar">
        ← all lessons
      </Link>
      <PageHeading title={lessonTitle(lesson)} />
      {lesson.patterns.map((pattern, index) => (
        <section className="pattern-section" key={index}>
          <span className="eyebrow">pattern {index + 1}</span>
          <h2 className="pattern-text">{pattern.pattern}</h2>
          <p className="explanation">{pattern.explanation}</p>
          <div className="sentence-paper">
            <span className="eyebrow">in context</span>
            <p className="sentence-text">{pattern.exampleJa}</p>
            <p>{pattern.exampleEn}</p>
          </div>
        </section>
      ))}
      <section className="knowledge-check">
        <h2>practice</h2>
        {lesson.quiz.map((q, i) => (
          <fieldset key={i}>
            <legend>
              {i + 1}. {q.question}
            </legend>
            <div className="answer-options">
              {q.options.map((option) => (
                <button
                  aria-pressed={answers[i] === option}
                  className={answers[i] === option ? "selected" : ""}
                  onClick={() => {
                    setAnswers({ ...answers, [i]: option });
                    setChecked(false);
                  }}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
            {checked && (
              <p role="status" className={answers[i] === q.answer ? "answer-good" : "answer-again"}>
                {answers[i] === q.answer
                  ? "correct."
                  : `take another look. the answer is ${q.answer}. revisit the pattern above, then try again.`}
              </p>
            )}
          </fieldset>
        ))}
        <button
          className="primary-button"
          disabled={Object.keys(answers).length !== lesson.quiz.length}
          onClick={async () => {
            setChecked(false);
            if (passed)
              await save((p) => {
                const now = Date.now();
                const nextCards = { ...p.cards };
                lesson.patterns.forEach((_, index) => {
                  const key = `grammar:${id}:${index}`;
                  if (!nextCards[key]) nextCards[key] = schedule(null, true, now);
                });
                return { ...p, cards: nextCards, lessons: { ...p.lessons, [id]: now } };
              });
            setChecked(true);
          }}
        >
          check <Check size={17} />
        </button>
        <SaveError error={error} />
        {checked && passed && !error && (
          <p className="answer-good" role="status">
            lesson saved.
          </p>
        )}
      </section>
      <div className="page-bottom">
        <span className="muted">{progress.lessons[id] ? "completed" : "answer all questions to finish."}</span>
        {id < 30 && (
          <Link to={`/grammar/${id + 1}`}>
            next lesson <ArrowRight size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Grammar and sentence cards, self-rated. */
export function Session() {
  const progress = useProgress();
  const active = progress.active;
  if (!active)
    return (
      <div className="page">
        <PageHeading title="grammar review" />
        <StartButton />
      </div>
    );
  if (active.index >= active.queue.length) return <SessionComplete />;
  return <RecallCard key={`${active.started}-${active.index}`} />;
}
function SessionComplete() {
  const progress = useProgress();
  const [save, error] = useSave();
  const navigate = useNavigate();
  const active = progress.active;
  return (
    <div className="page session-page">
      <div className="session-complete">
        <span className="complete-icon">
          <Check size={36} />
        </span>
        <h1>session complete</h1>
        <p>
          {active.correct} remembered across {active.index} recall attempts.
        </p>
        <button
          className="primary-button"
          onClick={async () => {
            if (
              await save((p) =>
                !p.active
                  ? p
                  : {
                      ...p,
                      active: null,
                      sessions: [
                        { finished: Date.now(), total: active.index, correct: active.correct },
                        ...p.sessions,
                      ].slice(0, 365),
                    },
              )
            )
              navigate("/");
          }}
        >
          done <Check size={18} />
        </button>
        <SaveError error={error} />
      </div>
    </div>
  );
}
function RecallCard() {
  const progress = useProgress();
  const active = progress.active;
  const key = active.queue[active.index];
  const card = cards[key];
  const [revealed, setRevealed] = useState(false);
  const [save, error] = useSave();
  const record = async (recalled) => {
    await save((p) => recordSessionAnswer(p, key, active.index, recalled, Date.now()));
  };
  // Sessions saved by older versions may hold retired or kanji drill prompts.
  if (!card || card.answer === undefined)
    return (
      <div className="page">
        <h1>this saved prompt is no longer available.</h1>
        <button
          className="primary-button"
          onClick={() => save((p) => ({ ...p, active: { ...p.active, index: p.active.index + 1 } }))}
        >
          skip unavailable prompt
        </button>
        <SaveError error={error} />
      </div>
    );
  const sentence = card.character && contextsFor(card.character)[0];
  const isNew = !progress.cards[key];
  return (
    <div className="page session-page">
      <div className="session-top">
        <Link to="/">← pause</Link>
        <span>
          {active.index + 1} / {active.queue.length}
        </span>
        <span className="skill-tag">{card.kind}</span>
      </div>
      <progress className="session-progress" value={active.index} max={active.queue.length} />
      <div className="recall-paper">
        <p className="eyebrow">{isNew ? "new" : "from due items"}</p>
        <p className="recall-instruction">{isNew ? "recall the answer." : card.instruction}</p>
        <h1 className={`recall-prompt ${card.character ? "single-character" : ""}`}>{card.prompt}</h1>
        {!revealed ? (
          <button autoFocus className="primary-button" onClick={() => setRevealed(true)}>
            show answer <ArrowRight size={18} />
          </button>
        ) : (
          <div className="recall-answer">
            <p className="eyebrow">{card.kind === "reading" ? "readings" : "meaning"}</p>
            <h2>{card.answer}</h2>
            {card.character && (
              <>
                <details>
                  <summary>all readings</summary>
                  <p className="reading-line">{readings(card.character).join(" / ")}</p>
                </details>
                <div className="word-examples">
                  {contextWords(card.character).map((word, i) => (
                    <div key={i}>
                      <strong>{word.word}</strong>
                      <span>{word.reading}</span>
                      <small>{word.meaning}</small>
                    </div>
                  ))}
                </div>
                {sentence && (
                  <div className="sentence-paper">
                    <p className="sentence-text">{sentence.sentence}</p>
                    <p>{sentence.translation}</p>
                  </div>
                )}
                <Link className="text-link" to={`/library/characters/${card.character.id}`}>
                  details <ArrowUpRight size={15} />
                </Link>
              </>
            )}
            {card.sentence && (
              <div className="word-examples">
                {card.sentence.targets.map((t, i) => (
                  <div key={i}>
                    <strong>{t.word}</strong>
                    <span>{t.reading}</span>
                  </div>
                ))}
              </div>
            )}
            {card.pattern && (
              <div className="sentence-paper">
                <p className="sentence-text">{card.pattern.exampleJa}</p>
                <p>{card.pattern.exampleEn}</p>
                <Link to={`/grammar/${card.lesson.lesson}`}>lesson</Link>
              </div>
            )}
            <div className="rating-actions">
              <button className="secondary-button" onClick={() => record(false)}>
                again <RotateCcw size={16} />
              </button>
              <button className="primary-button" onClick={() => record(true)}>
                remembered <Check size={17} />
              </button>
            </div>
          </div>
        )}
        <SaveError error={error} />
      </div>
    </div>
  );
}

export function Settings() {
  const progress = useProgress();
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(null);
  const [save, error] = useSave();
  const exportData = async () => {
    try {
      const raw = getRawProgress();
      await exportBackup(getWarning() && raw ? raw : JSON.stringify(progress, null, 2));
    } catch {
      setNotice("backup was not shared. try again to save a copy.");
    }
  };
  return (
    <div className="page reading-page">
      <PageHeading title="settings" />
      <KanjiSettings />
      <section className="settings-section">
        <h2>backups</h2>
        <p>saved on this device. export a backup to move your progress.</p>
        <div className="backup-actions">
          <button className="secondary-button" onClick={exportData}>
            <Download size={17} /> export backup
          </button>
          <label className="secondary-button import-label">
            <Upload size={17} /> choose backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 5000000) throw new Error("This backup is too large. Choose a file smaller than 5 MB.");
                  setPending(validateProgress(JSON.parse(await file.text())));
                  setNotice("Backup checked. Export your current progress before replacing it.");
                } catch (err) {
                  setNotice(err.message || "Could not read this backup.");
                  setPending(null);
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {pending && (
          <div className="import-confirm">
            <p>
              replace this device’s progress with {Object.keys(pending.cards).length} review records and{" "}
              {Object.keys(pending.lessons).length} completed lessons?
            </p>
            <button
              className="primary-button"
              onClick={async () => {
                if (await save(pending)) {
                  setPending(null);
                  setNotice("Backup restored.");
                }
              }}
            >
              replace with this backup
            </button>
            <button className="text-button" onClick={() => setPending(null)}>
              cancel
            </button>
          </div>
        )}
      </section>
      <SaveError error={error} />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <details className="reference-details">
        <summary>library & progress info</summary>
        <p>
          300 characters in {STAGE_COUNT} stages · 58 radicals · 30 lessons · 300 sentences. stroke order is
          Japanese and works offline.
        </p>
        <p>
          kanji reviews are typed and written, and each skill (reading, meaning, writing, words) keeps its own
          schedule. mastered means reading, meaning and writing are all solid. browser and desktop progress are
          separate.
        </p>
      </details>
    </div>
  );
}
