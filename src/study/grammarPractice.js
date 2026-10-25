import { createSession, lessons } from "./content.js";
import { schedule } from "./progress.js";

function lessonById(lessonId) {
  const id = Number(lessonId);
  if (!Number.isInteger(id)) return null;
  return lessons.find((lesson) => lesson.lesson === id) || null;
}

export function savedGrammarFeedback(active, key, index) {
  const feedback = active?.feedback;
  if (!feedback || feedback.index !== index || feedback.key !== key) return null;
  return feedback;
}

/** An open lesson revision, not a mixed due-review that happens to include some of its cards. */
export function sameLessonSession(active, lessonId) {
  if (!active?.queue?.length) return false;
  const id = Number(lessonId);
  if (!Number.isInteger(id)) return false;
  return active.mode === "lesson" && Number(active.lessonId) === id;
}

/**
 * Passed quiz marks the lesson complete and introduces unseen patterns as
 * needing review. Existing cards keep their recall record.
 */
export function completeLessonQuiz(progress, lessonId, now) {
  const lesson = lessonById(lessonId);
  if (!lesson) return progress;
  const nextCards = { ...progress.cards };
  lesson.patterns.forEach((_, index) => {
    const key = `grammar:${lesson.lesson}:${index}`;
    if (!nextCards[key]) nextCards[key] = schedule(null, false, now);
  });
  return {
    ...progress,
    cards: nextCards,
    lessons: { ...progress.lessons, [lesson.lesson]: now },
  };
}

/** Replace the open session with this lesson's patterns. No-op when the lesson has none. */
export function startLessonSession(progress, lessonId, now) {
  const active = createSession(progress, "lesson", now, { lessonId });
  if (!active.queue.length) return progress;
  return { ...progress, active };
}

function attemptText(text) {
  return String(text ?? "").slice(0, 5000);
}

/** Store the sentence the learner produced. Does not score and does not reveal the model. */
export function commitGrammarAttempt(progress, key, index, text) {
  const active = progress.active;
  if (!active || active.index !== index || active.queue[index] !== key) return progress;
  if (savedGrammarFeedback(active, key, index)) return progress;
  return {
    ...progress,
    active: {
      ...active,
      feedback: {
        index,
        key,
        correct: null,
        revealed: false,
        text: attemptText(text),
        selected: [],
      },
    },
  };
}

/**
 * Show the model sentence. Opening it before a committed attempt records help
 * for this queue index. Opening it after an attempt does not.
 */
export function openGrammarModel(progress, key, index, text) {
  const active = progress.active;
  if (!active || active.index !== index || active.queue[index] !== key) return progress;
  const saved = savedGrammarFeedback(active, key, index);
  if (saved?.revealed) return progress;
  const helped = !saved;
  let hints = active.hints;
  if (helped) {
    hints = active.hints ? [...active.hints] : [];
    if (!hints.includes(index)) hints.push(index);
  }
  return {
    ...progress,
    active: {
      ...active,
      ...(helped ? { hints } : {}),
      feedback: {
        index,
        key,
        correct: null,
        revealed: true,
        text: attemptText(saved ? saved.text : text),
        selected: [],
      },
    },
  };
}
