// Typing matcher for kanji rush. A kana answer is split into units; each unit
// accepts every common IME spelling plus the kana itself, so romaji typing,
// Japanese IME input and mixed input ("がくse") all validate per keystroke.

const SINGLE = {
  あ: ["a"], い: ["i", "yi"], う: ["u", "wu", "whu"], え: ["e"], お: ["o"],
  か: ["ka", "ca"], き: ["ki"], く: ["ku", "cu", "qu"], け: ["ke"], こ: ["ko", "co"],
  さ: ["sa"], し: ["shi", "si", "ci"], す: ["su"], せ: ["se", "ce"], そ: ["so"],
  た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra", "la"], り: ["ri", "li"], る: ["ru", "lu"], れ: ["re", "le"], ろ: ["ro", "lo"],
  わ: ["wa"], ゐ: ["wi"], ゑ: ["we"], を: ["wo", "o"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  だ: ["da"], ぢ: ["di", "ji"], づ: ["du", "zu"], で: ["de"], ど: ["do"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ゔ: ["vu"],
  ぁ: ["xa", "la"], ぃ: ["xi", "li"], ぅ: ["xu", "lu"], ぇ: ["xe", "le"], ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"], ゅ: ["xyu", "lyu"], ょ: ["xyo", "lyo"], ゎ: ["xwa", "lwa"],
  ー: ["-"], "・": ["/"], "　": [" "], " ": [" "],
};

const YOON_HEADS = {
  き: ["ky"], ぎ: ["gy"], に: ["ny"], ひ: ["hy"], び: ["by"], ぴ: ["py"],
  み: ["my"], り: ["ry", "ly"], し: ["sh", "sy"], ち: ["ch", "cy", "ty"],
  じ: ["j", "jy", "zy"], ぢ: ["dy"],
};
const COMBOS = {};
for (const [head, prefixes] of Object.entries(YOON_HEADS))
  for (const [small, vowel] of [["ゃ", "a"], ["ゅ", "u"], ["ょ", "o"]])
    COMBOS[head + small] = prefixes.map((prefix) => prefix + vowel);
Object.assign(COMBOS, {
  しぇ: ["she", "sye"], ちぇ: ["che", "tye", "cye"], じぇ: ["je", "jye", "zye"],
  ふぁ: ["fa"], ふぃ: ["fi"], ふぇ: ["fe"], ふぉ: ["fo"], ふゅ: ["fyu"],
  てぃ: ["thi"], でぃ: ["dhi"], とぅ: ["twu"], どぅ: ["dwu"],
  うぃ: ["wi"], うぇ: ["we"], うぉ: ["who"], ゔぁ: ["va"], ゔぃ: ["vi"],
  ゔぇ: ["ve"], ゔぉ: ["vo"], つぁ: ["tsa"],
});
// Typing the two halves separately ("kixya") is valid IME input too.
for (const [kana, spellings] of Object.entries(COMBOS)) {
  const [a, b] = [...kana];
  for (const first of SINGLE[a] || [])
    for (const second of SINGLE[b] || []) spellings.push(first + second);
}

const VOWELISH = /^[aiueoyn']/;
const toHira = (text) =>
  String(text).replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60),
  );

/** Lowercases, folds full-width letters and turns katakana into hiragana. */
export function normalizeTyped(text) {
  return toHira(String(text).normalize("NFKC").toLowerCase());
}

const cache = new Map();
/** Splits a kana answer into units, each with its accepted spellings. */
export function tokenize(answer) {
  const kana = toHira(answer);
  if (cache.has(kana)) return cache.get(kana);
  const chars = [...kana];
  const units = [];
  for (let i = 0; i < chars.length; i++) {
    const pair = chars[i] + (chars[i + 1] || "");
    if (COMBOS[pair]) {
      units.push({ kana: pair, spellings: [...COMBOS[pair], pair] });
      i++;
    } else units.push({ kana: chars[i], spellings: [...(SINGLE[chars[i]] || []), chars[i]] });
  }
  units.forEach((unit, i) => {
    const next = units[i + 1];
    if (unit.kana === "っ") {
      const doubled = next
        ? next.spellings
            .map((spelling) => spelling[0])
            .filter((c) => /[a-z]/.test(c) && !"aiueon".includes(c))
        : [];
      unit.spellings = [...new Set([...doubled, "xtu", "ltu", "xtsu", "ltsu", "っ"])];
    }
    if (unit.kana === "ん") {
      // A single n is ambiguous before vowels, y and n, exactly as in an IME.
      const single = !next || next.spellings.every((s) => !VOWELISH.test(s));
      unit.spellings = ["nn", "n'", "xn", "ん", ...(single ? ["n"] : [])];
    }
  });
  cache.set(kana, units);
  return units;
}

/**
 * Matches typed text against one kana answer.
 * ok: typed is a prefix of some valid spelling. complete: typed spells it all.
 * matched: kana characters fully typed (for the live preview).
 */
export function matchKana(answer, typed) {
  const units = tokenize(answer);
  const text = normalizeTyped(typed);
  let best = null;
  const better = (a, b) =>
    !b ||
    (a.complete && !b.complete) ||
    (a.complete === b.complete && a.matched > b.matched);
  const walk = (ui, pos, matched) => {
    if (best?.complete) return;
    if (pos === text.length) {
      const result = { ok: true, complete: ui === units.length, matched, rest: "" };
      if (better(result, best)) best = result;
      return;
    }
    if (ui === units.length) return;
    const unit = units[ui];
    const remaining = text.slice(pos);
    for (const spelling of unit.spellings) {
      if (remaining.startsWith(spelling))
        walk(ui + 1, pos + spelling.length, matched + unit.kana.length);
      else if (spelling.startsWith(remaining)) {
        const result = { ok: true, complete: false, matched, rest: remaining };
        if (better(result, best)) best = result;
      }
    }
  };
  walk(0, 0, 0);
  return best || { ok: false, complete: false, matched: 0, rest: "" };
}

/** Kana preview of what the learner has typed so far for this answer. */
export function previewKana(answer, typed) {
  const result = matchKana(answer, typed);
  return result.ok ? [...toHira(answer)].slice(0, result.matched).join("") + result.rest : "";
}

/** One romaji spelling to teach a reading ("がっこう" → "gakkou"). */
export function romajiFor(answer) {
  const units = tokenize(answer);
  return units
    .map((unit) =>
      unit.kana === "ん" && unit.spellings.includes("n")
        ? "n"
        : unit.spellings.find((s) => /^[a-z'-]+$/.test(s)) || unit.kana,
    )
    .join("");
}

const ARTICLE = /^(?:to|a|an|the)\s+/;
export function normalizeMeaningTyped(text) {
  return String(text)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^\s+/, "");
}

/** English meanings: prefix while typing, complete on an exact sense. */
export function matchMeaning(answers, typed) {
  const raw = normalizeMeaningTyped(typed);
  const text = raw.replace(ARTICLE, "");
  let ok = false;
  let complete = false;
  for (const answer of answers) {
    if (answer === text.trimEnd() && !text.endsWith(" ")) complete = true;
    if (answer.startsWith(text)) ok = true;
    for (const article of ["to ", "a ", "an ", "the "])
      if ((article + answer).startsWith(raw)) ok = true;
  }
  return { ok: ok || complete, complete, matched: 0, rest: raw };
}
