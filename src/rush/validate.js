// Rush records live inside the study backup (progress.rush). Kept free of
// imports so progress.js can validate them without a module cycle.
export const RUSH_KINDS = ["reading", "meaning", "word", "write", "listen"];
export const KANA_SKILLS = ["kana", "write", "listen"];
/** Kanji pools offered in the kanji tab. */
export const PLAY_SOURCES = ["learned", "weak"];
// Accepted on import so records saved by earlier builds still restore.
const SAVED_SOURCES = [...PLAY_SOURCES, "due", "range"];

export function emptyRush() {
  return {
    version: 1,
    total: 0,
    runs: 0,
    best: {},
    days: [],
    palette: 0,
    stages: {},
    kanji: {},
    kana: {},
    kanaStages: {},
    settings: {
      kinds: ["reading", "meaning", "write"],
      kanaKinds: ["kana", "write", "listen"],
      source: "learned",
      sound: true,
      voice: false,
    },
  };
}

const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const unit = (value) => typeof value === "number" && value >= 0 && value <= 1;
const idIn = (key, max) => /^\d+$/.test(key) && Number(key) >= 1 && Number(key) <= max;

export function validateRush(value) {
  const fail = () => {
    throw new Error("This backup contains invalid kana or kanji practice records.");
  };
  if (!record(value) || value.version !== 1) fail();
  if (![value.total, value.runs, value.palette].every(count)) fail();
  if (!record(value.best) || !Object.values(value.best).every(count)) fail();
  if (
    !Array.isArray(value.days) ||
    value.days.length > 400 ||
    !value.days.every((day) => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day))
  )
    fail();
  if (
    !record(value.stages) ||
    !Object.entries(value.stages).every(
      ([key, stage]) =>
        idIn(key, 60) && record(stage) && count(stage.cleared) && [1, 2, 3].includes(stage.stars),
    )
  )
    fail();
  const skills = (entry, kinds) => {
    if (!record(entry)) fail();
    if (entry.learned !== undefined && !count(entry.learned)) fail();
    for (const kind of kinds) {
      const skill = entry[kind];
      if (skill === undefined) continue;
      if (
        !record(skill) ||
        !unit(skill.ease) ||
        ![skill.seen, skill.hits, skill.misses, skill.last].every(count)
      )
        fail();
    }
  };
  if (!record(value.kanji)) fail();
  for (const [key, entry] of Object.entries(value.kanji)) {
    if (!idIn(key, 300)) fail();
    skills(entry, RUSH_KINDS);
  }
  // Kana records are optional: backups from before the kana track lack them.
  if (value.kana !== undefined) {
    if (!record(value.kana)) fail();
    for (const [key, entry] of Object.entries(value.kana)) {
      if (!/^[ぁ-ゖァ-ヺ]{1,2}$/.test(key)) fail();
      skills(entry, KANA_SKILLS);
    }
  }
  if (
    value.kanaStages !== undefined &&
    (!record(value.kanaStages) ||
      !Object.entries(value.kanaStages).every(
        ([key, stage]) =>
          /^[hk]\d{1,2}$/.test(key) &&
          record(stage) &&
          count(stage.cleared) &&
          [1, 2, 3].includes(stage.stars),
      ))
  )
    fail();
  const settings = value.settings;
  if (
    !record(settings) ||
    !Array.isArray(settings.kinds) ||
    !settings.kinds.length ||
    !settings.kinds.every((kind) => RUSH_KINDS.includes(kind)) ||
    !SAVED_SOURCES.includes(settings.source) ||
    (settings.kanaKinds !== undefined &&
      (!Array.isArray(settings.kanaKinds) ||
        !settings.kanaKinds.length ||
        !settings.kanaKinds.every((kind) => KANA_SKILLS.includes(kind)))) ||
    typeof settings.sound !== "boolean" ||
    typeof settings.voice !== "boolean"
  )
    fail();
  return value;
}
