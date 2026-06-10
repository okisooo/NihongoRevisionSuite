/**
 * Parses a modular range query string (e.g. "101-140, -111-120") and returns a Set of active IDs.
 * Supporting:
 * - Single IDs: "105"
 * - Ranges: "101-110"
 * - Exclusions: "-111-120", "!115", "^105"
 * 
 * @param {string} rangeStr - The query string to parse.
 * @param {number} minVal - Minimum allowed ID value.
 * @param {number} maxVal - Maximum allowed ID value.
 * @returns {Set<number>} Set of active IDs matching the query.
 */
export function parseRangeString(rangeStr, minVal, maxVal) {
  const parts = (rangeStr || '').split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    // Default: return all IDs from minVal to maxVal
    const all = new Set();
    for (let i = minVal; i <= maxVal; i++) all.add(i);
    return all;
  }

  const additions = new Set();
  const exclusions = new Set();
  let hasAdditions = false;

  parts.forEach(part => {
    const isExclusion = part.startsWith('!') || part.startsWith('-') || part.startsWith('^');
    const innerPart = isExclusion ? part.slice(1).trim() : part;
    const targetSet = isExclusion ? exclusions : additions;
    if (!isExclusion) hasAdditions = true;

    if (innerPart.includes('-')) {
      const [startStr, endStr] = innerPart.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const startVal = Math.min(start, end);
        const endVal = Math.max(start, end);
        for (let i = startVal; i <= endVal; i++) {
          if (i >= minVal && i <= maxVal) {
            targetSet.add(i);
          }
        }
      }
    } else {
      const val = parseInt(innerPart, 10);
      if (!isNaN(val) && val >= minVal && val <= maxVal) {
        targetSet.add(val);
      }
    }
  });

  const activeIds = new Set();
  if (hasAdditions) {
    // If there are specific additions, start with those and filter out exclusions
    additions.forEach(id => {
      if (!exclusions.has(id)) {
        activeIds.add(id);
      }
    });
  } else {
    // If only exclusions are specified, start with all and remove exclusions
    for (let i = minVal; i <= maxVal; i++) {
      if (!exclusions.has(i)) {
        activeIds.add(i);
      }
    }
  }

  return activeIds;
}
