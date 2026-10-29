import { matchKana, matchMeaning, normalizeTyped } from "./romaji.js";

// Pure game state for kanji rush. The view drives it with tick/input and
// drains events for sound and effects; nothing here touches the DOM.
export const RULES = {
  // Endless arcade: speeds up with every level, three hearts.
  challenge: { timed: true, lives: 3, maxLives: 5, maxOnScreen: 6 },
  // Stage gate, as in You Can Kana: clear 20 prompts at 80% accuracy.
  test: { timed: true, lives: 3, maxLives: 3, maxOnScreen: 4, goal: 20, pass: 0.8 },
  // Calm: one prompt at a time, no timer, each repeats until done cleanly.
  practice: { timed: false, lives: Infinity, maxOnScreen: 1 },
};
export const FEVER_COMBO = 25;
export const LEVEL_EVERY = 8;
const PENDING_MS = 450;
const HINT_BONUS_MS = 1500;

function random(run) {
  let t = (run.seed = (run.seed + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(run, values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(run) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createRun({ mode = "challenge", deck, seed = 1, slots = 9, goal }) {
  const rules = RULES[mode];
  if (!rules) throw new Error(`unknown rush mode: ${mode}`);
  const run = {
    mode,
    rules,
    deck,
    seed: seed >>> 0,
    slots,
    t: 0,
    targets: [],
    buffer: "",
    pending: null,
    pendingAt: 0,
    grace: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: rules.lives,
    livesLost: 0,
    level: 1,
    clears: 0,
    clean: 0,
    misses: 0,
    mistakes: 0,
    hints: 0,
    keys: 0,
    nextSpawn: 500,
    uid: 0,
    recent: [],
    freed: {},
    results: {},
    events: [],
    queue: null,
    goal: mode === "test" ? (goal ?? rules.goal) : null,
    paused: false,
    over: false,
    won: false,
  };
  if (mode === "practice") run.queue = shuffle(run, deck.map((p) => p.id));
  if (!deck.length) finish(run, false);
  return run;
}

export const multiplier = (combo) => 1 + Math.min(4, Math.floor(combo / 5) * 0.5);
export const accuracy = (run) =>
  run.clears + run.misses ? run.clean / (run.clears + run.misses) : 0;

function emit(run, event) {
  run.events.push({ ...event, t: run.t });
}
/** Returns and clears pending events (clear, miss, wrong, spawn, level...). */
export function drain(run) {
  const events = run.events;
  run.events = [];
  return events;
}
function result(run, prompt) {
  return (run.results[prompt.id] ??= {
    seen: 0,
    hits: 0,
    misses: 0,
    hints: 0,
    fumbles: 0,
    fastest: 0,
  });
}

/** How the typed buffer relates to one prompt. */
export function matchTarget(prompt, buffer) {
  if (prompt.kind === "write") return { ok: false, complete: false, more: false, matched: 0 };
  if (!buffer) return { ok: true, complete: false, more: false, matched: 0 };
  if (prompt.kind === "meaning") {
    const found = matchMeaning(prompt.answers, buffer);
    const text = found.rest.replace(/^(?:to|a|an|the)\s+/, "");
    return {
      ...found,
      answer: found.complete ? text : null,
      more: found.complete && prompt.answers.some((a) => a !== text && a.startsWith(text)),
    };
  }
  let best = { ok: false, complete: false, matched: 0 };
  let completeAnswer = null;
  for (const answer of prompt.answers) {
    const found = matchKana(answer, buffer);
    if (found.complete && !completeAnswer) completeAnswer = answer;
    if (
      (found.complete && !best.complete) ||
      (found.ok && !best.ok) ||
      (found.ok && found.complete === best.complete && found.matched > best.matched)
    )
      best = { ...found, answer };
  }
  const more =
    Boolean(completeAnswer) &&
    prompt.answers.some(
      (answer) =>
        answer !== completeAnswer &&
        answer.length > completeAnswer.length &&
        matchKana(answer, buffer).ok,
    );
  return { ...best, answer: completeAnswer ?? best.answer, more };
}

const remaining = (run, target) => target.born + target.life - run.t;
const byUrgency = (run) => (a, b) =>
  remaining(run, a) - remaining(run, b) || a.born - b.born;
const anyOk = (run, text) => run.targets.some((t) => matchTarget(t.prompt, text).ok);

function maxOnScreen(run) {
  if (!run.rules.timed) return Math.min(run.slots, run.rules.maxOnScreen);
  return Math.min(run.slots, run.rules.maxOnScreen, 2 + Math.floor((run.level - 1) / 2));
}
function spawnInterval(run) {
  if (!run.rules.timed) return 250;
  const floor = run.mode === "test" ? 1200 : 700;
  return Math.max(floor, 2600 - 180 * (run.level - 1));
}
/** Time allowed before a prompt expires, shorter as levels rise. */
export function lifeFor(run, prompt) {
  if (!run.rules.timed) return Infinity;
  const length = Math.min(12, prompt.length || 3);
  const base =
    prompt.kind === "meaning"
      ? 8500 + 250 * length
      : prompt.kind === "word"
        ? 4500 + 800 * length
        : 6000 + 550 * length;
  const speed = Math.max(0.45, 1 - 0.045 * (run.level - 1));
  return base * speed * (prompt.slack || 1);
}

function runWeight(run, prompt) {
  const r = run.results[prompt.id];
  if (!r || !r.seen) return 1.3;
  const shaky = r.misses + r.hints + r.fumbles > 0;
  return Math.max(0.08, (shaky ? 3 : 1) * 0.6 ** r.hits);
}
function pick(run) {
  const onScreen = new Set(run.targets.map((t) => t.prompt.id));
  const kanjiOnScreen = new Set(run.targets.flatMap((t) => t.prompt.kanjiIds));
  let pool = run.deck.filter((p) => !onScreen.has(p.id));
  const recent = new Set(run.recent);
  const fresh = pool.filter(
    (p) => !recent.has(p.id) && !p.kanjiIds.some((id) => kanjiOnScreen.has(id)),
  );
  if (fresh.length) pool = fresh;
  if (!pool.length) return null;
  const weights = pool.map((p) => Math.max(0.05, p.weight ?? 1) * runWeight(run, p));
  let roll = random(run) * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((roll -= weights[i]) <= 0) return pool[i];
  return pool[pool.length - 1];
}
function freeSlot(run) {
  const used = new Set(run.targets.map((t) => t.slot));
  const open = [...Array(run.slots).keys()].filter((slot) => !used.has(slot));
  if (!open.length) return -1;
  // Avoid dropping a new prompt where a burst is still animating.
  const settled = open.filter((slot) => run.t - (run.freed[slot] ?? -1e9) > 900);
  const choices = settled.length ? settled : open;
  return choices[Math.floor(random(run) * choices.length)];
}

function spawn(run) {
  let prompt;
  if (run.mode === "practice") {
    const id = run.queue.shift();
    prompt = run.deck.find((p) => p.id === id);
  } else prompt = pick(run);
  if (!prompt) return false;
  const slot = freeSlot(run);
  if (slot < 0) return false;
  const target = {
    uid: ++run.uid,
    prompt,
    born: run.t,
    life: lifeFor(run, prompt),
    slot,
    hinted: false,
    fumbles: 0,
  };
  run.targets.push(target);
  const recentSize = Math.max(0, Math.min(4, run.deck.length - maxOnScreen(run) - 1));
  run.recent = [prompt.id, ...run.recent].slice(0, recentSize);
  result(run, prompt).seen++;
  emit(run, { type: "spawn", target });
  return true;
}

function finish(run, won) {
  if (run.over) return;
  run.over = true;
  run.won = won;
  run.pending = null;
  emit(run, { type: "over", won });
}

function removeTarget(run, target) {
  run.targets = run.targets.filter((t) => t !== target);
  run.freed[target.slot] = run.t;
  if (run.pending === target.uid) run.pending = null;
}

function clearTarget(run, target, answer) {
  const typed = run.buffer;
  removeTarget(run, target);
  run.buffer = "";
  run.pending = null;
  const r = result(run, target.prompt);
  const clean = !target.hinted && target.fumbles === 0;
  const left = run.rules.timed
    ? Math.min(1, Math.max(0, remaining(run, target) / target.life))
    : 0;
  run.combo = target.hinted ? 0 : run.combo + 1;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  run.clears++;
  if (clean) run.clean++;
  r.hits++;
  if (target.hinted) r.hints++;
  else if (!clean) r.fumbles++;
  const took = run.t - target.born;
  r.fastest = r.fastest ? Math.min(r.fastest, took) : took;
  const mult = multiplier(run.combo);
  const fever = run.combo >= FEVER_COMBO;
  const base = 10 + 3 * Math.min(12, target.prompt.length || 1);
  const points = target.hinted
    ? 0
    : Math.round(base * (1 + left) * mult * (fever ? 2 : 1) * (run.rules.timed ? 1 : 0.5));
  run.score += points;
  // A trailing n completes ん; forgive the IME habit of typing a second n.
  run.grace =
    typed.endsWith("n") && !typed.endsWith("nn") ? { char: "n", until: run.t + 400 } : null;
  emit(run, { type: "clear", target, points, mult, fever, left, answer, clean });
  if (clean && run.combo % FEVER_COMBO === 0 && run.lives < run.rules.maxLives) {
    run.lives++;
    emit(run, { type: "heart" });
  }
  const level = 1 + Math.floor(run.clears / LEVEL_EVERY);
  if (level > run.level) {
    run.level = level;
    emit(run, { type: "level", level });
  }
  if (run.mode === "practice" && !clean)
    run.queue.splice(Math.min(2, run.queue.length), 0, target.prompt.id);
  if (run.mode === "test" && run.clears >= run.goal)
    finish(run, accuracy(run) >= run.rules.pass);
  if (run.mode === "practice" && !run.queue.length && !run.targets.length) finish(run, true);
}

function expire(run, target) {
  removeTarget(run, target);
  run.misses++;
  run.combo = 0;
  result(run, target.prompt).misses++;
  if (Number.isFinite(run.lives)) {
    run.lives--;
    run.livesLost++;
  }
  emit(run, { type: "miss", target });
  if (run.buffer && !anyOk(run, run.buffer)) run.buffer = "";
  if (run.lives <= 0) finish(run, false);
}

function wrong(run, previous) {
  run.mistakes++;
  run.combo = Math.floor(run.combo / 2);
  if (previous)
    for (const target of run.targets)
      if (matchTarget(target.prompt, previous).ok) target.fumbles++;
  emit(run, { type: "wrong" });
}

// Pops the most urgent complete target unless the buffer could still grow into
// another answer ("kan" → かん or かんじ); then it waits briefly for more keys.
function resolve(run) {
  const matches = run.targets.map((target) => ({
    target,
    match: matchTarget(target.prompt, run.buffer),
  }));
  const complete = matches
    .filter((m) => m.match.complete)
    .sort((a, b) => byUrgency(run)(a.target, b.target))[0];
  if (!complete) {
    run.pending = null;
    return;
  }
  const continues = matches.some((m) =>
    m === complete ? m.match.more : m.match.ok && !m.match.complete,
  );
  if (!continues) clearTarget(run, complete.target, complete.match.answer);
  else if (run.pending !== complete.target.uid) {
    run.pending = complete.target.uid;
    run.pendingAt = run.t;
  }
}

function commitPending(run) {
  const target = run.targets.find((t) => t.uid === run.pending);
  run.pending = null;
  if (!target) return false;
  const match = matchTarget(target.prompt, run.buffer);
  if (!match.complete) return false;
  clearTarget(run, target, match.answer);
  return true;
}

/** Feed the whole input value after each change. */
export function input(run, raw) {
  if (run.over || run.paused) return;
  // Writing prompts are answered on the pad, never by typing.
  if (run.targets.length && run.targets.every((t) => t.prompt.kind === "write")) return;
  const previous = run.buffer;
  const next = normalizeTyped(raw);
  if (next === previous) return;
  const grew = next.length > previous.length && next.startsWith(previous);
  if (!grew) {
    // Deleting always works; an IME replacement must still be valid.
    if (!next || anyOk(run, next)) {
      run.buffer = next;
      resolve(run);
    } else wrong(run, previous);
    return;
  }
  const added = next.slice(previous.length);
  run.keys += added.length;
  if (!previous && run.grace && added === run.grace.char && run.t <= run.grace.until) {
    run.grace = null;
    return;
  }
  if (anyOk(run, next)) {
    run.buffer = next;
    resolve(run);
    return;
  }
  if (run.pending !== null && commitPending(run)) {
    const fresh = added.trimStart();
    if (fresh && anyOk(run, fresh)) {
      run.buffer = fresh;
      resolve(run);
    } else if (fresh) wrong(run, "");
    return;
  }
  wrong(run, previous);
}

/** Enter: accept a waiting completion right away. */
export function confirm(run) {
  if (run.over || run.paused) return;
  if (run.pending !== null) commitPending(run);
}

/** Reveals the answer on the prompt being typed, or the most urgent one. */
export function hint(run) {
  if (run.over || run.paused || !run.targets.length) return null;
  const open = run.targets.filter((t) => !t.hinted).sort(byUrgency(run));
  const typing = run.buffer ? open.filter((t) => matchTarget(t.prompt, run.buffer).ok) : [];
  const target = typing[0] || open[0];
  if (!target) return null;
  return revealTarget(run, target);
}

function revealTarget(run, target) {
  target.hinted = true;
  if (run.rules.timed) target.life += HINT_BONUS_MS;
  run.hints++;
  run.combo = 0;
  emit(run, { type: "hint", target });
  return target;
}

/** A paused reference lookup assists only the visible matching prompts. */
export function referenceHints(run, ids) {
  if (!run || run.over) return [];
  return run.targets.filter(t => !t.hinted && t.prompt.track !== "kana" && t.prompt.kanjiIds.some(id => ids.includes(id)))
    .map(t => revealTarget(run, t));
}

export function tick(run, dt) {
  if (run.over || run.paused) return;
  run.t += dt;
  if (run.pending !== null && run.t - run.pendingAt >= PENDING_MS) commitPending(run);
  if (run.rules.timed)
    for (const target of [...run.targets])
      if (!run.over && remaining(run, target) <= 0) expire(run, target);
  if (run.over) return;
  if (!run.targets.length) run.nextSpawn = Math.min(run.nextSpawn, 250);
  run.nextSpawn -= dt;
  if (run.nextSpawn <= 0 && run.targets.length < maxOnScreen(run)) {
    spawn(run);
    run.nextSpawn = spawnInterval(run);
  }
  if (run.mode === "practice" && !run.queue.length && !run.targets.length) finish(run, true);
}

/** Result from the writing pad for the current write prompt. */
export function completeWrite(run, { clean, hinted = false }) {
  if (run.over || run.paused) return;
  const target = run.targets.find((t) => t.prompt.kind === "write");
  if (!target) return;
  if (hinted) target.hinted = true;
  if (!clean && !target.hinted) target.fumbles++;
  clearTarget(run, target, target.prompt.text);
}

export function setPaused(run, paused) {
  if (!run.over) run.paused = paused;
}

/** Ends a run early on request; practice has no game over. */
export function quit(run) {
  finish(run, true);
}

export function stars(run) {
  if (!run.won) return 0;
  const acc = accuracy(run);
  if (acc >= 0.999 && !run.livesLost) return 3;
  return acc >= 0.9 ? 2 : 1;
}

export function summary(run) {
  const missed = run.deck.filter((p) => {
    const r = run.results[p.id];
    return r && (r.misses || r.hints || r.fumbles);
  });
  return {
    mode: run.mode,
    score: run.score,
    clears: run.clears,
    clean: run.clean,
    misses: run.misses,
    mistakes: run.mistakes,
    hints: run.hints,
    maxCombo: run.maxCombo,
    level: run.level,
    accuracy: accuracy(run),
    seconds: Math.round(run.t / 1000),
    won: run.won,
    stars: run.mode === "test" ? stars(run) : 0,
    missed,
  };
}
