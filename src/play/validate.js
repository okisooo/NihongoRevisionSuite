import { KANA_STAGES } from '../rush/kana.js';

// Keep backup validation independent of the store and game reducers.
export function validateRound(flow) {
  const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const count = v => Number.isSafeInteger(v) && v >= 0;
  const fail = () => { throw new Error('This backup contains an invalid play round.'); };
  if (!record(flow) || flow.version !== 1 || !['kana', 'kanji'].includes(flow.track) || typeof flow.set !== 'string') fail();
  let ids = [];
  if (flow.track === 'kana') ids = (KANA_STAGES.find(s => s.id === flow.set)?.kana || []).map(k => `kana:${k}`);
  else if (/^[1-9]\d?$/.test(flow.set) && Number(flow.set) <= 60)
    ids = Array.from({ length: 5 }, (_, i) => (Number(flow.set) - 1) * 5 + i + 1).flatMap(id => [`reading:${id}`, `meaning:${id}`]);
  const allowed = new Set(ids);
  if (!allowed.size || !Array.isArray(flow.ids) || flow.ids.length < 1 || flow.ids.length > 5 ||
      new Set(flow.ids).size !== flow.ids.length || flow.ids.some(id => !allowed.has(id))) fail();
  if (!Array.isArray(flow.queue) || flow.queue.length > 15 || !flow.queue.every(q => record(q) && flow.ids.includes(q.id) && typeof q.guide === 'boolean')) fail();
  if (![flow.started, flow.score, flow.combo, flow.maxCombo, flow.clean, flow.clears, flow.hints].every(count) ||
      flow.combo > flow.maxCombo || flow.clean > flow.clears || flow.clean > flow.ids.length * 2 ||
      typeof flow.assisted !== 'boolean' || typeof flow.finished !== 'boolean' || flow.finished !== (flow.queue.length === 0)) fail();
  if (flow.finished && flow.clean !== flow.ids.length * 2) fail();
  if (!record(flow.results) || !Object.entries(flow.results).every(([id, r]) => flow.ids.includes(id) && record(r) &&
      ['seen', 'hits', 'misses', 'hints', 'fumbles', 'fastest'].every(k => count(r[k])) && r.hits <= r.seen && r.hints <= r.hits)) fail();
  if (flow.feedback !== null && (!record(flow.feedback) || !['learn', 'clean', 'repair'].includes(flow.feedback.kind) || !count(flow.feedback.points) || flow.finished)) fail();
  return flow;
}
