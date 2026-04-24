function cleanParagraph(paragraph: string) {
  return paragraph.replace(/\s+/g, " ").trim();
}

export function splitScriptIntoChunks(script: string, maxChars = 6000) {
  const normalized = script.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map(cleanParagraph)
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if ((current.length + 2 + paragraph.length) <= maxChars) {
      current = `${current}\n\n${paragraph}`;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

export function mergeDistinctText(base: string, incoming: string) {
  const left = base.trim();
  const right = incoming.trim();

  if (!left) return right;
  if (!right) return left;
  if (left.includes(right)) return left;
  if (right.includes(left)) return right;

  return `${left}\n${right}`;
}
