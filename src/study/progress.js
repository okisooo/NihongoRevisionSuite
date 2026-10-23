import { validateRush } from "../rush/validate.js";
import { validateRound } from "../play/validate.js";

export const STORAGE_KEY = "study_suite_v1";
const DAY = 86400000;
const intervals = [1, 3, 7, 14, 30, 60];

export function emptyProgress() {
  return {
    version: 1,
    cards: {},
    lessons: {},
    notes: {},
    sessions: [],
    active: null,
    settings: { from: 1, to: 300, newCount: 5 },
  };
}

export function schedule(previous, recalled, now) {
  const previousStreak = previous?.streak || 0;
  const lastSuccess = previous?.lastSuccess ?? previous?.lastReviewed ?? 0;
  // Repeating a drill immediately is useful practice, not spaced retention.
  const spaced = !previousStreak || now - lastSuccess >= DAY;
  const streak = recalled ? previousStreak + (spaced ? 1 : 0) : 0;
  return {
    introduced: previous?.introduced ?? previous?.lastReviewed ?? now,
    attempts: (previous?.attempts || 0) + 1,
    misses: (previous?.misses || 0) + (recalled ? 0 : 1),
    streak,
    due:
      recalled && !spaced && previous?.due > now
        ? previous.due
        : now +
          (recalled
            ? intervals[Math.min(streak - 1, intervals.length - 1)] * DAY
            : 60000),
    lastReviewed: now,
    lastSuccess: recalled && spaced ? now : lastSuccess,
  };
}

export function recordSessionAnswer(progress, key, index, recalled, now) {
  const active = progress.active;
  if (!active || active.index !== index || active.queue[index] !== key)
    return progress;
  recalled = Boolean(recalled) && !active.hints?.includes(index);
  const repeat = !recalled && !active.retried.includes(key);
  return {
    ...progress,
    cards: {
      ...progress.cards,
      [key]: schedule(progress.cards[key], recalled, now),
    },
    active: {
      ...active,
      feedback: null,
      index: index + 1,
      correct: active.correct + (recalled ? 1 : 0),
      variants: {
        ...active.variants,
        [key]: active.variants?.[key] ?? progress.cards[key]?.attempts ?? 0,
      },
      queue: repeat ? [...active.queue, key] : active.queue,
      retried: repeat ? [...active.retried, key] : active.retried,
    },
  };
}

export function validateProgress(value) {
  const record = (object) =>
    object !== null && typeof object === "object" && !Array.isArray(object);
  const count = (number) => Number.isSafeInteger(number) && number >= 0;
  if (
    !record(value) ||
    value.version !== 1 ||
    !record(value.cards) ||
    !record(value.lessons) ||
    !Array.isArray(value.sessions)
  )
    throw new Error("This is not a supported study backup.");
  for (const [key, card] of Object.entries(value.cards)) {
    if (
      !/^(character:\d+:(meaning|reading)|sentence:\d+:context|grammar:\d+:\d+|drill:\d+:(recognition|meaning|reading|vocabulary|cloze|components|writing))$/.test(
        key,
      ) ||
      !record(card) ||
      !["attempts", "misses", "streak", "due", "lastReviewed"].every((k) =>
        count(card[k]),
      ) ||
      card.misses > card.attempts ||
      card.streak > card.attempts ||
      (card.lastSuccess !== undefined && !count(card.lastSuccess)) ||
      (card.introduced !== undefined && !count(card.introduced))
    )
      throw new Error("This backup contains invalid review records.");
  }
  const { from, to, newCount } = value.settings || {};
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 1 ||
    to > 300 ||
    from > to ||
    ![3, 5, 10].includes(newCount)
  )
    throw new Error("This backup contains invalid study settings.");
  if (
    !Object.entries(value.lessons).every(
      ([id, date]) =>
        /^\d+$/.test(id) &&
        Number(id) >= 1 &&
        Number(id) <= 30 &&
        Number.isFinite(date),
    )
  )
    throw new Error("This backup contains invalid lesson records.");
  if (
    value.active !== null &&
    (!record(value.active) ||
      !Array.isArray(value.active.queue) ||
      !value.active.queue.every((k) => typeof k === "string") ||
      !count(value.active.index) ||
      value.active.index > value.active.queue.length ||
      !Array.isArray(value.active.retried) ||
      !value.active.retried.every((k) => typeof k === "string") ||
      !count(value.active.correct) ||
      value.active.correct > value.active.index ||
      !count(value.active.started))
  )
    throw new Error("This backup contains an invalid session.");
  if (
    value.active?.variants !== undefined &&
    (!record(value.active.variants) ||
      !Object.values(value.active.variants).every(count))
  )
    throw new Error("This backup contains invalid exercise variants.");
  if (
    value.active?.hints !== undefined &&
    (!Array.isArray(value.active.hints) ||
      !value.active.hints.every(
        (index) => count(index) && index < value.active.queue.length,
      ))
  )
    throw new Error("This backup contains invalid hint records.");
  const feedback = value.active?.feedback;
  if (feedback != null && (
    !record(feedback) || feedback.index !== value.active.index ||
    feedback.key !== value.active.queue[feedback.index] ||
    ![true, false, null].includes(feedback.correct) ||
    typeof feedback.revealed !== "boolean" ||
    typeof feedback.text !== "string" || feedback.text.length > 5000 ||
    !Array.isArray(feedback.selected) || !feedback.selected.every(count) ||
    (feedback.strokes !== undefined && (
      !Array.isArray(feedback.strokes) || feedback.strokes.length > 500 ||
      !feedback.strokes.every(stroke => Array.isArray(stroke) && stroke.length <= 10000 &&
        stroke.every(point => Array.isArray(point) && point.length === 2 &&
          point.every(n => Number.isFinite(n) && n >= 0 && n <= 560)))))))
    throw new Error("This backup contains invalid saved feedback.");
  if (
    value.notes !== undefined &&
    (!record(value.notes) ||
      !Object.entries(value.notes).every(
        ([id, note]) =>
          /^\d+$/.test(id) &&
          Number(id) >= 1 &&
          Number(id) <= 300 &&
          typeof note === "string" &&
          note.length <= 5000,
      ))
  )
    throw new Error("This backup contains invalid memory notes.");
  if (
    !value.sessions.every(
      (s) =>
        record(s) &&
        count(s.finished) &&
        count(s.total) &&
        count(s.correct) &&
        s.correct <= s.total,
    )
  )
    throw new Error("This backup contains invalid session history.");
  if (value.rush !== undefined) validateRush(value.rush);
  if (value.flow !== undefined) validateRound(value.flow);
  return value;
}
