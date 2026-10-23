import { primaryMeaning } from "./primaryMeanings";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, Dumbbell } from "lucide-react";
import {
  characters,
  lessons,
  sentences,
  words,
  readings,
  lessonTitle,
  normalize,
} from "./content";
import { radicalsData } from "../data/radicals";
import { componentsDb, kanjiDecompositions } from "../data/components";
import { useProgress, updateProgress } from "./store";
import { contextsFor, compactReadings } from "./characterData";
import { learnedIds, masteryOf, skillStrengths, stageOf, TIERS } from "../rush/mastery";
import { WritePractice } from "../rush/KanjiParts";
import { commonWords } from "../rush/deck";
import { schoolBook } from "../data/schoolBook";

export function Library() {
  const [params, setParams] = useSearchParams();
  const tab = [
    "characters",
    "words",
    "sentences",
    "grammar",
    "radicals",
  ].includes(params.get("type"))
    ? params.get("type")
    : "characters";
  const query = params.get("q") || "";
  const [limit, setLimit] = useState(60);
  const [range, setRange] = useState("all");
  const progress = useProgress();
  const change = (type, q) => {
    setParams({ type, q }, { replace: true });
    setLimit(60);
  };
  const learned = new Set(range === "mine" ? learnedIds(progress) : []);
  const source =
    tab === "characters"
      ? characters
      : tab === "radicals"
        ? radicalsData
        : tab === "grammar"
          ? lessons
          : tab === "sentences"
            ? sentences
            : words;
  const filtered = source.filter((item) => {
    if (
      tab === "characters" &&
      range === "mine" &&
      !learned.has(item.id)
    )
      return false;
    return normalize(
      [
        item.id,
        item.kanji,
        item.word,
        item.reading,
        item.meaning,
        item.title,
        item.sentence,
        item.translation,
        ...(item.targets || []).map(
          (target) => `${target.word} ${target.reading}`,
        ),
        ...(item.kunyomi || []),
        ...(item.onyomi || []),
        ...(item.patterns || []).map((p) => `${p.pattern} ${p.explanation}`),
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(normalize(query));
  });
  return (
    <div className="page">
      <div className="page-heading">
        <h1>library</h1>
      </div>
      {tab === "characters" && <p className="muted">school book · {schoolBook.title.toLowerCase()} · {schoolBook.level}</p>}
      <div className="library-toolbar">
        <label className="search-field">
          <span>search the library</span>
          <div className="search-input">
            <Search size={19} />
            <input
              type="search"
              placeholder="meaning, reading, character, or number"
              value={query}
              onChange={(e) => change(tab, e.target.value)}
            />
          </div>
        </label>
        {tab === "characters" && (
          <label className="range-select">
            show
            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                setLimit(60);
              }}
            >
              <option value="all">all characters</option>
              <option value="mine">kanji I have met</option>
            </select>
          </label>
        )}
      </div>
      <div className="library-tabs" aria-label="Library categories">
        {["characters", "words", "sentences", "grammar", "radicals"].map(
          (type) => (
            <button
              key={type}
              aria-pressed={tab === type}
              className={tab === type ? "selected" : ""}
              onClick={() => change(type, query)}
            >
              {type}
            </button>
          ),
        )}
        <span>{filtered.length.toLocaleString()} results</span>
      </div>
      <div
        className={
          tab === "characters" || tab === "radicals"
            ? "library-grid"
            : "library-list"
        }
      >
        {filtered.slice(0, limit).map((item) => {
          if (tab === "sentences")
            return (
              <details className="library-sentence" key={item.kanjiId}>
                <summary>{item.sentence}</summary>
                <p>{item.translation}</p>
                <div className="word-examples">
                  {item.targets.map((target, index) => (
                    <div key={index}>
                      <strong>{target.word}</strong>
                      <span>{target.reading}</span>
                    </div>
                  ))}
                </div>
                {characters
                  .filter((character) =>
                    item.targets.some(
                      (target) =>
                        target.word.includes(character.kanji) &&
                        item.sentence.includes(target.word),
                    ),
                  )
                  .map((character) => (
                    <Link
                      className="text-link related-character"
                      key={character.id}
                      to={`/library/characters/${character.id}`}
                    >
                      {character.kanji}
                    </Link>
                  ))}
              </details>
            );

          if (tab === "grammar")
            return (
              <Link
                className="lesson-row"
                key={item.lesson}
                to={`/grammar/${item.lesson}`}
              >
                <span className="lesson-step">
                  {String(item.lesson).padStart(2, "0")}
                </span>
                <span>
                  <h2>{lessonTitle(item)}</h2>
                  <p>{item.patterns.length} patterns</p>
                </span>
                <ArrowRight size={18} />
              </Link>
            );
          if (tab === "words")
            return (
              <Link
                key={item.id}
                className="word-row"
                to={`/library/characters/${item.characterId}`}
              >
                <strong>{item.word}</strong>
                <span>{item.reading}</span>
                <p>{item.meaning}</p>
                <ArrowRight size={16} />
              </Link>
            );
          if (tab === "radicals")
            return (
              <div className="library-character" key={item.id}>
                <div className="character-meta">
                  <span>radical {item.id}</span>
                </div>
                <span className="character-text">{item.kanji}</span>
                <span className="character-reading" lang="ja">{item.reading}</span>
                <h2>{primaryMeaning(item)}</h2>
              </div>
            );
          const tier = masteryOf(progress, item.id);
          return (
            <Link className="library-character" key={item.id} to={`/library/characters/${item.id}`}>
              <div className="character-meta">
                <span>{String(item.id).padStart(3, "0")}</span>
                {tier > 0 && <span className={`tier-tag tier-${tier}`}>{TIERS[tier]}</span>}
              </div>
              <span className="character-text">{item.kanji}</span>
              <span className="character-reading" lang="ja">{compactReadings(item)}</span>
              <h2>{primaryMeaning(item)}</h2>
            </Link>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={30} />
          <h2>no results</h2>
          <p>try another search.</p>
          <button
            className="secondary-button"
            onClick={() => {
              change(tab, "");
              setRange("all");
            }}
          >
            clear filters
          </button>
        </div>
      )}
      {filtered.length > limit && (
        <button
          className="secondary-button load-more"
          onClick={() => setLimit(limit + 60)}
        >
          show 60 more · {filtered.length - limit} remaining
        </button>
      )}
    </div>
  );
}

export function CharacterPage() {
  const { id } = useParams();
  const item = characters.find((c) => c.id === Number(id));
  if (!item)
    return (
      <div className="page">
        <h1>character not found</h1>
        <Link to="/library">return to library</Link>
      </div>
    );
  const contexts = contextsFor(item);
  const sentence = contexts[0];
  const components = kanjiDecompositions[item.kanji] || [];
  return (
    <div className="page character-page">
      <Link className="back-link" to="/library">
        ← back to library
      </Link>
      <div className="character-heading">
        <div className="character-sheet">
          <span className="eyebrow">
            character {String(item.id).padStart(3, "0")}
          </span>
          <span className="character-text">{item.kanji}</span>
        </div>
        <div>
          <p className="eyebrow"></p>
          <h1>{primaryMeaning(item)}</h1>
          <p className="reading-line">
            {readings(item).slice(0, 3).join(" / ")}
          </p>

          <div className="backup-actions">
            <Link className="primary-button" to={`/kanji/play?mode=practice&ids=${item.id}`}>
              <Dumbbell size={17} /> practise
            </Link>
            <Link className="secondary-button" to={`/kanji/stage/${stageOf(item.id)}`}>
              stage {stageOf(item.id)}
            </Link>
          </div>
        </div>
      </div>
      <SkillProgress id={item.id} />
      <WritePractice key={item.id} character={item} />
      <MemoryNote key={`note-${item.id}`} id={item.id} />
      <section className="pattern-section">
        <div className="section-top">
          <h2>words</h2>
        </div>
        <div className="word-examples">
          {(commonWords(item, 5).length ? commonWords(item, 5) : item.examples.slice(0, 5)).map((word, i) => (
            <div key={i}>
              <strong>{word.word}</strong>
              <span>{word.reading}</span>
              {word.meaning && <small>{word.meaning}</small>}
            </div>
          ))}
        </div>
      </section>
      {sentence && (
        <section className="pattern-section">
          <p className="eyebrow">sentence</p>
          <div className="sentence-paper">
            <p className="sentence-text">{sentence.sentence}</p>
            <details>
              <summary>translation & readings</summary>
              <p>{sentence.translation}</p>
              <div className="word-examples">
                {sentence.targets.map((target, i) => (
                  <div key={i}>
                    <strong>{target.word}</strong>
                    <span>{target.reading}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>
      )}
      {components.length > 0 && (
        <section className="pattern-section">
          <h2>components</h2>
          <div className="component-strip">
            {components.map((component, i) => (
              <div key={i}>
                <span className="character-text">
                  {typeof component === "string"
                    ? component
                    : component.component || ""}
                </span>
                <small>
                  {componentsDb[component]?.meaning || "visual component"}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
      {contexts.length > 1 && (
        <details className="reference-details">
          <summary>more sentences ({contexts.length - 1})</summary>
          {contexts.slice(1).map((context) => (
            <div className="sentence-paper" key={context.kanjiId}>
              <p className="sentence-text">{context.sentence}</p>
              <p>{context.translation}</p>
              <div className="word-examples">
                {context.targets.map((target, index) => (
                  <div key={index}>
                    <strong>{target.word}</strong>
                    <span>{target.reading}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </details>
      )}
      <details className="reference-details">
        <summary>all readings & words ({item.examples.length})</summary>
        <p className="explanation">{item.meaning}</p>
        <p className="reading-line">{readings(item).join(" / ")}</p>
        <p className="explanation">endings in parentheses are written after the character; hyphens mark readings used as part of a word. dictionary readings include rare uses. your class may require only some of these.</p>
        <div className="word-examples">
          {item.examples.map((word, i) => (
            <div key={i}>
              <strong>{word.word}</strong>
              <span>{word.reading}</span>
              <small>{word.meaning}</small>
            </div>
          ))}
        </div>
      </details>
      <div className="page-bottom">
        {item.id > 1 ? (
          <Link to={`/library/characters/${item.id - 1}`}>← previous</Link>
        ) : (
          <span />
        )}
        {item.id < 300 && (
          <Link to={`/library/characters/${item.id + 1}`}>next →</Link>
        )}
      </div>
    </div>
  );
}

const SKILL_LABEL = { reading: "読 reading", meaning: "意 meaning", write: "書 writing", word: "語 words" };

/** How solid each skill is, from kanji rush and the review schedule. */
function SkillProgress({ id }) {
  const progress = useProgress();
  return (
    <div className="skill-progress skill-bars">
      {skillStrengths(progress, id).map((skill) => (
        <div key={skill.kind}>
          <span lang="ja">{SKILL_LABEL[skill.kind]}</span>
          <span className="skill-bar" aria-label={`${Math.round(skill.ease * 100)}%`}>
            <i style={{ width: `${Math.round(skill.ease * 100)}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function MemoryNote({ id }) {
  const progress = useProgress();
  const [note, setNote] = useState(progress.notes?.[id] || "");
  const [status, setStatus] = useState("");
  return (
    <details className="reference-details">
      <summary>memory note</summary>
      <label className="sr-only" htmlFor="memory-note">
        your memory aid
      </label>
      <textarea
        id="memory-note"
        maxLength={5000}
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setStatus("");
        }}
        placeholder="a story, association, or tricky difference"
      />
      <button
        className="secondary-button"
        onClick={async () => {
          try {
            await updateProgress((p) => ({ ...p, notes: { ...p.notes, [id]: note } }));
            setStatus("saved");
          } catch {
            setStatus("could not save. retry after freeing device storage.");
          }
        }}
      >
        save
      </button>
      {status && (
        <p role="status" className="muted">
          {status}
        </p>
      )}
    </details>
  );
}
