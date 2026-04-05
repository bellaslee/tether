type PersonNameRow = {
  id: string;
  full_name: string;
  display_name: string | null;
};

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
  rows: PersonNameRow[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const aliases = [row.full_name, row.display_name]
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

/** person id → label for denormalizing model output (display > full). */
export function buildPersonIdToDisplayLabelMap(
  rows: PersonNameRow[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const label =
      (row.display_name?.trim() || row.full_name.trim()) || row.id;
    map.set(row.id, label);
  }
  return map;
}

/**
 * Turn `[person:<uuid>]` tokens and bare known person UUIDs in model text into display labels.
 * Bracketed placeholders are replaced first so bare-UUID replacement does not corrupt them.
 */
export function replacePersonUuidReferencesInText(
  text: string,
  personIdToLabel: Map<string, string>,
): string {
  if (!text || personIdToLabel.size === 0) {
    return text;
  }

  let result = text;
  const entries = [...personIdToLabel.entries()];

  for (const [id, label] of entries) {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`\\[person:${escapedId}\\]`, 'gi'),
      label,
    );
  }

  for (const [id, label] of entries) {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedId, 'gi'), label);
  }

  return result;
}
