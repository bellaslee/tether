import type { PersonStatus } from '@/lib/db/database.types';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import {
  isPeopleListCategoryId,
  type StoredPeopleListFilters,
} from '@/lib/people/people-list-filter-params';

const VIEW_STORAGE_KEY = 'tether.people.listView';
const SORT_STORAGE_KEY = 'tether.people.listSort';
const FILTER_STORAGE_KEY = 'tether.people.listFilters';

export type ListViewPreference = 'categories' | 'grid' | 'graph';

export type ListSortPreference =
  | 'name'
  | 'last_interaction'
  | 'created'
  | 'met';

export function effectiveListViewFromSearchParams(
  sp: URLSearchParams,
): ListViewPreference {
  const v = sp.get('view')?.trim().toLowerCase();
  if (v === 'grid') {
    return 'grid';
  }
  if (v === 'graph') {
    return 'graph';
  }
  return 'categories';
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
    if (raw === 'categories' || raw === 'grid' || raw === 'graph') {
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
    return { q, categoryIds, statusValues };
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
