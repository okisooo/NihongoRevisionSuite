import test from "node:test";
import assert from "node:assert/strict";
import { matchKana, matchMeaning, previewKana, romajiFor } from "../src/rush/romaji.js";
import {
  buildDeck,
  readingAnswers,
  meaningAnswersFor,
  wordsFor,
  characterById,
  dueDeck,
  pickSession,
} from "../src/rush/deck.js";
import {
  createRun,
  tick,
  input,
  confirm,
  hint,
  drain,
  summary,
  lifeFor,
  quit,
  completeWrite,
} from "../src/rush/engine.js";
import {
  applyRun,
  rushOf,
  masteryOf,
  streakDays,
  learnedIds,
  sourceIds,
  stageIds,
  weigher,
  markLearned,
  localDay,
  PALETTES,
} from "../src/rush/mastery.js";
import { emptyRush } from "../src/rush/validate.js";
import { emptyProgress, validateProgress, schedule } from "../src/study/progress.js";
import { kanjiDueKeys } from "../src/study/content.js";

const now = Date.UTC(2026, 8, 26, 12);

test("romaji matcher accepts every common IME spelling", () => {
  for (const [kana, typed] of [
    ["しゃしん", "shashin"], ["しゃしん", "syasinn"], ["がっこう", "gakkou"],
    ["がっこう", "gaxtukou"], ["ちゃ", "tya"], ["ちゃ", "cha"], ["じゅう", "juu"],
    ["じゅう", "zyuu"], ["ふじ", "huzi"], ["きんえん", "kin'en"], ["きんえん", "kinnen"],
    ["かんじ", "kanji"], ["まっちゃ", "maccha"], ["まっちゃ", "matcha"], ["ぢ", "ji"], ["づ", "zu"],
  ])
    assert.equal(matchKana(kana, typed).complete, true, `${typed} → ${kana}`);
});

test("romaji matcher validates prefixes and rejects wrong keys", () => {
  assert.deepEqual(
    [matchKana("やすむ", "yas").ok, matchKana("やすむ", "yas").complete],
    [true, false],
  );
  assert.equal(matchKana("やすむ", "yat").ok, false);
  // A lone n before a vowel would be read as な-row, so it is not allowed.
  assert.equal(matchKana("きんえん", "kine").ok, false);
  assert.equal(matchKana("さん", "san").complete, true);
  assert.equal(previewKana("がくせい", "gakus"), "がくs");
  assert.equal(romajiFor("がっこう"), "gakkou");
  assert.equal(romajiFor("さん"), "san");
  assert.equal(romajiFor("きんえん"), "kinnen");
});

test("kana and mixed IME input are matched directly", () => {
  assert.equal(matchKana("がくせい", "がくせい").complete, true);
  assert.equal(matchKana("がくせい", "ガクセイ").complete, true);
  assert.equal(matchKana("がくせい", "がくse").ok, true);
  assert.equal(matchKana("がくせい", "がこ").ok, false);
});

test("meaning matcher allows articles and needs a whole sense", () => {
  const answers = ["rest", "day off", "retire"];
  assert.equal(matchMeaning(answers, "to rest").complete, true);
  assert.equal(matchMeaning(answers, "day").complete, false);
  assert.equal(matchMeaning(answers, "day").ok, true);
  assert.equal(matchMeaning(answers, "day off").complete, true);
  assert.equal(matchMeaning(answers, "dax").ok, false);
});

test("bare-character readings skip affixes and join okurigana", () => {
  const sun = readingAnswers(characterById(41));
  assert.ok(sun.includes("ひ") && sun.includes("にち"));
  assert.ok(!sun.some((r) => r.includes("-")));
  assert.ok(readingAnswers(characterById(10)).includes("やすむ"));
  assert.ok(meaningAnswersFor(characterById(1)).every((m) => !m.includes("radical")));
});

test("every character yields typable prompts", () => {
  for (let id = 1; id <= 300; id++) {
    const c = characterById(id);
    assert.ok(readingAnswers(c).length, `reading for ${c.kanji}`);
    assert.ok(meaningAnswersFor(c).length, `meaning for ${c.kanji}`);
    for (const answer of readingAnswers(c))
      assert.equal(matchKana(answer, romajiFor(answer)).complete, true, `${c.kanji} ${answer}`);
  }
});

test("word prompts only use known characters and every reading is typable", () => {
  const ids = Array.from({ length: 60 }, (_, i) => i + 1);
  const words = wordsFor(ids);
  assert.ok(words.length > 20);
  const known = new Set(ids.map((id) => characterById(id).kanji));
  for (const word of words) {
    for (const ch of word.text.match(/[㐀-鿿]/g)) assert.ok(known.has(ch), word.text);
    for (const answer of word.answers)
      assert.equal(matchKana(answer, romajiFor(answer)).complete, true, `${word.text} ${answer}`);
  }
});

function deckOf(ids, kinds = ["reading", "meaning"]) {
  return buildDeck({ ids, kinds, weigh: weigher(emptyProgress(), now) });
}
const typeAnswer = (run, target) => {
  const answer = target.prompt.answers[0];
  input(run, target.prompt.kind === "meaning" ? answer : romajiFor(answer));
  if (run.targets.includes(target)) confirm(run);
};

test("clearing prompts scores, builds combos and levels up", () => {
  const run = createRun({ mode: "challenge", deck: deckOf(stageIds(1).concat(stageIds(2))), seed: 7 });
  for (let i = 0; i < 12; i++) {
    tick(run, 300);
    const target = run.targets[0];
    typeAnswer(run, target);
    assert.ok(!run.targets.includes(target), `cleared ${target.prompt.id}`);
  }
  assert.equal(run.clears, 12);
  assert.equal(run.combo, 12);
  assert.ok(run.score > 12 * 20);
  assert.equal(run.level, 2);
  assert.ok(drain(run).some((e) => e.type === "level"));
});

test("wrong keys are rejected, halve the combo and mark the prompt shaky", () => {
  const run = createRun({ mode: "practice", deck: deckOf([10]), seed: 3 });
  tick(run, 300);
  run.combo = 8;
  const target = run.targets.find((t) => t.prompt.kind === "reading") || run.targets[0];
  const answer = target.prompt.answers[0];
  const first = target.prompt.kind === "meaning" ? answer[0] : romajiFor(answer)[0];
  input(run, first);
  input(run, first + "q");
  assert.equal(run.buffer, first);
  assert.equal(run.combo, 4);
  assert.equal(target.fumbles, 1);
});

test("timed prompts expire, cost a heart and end the run", () => {
  const run = createRun({ mode: "challenge", deck: deckOf(stageIds(1)), seed: 11 });
  let guard = 0;
  while (!run.over && guard++ < 2000) tick(run, 250);
  assert.equal(run.over, true);
  assert.equal(run.lives, 0);
  assert.ok(run.misses >= 3);
  const events = drain(run);
  assert.equal(events.filter((e) => e.type === "miss").length, run.misses);
  assert.ok(summary(run).missed.length > 0);
});

test("a completion that could grow waits, then pops on its own", () => {
  const deck = [
    { id: "a", kind: "word", text: "漢", answers: ["かん"], kanjiIds: [1], srsKeys: ["x"], reveal: {}, length: 2, weight: 1 },
    { id: "b", kind: "word", text: "漢字", answers: ["かんじ"], kanjiIds: [2], srsKeys: ["y"], reveal: {}, length: 3, weight: 1 },
  ];
  const run = createRun({ mode: "challenge", deck, seed: 5 });
  tick(run, 300);
  tick(run, 2700);
  assert.equal(run.targets.length, 2);
  input(run, "kan");
  assert.equal(run.clears, 0, "かん waits because かんじ is still possible");
  input(run, "kanj");
  input(run, "kanji");
  assert.equal(run.clears, 1);
  assert.equal(run.targets[0].prompt.id, "a");
  input(run, "kan");
  tick(run, 500);
  assert.equal(run.clears, 2, "pending completion commits after a pause");
});

test("hints reveal, reset the combo and never count as clean", () => {
  const run = createRun({ mode: "practice", deck: deckOf([41]), seed: 2 });
  tick(run, 300);
  run.combo = 5;
  const target = hint(run);
  assert.equal(target.hinted, true);
  assert.equal(run.combo, 0);
  typeAnswer(run, target);
  assert.equal(run.clean, 0);
  assert.equal(run.results[target.prompt.id].hints, 1);
});

test("practice repeats shaky prompts until each is done cleanly", () => {
  const deck = deckOf([10, 11], ["reading"]);
  const run = createRun({ mode: "practice", deck, seed: 9 });
  tick(run, 300);
  hint(run);
  typeAnswer(run, run.targets[0]);
  let guard = 0;
  while (!run.over && guard++ < 50) {
    tick(run, 300);
    if (run.targets[0]) typeAnswer(run, run.targets[0]);
  }
  assert.equal(run.over, true);
  assert.equal(run.won, true);
  assert.equal(run.clears, 3);
});

test("test mode passes at the goal with enough accuracy", () => {
  const run = createRun({ mode: "test", deck: deckOf(stageIds(1)), seed: 4, goal: 5 });
  let guard = 0;
  while (!run.over && guard++ < 100) {
    tick(run, 200);
    if (run.targets[0]) typeAnswer(run, run.targets[0]);
  }
  assert.equal(run.won, true);
  assert.equal(summary(run).stars, 3);
});

test("weak prompts get more time and weight than mastered ones", () => {
  const progress = emptyProgress();
  progress.rush = { ...emptyRush(), kanji: { 1: { reading: { ease: 0.95, seen: 9, hits: 9, misses: 0, last: now } }, 2: { reading: { ease: 0.1, seen: 9, hits: 1, misses: 8, last: now } } } };
  const deck = buildDeck({ ids: [1, 2], kinds: ["reading"], weigh: weigher(progress, now) });
  const [strong, weak] = deck;
  assert.ok(weak.weight > strong.weight * 3);
  const run = createRun({ mode: "challenge", deck, seed: 1 });
  assert.ok(lifeFor(run, weak) > lifeFor(run, strong));
});

test("finished runs update mastery, reviews, streaks and stage clears", () => {
  const deck = deckOf(stageIds(1));
  const run = createRun({ mode: "test", deck, seed: 4, goal: 5 });
  let guard = 0;
  while (!run.over && guard++ < 100) {
    tick(run, 200);
    if (run.targets[0]) typeAnswer(run, run.targets[0]);
  }
  const result = applyRun(emptyProgress(), run, now, { stage: 1 });
  const saved = validateProgress(JSON.parse(JSON.stringify(result.progress)));
  const rush = rushOf(saved);
  assert.equal(rush.stages[1].stars, 3);
  assert.equal(rush.runs, 1);
  assert.deepEqual(rush.days, [localDay(now)]);
  assert.equal(streakDays(rush, now), 1);
  assert.equal(streakDays(rush, now + 86400000), 1, "streak survives until the next day ends");
  assert.equal(streakDays(rush, now + 2 * 86400000), 0);
  for (const id of stageIds(1)) assert.ok(rush.kanji[id].learned);
  assert.deepEqual(learnedIds(saved).slice(0, 5), stageIds(1));
  const reviewed = Object.keys(saved.cards);
  assert.ok(reviewed.length > 0 && reviewed.every((key) => /^character:\d+:(reading|meaning)$/.test(key)));
  assert.ok(Object.values(saved.cards).every((card) => card.streak === 1));
  assert.ok(stageIds(1).some((id) => masteryOf(saved, id) >= 1));
});

test("missed prompts become due reviews and appear in weak sources", () => {
  const deck = deckOf([41], ["reading"]);
  const run = createRun({ mode: "challenge", deck, seed: 1 });
  let guard = 0;
  while (run.misses < 1 && guard++ < 200) tick(run, 250);
  quit(run);
  const { progress } = applyRun(markLearned(emptyProgress(), [41], now), run, now, { kinds: ["reading"] });
  assert.equal(progress.cards["character:41:reading"].due, now + 60000);
  assert.deepEqual(sourceIds(progress, "weak"), [41]);
  assert.deepEqual(
    dueDeck(kanjiDueKeys(progress, now + 60000)).map((p) => p.id),
    ["reading:41"],
  );
});

test("lifetime score unlocks palettes and bests are kept per mix", () => {
  const run = createRun({ mode: "challenge", deck: deckOf([1]), seed: 1 });
  run.score = PALETTES[1].at + 10;
  quit(run);
  const result = applyRun(emptyProgress(), run, now, { kinds: ["meaning", "reading"] });
  assert.equal(result.newBest, true);
  assert.deepEqual(result.unlocked.map((p) => p.id), [PALETTES[1].id]);
  assert.equal(rushOf(result.progress).best["challenge:meaning+reading"], run.score);
});

test("invalid rush records are rejected on import", () => {
  const progress = emptyProgress();
  progress.rush = { ...emptyRush(), kanji: { 400: {} } };
  assert.throws(() => validateProgress(progress), /practice records/);
  progress.rush = { ...emptyRush(), settings: { kinds: [], source: "learned", sound: true, voice: false } };
  assert.throws(() => validateProgress(progress), /practice records/);
  progress.rush = emptyRush();
  assert.equal(validateProgress(progress), progress);
});

test("write prompts are answered on the pad, not by typing", () => {
  const deck = deckOf([10], ["write"]);
  assert.equal(deck[0].kind, "write");
  assert.equal(deck[0].text, "休");
  assert.deepEqual(deck[0].srsKeys, ["drill:10:writing"]);
  assert.ok(deck[0].cue.word.includes("○"), "cue hides the kanji inside a word");
  const run = createRun({ mode: "practice", deck, seed: 1 });
  tick(run, 300);
  input(run, "yasumu");
  assert.equal(run.mistakes, 0, "typing is ignored while writing");
  assert.equal(run.buffer, "");
  completeWrite(run, { clean: false });
  assert.equal(run.clears, 1);
  assert.equal(run.over, false, "a messy write comes back");
  tick(run, 300);
  completeWrite(run, { clean: true });
  assert.equal(run.over, true);
  const { progress } = applyRun(emptyProgress(), run, now, {});
  assert.equal(progress.cards["drill:10:writing"].streak, 0, "the first messy attempt counts");
  assert.ok(rushOf(progress).kanji[10].write.misses > 0);
});

test("due review cards become one prompt per skill", () => {
  const p = emptyProgress();
  for (const key of ["character:41:reading", "drill:41:writing", "drill:41:meaning", "character:41:meaning", "drill:10:reading", "drill:3:recognition"])
    p.cards[key] = schedule(null, false, now);
  const keys = kanjiDueKeys(p, now + 60000);
  assert.ok(!keys.includes("drill:3:recognition"), "retired drill skills are never due");
  const ids = dueDeck(keys).map((prompt) => prompt.id).sort();
  assert.deepEqual(ids.filter((id) => !id.startsWith("word:")), ["meaning:41", "reading:41", "write:41"]);
  const word = dueDeck(keys).find((prompt) => prompt.kind === "word");
  assert.ok(word && word.text.includes("休"), "a due word review uses one of the character's words");
});

test("meaning prompts also reschedule the older typed-meaning drill card", () => {
  const p = emptyProgress();
  p.cards["drill:4:meaning"] = schedule(null, false, now - 120000);
  const run = createRun({ mode: "practice", deck: deckOf([4], ["meaning"]), seed: 2 });
  tick(run, 300);
  typeAnswer(run, run.targets[0]);
  const { progress } = applyRun(p, run, now, {});
  assert.equal(progress.cards["character:4:meaning"].streak, 1);
  assert.equal(progress.cards["drill:4:meaning"].streak, 1);
  assert.equal(progress.cards["drill:4:reading"], undefined, "aliases are only updated when they exist");
});

test("practice sessions pick a limited set, weak prompts first", () => {
  const deck = deckOf(Array.from({ length: 40 }, (_, i) => i + 1), ["reading", "meaning", "write"]);
  const session = pickSession(deck, 20, () => 0.5);
  assert.equal(session.length, 20);
  assert.equal(new Set(session.map((p) => p.id)).size, 20);
});

test("older saved settings still load and fall back to a current source", () => {
  const p = emptyProgress();
  p.rush = { ...emptyRush(), settings: { kinds: ["reading"], source: "range", sound: true, voice: false } };
  assert.doesNotThrow(() => validateProgress(JSON.parse(JSON.stringify(p))));
  assert.equal(rushOf(p).settings.source, "learned");
  assert.ok(emptyRush().settings.kinds.includes("write"), "writing is on by default");
});

test("mastery needs reading, meaning and writing", () => {
  const p = emptyProgress();
  const strong = { ease: 0.95, seen: 9, hits: 9, misses: 0, last: now };
  p.rush = { ...emptyRush(), kanji: { 5: { learned: now, reading: strong, meaning: strong } } };
  assert.ok(masteryOf(p, 5) < 4, "no writing yet");
  p.rush.kanji[5].write = strong;
  assert.equal(masteryOf(p, 5), 4);
});