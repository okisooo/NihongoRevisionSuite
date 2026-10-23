import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { kanjiData } from '../src/data/kanji.js';
import { sentencesData } from '../src/data/sentences.js';
import { grammarData } from '../src/data/grammar.js';
import { buildDeck, readingAnswers, wordsFor, commonWords } from '../src/rush/deck.js';
import { readings } from '../src/study/content.js';
import { schoolBook } from '../src/data/schoolBook.js';
import { meaningSenses } from '../src/study/meanings.js';

const reference = JSON.parse(fs.readFileSync(new URL('./fixtures/content-reference.json', import.meta.url)));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('the school list retains every original character, ID and position', () => {
  assert.deepEqual(kanjiData.map(c => [c.id, c.kanji]), reference.curriculum);
  const original = fs.readFileSync(new URL('../restore-curriculum.js', import.meta.url), 'utf8');
  const list = original.match(/const rawList = `([\s\S]*?)`/)[1].split(/\r?\n/)
    .filter(line => !line.includes('*')).flatMap(line => line.match(/\p{Script=Han}/gu) || []);
  assert.deepEqual(kanjiData.map(c => c.kanji), list);
  // Independently transcribed from the publisher's sample, chapter 3.
  assert.equal(kanjiData.slice(36, 56).map(c => c.kanji).join(''), '百千万円日月明立音暗火水土国全金工左右友');
  assert.equal(schoolBook.isbn, '978-4-87424-402-9');
});

test('every example and standalone word has a dictionary-supported spelling, reading and meaning', () => {
  for (const c of kanjiData) for (const w of [...c.examples, ...c.standalone]) {
    const source = reference.pairs[`${w.word}:${w.reading}`];
    assert.ok(source, `${c.id}: ${w.word} ${w.reading}`);
    assert.ok(source.glosses.join(', ').includes(w.meaning), `${w.word}: ${w.meaning}`);
    assert.equal(Boolean(w.common), source.common, `${w.word} frequency flag`);
  }
});

test('bare-character cues do not teach pronunciations with invisible kana endings', () => {
  for (const c of kanjiData) {
    const source = reference.characters.find(item => item.character === c.kanji);
    for (const type of ['onyomi', 'kunyomi'])
      for (const reading of c[type]) assert.ok(source[type].includes(reading), `${c.kanji}: ${reading}`);
    const bare = [...c.onyomi, ...c.kunyomi].filter(x => !/[.-]/.test(x));
    assert.deepEqual(readingAnswers(c), [...new Set(bare)]);
  }
  const rest = buildDeck({ ids: [10], kinds: ['reading'] })[0];
  assert.equal(rest.text, '休');
  assert.ok(!rest.answers.includes('やすむ'));
  assert.ok(readings(kanjiData[9]).includes('やす(む)'));
  const nativeOnly = buildDeck({ ids: [299], kinds: ['reading'] })[0];
  assert.equal(nativeOnly.text, '込む');
  assert.deepEqual(nativeOnly.answers, ['こむ']);
});

test('a word meaning stays paired with its spelling AND pronunciation', () => {
  assert.deepEqual(meaningSenses('counter for flat things (sheets, pages); piece'), ['counter for flat things (sheets, pages)', 'piece']);
  const ids = kanjiData.map(c => c.id);
  for (const c of kanjiData) for (const w of commonWords(c, 500)) {
    if (!w.meaning) continue;
    const source = reference.pairs[`${w.word}:${w.reading}`];
    assert.ok(source?.glosses.join(', ').includes(w.meaning), `${w.word}: ${w.reading}: ${w.meaning}`);
  }
  for (const prompt of wordsFor(ids)) {
    for (const answer of prompt.answers) {
      assert.ok(reference.pairs[`${prompt.text}:${answer}`] || sentencesData.some(s => s.targets.some(t => t.word === prompt.text && t.reading === answer)));
    }
  }
  for (const prompt of buildDeck({ ids, kinds: ['listen'] }))
    assert.deepEqual(prompt.answers, [prompt.say], `${prompt.text}: accept the pronunciation actually played`);
});

test('all sentence targets occur in their sentence and their pronunciation guides agree', () => {
  assert.equal(sentencesData.find(s => s.kanjiId === 19).targets[0].reading, 'おりる');
  for (const sentence of sentencesData) for (const t of sentence.targets) {
    assert.ok(sentence.sentence.includes(t.word), `${sentence.kanjiId}: ${t.word}`);
    assert.equal(t.segments.map(s => s.ruby).join(''), t.word);
    assert.equal(t.segments.map(s => s.rt || s.ruby).join(''), t.reading);
    assert.match(t.reading, /^[ぁ-ゖー]+$/);
  }
});

test('grammar answer keys form the reviewed sentences without duplicated endings', () => {
  const completed = new Map([[12, '昨日は天気が よかったです か。'], [18, '食事の まえ に、手を洗います。'], [19, '寒 く なりました。'], [25, '高く ても、買いたいです。']]);
  for (const [lesson, sentence] of completed) {
    const q = grammarData[lesson - 1].quiz[lesson === 12 ? 0 : 1];
    assert.ok(q.question.replace('___', q.answer).includes(sentence));
  }
  for (const lesson of grammarData) for (const q of lesson.quiz) {
    assert.equal(q.options.filter(x => x === q.answer).length, 1);
    assert.equal(new Set(q.options).size, q.options.length);
  }
  assert.match(grammarData[7].quiz[1].question, /ending with/);
  assert.match(grammarData[12].patterns[0].explanation, /either/);
  assert.match(grammarData[19].patterns[0].explanation, /だ/);
  assert.match(grammarData[25].patterns[0].explanation, /な instead of だ/);
  assert.ok(grammarData[26].patterns[0].exampleFurigana.includes('すこ[少]し'));
});

test('changes to reviewed grammar or sentence content require a fresh content review', () => {
  assert.deepEqual(grammarData.map(l => ({ lesson: l.lesson, sha256: sha(l) })), reference.grammar);
  assert.deepEqual(sentencesData.map(s => ({ id: s.kanjiId, sha256: sha(s) })), reference.sentences);
});
