export type PersonGraphConnectionRow = {
  person_id: string;
  related_person_id: string;
  connection_type_id: string;
};

export type CollapsedGraphLink = {
  id: string;
  sourcePersonId: string;
  targetPersonId: string;
  connectionLabels: string;
};

/** Undirected collapsed edge: merges reciprocal rows and duplicate types. */
export function collapsePersonConnections(
  rows: PersonGraphConnectionRow[],
  typeNameById: Map<string, string>,
): CollapsedGraphLink[] {
  const buckets = new Map<
    string,
    { a: string; b: string; names: Set<string> }
  >();

  for (const row of rows) {
    const p = row.person_id;
    const r = row.related_person_id;
    const [sourcePersonId, targetPersonId] =
      p.localeCompare(r, undefined, { sensitivity: 'base' }) < 0 ? [p, r] : [r, p];
    const key = `${sourcePersonId}:${targetPersonId}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { a: sourcePersonId, b: targetPersonId, names: new Set() };
      buckets.set(key, bucket);
    }
    const resolved = typeNameById.get(row.connection_type_id)?.trim();
    bucket.names.add(resolved && resolved.length > 0 ? resolved : 'Connected');
  }

  return [...buckets.values()].map((b) => ({
    id: `${b.a}:${b.b}`,
    sourcePersonId: b.a,
    targetPersonId: b.b,
    connectionLabels: [...b.names].sort((x, y) =>
      x.localeCompare(y, undefined, { sensitivity: 'base' }),
    ).join(' · '),
  }));
}
