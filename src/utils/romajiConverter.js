const romajiMap = {
  // Triplets/Consonants mapping first to prevent sub-syllable replacements
  "shia": "しゃ", "shiu": "しゅ", "shio": "しょ",
  "chia": "ちゃ", "chiu": "ちゅ", "chio": "ちょ",
  "tsua": "つぁ", "tsui": "つぃ", "tsue": "つぇ", "tsuo": "つぉ",
  "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ",
  "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ",
  "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ",
  "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ",
  "bya": "びゃ", "byu": "びゅ", "byo": "びょ",
  "pya": "ぴゃ", "pyu": "ぴゅ", "pyo": "ぴょ",
  "mya": "みゃ", "myu": "みゅ", "myo": "みょ",
  "rya": "りゃ", "ryu": "りょ", "ryo": "りょ",
  "ja": "じゃ", "ju": "じゅ", "jo": "じょ",
  
  // Double characters / Syllables
  "sha": "しゃ", "shu": "しゅ", "sho": "しょ", "shi": "し", "si": "し",
  "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ", "chi": "ち", "ti": "ち",
  "tsu": "つ", "tu": "つ",
  
  "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",
  "sa": "さ", "su": "す", "se": "せ", "so": "そ",
  "ta": "た", "te": "て", "to": "と",
  "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の",
  "ha": "は", "hi": "ひ", "fu": "ふ", "he": "へ", "ho": "ほ", "hu": "ふ",
  "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",
  "ya": "や", "yu": "ゆ", "yo": "よ",
  "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",
  "wa": "わ", "wo": "を",
  
  "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
  "za": "ざ", "zi": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ", "ji": "じ",
  "da": "だ", "di": "ぢ", "du": "づ", "de": "で", "do": "ど",
  "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",
  "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",
  
  // Single vowels
  "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お",
  
  // N/M/Nn
  "nn": "ん", "n'": "ん", "n": "ん"
};

/**
 * Converts a Romaji string to Hiragana.
 * Already-Hiragana, Kanji, and spaces are ignored/preserved.
 * 
 * @param {string} str - Romaji input
 * @returns {string} Converted Hiragana output
 */
export function romajiToHiragana(str) {
  if (!str) return '';
  let result = '';
  let i = 0;
  
  // Convert string to lowercase for mapping
  str = str.toLowerCase();
  
  while (i < str.length) {
    // 1. Check double consonant (e.g., kk, ss, tt, pp, dd, bb, gg)
    // Avoid double 'nn' which is handled as "ん"
    if (i < str.length - 1 && 
        str[i] === str[i+1] && 
        str[i] !== 'a' && str[i] !== 'i' && str[i] !== 'u' && str[i] !== 'e' && str[i] !== 'o' && 
        str[i] !== 'n') {
      result += 'っ';
      i++;
      continue;
    }
    
    // 2. Check match of length 4, 3, 2, 1
    let found = false;
    for (let len = 4; len >= 1; len--) {
      if (i + len <= str.length) {
        const substring = str.substring(i, i + len);
        // Special rule for 'n' followed by a vowel or y
        if (substring === 'n' && i < str.length - 1) {
          const nextChar = str[i+1];
          if ('aiueoy'.includes(nextChar)) {
            // Do not convert 'n' alone, let it combine with the next vowel/y
            continue;
          }
        }
        
        if (romajiMap[substring]) {
          result += romajiMap[substring];
          i += len;
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      result += str[i];
      i++;
    }
  }
  
  return result;
}

/**
 * Generates all possible Romaji spellings for a given Hiragana string.
 * 
 * @param {string} hiragana - Target Hiragana string
 * @returns {string[]} Array of possible Romaji spellings
 */
export function generateRomajiCombinations(hiragana) {
  if (!hiragana) return [""];
  
  // Dynamic reverse map of romajiMap
  const reverseMap = {};
  for (const [romaji, kana] of Object.entries(romajiMap)) {
    if (!reverseMap[kana]) {
      reverseMap[kana] = [];
    }
    if (!reverseMap[kana].includes(romaji)) {
      reverseMap[kana].push(romaji);
    }
  }
  
  // Parse hiragana into syllables
  const syllables = [];
  let idx = 0;
  while (idx < hiragana.length) {
    const char = hiragana[idx];
    const nextChar = hiragana[idx + 1];
    
    // Check for yoon / contracted sounds
    if (nextChar && "ゃゅょぁぃぅぇぉ".includes(nextChar)) {
      const combined = char + nextChar;
      if (reverseMap[combined]) {
        syllables.push(combined);
        idx += 2;
        continue;
      }
    }
    
    syllables.push(char);
    idx += 1;
  }
  
  // Generate combinations
  let results = [""];
  for (let sIdx = 0; sIdx < syllables.length; sIdx++) {
    const syl = syllables[sIdx];
    let spellings = [];
    
    if (syl === "っ") {
      const nextSyl = syllables[sIdx + 1];
      if (nextSyl) {
        const nextSpellings = reverseMap[nextSyl] || [nextSyl[0]];
        const firstChars = [...new Set(nextSpellings.map(sp => sp[0]).filter(Boolean))];
        if (firstChars.length > 0) {
          spellings = firstChars;
        } else {
          spellings = ["t"];
        }
      } else {
        spellings = ["tsu", "xtsu"];
      }
    } else {
      spellings = reverseMap[syl] || [syl];
    }
    
    const newResults = [];
    for (const r of results) {
      for (const sp of spellings) {
        newResults.push(r + sp);
      }
    }
    results = newResults;
  }
  
  return results;
}

/**
 * Checks if a typed Hiragana/Romaji input is a valid match/prefix of a target Hiragana reading.
 * 
 * @param {string} targetReading - Expected Hiragana reading
 * @param {string} typedInput - User typed input (Hiragana + trailing Romaji)
 * @returns {object} { isError: boolean, matchedCount: number, isComplete: boolean }
 */
export function checkMatch(targetReading, typedInput) {
  let commonLen = 0;
  
  // Find longest exact Hiragana match
  while (commonLen < typedInput.length && commonLen < targetReading.length) {
    const tChar = typedInput[commonLen];
    const rChar = targetReading[commonLen];
    
    // Check if character is Hiragana (Japanese Hiragana range: \u3040-\u309F)
    const isHiragana = tChar >= '\u3040' && tChar <= '\u309F';
    
    if (isHiragana) {
      if (tChar === rChar) {
        commonLen++;
      } else {
        return { isError: true, matchedCount: commonLen, isComplete: false };
      }
    } else {
      break;
    }
  }
  
  const remainingTarget = targetReading.substring(commonLen);
  const remainingTyped = typedInput.substring(commonLen);
  
  if (remainingTyped.length === 0) {
    return { isError: false, matchedCount: commonLen, isComplete: remainingTarget.length === 0 };
  }
  
  if (remainingTarget.length === 0) {
    return { isError: true, matchedCount: commonLen, isComplete: false };
  }
  
  const romajiSpellings = generateRomajiCombinations(remainingTarget);
  const isValidPrefix = romajiSpellings.some(spelling => spelling.startsWith(remainingTyped));
  
  if (isValidPrefix) {
    const isComplete = romajiSpellings.includes(remainingTyped);
    return { isError: false, matchedCount: commonLen, isComplete };
  } else {
    return { isError: true, matchedCount: commonLen, isComplete: false };
  }
}
