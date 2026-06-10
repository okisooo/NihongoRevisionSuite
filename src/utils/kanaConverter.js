/**
 * Converts all Katakana characters in a string to Hiragana.
 * Leaves Hiragana, Kanji, and other characters unchanged.
 * 
 * @param {string} str - The string to convert.
 * @returns {string} The converted string.
 */
export function toHiragana(str) {
  if (!str) return '';
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}
