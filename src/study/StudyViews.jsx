import { contextsFor } from "./characterData";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, RotateCcw, Download, Upload } from "lucide-react";
import { useProgress, updateProgress, getWarning, getRawProgress } from "./store";
import { exportBackup } from "./backup";
import {
  cards,
  lessons,
  readings,
  lessonTitle,
  createSession,
  contextWords,
  studyDueKeys,
} from "./content";
import { validateProgress, recordSessionAnswer } from "./progress";
import {
  commitGrammarAttempt,
  completeLessonQuiz,
  openGrammarModel,
  sameLessonSession,
  savedGrammarFeedback,
  startLessonSession,
} from "./grammarPractice";
import { STAGE_COUNT } from "../rush/mastery";
import { KanjiSettings } from "../rush/KanjiViews";

function SaveError({ error }) {
  return error ? (
    <p role="alert" className="save-error">
      {error}
    </p>
  ) : null;
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
function useGuardedSave() {
  const [save, error] = useSave();
  const busy = useRef(false);
  const run = async (change) => {
    if (busy.current) return false;
    busy.current = true;
    try {
      return await save(change);
    } finally {
      busy.current = false;
    }
  };
  return [run, error];
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
  const [openedAt] = useState(() => Date.now());
  const dueCount = studyDueKeys(progress, openedAt).length;
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
      <p className="muted">complete means the quiz was passed. revise a lesson to practice sentences. that quiz is not a recall score.</p>
      {(progress.active || dueCount > 0) && (
        <div className="practice-links">
          {progress.active ? (
            <Link className="primary-button" to="/session">
              continue review <ArrowRight size={18} />
            </Link>
          ) : (
            <StartButton mode="review">review due items</StartButton>
          )}
          {dueCount > 0 && <span className="muted">{dueCount} due</span>}
        </div>
      )}
      <div className="lesson-path">
        {matches.map((l) => (
          <div className="lesson-row" key={l.lesson}>
            <span className={`lesson-step ${progress.lessons[l.lesson] ? "done" : ""}`}>
              {progress.lessons[l.lesson] ? <Check size={20} /> : String(l.lesson).padStart(2, "0")}
            </span>
            <span>
              <h2>{lessonTitle(l)}</h2>
              <p>
                {l.patterns.length} patterns · {l.quiz.length} questions
              </p>
            </span>
            <Link className="text-link" to={`/grammar/${l.lesson}`}>
              open
            </Link>
            <Link className="text-link" to={`/grammar/${l.lesson}/revise`}>
              revise
            </Link>
          </div>
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
      <p>
        <Link className="text-link" to={`/grammar/${id}/revise`}>
          revise this lesson <ArrowRight size={16} />
        </Link>
      </p>
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
            if (passed) await save((p) => completeLessonQuiz(p, id, Date.now()));
            setChecked(true);
          }}
        >
          check <Check size={17} />
        </button>
        <SaveError error={error} />
        {checked && passed && !error && (
          <p className="answer-good" role="status">
            lesson marked complete. patterns with no review record are saved as needing review. this quiz does not count as recall.
          </p>
        )}
      </section>
      <div className="page-bottom">
        <span className="muted">
          {progress.lessons[id]
            ? "lesson complete. this is not a recall score."
            : "answer all questions to mark the lesson complete."}
        </span>
        {id < 30 && (
          <Link to={`/grammar/${id + 1}`}>
            next lesson <ArrowRight size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function GrammarRevision() {
  const { id } = useParams();
  return <GrammarRevisionBody key={id} id={Number(id)} />;
}
function GrammarRevisionBody({ id }) {
  const lesson = lessons.find((item) => item.lesson === id);
  const progress = useProgress();
  const navigate = useNavigate();
  const [run, error] = useGuardedSave();
  const [note, setNote] = useState("");
  if (!lesson)
    return (
      <div className="page">
        <h1>lesson not found</h1>
        <Link to="/grammar">all lessons</Link>
      </div>
    );
  const active = progress.active;
  const same = sameLessonSession(active, id);
  const begin = async (allowReplace) => {
    const seen = active?.started ?? null;
    let opened = false;
    setNote("");
    const ok = await run((progressNow) => {
      if ((progressNow.active?.started ?? null) !== seen) return progressNow;
      if (sameLessonSession(progressNow.active, id)) return progressNow;
      if (progressNow.active && !allowReplace) return progressNow;
      const next = startLessonSession(progressNow, id, Date.now());
      opened = next !== progressNow;
      return next;
    });
    if (ok && opened) navigate("/session");
    else if (ok) setNote("that review changed. look again before starting.");
  };
  return (
    <div className="page reading-page">
      <Link className="back-link" to={`/grammar/${id}`}>
        ← this lesson
      </Link>
      <PageHeading title={lessonTitle(lesson)} />
      <p>
        make one sentence for each pattern in this lesson. type it, or say or write it first. a model
        sentence stays hidden until you ask for it. afterwards you rate the sentence yourself. the rating
        is self-rated, not an exact match to the example.
      </p>
      <p className="muted">{lesson.patterns.length} patterns in this round. other lessons stay as they are.</p>
      <div className="backup-actions">
        {same ? (
          <Link className="primary-button" to="/session">
            continue this lesson <ArrowRight size={18} />
          </Link>
        ) : active ? (
          <>
            <Link className="secondary-button" to="/session">
              continue current review
            </Link>
            <button className="primary-button" onClick={() => begin(true)}>
              start this lesson
            </button>
          </>
        ) : (
          <button className="primary-button" onClick={() => begin(false)}>
            start this lesson <ArrowRight size={18} />
          </button>
        )}
      </div>
      {same && <p className="rating-note">this lesson's revision is already open.</p>}
      {active && !same && (
        <p className="rating-note">
          another review is still open. continue it, or start this lesson instead. starting replaces that
          open review without saving it as finished.
        </p>
      )}
      {note && (
        <p className="notice" role="status">
          {note}
        </p>
      )}
      <SaveError error={error} />
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
          {active.mode === "lesson" || active.queue.some((key) => key.startsWith("grammar:"))
            ? `${active.correct} self-rated as matching across ${active.index} attempts.`
            : `${active.correct} remembered across ${active.index} recall attempts.`}
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
function GrammarRecall({ card }) {
  const progress = useProgress();
  const active = progress.active;
  const key = card.key;
  const index = active.index;
  const saved = savedGrammarFeedback(active, key, index);
  const [draft, setDraft] = useState("");
  const [run, error] = useGuardedSave();
  const helped = Boolean(active.hints?.includes(index));
  const text = saved ? saved.text : draft;
  return (
    <div className="page session-page">
      <div className="session-top">
        <Link to="/">← pause</Link>
        <span>
          {index + 1} / {active.queue.length}
        </span>
        <span className="skill-tag">grammar</span>
      </div>
      <progress className="session-progress" value={index} max={active.queue.length} />
      <div className="recall-paper">
        <p className="eyebrow">{progress.cards[key] ? "review" : "new"}</p>
        <p className="recall-instruction">form a sentence using this pattern.</p>
        <h1 className="recall-prompt">{card.pattern.pattern}</h1>
        <p className="explanation">{card.pattern.explanation}</p>
        <div className="reference-details">
          <label className="search-field">
            <span>your sentence</span>
            <textarea
              value={text}
              onChange={(event) => setDraft(event.target.value)}
              readOnly={Boolean(saved)}
              maxLength={5000}
              rows={3}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="type a sentence, or leave this empty if you said or wrote it"
            />
          </label>
        </div>
        {!saved && (
          <>
            <div className="backup-actions">
              <button className="primary-button" onClick={() => run((p) => commitGrammarAttempt(p, key, index, draft))}>
                i've made a sentence <Check size={17} />
              </button>
              <button className="secondary-button" onClick={() => run((p) => openGrammarModel(p, key, index, draft))}>
                show a model
              </button>
            </div>
            <p className="rating-note">showing a model before your sentence marks this as help.</p>
          </>
        )}
        {saved && !saved.revealed && (
          <div className="backup-actions">
            <button className="primary-button" onClick={() => run((p) => openGrammarModel(p, key, index, saved.text))}>
              show the model <ArrowRight size={18} />
            </button>
          </div>
        )}
        {saved?.revealed && (
          <div className="recall-answer">
            <div className="sentence-paper">
              <span className="eyebrow">one model sentence</span>
              <p className="sentence-text">{card.pattern.exampleJa}</p>
              <p>{card.pattern.exampleEn}</p>
            </div>
            <p className="rating-note">
              one way to use the pattern. a different sentence can still be right. this is not graded by matching these words.
            </p>
            <p>{saved.text ? `your sentence: ${saved.text}` : "your sentence was said or written, and not typed."}</p>
            <p className="rating-note">self-rated. you decide whether your sentence matches the intended use.</p>
            {helped && (
              <p className="rating-note">the model was opened before your attempt, so a match is saved as practice.</p>
            )}
            <div className="rating-actions">
              <button
                className="secondary-button"
                onClick={() => run((p) => recordSessionAnswer(p, key, index, false, Date.now()))}
              >
                needs practice <RotateCcw size={16} />
              </button>
              <button
                className="primary-button"
                onClick={() => run((p) => recordSessionAnswer(p, key, index, true, Date.now()))}
              >
                matches the intended use <Check size={17} />
              </button>
            </div>
            <Link className="text-link" to={`/grammar/${card.lesson.lesson}`}>
              lesson
            </Link>
          </div>
        )}
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
  if (card.pattern) return <GrammarRecall card={card} />;
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
        <p>
          on a phone, install this site from the browser: add to home screen in safari, or install app in
          chrome. study works on that device after the page has loaded once. progress stays on this device
          only. export a backup before clearing site data, reinstalling, or switching phones or computers,
          then import the file there. there is no account sync.
        </p>
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
        <p>dictionary data: <a href="./content-sources.txt" target="_blank" rel="noreferrer">edrdg · sources & credits</a>.</p>
        <p>
          300 characters in {STAGE_COUNT} stages · 58 radicals · 30 lessons · 300 sentences. stroke order is
          Japanese and works offline.
        </p>
        <p>
          study rounds keep word reading, word meaning and writing records separate. later recall is recorded only
          after an unassisted cold check. the kanji practice grid’s highest tier also requires spaced meaning,
          reading and writing checks. progress stays on each device until you transfer a backup.
        </p>
      </details>
    </div>
  );
}
