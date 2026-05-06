export type InteractionTypeOption = {
  id: string;
  name: string;
};

export function defaultInteractionTypeId(types: InteractionTypeOption[]) {
  const hangout = types.find((t) => t.name === 'Hangout');
  return hangout?.id ?? types[0]?.id ?? '';
}

/** UX “blank category” resolves to Other for save (fallback first type id). */
export function resolveInteractionTypeIdForSave(
  selectedId: string,
  types: InteractionTypeOption[],
): string {
  const trimmed = selectedId.trim();
  if (trimmed) {
    return trimmed;
  }
  const other = types.find((t) => t.name === 'Other');
  return other?.id ?? types[0]?.id ?? '';
}
