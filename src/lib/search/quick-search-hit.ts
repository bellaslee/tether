export type QuickSearchHitKind = 'person' | 'interaction';

export type QuickSearchHit = {
  kind: QuickSearchHitKind;
  id: string;
  label: string;
  subtitle: string | null;
};
