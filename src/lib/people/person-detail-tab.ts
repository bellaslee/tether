export type PersonDetailTab =
  | 'profile'
  | 'memory'
  | 'timeline'
  | 'contacts';

export const PERSON_DETAIL_TAB_ORDER: PersonDetailTab[] = [
  'profile',
  'memory',
  'timeline',
  'contacts',
];

/** Default URL: no `tab` query means Profile. */
export function parsePersonDetailTabParam(
  param: string | undefined | null,
): PersonDetailTab {
  const v = param?.trim().toLowerCase();
  if (v === 'memory') {
    return 'memory';
  }
  if (v === 'timeline') {
    return 'timeline';
  }
  if (v === 'contacts' || v === 'details') {
    return 'contacts';
  }
  if (v === 'overview') {
    return 'profile';
  }
  return 'profile';
}

export function personDetailTabSearchParam(
  tab: PersonDetailTab,
): string | null {
  if (tab === 'profile') {
    return null;
  }
  return tab;
}
