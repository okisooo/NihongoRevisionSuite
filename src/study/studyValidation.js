const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const count = value => Number.isSafeInteger(value) && value >= 0;
const id = value => Number.isInteger(value) && value >= 1 && value <= 300;
const kinds = ["meet","read","write","use"];
const outcome = value => record(value) && typeof value.correct === "boolean" && typeof value.assisted === "boolean" && (value.primed===undefined||typeof value.primed==="boolean") && ["screen","paper","self"].includes(value.method) && count(value.mistakes) && value.mistakes <= 10000;
export function validateStudy(value) {
  const invalid = () => { throw new Error("This backup contains invalid focused study records."); };
  if (!record(value)) invalid();
  if (value.exposed!==undefined && (!record(value.exposed)||Object.keys(value.exposed).length>300||Object.entries(value.exposed).some(([key,date])=>!/^\d+$/.test(key)||!id(Number(key))||!count(date)))) invalid();
  if (value.introduced !== undefined && (!record(value.introduced) || Object.entries(value.introduced).some(([key,date])=>!/^\d+$/.test(key)||!id(Number(key))||!count(date)))) invalid();
  if (value.evidence !== undefined) {
    if (!record(value.evidence) || Object.keys(value.evidence).length > 900) invalid();
    for (const [key, entry] of Object.entries(value.evidence)) {
      if (!/^(read|write|use):\d+$/.test(key) || !id(Number(key.split(":")[1])) || !outcome(entry) ||
        typeof entry.word !== "string" || entry.word.length < 1 || entry.word.length > 100 ||
        typeof entry.reading !== "string" || entry.reading.length < 1 || entry.reading.length > 100 ||
        !["lastAttempt","lastSuccess","laterSuccess"].every(k=>count(entry[k])) || entry.lastSuccess>entry.lastAttempt || entry.laterSuccess>entry.lastSuccess) invalid();
      if (entry.review!==undefined && (!record(entry.review)||!["attempts","misses","streak","due","lastReviewed"].every(k=>count(entry.review[k]))||entry.review.misses>entry.review.attempts||entry.review.streak>entry.review.attempts||(entry.review.lastSuccess!==undefined&&!count(entry.review.lastSuccess))||(entry.review.introduced!==undefined&&!count(entry.review.introduced)))) invalid();
    }
  }
  if (value.active != null) {
    const active=value.active;
    if (!record(active) || !Array.isArray(active.ids) || !active.ids.length || active.ids.length>2 || !active.ids.every(id) || new Set(active.ids).size!==active.ids.length ||
      !Array.isArray(active.tasks) || active.tasks.length!==active.ids.length*(active.review?1:4) || !count(active.index) || active.index>active.tasks.length || !count(active.started) ||
      typeof active.helped!=="boolean" || !Array.isArray(active.results) || active.results.length>active.tasks.length) invalid();
    if (active.review!==undefined && typeof active.review!=="boolean") invalid();
    const expected=kinds.flatMap(kind=>active.ids.map(id=>({kind,id})));
    if (!active.tasks.every((t,i)=>record(t)&&(active.review ? t.id===active.ids[i]&&kinds.slice(1).includes(t.kind) : t.id===expected[i].id&&t.kind===expected[i].kind))) invalid();
    const seen=new Set();
    for(const result of active.results) {
      const task=active.tasks[result.index];
      if (!outcome(result)||!count(result.index)||result.index>active.index||!task||task.kind==="meet"||result.kind!==task.kind||result.id!==task.id||!count(result.at)||seen.has(result.index)) invalid();
      seen.add(result.index);
    }
    if (active.feedback!==null && (!outcome(active.feedback)||!seen.has(active.index))) invalid();
    if (active.index===active.tasks.length && active.feedback!==null) invalid();
    if (active.paperCommitted!==undefined && typeof active.paperCommitted!=="boolean") invalid();
    if (active.selfCheck!=null && (typeof active.selfCheck!=="string" || active.selfCheck.length>5000)) invalid();
    for (let i=0;i<active.index;i++) if (active.tasks[i].kind!=="meet"&&!seen.has(i)) invalid();
    if (active.feedback!==null) {
      const current=active.results.find(r=>r.index===active.index);
      if (!["correct","assisted","method","mistakes","primed"].every(key=>current[key]===active.feedback[key])) invalid();
    } else if (seen.has(active.index)) invalid();
  }
  return value;
}
