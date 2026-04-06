import { personShownName, type PersonForDisplay } from '@/lib/people/list-name';
import {
  computeRelationshipWarmth,
  type RelationshipWarmth,
} from '@/lib/people/relationship-warmth';

const WARMTH_SORT_RANK: Record<RelationshipWarmth, number> = {
  hot: 0,
  warm: 1,
  cold: 2,
};

export type PersonForWarmthSort = PersonForDisplay & {
  last_interaction_at: string | null;
  met_at: string | null;
  created_at: string;
};

export function comparePeopleByRelationshipWarmth(
  a: PersonForWarmthSort,
  b: PersonForWarmthSort,
): number {
  const wa = computeRelationshipWarmth({
    lastInteractionAt: a.last_interaction_at,
    metAt: a.met_at,
    createdAt: a.created_at,
  });
  const wb = computeRelationshipWarmth({
    lastInteractionAt: b.last_interaction_at,
    metAt: b.met_at,
    createdAt: b.created_at,
  });
  const d = WARMTH_SORT_RANK[wa] - WARMTH_SORT_RANK[wb];
  if (d !== 0) {
    return d;
  }
  return personShownName(a).localeCompare(personShownName(b), undefined, {
    sensitivity: 'base',
  });
}
