import fs from 'fs';
import path from 'path';

const filePath = path.join('src', 'data', 'kanji.js');
const fileContent = fs.readFileSync(filePath, 'utf-8');
const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
const kanjiList = JSON.parse(jsonStr);

let cleanedCount = 0;

kanjiList.forEach(item => {
  // 1. Clean up 二 (ID 2): Remove "ふたたび"
  if (item.id === 2 && item.kanji === '二') {
    item.kunyomi = item.kunyomi.filter(k => k !== 'ふたたび');
    cleanedCount++;
  }
  
  // 2. Clean up 三 (ID 3): Remove "ゾウ"
  if (item.id === 3 && item.kanji === '三') {
    item.onyomi = item.onyomi.filter(o => o !== 'ゾウ');
    cleanedCount++;
  }
  
  // 3. Clean up 十 (ID 35): Remove "そ"
  if (item.id === 35 && item.kanji === '十') {
    item.kunyomi = item.kunyomi.filter(k => k !== 'そ');
    cleanedCount++;
  }

  // Regenerate the combined raw "reading" string to match the cleaned onyomi and kunyomi
  const allReadings = [...item.kunyomi, ...item.onyomi];
  if (allReadings.length > 0) {
    item.reading = allReadings.join(' / ');
  }
});

// Write back to file
const newContent = `export const kanjiData = ${JSON.stringify(kanjiList, null, 2)};\n`;
fs.writeFileSync(filePath, newContent);

console.log(`Successfully cleaned up readings for ${cleanedCount} kanjis in kanji.js!`);
