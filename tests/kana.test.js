import test from "node:test";
import assert from "node:assert/strict";
import { KANA_STAGES, ALL_KANA, romajiOf, writable, toKatakana } from "../src/rush/kana.js";
import { buildKanaDeck, TYPED } from "../src/rush/deck.js";
import { matchKana, romajiFor } from "../src/rush/romaji.js";
import { createRun, tick, input, confirm, completeWrite } from "../src/rush/engine.js";
import {
  applyRun,
  kanaMastery,
  kanaSource,
  kanaStageStatus,
  markKanaLearned,
  nextKanaStage,
  rushOf,
} from "../src/rush/mastery.js";
import { emptyRush } from "../src/rush/validate.js";
import { emptyProgress, validateProgress } from "../src/study/progress.js";
import { strokeData } from "../src/data/strokes.js";

const now = Date.UTC(2026, 9, 5, 12);

test("kana stages cover every sound once per script, katakana mirroring hiragana", () => {
  assert.equal(KANA_STAGES.length, 28);
  const hira = KANA_STAGES.filter((s) => s.script === "hiragana").flatMap((s) => s.kana);
  const kata = KANA_STAGES.filter((s) => s.script === "katakana").flatMap((s) => s.kana);
  assert.equal(new Set(hira).size, hira.length);
  assert.deepEqual(kata, hira.map(toKatakana));
  assert.ok(hira.includes("ん") && hira.includes("きゃ") && hira.includes("ぴょ"));
  assert.equal(KANA_STAGES[0].id, "h1");
});

test("every kana has unambiguous romaji that types back to it, and stroke data to write it", () => {
  for (const k of ALL_KANA) {
    assert.equal(matchKana(k, romajiOf(k)).complete, true, `${k} ${romajiOf(k)}`);
    if (writable(k)) assert.ok(strokeData[k], `strokes for ${k}`);
  }
  assert.equal(romajiOf("し"), "shi");
  assert.equal(romajiOf("ぢ"), "di", "ぢ is not confused with じ");
  assert.equal(romajiOf("ツ"), "tsu");
  assert.equal(romajiOf("ん"), "n");
  assert.equal(romajiFor("きゃ"), "kya");
});

test("kana deck: read, write (single characters only) and one listening prompt per sound", () => {
  const deck = buildKanaDeck({ kana: ["か", "カ", "きゃ"], kinds: ["kana", "write", "listen"] });
  const ids = deck.map((p) => p.id);
  assert.deepEqual(ids.filter((id) => id.startsWith("kana:")), ["kana:か", "kana:カ", "kana:きゃ"]);
  assert.deepEqual(ids.filter((id) => id.startsWith("kwrite:")), ["kwrite:か", "kwrite:カ"]);
  assert.deepEqual(ids.filter((id) => id.startsWith("klisten:")), ["klisten:か", "klisten:きゃ"]);
  const write = deck.find((p) => p.id === "kwrite:カ");
  assert.equal(write.cue.main, "ka");
  assert.equal(write.cue.sub, "in katakana");
  assert.ok(deck.every((p) => p.track === "kana" && p.srsKeys.length === 0));
  assert.ok(TYPED.includes("kana") && !TYPED.includes("listen") && !TYPED.includes("write"));
});

test("reading and listening prompts are answered by typing; writing on the pad", () => {
  const deck = buildKanaDeck({ kana: ["シ"], kinds: ["kana", "listen", "write"] });
  const run = createRun({ mode: "practice", deck, seed: 3 });
  let guard = 0;
  while (!run.over && guard++ < 30) {
    tick(run, 300);
    const target = run.targets[0];
    if (!target) continue;
    if (target.prompt.kind === "write") completeWrite(run, { clean: true });
    else {
      input(run, "shi");
      confirm(run);
    }
  }
  assert.equal(run.over, true);
  assert.equal(run.clean, 3);
});

test("kana results land in their own records, and a passed test clears the stage", () => {
  const stage = KANA_STAGES[0];
  const deck = buildKanaDeck({ kana: stage.kana, kinds: ["kana"] });
  const run = createRun({ mode: "test", deck, seed: 4, goal: 5 });
  let guard = 0;
  while (!run.over && guard++ < 100) {
    tick(run, 200);
    const target = run.targets[0];
    if (target) {
      input(run, romajiOf(target.prompt.text));
      confirm(run);
    }
  }
  assert.equal(run.won, true);
  const { progress } = applyRun(emptyProgress(), run, now, { kanaStageId: stage.id, srs: false });
  const saved = validateProgress(JSON.parse(JSON.stringify(progress)));
  const rush = rushOf(saved);
  assert.equal(rush.kanaStages.h1.stars, 3);
  assert.deepEqual(Object.keys(rush.kanji), [], "kanji records untouched");
  assert.ok(stage.kana.every((k) => rush.kana[k].learned && rush.kana[k].kana.hits > 0));
  assert.deepEqual(kanaSource(saved).sort(), [...stage.kana].sort());
  assert.equal(nextKanaStage(rush).id, "h2");
  assert.equal(kanaStageStatus(rush, "h2"), "open");
  assert.equal(kanaStageStatus(rush, "h3"), "locked");
  assert.equal(kanaStageStatus(rush, "k1"), "open", "katakana can start anytime");
  assert.ok(kanaMastery(saved, "あ") >= 1);
  assert.deepEqual(Object.keys(saved.cards), [], "kana never creates review cards");
});

test("kana records validate, and older backups without them still load", () => {
  const p = markKanaLearned(emptyProgress(), ["あ", "キャ"], now);
  assert.doesNotThrow(() => validateProgress(JSON.parse(JSON.stringify(p))));
  const old = emptyProgress();
  const legacy = emptyRush();
  delete legacy.kana;
  delete legacy.kanaStages;
  old.rush = { ...legacy, settings: { kinds: ["reading"], source: "learned", sound: true, voice: false } };
  assert.doesNotThrow(() => validateProgress(old));
  assert.deepEqual(rushOf(old).settings.kanaKinds, ["kana", "write", "listen"]);
  const bad = emptyProgress();
  bad.rush = { ...emptyRush(), kana: { abc: { learned: now } } };
  assert.throws(() => validateProgress(bad), /practice records/);
  bad.rush = { ...emptyRush(), kanaStages: { z9: { cleared: now, stars: 1 } } };
  assert.throws(() => validateProgress(bad), /practice records/);
});

test("kanji listening plays curriculum words of learned kanji", async () => {
  const { buildDeck } = await import("../src/rush/deck.js");
  const deck = buildDeck({ ids: Array.from({ length: 30 }, (_, i) => i + 1), kinds: ["listen"] });
  assert.ok(deck.length > 5);
  for (const prompt of deck) {
    assert.equal(prompt.kind, "listen");
    assert.equal(prompt.say, prompt.answers[0]);
    assert.ok(prompt.reveal.main.startsWith(prompt.text), "the word is shown after answering");
    assert.deepEqual(prompt.srsKeys, []);
  }
});
