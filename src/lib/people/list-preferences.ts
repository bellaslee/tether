import type { PersonStatus } from '@/lib/db/database.types';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import {
  isPeopleListCategoryId,
  type StoredPeopleListFilters,
} from '@/lib/people/people-list-filter-params';
import type { RelationshipWarmth } from '@/lib/people/relationship-warmth';

const VIEW_STORAGE_KEY = 'prm.people.listView';
const SORT_STORAGE_KEY = 'prm.people.listSort';
const FILTER_STORAGE_KEY = 'prm.people.listFilters';

const WARMTH_FILTER_VALUES: RelationshipWarmth[] = ['hot', 'warm', 'cold'];

export type ListViewPreference = 'categories' | 'grid';

export type ListSortPreference =
  | 'name'
  | 'last_interaction'
  | 'created'
  | 'met';

export function effectiveListViewFromSearchParams(
  sp: URLSearchParams,
): ListViewPreference {
  return sp.get('view') === 'grid' ? 'grid' : 'categories';
}

export function effectiveListSortFromSearchParams(
  sp: URLSearchParams,
): ListSortPreference {
  const s = sp.get('sort')?.trim();
  if (s === 'last_interaction' || s === 'created' || s === 'met') {
    return s;
  }
  return 'name';
}

export function readStoredListView(): ListViewPreference | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw === 'categories' || raw === 'grid') {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function readStoredListSort(): ListSortPreference | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (
      raw === 'name' ||
      raw === 'last_interaction' ||
      raw === 'created' ||
      raw === 'met'
    ) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeStoredListPreferences(
  view: ListViewPreference,
  sort: ListSortPreference,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
    localStorage.setItem(SORT_STORAGE_KEY, sort);
  } catch {
    // private mode / quota
  }
}

export function readStoredPeopleListFilters(): StoredPeopleListFilters | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') {
      return null;
    }
    const o = data as Record<string, unknown>;
    const q = typeof o.q === 'string' ? o.q : '';
    const categoryIds = Array.isArray(o.categoryIds)
      ? o.categoryIds.filter(
          (x): x is string => typeof x === 'string' && isPeopleListCategoryId(x),
        )
      : [];
    const statusValues = Array.isArray(o.statusValues)
      ? o.statusValues.filter(
          (x): x is PersonStatus =>
            typeof x === 'string' && PERSON_STATUSES.includes(x as PersonStatus),
        )
      : [];
    const warmth = Array.isArray(o.warmth)
      ? o.warmth.filter(
          (x): x is RelationshipWarmth =>
            typeof x === 'string' &&
            WARMTH_FILTER_VALUES.includes(x as RelationshipWarmth),
        )
      : [];
    return { q, categoryIds, statusValues, warmth };
  } catch {
    return null;
  }
}

export function writeStoredPeopleListFilters(
  filters: StoredPeopleListFilters,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // private mode / quota
  }
}
