/** Normalize for comparing AI memory strings (facts, task title+body). */
export function normalizeMemoryText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const MIN_CONTAINED_LEN = 12;
const WORD_MIN_LEN = 2;
const JACCARD_THRESHOLD = 0.72;

function tokenSet(normalized: string): Set<string> {
  const out = new Set<string>();
  for (const raw of normalized.split(/\s+/)) {
    const t = raw.replace(/[^a-z0-9']/gi, '').toLowerCase();
    if (t.length > WORD_MIN_LEN) {
      out.add(t);
    }
  }
  return out;
}

/**
 * Whether two strings are near-duplicates for CRM memory (don't re-suggest).
 */
export function memoryTextsSimilar(a: string, b: string): boolean {
  const na = normalizeMemoryText(a);
  const nb = normalizeMemoryText(b);
  if (!na || !nb) {
    return false;
  }
  if (na === nb) {
    return true;
  }

  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (shorter.length >= MIN_CONTAINED_LEN && longer.includes(shorter)) {
    return true;
  }

  const wordsA = tokenSet(na);
  const wordsB = tokenSet(nb);
  if (wordsA.size === 0 && wordsB.size === 0) {
    return na === nb;
  }
  if (wordsA.size === 0 || wordsB.size === 0) {
    return shorter.length >= 8 && longer.includes(shorter);
  }

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) {
      intersection += 1;
    }
  }
  const union = wordsA.size + wordsB.size - intersection;
  if (union === 0) {
    return false;
  }
  return intersection / union >= JACCARD_THRESHOLD;
}

export type FactLikeRow = { person_id: string; body: string };

/** Drop new facts that match existing or earlier new rows for the same person. */
export function filterDedupedFacts<T extends FactLikeRow>(
  candidates: T[],
  existingBodiesByPerson: Map<string, string[]>,
): T[] {
  const result: T[] = [];
  const stagedByPerson = new Map<string, string[]>();

  for (const row of candidates) {
    const existing = existingBodiesByPerson.get(row.person_id) ?? [];
    const staged = stagedByPerson.get(row.person_id) ?? [];
    const compareTo = [...existing, ...staged];
    if (compareTo.some((b) => memoryTextsSimilar(row.body, b))) {
      continue;
    }
    result.push(row);
    stagedByPerson.set(row.person_id, [...staged, row.body]);
  }

  return result;
}

export type TaskSig = {
  person_id: string | null;
  title: string;
  description: string | null;
};

export function tasksSimilar(a: TaskSig, b: TaskSig): boolean {
  if (a.person_id !== b.person_id) {
    return false;
  }
  const ta = `${a.title}\n${a.description ?? ''}`;
  const tb = `${b.title}\n${b.description ?? ''}`;
  return memoryTextsSimilar(ta, tb);
}

/** Drop new tasks that match existing or earlier new rows (same person_id). */
export function filterDedupedSuggestedTasks<T extends TaskSig>(
  candidates: T[],
  existing: TaskSig[],
): T[] {
  const result: T[] = [];
  const staged: TaskSig[] = [];

  for (const row of candidates) {
    const compareTo = [...existing, ...staged];
    if (compareTo.some((e) => tasksSimilar(row, e))) {
      continue;
    }
    result.push(row);
    staged.push(row);
  }

  return result;
}
