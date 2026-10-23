import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { kanjiData } from '../src/data/kanji.js';
import { ALL_KANA, writable } from '../src/rush/kana.js';
import { strokeData } from '../src/data/strokes.js';
import { strokesFor } from '../src/rush/strokes.js';
const reference = JSON.parse(readFileSync(new URL('./fixtures/writing-reference.json', import.meta.url), 'utf8'));

test('every writing lesson has complete bundled stroke data', async () => {
  const characters = [...new Set([...kanjiData.map(c => c.kanji), ...ALL_KANA.filter(writable)])];
  assert.equal(characters.length, 442);
  for (const character of characters) {
    const data = await strokesFor(character);
    assert.equal(data, strokeData[character], `${character}: bundled lesson data`);
    assert.ok(data.strokes.length > 0);
    assert.equal(data.strokes.length, data.medians.length);
    data.medians.forEach(points => {
      assert.ok(points.length >= 2);
      assert.ok(points.every(point => point.length === 2 && point.every(Number.isFinite)));
    });
  }
});

test('lesson shapes and stroke sequence match the reviewed reference snapshot', () => {
  const characters = [...new Set([...kanjiData.map(c => c.kanji), ...ALL_KANA.filter(writable)])];
  assert.deepEqual(Object.keys(reference.entries).sort(), characters.map(c => c.codePointAt(0).toString(16)).sort(), 'new writing lessons need a reference check');
  for (const character of characters) {
    const expected = reference.entries[character.codePointAt(0).toString(16)];
    const data = strokeData[character];
    assert.equal(data.strokes.length, expected.strokes, `${character}: reference stroke count`);
    const digest = createHash('sha256').update(JSON.stringify({ strokes: data.strokes, medians: data.medians })).digest('hex');
    assert.equal(digest, expected.sha256, `${character}: re-audit a changed shape, direction or order`);
  }
});

test('unsupported characters never substitute an unaudited online writing model', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ strokes: ['unverified'], medians: [] }) }));
  await assert.rejects(strokesFor('not-in-the-curriculum'), /unavailable/i);
  await assert.rejects(strokesFor('toString'), /unavailable/i);
  assert.equal(network.mock.callCount(), 0);
});
