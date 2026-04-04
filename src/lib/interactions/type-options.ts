export type InteractionTypeOption = {
  id: string;
  name: string;
};

export function defaultInteractionTypeId(types: InteractionTypeOption[]) {
  const hangout = types.find((t) => t.name === 'Hangout');
  return hangout?.id ?? types[0]?.id ?? '';
}
