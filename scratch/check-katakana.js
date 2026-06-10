import fs from 'fs';
import path from 'path';

// Let's import kanji.js and radicals.js manually by reading and parsing them.
const kanjiFilePath = 'src/data/kanji.js';
const radicalsFilePath = 'src/data/radicals.js';
const componentsFilePath = 'src/data/components.js';

function checkKatakana(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`${filePath} does not exist.`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const katakanaRegex = /[\u30a0-\u30ff]/g;
  const matches = content.match(katakanaRegex);
  if (matches) {
    console.log(`${filePath} has ${matches.length} Katakana characters! Examples: ${Array.from(new Set(matches)).slice(0, 20).join(', ')}`);
  } else {
    console.log(`${filePath} has NO Katakana characters.`);
  }
}

checkKatakana(kanjiFilePath);
checkKatakana(radicalsFilePath);
checkKatakana(componentsFilePath);
