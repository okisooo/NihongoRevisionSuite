import { kanjiData } from './src/data/kanji.js';

const seen = new Map();
const duplicates = [];

for (const item of kanjiData) {
  if (seen.has(item.kanji)) {
    duplicates.push({
      kanji: item.kanji,
      firstId: seen.get(item.kanji),
      secondId: item.id
    });
  } else {
    seen.set(item.kanji, item.id);
  }
}

console.log('Total Kanjis:', kanjiData.length);
console.log('Duplicates count:', duplicates.length);
console.log('Duplicates:', duplicates);
