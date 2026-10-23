/** AnimCJK uses d2a/d2b, etc. for pieces of one self-overlapping pen stroke. */
export function mergeStrokeParts({ strokes, medians }, svg) {
  const parts = [...svg.matchAll(/<path\b[^>]*\bid=["']z\d+d(\d+)[a-z]?["'][^>]*>/g)];
  if (parts.length !== strokes.length || medians.length !== strokes.length)
    throw new Error('Stroke source and SVG parts do not match.');

  const groups = [];
  for (const [index, part] of parts.entries()) {
    const number = Number(part[1]);
    if (number === groups.length + 1) groups.push([]);
    else if (number !== groups.length) throw new Error('Stroke IDs must be consecutive and ordered.');
    groups[number - 1].push(index);
  }
  if (!groups.length) throw new Error('No pen strokes found in SVG.');

  return {
    // Compound outlines let the whole looping stroke fill as one unit.
    strokes: groups.map(group => group.map(index => strokes[index]).join(' ')),
    // The first median follows the complete pen motion. Later parts repeat it
    // with reflected detours (sometimes off-canvas) to delay the animation.
    medians: groups.map(group => medians[group[0]]),
  };
}
