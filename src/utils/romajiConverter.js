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
  "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ",
  "ja": "じゃ", "ju": "じゅ", "jo": "じょ",
  
  // Double characters / Syllables
  "sha": "しゃ", "shu": "しゅ", "sho": "しょ", "shi": "し",
  "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ", "chi": "ち",
  "tsu": "つ",
  
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
