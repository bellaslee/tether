'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PeopleFilterDisclosure } from '@/components/people/people-filter-disclosure';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import type { PersonStatus } from '@/lib/db/database.types';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import { formatStatus } from '@/lib/domain/labels';
import { applyPeopleListFilterFacetsToParams } from '@/lib/people/people-list-filter-params';
import {
  relationshipWarmthLabel,
  type RelationshipWarmth,
} from '@/lib/people/relationship-warmth';

const RELATIONSHIP_WARMTH_FILTERS: RelationshipWarmth[] = ['hot', 'warm', 'cold'];

type CategoryOption = { id: string; name: string };

type Props = {
  q: string;
  categoryIds: string[];
  categoryOptions: CategoryOption[];
  categoryFilterInitiallyOpen: boolean;
  statusValues: PersonStatus[];
  statusFilterInitiallyOpen: boolean;
  warmthFilter: RelationshipWarmth[];
};

function replacePath(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  params: URLSearchParams,
) {
  const qs = params.toString();
  router.replace(qs ? `${pathname}?${qs}` : pathname);
}

function appliedFacetsKey(
  categoryIds: string[],
  statusValues: PersonStatus[],
  warmthFilter: RelationshipWarmth[],
): string {
  return [
    [...categoryIds].sort().join(','),
    [...statusValues].sort().join(','),
    [...warmthFilter].sort().join(','),
  ].join('|');
}

export function PeopleFiltersSidebar({
  q,
  categoryIds,
  categoryOptions,
  categoryFilterInitiallyOpen,
  statusValues,
  statusFilterInitiallyOpen,
  warmthFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [qDraft, setQDraft] = useState(q);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const appliedKey = useMemo(
    () => appliedFacetsKey(categoryIds, statusValues, warmthFilter),
    [categoryIds, statusValues, warmthFilter],
  );

  const [draftCategoryIds, setDraftCategoryIds] = useState<Set<string>>(
    () => new Set(categoryIds),
  );
  const [draftStatusValues, setDraftStatusValues] = useState<PersonStatus[]>(
    () => [...statusValues],
  );
  const [draftWarmth, setDraftWarmth] = useState<RelationshipWarmth[]>(() => [
    ...warmthFilter,
  ]);

  useEffect(() => {
    setDraftCategoryIds(new Set(categoryIds));
    setDraftStatusValues([...statusValues]);
    setDraftWarmth([...warmthFilter]);
  }, [appliedKey, categoryIds, statusValues, warmthFilter]);

  useEffect(() => {
    setQDraft(q);
  }, [q]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const syncSearchToUrl = useCallback(
    (next: string) => {
      const p = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (trimmed) {
        p.set('q', trimmed);
      } else {
        p.delete('q');
      }
      replacePath(router, pathname, p);
    },
    [pathname, router, searchParams],
  );

  const flushSearch = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = undefined;
    }
    syncSearchToUrl(qDraft);
  }, [qDraft, syncSearchToUrl]);

  const onQChange = useCallback(
    (value: string) => {
      setQDraft(value);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = undefined;
        syncSearchToUrl(value);
      }, 300);
    },
    [syncSearchToUrl],
  );

  const toggleCategory = useCallback((id: string, checked: boolean) => {
    setDraftCategoryIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleStatus = useCallback((s: PersonStatus, checked: boolean) => {
    setDraftStatusValues((prev) => {
      if (checked) {
        return [...new Set([...prev, s])];
      }
      return prev.filter((x) => x !== s);
    });
  }, []);

  const toggleWarmth = useCallback((w: RelationshipWarmth, checked: boolean) => {
    setDraftWarmth((prev) => {
      if (checked) {
        return [...new Set([...prev, w])];
      }
      return prev.filter((x) => x !== w);
    });
  }, []);

  const applyFilters = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    applyPeopleListFilterFacetsToParams(p, {
      categoryIds: draftCategoryIds,
      allCategoryIds: categoryOptions.map((c) => c.id),
      statusValues: draftStatusValues,
      warmth: draftWarmth,
    });
    replacePath(router, pathname, p);
  }, [
    categoryOptions,
    draftCategoryIds,
    draftStatusValues,
    draftWarmth,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0 w-full">
        <FormInput
          id="q"
          value={qDraft}
          onChange={(e) => onQChange(e.target.value)}
          onBlur={flushSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              flushSearch();
            }
          }}
          placeholder="Search by name"
          aria-label="Search by name"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={applyFilters}
      >
        Apply filters
      </Button>
      <div className="flex flex-wrap justify-end gap-2 text-xs text-muted">
        <Link className="underline-offset-4 hover:underline" href="/people">
          Clear filters
        </Link>
      </div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <PeopleFilterDisclosure
          key="people-filter-categories"
          initialOpen={categoryFilterInitiallyOpen}
          labelId="people-filter-categories-label"
          label="Categories"
        >
          <p className="mb-2 text-xs text-muted">
            Leave all unchecked to show every category.
          </p>
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto text-sm">
            {categoryOptions.length === 0 ? (
              <span className="text-muted">No categories yet.</span>
            ) : (
              categoryOptions.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1 pr-2 transition hover:bg-white/60"
                >
                  <input
                    type="checkbox"
                    checked={draftCategoryIds.has(c.id)}
                    onChange={(e) => toggleCategory(c.id, e.target.checked)}
                    className="size-4 rounded border-border-soft text-accent focus:ring-accent/40"
                  />
                  <span>{c.name}</span>
                </label>
              ))
            )}
          </div>
        </PeopleFilterDisclosure>
        <PeopleFilterDisclosure
          key="people-filter-status"
          initialOpen={statusFilterInitiallyOpen}
          labelId="people-filter-status-label"
          label="Status"
        >
          <p className="mb-2 text-xs text-muted">
            Leave all unchecked to show every status.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            {PERSON_STATUSES.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-lg py-1 pr-2 transition hover:bg-white/60"
              >
                <input
                  type="checkbox"
                  checked={draftStatusValues.includes(s)}
                  onChange={(e) => toggleStatus(s, e.target.checked)}
                  className="size-4 rounded border-border-soft text-accent focus:ring-accent/40"
                />
                <span>{formatStatus(s)}</span>
              </label>
            ))}
          </div>
        </PeopleFilterDisclosure>
        <PeopleFilterDisclosure
          key="people-filter-warmth"
          initialOpen={warmthFilter.length > 0}
          labelId="people-filter-warmth-label"
          label="Relationship warmth"
        >
          <p className="mb-2 text-xs text-muted">
            Matches the Hot, Warm, and Cold chips on each card. Leave all
            unchecked to show every warmth.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            {RELATIONSHIP_WARMTH_FILTERS.map((w) => (
              <label
                key={w}
                className="flex cursor-pointer items-center gap-2 rounded-lg py-1 pr-2 transition hover:bg-white/60"
              >
                <input
                  type="checkbox"
                  checked={draftWarmth.includes(w)}
                  onChange={(e) => toggleWarmth(w, e.target.checked)}
                  className="size-4 rounded border-border-soft text-accent focus:ring-accent/40"
                />
                <span>{relationshipWarmthLabel(w)}</span>
              </label>
            ))}
          </div>
        </PeopleFilterDisclosure>
      </div>
    </div>
  );
}
