/**
 * Replace known profile name aliases in user note text with stable `[person:<uuid>]`
 * tokens before sending the note to a model. Aliases are matched longest-first.
 */
export function placeholderizeNote(
  note: string,
  aliasToPersonId: Map<string, string>,
): string {
  if (!note || aliasToPersonId.size === 0) {
    return note;
  }

  const entries = [...aliasToPersonId.entries()]
    .map(([alias, id]) => [alias.trim(), id] as const)
    .filter(([alias]) => alias.length > 0)
    .sort((a, b) => b[0].length - a[0].length);

  let result = note;
  for (const [alias, personId] of entries) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    result = result.replace(re, `[person:${personId}]`);
  }
  return result;
}

/** Build alias → person id from profile rows (server-only load). */
export function buildAliasMapForPeople(
  rows: Array<{
    id: string;
    full_name: string;
    display_name: string | null;
    preferred_name: string | null;
  }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const aliases = [
      row.full_name,
      row.display_name,
      row.preferred_name,
    ]
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0);

    for (const a of aliases) {
      if (!map.has(a)) {
        map.set(a, row.id);
      }
    }
  }
  return map;
}
