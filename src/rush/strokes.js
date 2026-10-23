// Japanese stroke data ships with the app (src/data/strokes.js, loaded on first
// use). Anything missing falls back to hanzi-writer's online data.
let local = null;
const loadLocal = () => (local ??= import("../data/strokes.js").then((m) => m.strokeData));
const ONLINE = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/";

export async function strokesFor(character) {
  const data = await loadLocal();
  if (data[character]) return data[character];
  const response = await fetch(`${ONLINE}${encodeURIComponent(character)}.json`);
  if (!response.ok) throw new Error(`no stroke data for ${character}`);
  return response.json();
}

/** hanzi-writer `charDataLoader` option. */
export const charDataLoader = (character) => strokesFor(character);

/** Mistakes allowed for a clean write: mouse and finger strokes are imprecise. */
export const allowedMistakes = (strokes) => (strokes >= 10 ? 2 : 1);
