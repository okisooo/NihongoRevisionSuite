import { romajiFor } from "./romaji.js";

// Kana are taught in small row groups, as in You Can Kana: plain rows first,
// then voiced rows, then contracted sounds. Katakana mirror the hiragana stages.
const HIRAGANA_STAGES = [
  ["あいうえお"],
  ["かきくけこ"],
  ["さしすせそ"],
  ["たちつてと"],
  ["なにぬねの"],
  ["はひふへほ"],
  ["まみむめも"],
  ["やゆよ", "わをん"],
  ["らりるれろ"],
  ["がぎぐげご", "ざじずぜぞ"],
  ["だぢづでど", "ばびぶべぼ", "ぱぴぷぺぽ"],
  ["きゃきゅきょ", "しゃしゅしょ", "ちゃちゅちょ", "にゃにゅにょ"],
  ["ひゃひゅひょ", "みゃみゅみょ", "りゃりゅりょ"],
  ["ぎゃぎゅぎょ", "じゃじゅじょ", "びゃびゅびょ", "ぴゃぴゅぴょ"],
];

const SMALL = "ゃゅょ";
/** Splits a row into sounds, keeping contracted pairs (きゃ) together. */
function sounds(row) {
  const out = [];
  for (const ch of row) {
    if (SMALL.includes(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}
export const toKatakana = (text) =>
  text.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
export const toHira = (text) =>
  text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

export const SCRIPTS = [
  { id: "h", name: "hiragana", sample: "あ" },
  { id: "k", name: "katakana", sample: "ア" },
];

export const KANA_STAGES = SCRIPTS.flatMap((script) =>
  HIRAGANA_STAGES.map((rows, i) => {
    const hira = rows.flatMap(sounds);
    return {
      id: `${script.id}${i + 1}`,
      number: i + 1,
      script: script.name,
      kana: script.id === "h" ? hira : hira.map(toKatakana),
    };
  }),
);
export const kanaStage = (id) => KANA_STAGES.find((stage) => stage.id === id);
export const ALL_KANA = KANA_STAGES.flatMap((stage) => stage.kana);
export const scriptOf = (kana) => (/[ァ-ヺ]/.test(kana) ? "katakana" : "hiragana");
/** One unambiguous romaji spelling per sound: ぢ is "di", を is "wo". */
export const romajiOf = (kana) => romajiFor(toHira(kana));
/** Single characters can be written on the pad; contracted pairs cannot. */
export const writable = (kana) => [...kana].length === 1;
