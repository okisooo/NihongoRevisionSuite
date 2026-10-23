import { buildDeck, buildKanaDeck } from '../rush/deck.js';
import { KANA_STAGES } from '../rush/kana.js';
import { applyRun, markKanaLearned, markLearned, rushOf, stageIds } from '../rush/mastery.js';
import { matchTarget } from '../rush/engine.js';

export const TRACKS = ['kana', 'kanji'];
export const ROUNDS = {
  kana: KANA_STAGES.map(s => ({ id: s.id, name: `${s.script} ${s.number}`, symbols: s.kana })),
  kanji: Array.from({ length: 60 }, (_, i) => ({ id: String(i + 1), name: `characters ${i * 5 + 1}–${i * 5 + 5}` })),
};

export function roundDeck(track, set) {
  if (!TRACKS.includes(track) || !ROUNDS[track].some(s => s.id === set)) return [];
  return track === 'kana'
    ? buildKanaDeck({ kana: KANA_STAGES.find(s => s.id === set).kana, kinds: ['kana'] })
    : buildDeck({ ids: stageIds(Number(set)), kinds: ['meaning', 'reading'] });
}

function skill(progress, prompt) {
  const rush = rushOf(progress);
  return (prompt.track === 'kana' ? rush.kana : rush.kanji)[prompt.kanjiIds[0]]?.[prompt.kind];
}

export function recommendedSet(progress, track) {
  return ROUNDS[track].find(set => roundDeck(track, set.id).some(p => (skill(progress, p)?.hits || 0) < 2)) || ROUNDS[track][0];
}

function shuffle(values, random) {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function createRound(progress, track, set, now, random = Math.random) {
  const all = roundDeck(track, set);
  if (!all.length) throw new Error('Choose a valid practice set.');
  const selected = shuffle(all, random)
    .sort((a, b) => (skill(progress, a)?.hits || 0) - (skill(progress, b)?.hits || 0))
    .slice(0, 5);
  const ids = selected.map(p => p.id);
  const intros = selected.filter(p => !skill(progress, p)?.seen).map(p => ({ id: p.id, guide: true }));
  const first = shuffle(ids, random);
  const second = shuffle(ids, random);
  if (second.length > 1 && second[0] === first.at(-1)) second.push(second.shift());
  return {
    version: 1, track, set, started: now, ids,
    queue: [...intros, ...first.map(id => ({ id, guide: false })), ...second.map(id => ({ id, guide: false }))],
    score: 0, combo: 0, maxCombo: 0, clean: 0, clears: 0, hints: 0,
    assisted: false, feedback: null, results: {}, finished: false,
  };
}

export function currentPrompt(round) {
  return roundDeck(round.track, round.set).find(p => p.id === round.queue[0]?.id);
}

export function revealRound(round) {
  if (round.finished || round.feedback || round.assisted || round.queue[0]?.guide) return round;
  return { ...round, assisted: true, combo: 0, hints: round.hints + 1 };
}

export function answerRound(round, text) {
  if (round.finished || round.feedback) return round;
  const prompt = currentPrompt(round);
  if (!prompt || !matchTarget(prompt, text).complete) return round;
  const guide = round.queue[0].guide;
  const clean = !guide && !round.assisted;
  const combo = clean ? round.combo + 1 : 0;
  const points = clean ? 20 + Math.min(4, Math.floor(combo / 3)) * 5 : 0;
  const previous = round.results[prompt.id] || { seen: 0, hits: 0, misses: 0, hints: 0, fumbles: 0, fastest: 0 };
  const results = guide ? round.results : {
    ...round.results,
    [prompt.id]: { ...previous, seen: previous.seen + 1, hits: previous.hits + 1, hints: previous.hints + (round.assisted ? 1 : 0) },
  };
  return {
    ...round, results, combo, score: round.score + points,
    clean: round.clean + (clean ? 1 : 0), clears: round.clears + (guide ? 0 : 1),
    maxCombo: Math.max(round.maxCombo, combo),
    feedback: { kind: guide ? 'learn' : clean ? 'clean' : 'repair', points },
  };
}

export function advanceRound(round) {
  if (!round.feedback || round.finished) return round;
  const [current, ...queue] = round.queue;
  if (round.feedback.kind === 'repair') queue.splice(Math.min(3, queue.length), 0, { id: current.id, guide: false });
  return { ...round, queue, assisted: false, feedback: null, finished: queue.length === 0 };
}

/** Commit one round once; guided copies never count as successful recall. */
function commitRound(progress, flow, now) {
  if (!flow.clears) return progress;
  const deck = roundDeck(flow.track, flow.set).filter(p => flow.ids.includes(p.id));
  const run = { mode: 'practice', deck, results: flow.results, score: flow.score, clears: flow.clears };
  let next = applyRun(progress, run, now, { srs: flow.track === 'kanji' }).progress;
  const touched = deck.filter(p => flow.results[p.id]).flatMap(p => p.kanjiIds);
  next = flow.track === 'kana' ? markKanaLearned(next, touched, now) : markLearned(next, touched, now);
  return next;
}

export function startRound(progress, track, set, now, random) {
  // Changing a set keeps any real recall already earned in the interrupted round.
  const previous = progress.flow;
  const base = previous && !previous.finished ? commitRound(progress, previous, now) : progress;
  return { ...base, flow: createRound(base, track, set, now, random) };
}

export function changeRound(progress, action, value, now) {
  const previous = progress.flow;
  if (!previous || previous.finished) return progress;
  const flow = action === 'answer' ? answerRound(previous, value)
    : action === 'reveal' ? revealRound(previous)
      : action === 'next' ? advanceRound(previous) : previous;
  if (flow === previous) return progress;
  const next = flow.finished ? commitRound(progress, flow, now) : progress;
  return { ...next, flow };
}

