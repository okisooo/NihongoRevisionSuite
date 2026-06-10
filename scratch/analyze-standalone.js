import fs from 'fs';
import path from 'path';

const kanjiFilePath = 'src/data/kanji.js';
const fileContent = fs.readFileSync(kanjiFilePath, 'utf-8');
const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
const kanjiList = JSON.parse(jsonStr);

function toHiragana(str) {
  if (!str) return '';
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

const derived = kanjiList.map(item => {
  const kunList = item.kunyomi || [];
  const onList = item.onyomi || [];
  
  // Current derivation logic (only uses kunyomi)
  const currentWords = kunList.map(kun => {
    if (kun.includes('.')) {
      const [main, okuri] = kun.split('.');
      return {
        word: item.kanji + okuri,
        reading: main + okuri
      };
    }
    return {
      word: item.kanji,
      reading: kun
    };
  });

  return {
    id: item.id,
    kanji: item.kanji,
    meaning: item.meaning,
    kun: kunList,
    on: onList.map(toHiragana),
    derivedCurrent: currentWords
  };
});

// Let's print out the first 50 or some specific ones that might be problematic
derived.forEach(d => {
  if (d.derivedCurrent.length === 0) {
    console.log(`ID ${d.id}: ${d.kanji} (${d.meaning}) has NO kunyomi. Onyomi: ${d.on.join(', ')}`);
  } else {
    // Check if kunyomi has things like trailing hyphen indicating prefix/suffix
    const prefixes = d.derivedCurrent.filter(w => w.reading.endsWith('-') || w.reading.startsWith('-'));
    if (prefixes.length > 0) {
      console.log(`ID ${d.id}: ${d.kanji} has prefix/suffix readings: ${prefixes.map(p => `${p.word} (${p.reading})`).join(', ')}`);
    }
  }
});
