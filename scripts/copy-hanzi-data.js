// Copies stroke-order data for every character the app shows into public/hanzi-data,
// so HanziWriter works offline instead of fetching it from a CDN at runtime.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { kanjiData } from '../src/data/kanji.js';
import { radicalsData } from '../src/data/radicals.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'node_modules', 'hanzi-writer-data');
const outDir = path.join(root, 'public', 'hanzi-data');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const chars = new Set([...kanjiData, ...radicalsData].map(k => k.kanji));
let copied = 0;
const missing = [];
for (const ch of chars) {
  const file = path.join(srcDir, `${ch}.json`);
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(outDir, `${ch}.json`));
    copied++;
  } else {
    missing.push(ch);
  }
}
console.log(`hanzi-data: copied ${copied} characters` + (missing.length ? `, no stroke data for: ${missing.join(' ')}` : ''));
