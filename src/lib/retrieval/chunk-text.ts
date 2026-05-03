const MAX_CHUNK = 900;
const OVERLAP = 80;

/**
 * Naive character-based chunking for notes and fact bodies.
 * Keeps chunks under ~900 chars with small overlap.
 */
export function chunkTextForEmbedding(text: string): string[] {
  const t = text.replace(/\r\n/g, '\n').trim();
  if (!t) {
    return [];
  }
  if (t.length <= MAX_CHUNK) {
    return [t];
  }
  const chunks: string[] = [];
  let start = 0;
  while (start < t.length) {
    const end = Math.min(start + MAX_CHUNK, t.length);
    const slice = t.slice(start, end).trim();
    if (slice.length > 0) {
      chunks.push(slice);
    }
    if (end >= t.length) {
      break;
    }
    start = Math.max(end - OVERLAP, start + 1);
  }
  return chunks;
}
