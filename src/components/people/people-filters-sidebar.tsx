'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormInput } from '@/components/ui/form-input';
import type { PersonStatus } from '@/lib/db/database.types';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import { formatStatus } from '@/lib/domain/labels';
import {
  relationshipWarmthLabel,
  type RelationshipWarmth,
} from '@/lib/people/relationship-warmth';
import { PeopleFilterDisclosure } from '@/components/people/people-filter-disclosure';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function parseCategoryIdsFromSearchParams(sp: URLSearchParams): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of sp.getAll('category')) {
    const id = raw.trim();
    if (UUID_RE.test(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function effectiveCategorySelection(
  sp: URLSearchParams,
  allOptionIds: string[],
): Set<string> {
  if (!sp.has('category')) {
    return new Set(allOptionIds);
  }
  const parsed = parseCategoryIdsFromSearchParams(sp);
  if (parsed.length === 0) {
    return new Set(allOptionIds);
  }
  return new Set(parsed);
}

function parseStatusesFromSearchParams(sp: URLSearchParams): PersonStatus[] {
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

function effectiveStatusValues(sp: URLSearchParams): PersonStatus[] {
  const fromUrl = parseStatusesFromSearchParams(sp);
  if (fromUrl.length === 0 && !sp.has('status')) {
    return ['active'];
  }
  return fromUrl;
}

function parseWarmthFromSearchParams(sp: URLSearchParams): RelationshipWarmth[] {
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

  const toggleCategory = useCallback(
    (id: string, checked: boolean) => {
      const allIds = categoryOptions.map((c) => c.id);
      const allSet = new Set(allIds);
      const current = effectiveCategorySelection(searchParams, allIds);
      if (checked) {
        current.add(id);
      } else {
        current.delete(id);
      }
      const p = new URLSearchParams(searchParams.toString());
      p.delete('category');
      const fullySelected =
        current.size === allSet.size &&
        [...allSet].every((optionId) => current.has(optionId));
      if (!fullySelected && current.size > 0) {
        for (const cid of [...current].sort()) {
          p.append('category', cid);
        }
      }
      replacePath(router, pathname, p);
    },
    [categoryOptions, pathname, router, searchParams],
  );

  const toggleStatus = useCallback(
    (s: PersonStatus, checked: boolean) => {
      const p = new URLSearchParams(searchParams.toString());
      const effective = effectiveStatusValues(searchParams);
      let next: PersonStatus[];
      if (checked) {
        next = [...new Set([...effective, s])];
      } else {
        next = effective.filter((x) => x !== s);
      }
      p.delete('status');
      const matchesDefaultActive = next.length === 1 && next[0] === 'active';
      if (!matchesDefaultActive && next.length > 0) {
        for (const st of next) {
          p.append('status', st);
        }
      }
      replacePath(router, pathname, p);
    },
    [pathname, router, searchParams],
  );

  const toggleWarmth = useCallback(
    (w: RelationshipWarmth, checked: boolean) => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete('warmth');
      const current = new Set(parseWarmthFromSearchParams(searchParams));
      if (checked) {
        current.add(w);
      } else {
        current.delete(w);
      }
      for (const x of [...current].sort()) {
        p.append('warmth', x);
      }
      replacePath(router, pathname, p);
    },
    [pathname, router, searchParams],
  );

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
      <div className="flex flex-wrap justify-end gap-2 text-xs text-muted">
        <Link
          className="underline-offset-4 hover:underline"
          href="/people"
        >
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
            Everyone shows when all are checked. Uncheck to hide a category.
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
                    checked={categoryIds.includes(c.id)}
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
          key={`status-filters-${statusValues.slice().sort().join('|')}`}
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
                  checked={statusValues.includes(s)}
                  onChange={(e) => toggleStatus(s, e.target.checked)}
                  className="size-4 rounded border-border-soft text-accent focus:ring-accent/40"
                />
                <span>{formatStatus(s)}</span>
              </label>
            ))}
          </div>
        </PeopleFilterDisclosure>
        <PeopleFilterDisclosure
          key={`warmth-filters-${warmthFilter.slice().sort().join('|')}`}
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
                  checked={warmthFilter.includes(w)}
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
