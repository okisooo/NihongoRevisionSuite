import test from 'node:test';
import assert from 'node:assert/strict';
import { exportBackup } from '../src/study/backup.js';
import { emptyProgress, schedule, validateProgress } from '../src/study/progress.js';
import { createSession } from '../src/study/content.js';
import { emptyRush } from '../src/rush/validate.js';

test('browser export emits a restorable JSON backup with an active session and kanji records', async t => {
  const now = 1789600000000;
  const saved = emptyProgress();
  saved.cards['grammar:1:0'] = schedule(null, true, now - 2 * 86400000);
  saved.active = createSession(saved, 'review', now);
  saved.rush = { ...emptyRush(), total: 120, kanji: { 4: { learned: now } } };
  let blob;
  let clicked = false;
  const anchor = { click: () => { clicked = true; } };
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement: tag => { assert.equal(tag, 'a'); return anchor; },
  } });
  t.after(() => {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  });
  t.mock.method(URL, 'createObjectURL', value => { blob = value; return 'blob:test-backup'; });
  await exportBackup(JSON.stringify(saved));
  assert.equal(clicked, true);
  assert.match(anchor.download, /^study-progress-\d{4}-\d{2}-\d{2}\.json$/);
  assert.equal(anchor.href, 'blob:test-backup');
  assert.equal(blob.type, 'application/json');
  assert.deepEqual(validateProgress(JSON.parse(await blob.text())), JSON.parse(JSON.stringify(saved)));
});
