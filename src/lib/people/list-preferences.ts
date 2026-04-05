const VIEW_STORAGE_KEY = 'crm.people.listView';
const SORT_STORAGE_KEY = 'crm.people.listSort';

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
