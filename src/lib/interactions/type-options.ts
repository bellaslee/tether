export type InteractionTypeOption = {
  id: string;
  name: string;
};

export function defaultInteractionTypeId(types: InteractionTypeOption[]) {
  const hangout = types.find((t) => t.name === 'Hangout');
  return hangout?.id ?? types[0]?.id ?? '';
}

/** Default type for Quick Log (and presets opened from it): **Other** when present. */
export function defaultQuickLogInteractionTypeId(
  types: InteractionTypeOption[],
) {
  const other = types.find((t) => t.name === 'Other');
  return other?.id ?? types[0]?.id ?? '';
}
