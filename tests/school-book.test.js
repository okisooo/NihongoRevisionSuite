import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { kanjiData } from '../src/data/kanji.js';
import { schoolBook } from '../src/data/schoolBook.js';

const reference = JSON.parse(fs.readFileSync(new URL('./fixtures/school-book-reference.json', import.meta.url)));

test('all 300 characters and their numbered positions match the independently transcribed printed book index', () => {
  const printed = [...reference.rows.join('')];
  assert.equal(printed.length, 300);
  assert.equal(new Set(printed).size, 300);
  assert.equal(schoolBook.isbn, reference.mainBook.isbn);
  assert.deepEqual(kanjiData.map(item => [item.id, item.kanji]), printed.map((character, index) => [index + 1, character]));
  assert.deepEqual(reference.chapters.flatMap(chapter => Array.from({ length: chapter.last - chapter.first + 1 }, (_, index) => chapter.first + index)), kanjiData.map(item => item.id));
  assert.equal(reference.chapters.length, 16);
  assert.equal(reference.chapters[7].last, 150);
});
