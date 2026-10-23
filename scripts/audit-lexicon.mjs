import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = process.argv[2];
const out = process.argv[3];
if (!source || !out) throw new Error('Usage: node scripts/audit-lexicon.mjs <dictionary-directory> <report-directory>');
fs.mkdirSync(out, { recursive: true });
const {kanjiData: chars} = await import(pathToFileURL(root+'/src/data/kanji.js'));
const {sentencesData: sentences} = await import(pathToFileURL(root+'/src/data/sentences.js'));
const {grammarData: grammar} = await import(pathToFileURL(root+'/src/data/grammar.js'));
const {primaryMeaning} = await import(pathToFileURL(root+'/src/study/primaryMeanings.js'));
const hira = s => s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96));
const tags = (s,t) => [...s.matchAll(new RegExp('<'+t+'(?: [^>]*)?>([\\s\\S]*?)</'+t+'>','g'))].map(m=>m[1]);
const decode = s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const hashes = {};
function xml(file) {const b=fs.readFileSync(source+'/'+file);hashes[file]=createHash('sha256').update(b).digest('hex');return gunzipSync(b).toString('utf8');}
const kd = new Map(tags(xml('kanjidic2.xml.gz'),'character').map(s=>[tags(s,'literal')[0],{
  onyomi:[...s.matchAll(/<reading r_type="ja_on">(.*?)<\/reading>/g)].map(m=>hira(m[1])),
  kunyomi:[...s.matchAll(/<reading r_type="ja_kun">(.*?)<\/reading>/g)].map(m=>m[1]),
  meaning:[...s.matchAll(/<meaning>(.*?)<\/meaning>/g)].map(m=>decode(m[1]))
}]));
const dict = new Map();
for(const s of tags(xml('JMdict_e.gz'),'entry')) {
 const forms=tags(s,'k_ele').map(x=>({text:tags(x,'keb')[0],priority:tags(x,'ke_pri'),info:tags(x,'ke_inf')}));
 const readings=tags(s,'r_ele').filter(x=>!x.includes('<re_nokanji')).map(x=>({text:tags(x,'reb')[0],restrict:tags(x,'re_restr'),priority:tags(x,'re_pri'),info:tags(x,'re_inf')}));
 const senses=tags(s,'sense').map(x=>({gloss:tags(x,'gloss').map(decode),stagk:tags(x,'stagk'),stagr:tags(x,'stagr')}));
 for(const form of forms) {const word=form.text;const list=dict.get(word)||[];const applicable=readings.filter(r=>!r.restrict.length||r.restrict.includes(word));list.push({id:tags(s,'ent_seq')[0],commonReadings:applicable.filter(r=>form.priority.length&&!form.info.length&&r.priority.length&&!r.info.length).map(r=>r.text),readings:applicable.map(r=>r.text),senses:senses.filter(x=>!x.stagk.length||x.stagk.includes(word))});dict.set(word,list);}
}
const readingDiffs=chars.flatMap(c=>['onyomi','kunyomi'].flatMap(type=>{
const ref=kd.get(c.kanji)?.[type]||[];const data=c[type]||[];
return data.some(x=>!ref.includes(hira(x)))||ref.some(x=>!data.map(hira).includes(x))?[{id:c.id,char:c.kanji,type,data,reference:ref}]:[];
}));
function checkWord(w,owner,source) {
 const entries=dict.get(w.word)||[];const matches=entries.filter(e=>e.readings.includes(w.reading));
 const glosses=matches.flatMap(e=>e.senses.filter(s=>!s.stagr.length||s.stagr.includes(w.reading)).flatMap(s=>s.gloss));
 return {owner,source,...w,knownWord:!!entries.length,validReading:!!matches.length,common:matches.some(e=>e.commonReadings.includes(w.reading)),referenceReadings:[...new Set(entries.flatMap(e=>e.readings))],glosses:[...new Set(glosses)]};
}
const examples=chars.flatMap(c=>(c.examples||[]).map(w=>checkWord(w,c.id,'example')));
const standalone=chars.flatMap(c=>(c.standalone||[]).map(w=>checkWord(w,c.id,'standalone')));
const targets=sentences.flatMap(s=>s.targets.map(w=>checkWord(w,s.kanjiId,'sentence')));
const report={hashes,counts:{characters:chars.length,examples:examples.length,uniqueExamples:new Set(examples.map(w=>w.word+':'+w.reading)).size,standalone:standalone.length,targets:targets.length,grammar:grammar.length,patterns:grammar.flatMap(x=>x.patterns).length,quiz:grammar.flatMap(x=>x.quiz).length},readingDiffs,invalidExamples:examples.filter(w=>!w.validReading),invalidStandalone:standalone.filter(w=>!w.validReading),invalidTargets:targets.filter(w=>!w.validReading),meaningDiffs:examples.filter(w=>w.validReading&&!w.glosses.join(', ').includes(w.meaning))};
fs.writeFileSync(out+'/lexical-report.json',JSON.stringify(report,null,2));
fs.writeFileSync(out+'/dictionary-matches.json',JSON.stringify({examples,standalone,targets}));
fs.writeFileSync(out+'/character-reference.json',JSON.stringify(chars.map(c=>({character:c.kanji,...kd.get(c.kanji)}))));
fs.writeFileSync(out+'/curriculum.tsv',chars.map(c=>[c.id,c.kanji,primaryMeaning(c),kd.get(c.kanji)?.meaning.join(', ')].join('\t')).join('\n'));
fs.writeFileSync(out+'/sentences.tsv',sentences.map(s=>[s.kanjiId,s.sentence,s.translation,s.targets.map(t=>t.word+'='+t.reading+' ('+t.segments.map(z=>z.rt||z.ruby).join('')+')').join('; ')].join('\t')).join('\n'));
const lists={};for(const file of ['restore-curriculum.js','fetch-kanji.js','rebuild-database.js']) {
 const text=fs.readFileSync(root+'/'+file,'utf8');const raw=text.match(/const raw(?:Kanji)?List = `([\s\S]*?)`/i)?.[1]||'';
 const list=raw.split(/\r?\n/).filter(l=>!l.includes('*')).flatMap(l=>l.match(/\p{Script=Han}/gu)||[]);
 lists[file]={count:list.length,mismatches:chars.flatMap((c,i)=>c.kanji!==list[i]?[{id:c.id,current:c.kanji,original:list[i]}]:[])};
}fs.writeFileSync(out+'/source-lists.json',JSON.stringify(lists,null,2));
console.log(JSON.stringify({...report,readingDiffs:readingDiffs.length,invalidExamples:report.invalidExamples.length,invalidStandalone:report.invalidStandalone.length,invalidTargets:report.invalidTargets.length,meaningDiffs:report.meaningDiffs.length,lists:Object.fromEntries(Object.entries(lists).map(([k,v])=>[k,{count:v.count,differences:v.mismatches.length}]))},null,2));
