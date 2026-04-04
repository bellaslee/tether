export type ConnectionTypeOption = {
  id: string;
  name: string;
};

export function defaultConnectionTypeId(types: ConnectionTypeOption[]) {
  const friend = types.find((t) => t.name === 'Friend');
  return friend?.id ?? types[0]?.id ?? '';
}
