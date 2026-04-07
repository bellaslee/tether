import type { PersonStatus } from '@/lib/db/database.types';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import type { RelationshipWarmth } from '@/lib/people/relationship-warmth';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RELATIONSHIP_WARMTH_FILTERS: RelationshipWarmth[] = ['hot', 'warm', 'cold'];

export function isPeopleListCategoryId(value: string): boolean {
  return UUID_RE.test(value);
}

function searchParamToStrings(param: string | string[] | undefined): string[] {
  if (param === undefined) {
    return [];
  }
  return Array.isArray(param) ? param : [param];
}

export function parsePeopleListCategoryIds(
  param: string | string[] | undefined,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of searchParamToStrings(param)) {
    const id = raw.trim();
    if (isPeopleListCategoryId(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export function parsePeopleListCategoryIdsFromSearchParams(
  sp: URLSearchParams,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of sp.getAll('category')) {
    const id = raw.trim();
    if (isPeopleListCategoryId(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export function parsePeopleListStatuses(
  param: string | string[] | undefined,
): PersonStatus[] {
  const seen = new Set<PersonStatus>();
  const out: PersonStatus[] = [];
  for (const raw of searchParamToStrings(param)) {
    const s = raw.trim();
    if (PERSON_STATUSES.includes(s as PersonStatus) && !seen.has(s as PersonStatus)) {
      seen.add(s as PersonStatus);
      out.push(s as PersonStatus);
    }
  }
  return out;
}

export function parsePeopleListStatusesFromSearchParams(
  sp: URLSearchParams,
): PersonStatus[] {
  const seen = new Set<PersonStatus>();
  const out: PersonStatus[] = [];
  for (const raw of sp.getAll('status')) {
    const s = raw.trim();
    if (PERSON_STATUSES.includes(s as PersonStatus) && !seen.has(s as PersonStatus)) {
      seen.add(s as PersonStatus);
      out.push(s as PersonStatus);
    }
  }
  return out;
}

/** Matches people page: absent or empty status param → treat as active-only. */
export function effectivePeopleListStatuses(
  statusInUrl: boolean,
  parsed: PersonStatus[],
): PersonStatus[] {
  if (!statusInUrl && parsed.length === 0) {
    return ['active'];
  }
  return parsed;
}

export function parsePeopleListWarmth(
  param: string | string[] | undefined,
): RelationshipWarmth[] {
  const seen = new Set<RelationshipWarmth>();
  const out: RelationshipWarmth[] = [];
  for (const raw of searchParamToStrings(param)) {
    const w = raw.trim().toLowerCase();
    if (
      RELATIONSHIP_WARMTH_FILTERS.includes(w as RelationshipWarmth) &&
      !seen.has(w as RelationshipWarmth)
    ) {
      seen.add(w as RelationshipWarmth);
      out.push(w as RelationshipWarmth);
    }
  }
  return out;
}

export function parsePeopleListWarmthFromSearchParams(
  sp: URLSearchParams,
): RelationshipWarmth[] {
  const seen = new Set<RelationshipWarmth>();
  const out: RelationshipWarmth[] = [];
  for (const raw of sp.getAll('warmth')) {
    const w = raw.trim().toLowerCase();
    if (
      RELATIONSHIP_WARMTH_FILTERS.includes(w as RelationshipWarmth) &&
      !seen.has(w as RelationshipWarmth)
    ) {
      seen.add(w as RelationshipWarmth);
      out.push(w as RelationshipWarmth);
    }
  }
  return out;
}

export type PeopleListFilterFacetSnapshot = {
  q: string;
  categoryIds: string[];
  statusValues: PersonStatus[];
  warmth: RelationshipWarmth[];
};

/** Raw URL facets for persistence (not `effectivePeopleListStatuses`). */
export type StoredPeopleListFilters = {
  q: string;
  categoryIds: string[];
  statusValues: PersonStatus[];
  warmth: RelationshipWarmth[];
};

export function peopleListFiltersForStorage(
  sp: URLSearchParams,
): StoredPeopleListFilters {
  return {
    q: sp.get('q')?.trim() ?? '',
    categoryIds: parsePeopleListCategoryIdsFromSearchParams(sp),
    statusValues: parsePeopleListStatusesFromSearchParams(sp),
    warmth: parsePeopleListWarmthFromSearchParams(sp),
  };
}

export function peopleListFiltersPersistKey(sp: URLSearchParams): string {
  const f = peopleListFiltersForStorage(sp);
  return [
    f.q,
    [...f.categoryIds].sort().join(','),
    [...f.statusValues].sort().join(','),
    [...f.warmth].sort().join(','),
  ].join('|');
}

export function mergeStoredPeopleListFiltersIntoSearchParams(
  sp: URLSearchParams,
  stored: StoredPeopleListFilters | null,
): boolean {
  if (!stored) {
    return false;
  }
  let changed = false;
  if (!sp.has('q') && stored.q) {
    sp.set('q', stored.q);
    changed = true;
  }
  if (!sp.has('category') && stored.categoryIds.length > 0) {
    for (const id of [...stored.categoryIds].sort()) {
      sp.append('category', id);
    }
    changed = true;
  }
  if (!sp.has('status') && stored.statusValues.length > 0) {
    for (const s of stored.statusValues) {
      sp.append('status', s);
    }
    changed = true;
  }
  if (!sp.has('warmth') && stored.warmth.length > 0) {
    for (const w of [...stored.warmth].sort()) {
      sp.append('warmth', w);
    }
    changed = true;
  }
  return changed;
}

export function peopleListFilterFacetSnapshotFromSearchParams(
  sp: URLSearchParams,
): PeopleListFilterFacetSnapshot {
  const statusInUrl = sp.has('status');
  const parsedStatus = parsePeopleListStatusesFromSearchParams(sp);
  return {
    q: sp.get('q')?.trim() ?? '',
    categoryIds: parsePeopleListCategoryIdsFromSearchParams(sp),
    statusValues: effectivePeopleListStatuses(statusInUrl, parsedStatus),
    warmth: parsePeopleListWarmthFromSearchParams(sp),
  };
}

/**
 * Writes category, status, and warmth keys into params (q is unchanged).
 * Empty category selection or full set → omit category (show all).
 */
export function applyPeopleListFilterFacetsToParams(
  params: URLSearchParams,
  input: {
    categoryIds: Set<string>;
    allCategoryIds: string[];
    statusValues: PersonStatus[];
    warmth: RelationshipWarmth[];
  },
): void {
  const { categoryIds, allCategoryIds, statusValues, warmth } = input;
  const allSet = new Set(allCategoryIds);
  const fullySelected =
    allSet.size > 0 &&
    categoryIds.size === allSet.size &&
    [...allSet].every((id) => categoryIds.has(id));

  params.delete('category');
  if (!fullySelected && categoryIds.size > 0) {
    for (const cid of [...categoryIds].sort()) {
      params.append('category', cid);
    }
  }

  params.delete('status');
  const matchesDefaultActive =
    statusValues.length === 1 && statusValues[0] === 'active';
  if (!matchesDefaultActive && statusValues.length > 0) {
    for (const st of statusValues) {
      params.append('status', st);
    }
  }

  params.delete('warmth');
  for (const w of [...warmth].sort()) {
    params.append('warmth', w);
  }
}
