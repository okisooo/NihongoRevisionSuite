import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync('src/data/kanji.js', 'utf-8');
const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
const kanjiList = JSON.parse(jsonStr);

const katakanaRegex = /[\u30a0-\u30ff]/;

let readingsWithKatakana = 0;
let onyomisWithKatakana = 0;

kanjiList.forEach(item => {
  if (katakanaRegex.test(item.reading)) {
    readingsWithKatakana++;
    console.log(`Kanji ${item.kanji} (ID ${item.id}) has Katakana in reading: ${item.reading}`);
  }
  
  const hasKatakanaOnyomi = item.onyomi.some(on => katakanaRegex.test(on));
  if (hasKatakanaOnyomi) {
    onyomisWithKatakana++;
    console.log(`Kanji ${item.kanji} (ID ${item.id}) has Katakana in onyomi: ${item.onyomi.join(', ')}`);
  }
});

console.log(`Readings with Katakana: ${readingsWithKatakana}`);
console.log(`Onyomi with Katakana: ${onyomisWithKatakana}`);
