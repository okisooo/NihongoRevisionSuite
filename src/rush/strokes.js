// Japanese stroke data ships with the app (src/data/strokes.js, loaded on first
// use). Missing characters must not silently switch to another language's data.
let local = null;
const loadLocal = () => (local ??= import("../data/strokes.js").then((m) => m.strokeData));

export async function strokesFor(character) {
  const data = await loadLocal();
  if (Object.hasOwn(data, character)) return data[character];
  throw new Error(`Japanese stroke data unavailable for ${character}`);
}

/** hanzi-writer `charDataLoader` option. */
export const charDataLoader = (character) => strokesFor(character);

/** Mistakes allowed for a clean write: mouse and finger strokes are imprecise. */
export const allowedMistakes = (strokes) => (strokes >= 10 ? 2 : 1);
