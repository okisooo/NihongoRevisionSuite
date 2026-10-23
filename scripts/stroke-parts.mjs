/** AnimCJK uses d2a/d2b, etc. for pieces of one self-overlapping pen stroke. */
export function mergeStrokeParts({ character, strokes, medians }, svg) {
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

  const combined = {
    // Compound outlines let the whole looping stroke fill as one unit.
    strokes: groups.map(group => group.map(index => strokes[index]).join(' ')),
    // The first median follows the complete pen motion. Later parts repeat it
    // with reflected detours (sometimes off-canvas) to delay the animation.
    medians: groups.map(group => medians[group[0]]),
  };
  // The small circle diacritic is taught from six o'clock, clockwise. The
  // source animation draws these circles in the opposite direction.
  if (character?.normalize('NFD').endsWith('\u309a')) {
    const circle = [...combined.medians.at(-1)];
    if (circle[0][0] === circle.at(-1)[0] && circle[0][1] === circle.at(-1)[1]) circle.pop();
    const area = circle.reduce((sum, p, i) => { const q = circle[(i + 1) % circle.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0);
    if (area > 0) circle.reverse();
    const bottom = circle.findIndex(p => p[1] === Math.min(...circle.map(point => point[1])));
    const ordered = [...circle.slice(bottom), ...circle.slice(0, bottom)];
    combined.medians[combined.medians.length - 1] = [...ordered, ordered[0]];
  }
  return combined;
}
