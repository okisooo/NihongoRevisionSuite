import test from 'node:test';
import assert from 'node:assert/strict';
import { strokeData } from '../src/data/strokes.js';
import { mergeStrokeParts } from '../scripts/stroke-parts.mjs';

test('looping characters use pen strokes, not animation fragments', () => {
  const counts = { あ: 3, お: 3, す: 2, ず: 4, な: 4, ぬ: 2, ね: 2, の: 1, は: 3, ば: 5, ぱ: 4, ほ: 4, ぼ: 6, ぽ: 5, ま: 3, み: 2, む: 3, め: 2, ょ: 2, よ: 2, る: 1 };
  for (const [character, count] of Object.entries(counts)) {
    assert.equal(strokeData[character].strokes.length, count, `${character}: actual pen lifts`);
    assert.equal(strokeData[character].medians.length, count);
    for (const median of strokeData[character].medians)
      assert.ok(median.every(([x, y]) => x >= -128 && x <= 1152 && y >= -128 && y <= 1152), `${character}: no off-canvas animation detours`);
  }
});

test('a looping stroke retains every outline but follows one complete pen motion', () => {
  const data = { strokes: ['top', 'stem', 'loop', 'dot'], medians: [[[1, 2]], [[3, 4], [5, 6], [7, 8]], [[3, -900], [5, -800]], [[9, 10]]] };
  const svg = '<path id="z12362d1"/><path id="z12362d2a"/><path id="z12362d2b"/><path id="z12362d3"/>';
  const merged = mergeStrokeParts(data, svg);
  assert.deepEqual(merged.strokes, ['top', 'stem loop', 'dot']);
  assert.deepEqual(merged.medians, [data.medians[0], data.medians[1], data.medians[3]]);
  assert.equal(data.strokes.length, 4, 'source stays unchanged');
});

test('three-part loops merge and ordinary strokes stay unchanged', () => {
  const data = { strokes: ['a', 'b', 'c', 'd'], medians: [[[1, 2]], [[3, 4]], [[5, 6]], [[7, 8]]] };
  assert.deepEqual(mergeStrokeParts(data, '<path id="z1d1"/><path id="z1d2a"/><path id="z1d2b"/><path id="z1d2c"/>').strokes, ['a', 'b c d']);
  assert.deepEqual(mergeStrokeParts(data, '<path id="z1d1"/><path id="z1d2"/><path id="z1d3"/><path id="z1d4"/>'), data);
  assert.throws(() => mergeStrokeParts(data, '<path id="z1d1"/>'), /do not match/);
  assert.throws(() => mergeStrokeParts(data, '<path id="z1d1"/><path id="z1d3"/><path id="z1d4"/><path id="z1d5"/>'), /consecutive/);
});
