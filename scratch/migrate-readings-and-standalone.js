import fs from 'fs';
import path from 'path';

// Load databases
const kanjiFilePath = 'src/data/kanji.js';
const radicalsFilePath = 'src/data/radicals.js';
const componentsFilePath = 'src/data/components.js';

function toHiragana(str) {
  if (!str) return '';
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

// Curated overrides for standalone words & readings to guarantee 100% correct furigana breakdowns.
const standaloneOverrides = {
  "一": [
    { word: "一", reading: "いち", segments: [{ ruby: "一", rt: "いち" }] },
    { word: "一つ", reading: "ひとつ", segments: [{ ruby: "一", rt: "ひと" }, { ruby: "つ" }] }
  ],
  "二": [
    { word: "二", reading: "に", segments: [{ ruby: "二", rt: "に" }] },
    { word: "二つ", reading: "ふたつ", segments: [{ ruby: "二", rt: "ふた" }, { ruby: "つ" }] }
  ],
  "三": [
    { word: "三", reading: "さん", segments: [{ ruby: "三", rt: "さん" }] },
    { word: "三つ", reading: "みっつ", segments: [{ ruby: "三", rt: "みっ" }, { ruby: "つ" }] }
  ],
  "四": [
    { word: "四", reading: "よん", segments: [{ ruby: "四", rt: "よん" }] },
    { word: "四つ", reading: "よっつ", segments: [{ ruby: "四", rt: "よっ" }, { ruby: "つ" }] }
  ],
  "五": [
    { word: "五", reading: "ご", segments: [{ ruby: "五", rt: "ご" }] },
    { word: "五つ", reading: "いつつ", segments: [{ ruby: "五", rt: "いつ" }, { ruby: "つ" }] }
  ],
  "六": [
    { word: "六", reading: "ろく", segments: [{ ruby: "六", rt: "ろく" }] },
    { word: "六つ", reading: "むっつ", segments: [{ ruby: "六", rt: "むっ" }, { ruby: "つ" }] }
  ],
  "七": [
    { word: "七", reading: "なな", segments: [{ ruby: "七", rt: "なな" }] },
    { word: "七つ", reading: "ななつ", segments: [{ ruby: "七", rt: "なな" }, { ruby: "つ" }] }
  ],
  "八": [
    { word: "八", reading: "はち", segments: [{ ruby: "八", rt: "はち" }] },
    { word: "八つ", reading: "やつ", segments: [{ ruby: "八", rt: "や" }, { ruby: "つ" }] }
  ],
  "九": [
    { word: "九", reading: "きゅう", segments: [{ ruby: "九", rt: "きゅう" }] },
    { word: "九つ", reading: "ここのつ", segments: [{ ruby: "九", rt: "ここの" }, { ruby: "つ" }] }
  ],
  "十": [
    { word: "十", reading: "じゅう", segments: [{ ruby: "十", rt: "じゅう" }] },
    { word: "十", reading: "とお", segments: [{ ruby: "十", rt: "とお" }] }
  ],
  "百": [
    { word: "百", reading: "ひゃく", segments: [{ ruby: "百", rt: "ひゃく" }] }
  ],
  "千": [
    { word: "千", reading: "せん", segments: [{ ruby: "千", rt: "せん" }] }
  ],
  "万": [
    { word: "万", reading: "まん", segments: [{ ruby: "万", rt: "まん" }] }
  ],
  "円": [
    { word: "円", reading: "えん", segments: [{ ruby: "円", rt: "えん" }] }
  ],
  "本": [
    { word: "本", reading: "ほん", segments: [{ ruby: "本", rt: "ほん" }] }
  ],
  "分": [
    { word: "分", reading: "ふん", segments: [{ ruby: "分", rt: "ふん" }] }
  ],
  "半": [
    { word: "半", reading: "はん", segments: [{ ruby: "半", rt: "はん" }] }
  ],
  "気": [
    { word: "気", reading: "き", segments: [{ ruby: "気", rt: "き" }] }
  ],
  "駅": [
    { word: "駅", reading: "えき", segments: [{ ruby: "駅", rt: "えき" }] }
  ],
  "度": [
    { word: "度", reading: "ど", segments: [{ ruby: "度", rt: "ど" }] }
  ],
  "番": [
    { word: "番", reading: "ばん", segments: [{ ruby: "番", rt: "ばん" }] }
  ],
  "号": [
    { word: "号", reading: "ごう", segments: [{ ruby: "号", rt: "ごう" }] }
  ],
  "線": [
    { word: "線", reading: "せん", segments: [{ ruby: "線", rt: "せん" }] }
  ],
  "門": [
    { word: "門", reading: "もん", segments: [{ ruby: "門", rt: "もん" }] }
  ],
  "服": [
    { word: "服", reading: "ふく", segments: [{ ruby: "服", rt: "ふく" }] }
  ],
  "肉": [
    { word: "肉", reading: "にく", segments: [{ ruby: "肉", rt: "にく" }] }
  ],
  "茶": [
    { word: "茶", reading: "ちゃ", segments: [{ ruby: "茶", rt: "ちゃ" }] }
  ],
  "点": [
    { word: "点", reading: "てん", segments: [{ ruby: "点", rt: "てん" }] }
  ],
  "図": [
    { word: "図", reading: "ず", segments: [{ ruby: "図", rt: "ず" }] }
  ],
  "区": [
    { word: "区", reading: "く", segments: [{ ruby: "区", rt: "く" }] }
  ],
  "市": [
    { word: "市", reading: "し", segments: [{ ruby: "市", rt: "し" }] }
  ],
  "字": [
    { word: "字", reading: "じ", segments: [{ ruby: "字", rt: "じ" }] }
  ],
  "秒": [
    { word: "秒", reading: "びょう", segments: [{ ruby: "秒", rt: "びょう" }] }
  ],
  "税": [
    { word: "税", reading: "ぜい", segments: [{ ruby: "税", rt: "ぜい" }] }
  ],
  "工": [
    { word: "工", reading: "こう", segments: [{ ruby: "工", rt: "こう" }] }
  ],
  "名": [
    { word: "名", reading: "な", segments: [{ ruby: "名", rt: "な" }] }
  ],
  "人": [
    { word: "人", reading: "ひと", segments: [{ ruby: "人", rt: "ひと" }] }
  ],
  "目": [
    { word: "目", reading: "め", segments: [{ ruby: "目", rt: "め" }] }
  ],
  "手": [
    { word: "手", reading: "て", segments: [{ ruby: "手", rt: "て" }] }
  ],
  "木": [
    { word: "木", reading: "き", segments: [{ ruby: "木", rt: "き" }] }
  ],
  "金": [
    { word: "金", reading: "かね", segments: [{ ruby: "金", rt: "かね" }] }
  ],
  "生": [
    { word: "生きる", reading: "いきる", segments: [{ ruby: "生", rt: "い" }, { ruby: "きる" }] },
    { word: "生まれる", reading: "うまれる", segments: [{ ruby: "生", rt: "うま" }, { ruby: "れる" }] },
    { word: "生", reading: "なま", segments: [{ ruby: "生", rt: "なま" }] }
  ],
  "話": [
    { word: "話す", reading: "はなす", segments: [{ ruby: "話", rt: "はな" }, { ruby: "す" }] },
    { word: "話", reading: "はなし", segments: [{ ruby: "話", rt: "はなし" }] }
  ],
  "売": [
    { word: "売る", reading: "うる", segments: [{ ruby: "売", rt: "う" }, { ruby: "る" }] }
  ],
  "切": [
    { word: "切る", reading: "きる", segments: [{ ruby: "切", rt: "き" }, { ruby: "る" }] }
  ],
  "込": [
    { word: "込む", reading: "こむ", segments: [{ ruby: "込", rt: "こ" }, { ruby: "む" }] }
  ],
  "申": [
    { word: "申す", reading: "もうす", segments: [{ ruby: "申", rt: "もう" }, { ruby: "す" }] }
  ],
  "堂": [
    { word: "堂", reading: "どう", segments: [{ ruby: "堂", rt: "どう" }] }
  ],
  "曜": [
    { word: "曜", reading: "よう", segments: [{ ruby: "曜", rt: "よう" }] }
  ]
};

// 1. Process kanjiData in kanji.js
if (fs.existsSync(kanjiFilePath)) {
  console.log('Migrating kanji.js...');
  const fileContent = fs.readFileSync(kanjiFilePath, 'utf-8');
  const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
  const kanjiList = JSON.parse(jsonStr);

  const migratedKanjis = kanjiList.map(item => {
    // Convert Onyomi to Hiragana
    const onyomi = (item.onyomi || []).map(toHiragana);
    const kunyomi = (item.kunyomi || []);
    
    // Rebuild the combined reading string in Hiragana
    const rawReading = item.reading || '';
    const reading = toHiragana(rawReading);

    // Derive standalone word lists
    let standalone = [];
    if (standaloneOverrides[item.kanji]) {
      // Use curated override
      standalone = standaloneOverrides[item.kanji];
    } else {
      // Derive from Kunyomi dot notation
      standalone = kunyomi
        .filter(kun => !kun.startsWith('-') && !kun.endsWith('-')) // Ignore prefixes/suffixes
        .map(kun => {
          if (kun.includes('.')) {
            const [main, okuri] = kun.split('.');
            return {
              word: item.kanji + okuri,
              reading: main + okuri,
              segments: [
                { ruby: item.kanji, rt: main },
                { ruby: okuri }
              ]
            };
          }
          return {
            word: item.kanji,
            reading: kun,
            segments: [
              { ruby: item.kanji, rt: kun }
            ]
          };
        });
    }

    return {
      ...item,
      reading,
      onyomi,
      standalone
    };
  });

  const outputContent = `export const kanjiData = ${JSON.stringify(migratedKanjis, null, 2)};\n`;
  fs.writeFileSync(kanjiFilePath, outputContent);
  console.log(`Successfully migrated ${migratedKanjis.length} kanjis in kanji.js to Hiragana and added standalone segments!`);
}

// 2. Process radicalsData in radicals.js
if (fs.existsSync(radicalsFilePath)) {
  console.log('Migrating radicals.js...');
  const fileContent = fs.readFileSync(radicalsFilePath, 'utf-8');
  const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
  const radicalsList = JSON.parse(jsonStr);

  const migratedRadicals = radicalsList.map(item => {
    return {
      ...item,
      reading: toHiragana(item.reading)
    };
  });

  const outputContent = `export const radicalsData = ${JSON.stringify(migratedRadicals, null, 2)};\n`;
  fs.writeFileSync(radicalsFilePath, outputContent);
  console.log(`Successfully migrated ${migratedRadicals.length} radicals in radicals.js to Hiragana!`);
}

// 3. Process componentsDb in components.js
if (fs.existsSync(componentsFilePath)) {
  console.log('Migrating components.js...');
  const fileContent = fs.readFileSync(componentsFilePath, 'utf-8');
  
  // Extract componentsDb and kanjiDecompositions strings
  const dbMatch = fileContent.match(/export const componentsDb = ([\s\S]+?);/);
  const decompMatch = fileContent.match(/export const kanjiDecompositions = ([\s\S]+?);/);

  if (dbMatch) {
    const componentsDb = JSON.parse(dbMatch[1]);
    
    Object.keys(componentsDb).forEach(key => {
      const comp = componentsDb[key];
      if (comp.reading) {
        comp.reading = toHiragana(comp.reading);
      }
    });

    const decompStr = decompMatch ? decompMatch[1] : '{}';

    const outputContent = `// Automatically generated by generate-decompositions.js. Do not edit directly.

export const componentsDb = ${JSON.stringify(componentsDb, null, 2)};

export const kanjiDecompositions = ${decompStr};
`;
    fs.writeFileSync(componentsFilePath, outputContent);
    console.log(`Successfully migrated componentsDb in components.js to Hiragana!`);
  }
}
