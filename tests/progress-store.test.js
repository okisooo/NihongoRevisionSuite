import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressStore } from '../src/study/progressStore.js';
import { emptyProgress } from '../src/study/progress.js';

test('native-style delayed writes finish before progress advances', async () => {
  let finish;
  let stored;
  const store = createProgressStore({ read: () => null, write: (value) => {
    stored = value;
    return new Promise((resolve) => { finish = resolve; });
  } });
  await store.initialize();
  let notifications = 0;
  store.subscribe(() => notifications++);
  const operation = store.update((p) => ({ ...p, notes: { 151: 'turn' } }));
  await Promise.resolve();
  assert.deepEqual(store.getSnapshot().notes, {});
  assert.equal(notifications, 0);
  finish();
  await operation;
  assert.equal(store.getSnapshot().notes[151], 'turn');
  assert.equal(notifications, 1);
  assert.equal(JSON.parse(stored).notes[151], 'turn');
});

test('failed writes leave the current record intact and retries can succeed', async () => {
  let fail = true;
  const store = createProgressStore({ read: () => JSON.stringify(emptyProgress()), write: () => {
    if (fail) throw new Error('disk full');
  } });
  await store.initialize();
  const original = store.getSnapshot();
  await assert.rejects(store.update((p) => ({ ...p, notes: { 1: 'test' } })), /disk full/);
  assert.equal(store.getSnapshot(), original);
  fail = false;
  await store.update((p) => ({ ...p, notes: { 1: 'retry' } }));
  assert.equal(store.getSnapshot().notes[1], 'retry');
});

test('queued changes see the last committed state, not stale snapshots', async () => {
  const saved = [];
  const store = createProgressStore({ read: () => null, write: async (value) => { saved.push(value); } });
  await store.initialize();
  await Promise.all([151, 152, 153].map((id) => store.update((p) => ({ ...p, notes: { ...p.notes, [id]: 'saved' } }))));
  assert.equal(saved.length, 3);
  assert.deepEqual(Object.keys(store.getSnapshot().notes), ['151', '152', '153']);
});

test('read failures cannot overwrite an inaccessible saved record', async () => {
  let writes = 0;
  const store = createProgressStore({ read: () => { throw new Error('unavailable'); }, write: () => { writes++; } });
  await assert.rejects(store.initialize(), /unavailable/);
  await assert.rejects(store.update(emptyProgress()), /not loaded/);
  assert.equal(writes, 0);
});

test('corrupt original data stays available for backup export', async () => {
  const raw = '{broken';
  const store = createProgressStore({ read: () => raw, write: () => {} });
  await store.initialize();
  assert.equal(store.getRaw(), raw);
  assert.match(store.getWarning(), /Export the original backup/);
  await store.update(emptyProgress());
  assert.equal(store.getWarning(), '');
});

test('saved notes, range, and active sessions survive a fresh app launch', async () => {
  let disk;
  const first = createProgressStore({ read: () => null, write: (value) => { disk = value; } });
  await first.initialize();
  await first.update((p) => ({ ...p, notes: { 160: 'review this' }, settings: { from: 151, to: 160, newCount: 5 },
    active: { queue: ['character:151:meaning'], index: 0, correct: 0, retried: [], started: 1, hints: [0], variants: {} },
  }));
  const second = createProgressStore({ read: () => disk, write: () => {} });
  await second.initialize();
  assert.deepEqual(second.getSnapshot(), first.getSnapshot());
});

test('legacy weak entries migrate only when no saved record exists', async () => {
  const make = (raw) => createProgressStore({ read: () => raw, write: () => {}, readLegacy: () => '[151,0,301,"152"]' });
  const fresh = make(null);
  await fresh.initialize();
  assert.deepEqual(Object.keys(fresh.getSnapshot().cards), ['character:151:meaning']);
  const existing = make(JSON.stringify(emptyProgress()));
  await existing.initialize();
  assert.deepEqual(existing.getSnapshot().cards, {});
});
