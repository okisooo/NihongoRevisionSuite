import { schedule } from "../study/progress.js";
import { cards, metCharacter } from "../study/content.js";
import { emptyRush, PLAY_SOURCES } from "./validate.js";
import { stars } from "./engine.js";
import { KANA_STAGES, kanaStage, writable } from "./kana.js";

export { emptyRush };
export const STAGE_SIZE = 5;
export const STAGE_COUNT = 60;
const DAY = 86400000;

// Arena colour palettes unlock with lifetime score, like You Can Kana's.
export const PALETTES = [
  { id: "sumi", name: "墨 sumi", at: 0, bg: "#10151e", bg2: "#1b2536", ink: "#eef3fa", accent: "#6ea8ff", hot: "#ff6b81", warn: "#ffc05c" },
  { id: "sakura", name: "桜 sakura", at: 2000, bg: "#26121c", bg2: "#44203a", ink: "#fff1f6", accent: "#ff8fbd", hot: "#ff4f6e", warn: "#ffd98a" },
  { id: "matcha", name: "抹茶 matcha", at: 6000, bg: "#0f1a12", bg2: "#1f3524", ink: "#eff8ea", accent: "#9fdc6c", hot: "#ff7a59", warn: "#f4d35e" },
  { id: "yuugure", name: "夕暮れ dusk", at: 15000, bg: "#1a1030", bg2: "#3b2156", ink: "#fbf0ff", accent: "#ffa66b", hot: "#ff5c8a", warn: "#ffe08a" },
  { id: "umi", name: "海 ocean", at: 30000, bg: "#051c26", bg2: "#0b3b4d", ink: "#e8fbff", accent: "#39e0cf", hot: "#ff6f61", warn: "#ffd166" },
  { id: "kitsune", name: "狐 kitsune", at: 60000, bg: "#1f1007", bg2: "#43220c", ink: "#fff3e6", accent: "#ff9142", hot: "#ff4d4d", warn: "#ffe066" },
  { id: "neon", name: "電 neon", at: 120000, bg: "#08060f", bg2: "#1d0f3a", ink: "#f4f0ff", accent: "#00f0ff", hot: "#ff2bd6", warn: "#fff200" },
  { id: "kin", name: "金 gold", at: 250000, bg: "#141109", bg2: "#302611", ink: "#fff9e8", accent: "#ffd24a", hot: "#ff7043", warn: "#fff1a8" },
];

export function rushOf(progress) {
  const base = emptyRush();
  const rush = progress.rush;
  if (!rush) return base;
  const settings = { ...base.settings, ...rush.settings };
  // Older records may name sources that are now reached from the today page.
  if (!PLAY_SOURCES.includes(settings.source)) settings.source = "learned";
  return { ...base, ...rush, settings };
}

export const stageIds = (stage) =>
  Array.from({ length: STAGE_SIZE }, (_, i) => (stage - 1) * STAGE_SIZE + i + 1);
export const stageOf = (id) => Math.ceil(id / STAGE_SIZE);
export const nextStage = (rush) => {
  for (let stage = 1; stage <= STAGE_COUNT; stage++)
    if (!rush.stages[stage]) return stage;
  return null;
};
export function stageStatus(rush, stage) {
  if (rush.stages[stage]) return "cleared";
  if (stage === 1 || rush.stages[stage - 1]) return "open";
  return "locked";
}

/** Characters met in rush lessons or in regular study. */
export function learnedIds(progress) {
  const ids = [];
  for (let id = 1; id <= 300; id++) if (metCharacter(progress, id)) ids.push(id);
  return ids;
}

/** Kana and kanji keep separate records: rush.kana["か"], rush.kanji[12]. */
const bucket = (rush, track) => (track === "kana" ? rush.kana : rush.kanji);

export function skillEase(rush, id, kind, track = "kanji") {
  const skill = bucket(rush, track)[id]?.[kind];
  return skill?.seen ? skill.ease : null;
}

function srsStreak(progress, id, skill) {
  return Math.max(
    progress.cards[`character:${id}:${skill}`]?.streak || 0,
    progress.cards[`drill:${id}:${skill}`]?.streak || 0,
  );
}

export const TIERS = ["unseen", "learning", "familiar", "strong", "mastered"];
const CORE = [
  ["reading", "reading"],
  ["meaning", "meaning"],
  ["write", "writing"],
];

/**
 * 0 unseen · 1 learning · 2 familiar · 3 strong · 4 mastered. Mastery needs
 * all three core skills (reading, meaning, writing), from rush or reviews.
 */
export function masteryOf(progress, id) {
  if (!metCharacter(progress, id)) return 0;
  const rush = rushOf(progress);
  const scores = CORE.map(([kind, skill]) =>
    Math.max(skillEase(rush, id, kind) ?? 0, Math.min(1, srsStreak(progress, id, skill) / 4)),
  );
  const score = scores.reduce((a, b) => a + b, 0) / scores.length;
  return score >= 0.85 ? 4 : score >= 0.6 ? 3 : score >= 0.3 ? 2 : 1;
}

/** Per-skill strength for one character (0..1), for the library page. */
export function skillStrengths(progress, id) {
  const rush = rushOf(progress);
  return [...CORE, ["word", "reading"]].map(([kind]) => ({
    kind,
    ease:
      kind === "word"
        ? (skillEase(rush, id, "word") ?? 0)
        : Math.max(
            skillEase(rush, id, kind) ?? 0,
            Math.min(1, srsStreak(progress, id, kind === "write" ? "writing" : kind) / 4),
          ),
  }));
}

/** Adaptive spawn weight and time allowance for each prompt. */
export function weigher(progress, now) {
  const rush = rushOf(progress);
  return (prompt) => {
    const eases = prompt.kanjiIds
      .map((id) => skillEase(rush, id, prompt.kind, prompt.track))
      .filter((ease) => ease !== null);
    const due = prompt.srsKeys.some((key) => progress.cards[key]?.due <= now);
    if (!eases.length) return { weight: 1.6 * (due ? 1.8 : 1), slack: 1.35 };
    const ease = eases.reduce((a, b) => a + b, 0) / eases.length;
    return {
      weight: (0.35 + 2.4 * (1 - ease) ** 1.5) * (due ? 1.8 : 1),
      slack: 1.35 - 0.5 * ease,
    };
  };
}

export function localDay(now) {
  const date = new Date(now);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
/** Consecutive play days ending today (or yesterday, if today is unplayed). */
export function streakDays(rush, now) {
  const days = new Set(rush.days);
  let cursor = now;
  if (!days.has(localDay(cursor))) cursor -= DAY;
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

export const unlockedPalettes = (rush) => PALETTES.filter((p) => rush.total >= p.at);
export const paletteOf = (rush) =>
  rush.total >= (PALETTES[rush.palette]?.at ?? Infinity) ? PALETTES[rush.palette] : PALETTES[0];
export const nextPalette = (rush) => PALETTES.find((p) => p.at > rush.total) || null;

export const bestKey = (mode, kinds) => `${mode}:${[...kinds].sort().join("+")}`;

function updateSkill(skill, r, now) {
  const clean = Math.max(0, r.hits - r.hints - r.fumbles);
  const shaky = r.misses + r.hints + r.fumbles;
  let ease = skill?.seen ? skill.ease : 0.3;
  // Repeats inside one run count less than recall on separate days.
  for (let i = 0; i < Math.min(2, clean); i++) ease += (1 - ease) * (i ? 0.08 : 0.18);
  for (let i = 0; i < shaky; i++) ease *= 0.55;
  return {
    ease: Math.round(Math.min(1, Math.max(0, ease)) * 1000) / 1000,
    seen: (skill?.seen || 0) + r.seen,
    hits: (skill?.hits || 0) + clean,
    misses: (skill?.misses || 0) + shaky,
    last: now,
  };
}

export function markLearned(progress, ids, now) {
  const rush = rushOf(progress);
  const kanji = { ...rush.kanji };
  for (const id of ids) kanji[id] = { ...kanji[id], learned: kanji[id]?.learned || now };
  return { ...progress, rush: { ...rush, kanji } };
}

/**
 * Folds a finished run into saved progress: rush mastery, lifetime score,
 * streak, bests, stage clears, and one review-schedule update per card.
 */
export function applyRun(
  progress,
  run,
  now,
  { stage = null, kanaStageId = null, srs = true, kinds = [] } = {},
) {
  const rush = rushOf(progress);
  const kanji = { ...rush.kanji };
  const kana = { ...rush.kana };
  const nextCards = { ...progress.cards };
  const recall = new Map();
  for (const prompt of run.deck) {
    const r = run.results[prompt.id];
    if (!r || r.hits + r.misses === 0) continue;
    const into = prompt.track === "kana" ? kana : kanji;
    for (const id of prompt.kanjiIds)
      into[id] = { ...into[id], [prompt.kind]: updateSkill(into[id]?.[prompt.kind], r, now) };
    const recalled = r.hits > 0 && r.misses + r.hints + r.fumbles === 0;
    // The first key is the prompt's own card; later keys are older aliases of
    // the same skill, updated only when that card already exists.
    prompt.srsKeys.forEach((key, i) => {
      if (i === 0 || progress.cards[key]) recall.set(key, (recall.get(key) ?? true) && recalled);
    });
  }
  if (srs)
    for (const [key, recalled] of recall)
      if (cards[key]) nextCards[key] = schedule(progress.cards[key], recalled, now);
  const total = rush.total + run.score;
  const before = unlockedPalettes(rush).length;
  const next = {
    ...rush,
    kanji,
    kana,
    total,
    runs: rush.runs + 1,
    // A streak day needs at least one cleared prompt, not just an opened run.
    days: run.clears ? [...new Set([localDay(now), ...rush.days])].slice(0, 400) : rush.days,
  };
  let newBest = false;
  if (run.mode === "challenge" && run.score > 0) {
    const key = bestKey(run.mode, kinds);
    newBest = run.score > (rush.best[key] || 0);
    if (newBest) next.best = { ...rush.best, [key]: run.score };
  }
  let earned = 0;
  if (run.mode === "test" && stage && run.won) {
    earned = stars(run);
    const previous = rush.stages[stage];
    next.stages = {
      ...rush.stages,
      [stage]: { cleared: previous?.cleared || now, stars: Math.max(previous?.stars || 0, earned) },
    };
    for (const id of stageIds(stage)) kanji[id] = { ...kanji[id], learned: kanji[id]?.learned || now };
  }
  if (run.mode === "test" && kanaStageId && run.won) {
    earned = stars(run);
    const previous = rush.kanaStages[kanaStageId];
    next.kanaStages = {
      ...rush.kanaStages,
      [kanaStageId]: { cleared: previous?.cleared || now, stars: Math.max(previous?.stars || 0, earned) },
    };
    for (const k of kanaStage(kanaStageId).kana) kana[k] = { ...kana[k], learned: kana[k]?.learned || now };
  }
  const unlocked = unlockedPalettes(next).slice(before);
  return {
    progress: { ...progress, cards: nextCards, rush: next },
    newBest,
    unlocked,
    stars: earned,
  };
}

/** Which characters a run draws from: everything learned, or weak spots. */
export function sourceIds(progress, source) {
  const learned = learnedIds(progress);
  if (source === "weak") {
    const rush = rushOf(progress);
    return learned.filter((id) => {
      // Weak means actually missed, not merely new.
      const shaky = ["reading", "meaning", "word", "write"].some((k) => {
        const skill = rush.kanji[id]?.[k];
        return skill?.misses > 0 && skill.ease < 0.5;
      });
      const srsWeak = ["meaning", "reading", "writing"].some((skill) =>
        [`character:${id}:${skill}`, `drill:${id}:${skill}`].some(
          (key) => progress.cards[key]?.misses > 0 && progress.cards[key].streak < 3,
        ),
      );
      return srsWeak || shaky;
    });
  }
  return learned;
}

/* ---------- kana track ---------- */

export function markKanaLearned(progress, list, now) {
  const rush = rushOf(progress);
  const kana = { ...rush.kana };
  for (const k of list) kana[k] = { ...kana[k], learned: kana[k]?.learned || now };
  return { ...progress, rush: { ...rush, kana } };
}

/** Next uncleared stage of a script ("hiragana" | "katakana"), or of either. */
export function nextKanaStage(rush, script) {
  return (
    KANA_STAGES.find((s) => (!script || s.script === script) && !rush.kanaStages[s.id]) || null
  );
}
export function kanaStageStatus(rush, id) {
  if (rush.kanaStages[id]) return "cleared";
  const index = KANA_STAGES.findIndex((s) => s.id === id);
  const previous = KANA_STAGES[index - 1];
  if (id.endsWith("1") && id.length === 2) return "open";
  return previous && rush.kanaStages[previous.id] ? "open" : "locked";
}

/** Kana met in a stage, all or only the ones that keep slipping. */
export function kanaSource(progress, source = "learned") {
  const rush = rushOf(progress);
  const learned = Object.keys(rush.kana).filter((k) => rush.kana[k].learned);
  if (source !== "weak") return learned;
  return learned.filter((k) =>
    ["kana", "write", "listen"].some((kind) => {
      const skill = rush.kana[k]?.[kind];
      return skill?.misses > 0 && skill.ease < 0.5;
    }),
  );
}

/** Same tiers as kanji: reading, listening, and writing (single characters). */
export function kanaMastery(progress, k) {
  const rush = rushOf(progress);
  const entry = rush.kana[k];
  if (!entry) return 0;
  const kinds = writable(k) ? ["kana", "listen", "write"] : ["kana", "listen"];
  const score = kinds.reduce((sum, kind) => sum + (skillEase(rush, k, kind, "kana") ?? 0), 0) / kinds.length;
  return score >= 0.85 ? 4 : score >= 0.6 ? 3 : score >= 0.3 ? 2 : 1;
}
