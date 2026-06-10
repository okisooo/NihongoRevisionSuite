import fs from 'fs';
import path from 'path';

// Read the current kanjiData
const filePath = path.join('src', 'data', 'kanji.js');
const fileContent = fs.readFileSync(filePath, 'utf-8');
const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
const kanjiList = JSON.parse(jsonStr);

console.log(`Loaded ${kanjiList.length} kanjis to enrich.`);

function toHiragana(str) {
  if (!str) return '';
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

async function fetchKanjiInfo(char) {
  try {
    const res = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(char)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error(`Error fetching kanji info for ${char}:`, e.message);
  }
  return null;
}

async function fetchKanjiWords(char) {
  try {
    const res = await fetch(`https://kanjiapi.dev/v1/words/${encodeURIComponent(char)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error(`Error fetching words for ${char}:`, e.message);
  }
  return null;
}

// Function to process words and extract top examples
function extractExamples(words, targetChar) {
  if (!words || !Array.isArray(words)) return [];

  // Filter and score words
  const processed = words
    .map(w => {
      const variant = w.variants[0] || {};
      const written = variant.written || '';
      const pronounced = variant.pronounced || '';
      const priorities = variant.priorities || [];
      const meaning = w.meanings[0]?.glosses?.slice(0, 3).join(', ') || '';

      // Score based on:
      // - presence of priority tags (higher is better)
      // - length of word (2-3 chars preferred)
      // - contains the target character
      let score = 0;
      if (written.includes(targetChar)) score += 10;
      score += priorities.length * 5;
      
      // Prefer standard length compounds (2-3 chars)
      if (written.length === 2) score += 3;
      else if (written.length === 3) score += 2;
      else if (written.length === 1) score -= 2; // skip single-char repeats of the same kanji if possible
      else if (written.length > 4) score -= 3;

      return {
        word: written,
        reading: pronounced,
        meaning: meaning,
        score: score,
        priorities: priorities
      };
    })
    .filter(w => w.word && w.reading && w.meaning && w.word.includes(targetChar) && w.word !== targetChar); // exclude self-repeating 1-char word

  // Sort by score desc
  processed.sort((a, b) => b.score - a.score);

  // Take top 25 unique words
  const seen = new Set();
  const examples = [];
  for (const item of processed) {
    if (seen.has(item.word)) continue;
    seen.add(item.word);
    examples.push({
      word: item.word,
      reading: item.reading,
      meaning: item.meaning
    });
    if (examples.length === 25) break;
  }

  return examples;
}

async function enrich() {
  const enrichedList = new Array(kanjiList.length);
  const CONCURRENCY = 15;
  let index = 0;

  async function worker() {
    while (index < kanjiList.length) {
      const myIndex = index++;
      const item = kanjiList[myIndex];
      console.log(`Enriching [${myIndex + 1}/${kanjiList.length}]: ${item.kanji}...`);

      const infoPromise = fetchKanjiInfo(item.kanji);
      const wordsPromise = fetchKanjiWords(item.kanji);

      // Wait for both in parallel
      const [info, words] = await Promise.all([infoPromise, wordsPromise]);

      const onyomi = (info ? info.on_readings : []).map(toHiragana);
      const kunyomi = info ? info.kun_readings : [];
      const examples = extractExamples(words, item.kanji);

      // Rebuild combined reading string in Hiragana
      const reading = [...kunyomi, ...onyomi].join(' / ');

      enrichedList[myIndex] = {
        ...item,
        reading,
        onyomi,
        kunyomi,
        examples,
        standalone: item.standalone || []
      };

      // small delay to be polite to the server
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // Start CONCURRENCY workers
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // Write back to file
  const newContent = `export const kanjiData = ${JSON.stringify(enrichedList, null, 2)};\n`;
  fs.writeFileSync(filePath, newContent);
  console.log('Successfully enriched kanjiData in kanji.js!');
}

enrich();
