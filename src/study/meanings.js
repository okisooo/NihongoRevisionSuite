// Accepted English answers for a dictionary sense list.
export function normalizeMeaning(text) {
  return String(text)
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/^(?:(?:to|a|an|the)\s+)+/, "")
    .replace(/\s+/g, " ");
}

/** Splits senses on commas and semicolons outside parentheses. */
export function meaningSenses(text) {
  const senses = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    if (text[index] === "(") depth++;
    if (text[index] === ")") depth = Math.max(0, depth - 1);
    if ((text[index] === "," || text[index] === ";") && depth === 0) {
      senses.push(text.slice(start, index));
      start = index + 1;
    }
  }
  senses.push(text.slice(start));
  return senses.map(part => part.trim()).filter(Boolean);
}

export function meaningAnswers(text) {
  const senses = meaningSenses(text);
  return [
    ...new Set(
      senses
        .flatMap((part) => [part, part.replace(/\([^)]*\)/g, "")])
        .map(normalizeMeaning)
        .filter(Boolean),
    ),
  ];
}
