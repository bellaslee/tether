'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  mergeStoredPeopleListFiltersIntoSearchParams,
  peopleListFiltersForStorage,
  peopleListFiltersPersistKey,
} from '@/lib/people/people-list-filter-params';
import {
  effectiveListSortFromSearchParams,
  effectiveListViewFromSearchParams,
  readStoredListSort,
  readStoredListView,
  readStoredPeopleListFilters,
  writeStoredListPreferences,
  writeStoredPeopleListFilters,
} from '@/lib/people/list-preferences';

/**
 * Merges saved list view / sort / filter facets into the URL when those params
 * are omitted, only on first paint or when navigating onto /people from another
 * route. While you stay on /people, the URL is authoritative so choosing default
 * view/sort (omitted params) is not overwritten from storage.
 *
 * The name search query (`q`) is not persisted: it only lives in the URL for the
 * current visit. Category, status, and warmth facets still sync with localStorage.
 */
export function PeopleListPreferencesSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPersisted = useRef<string | null>(null);
  const prevPathnameRef = useRef<string | null>(null);
  const isFirstPeopleEffect = useRef(true);

  useLayoutEffect(() => {
    if (pathname !== '/people') {
      prevPathnameRef.current = pathname;
      lastPersisted.current = null;
      return;
    }

    const enteredFromOtherRoute =
      prevPathnameRef.current !== null &&
      prevPathnameRef.current !== '/people';
    const shouldMergeFromStorage =
      isFirstPeopleEffect.current || enteredFromOtherRoute;
    isFirstPeopleEffect.current = false;
    prevPathnameRef.current = pathname;

    const sp = new URLSearchParams(searchParams.toString());
    const urlHasView = sp.has('view');
    const urlHasSort = sp.has('sort');
    let changed = false;

    if (shouldMergeFromStorage) {
      if (mergeStoredPeopleListFiltersIntoSearchParams(sp, readStoredPeopleListFilters())) {
        changed = true;
      }

      if (!urlHasView) {
        const stored = readStoredListView();
        if (stored === 'grid') {
          sp.set('view', 'grid');
          changed = true;
        } else if (stored === 'graph') {
          sp.set('view', 'graph');
          changed = true;
        }
      }

      if (!urlHasSort) {
        const stored = readStoredListSort();
        if (stored && stored !== 'name') {
          sp.set('sort', stored);
          changed = true;
        }
      }
    }

    if (changed) {
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    }

    const view = effectiveListViewFromSearchParams(sp);
    const sort = effectiveListSortFromSearchParams(sp);
    const persistKey = `${view}|${sort}|${peopleListFiltersPersistKey(sp)}`;
    if (lastPersisted.current !== persistKey) {
      lastPersisted.current = persistKey;
      writeStoredListPreferences(view, sort);
      writeStoredPeopleListFilters(peopleListFiltersForStorage(sp));
    }
  }, [pathname, router, searchParams]);

  return null;
}
