import Link from 'next/link';
import { Suspense } from 'react';
import { ButtonLink } from '@/components/ui/button';
import type { PersonStatus, Tables } from '@/lib/db/database.types';
import { requireCrmAccess } from '@/lib/crm/guard';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import { personShownName } from '@/lib/people/list-name';
import {
  computeRelationshipWarmth,
  type RelationshipWarmth,
} from '@/lib/people/relationship-warmth';
import { PeopleFiltersSidebar } from '@/components/people/people-filters-sidebar';
import { RelationshipWarmthChip } from '@/components/people/relationship-warmth-chip';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function first(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

function searchParamToStrings(param: string | string[] | undefined): string[] {
  if (param === undefined) {
    return [];
  }
  return Array.isArray(param) ? param : [param];
}

function isCategoryIdFilter(value: string): value is string {
  return UUID_RE.test(value);
}

function isStatus(value: string): value is PersonStatus {
  return PERSON_STATUSES.includes(value as PersonStatus);
}

function parseCategoryIds(param: string | string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of searchParamToStrings(param)) {
    const id = raw.trim();
    if (isCategoryIdFilter(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function parseStatuses(param: string | string[] | undefined): PersonStatus[] {
  const seen = new Set<PersonStatus>();
  const out: PersonStatus[] = [];
  for (const raw of searchParamToStrings(param)) {
    const s = raw.trim();
    if (isStatus(s) && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

const RELATIONSHIP_WARMTH_FILTERS: RelationshipWarmth[] = ['hot', 'warm', 'cold'];

function isWarmthFilter(value: string): value is RelationshipWarmth {
  return RELATIONSHIP_WARMTH_FILTERS.includes(value as RelationshipWarmth);
}

function parseWarmthFilters(
  param: string | string[] | undefined,
): RelationshipWarmth[] {
  const seen = new Set<RelationshipWarmth>();
  const out: RelationshipWarmth[] = [];
  for (const raw of searchParamToStrings(param)) {
    const w = raw.trim().toLowerCase();
    if (isWarmthFilter(w) && !seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

type PersonListRow = Pick<
  Tables<'people'>,
  | 'id'
  | 'full_name'
  | 'display_name'
  | 'preferred_name'
  | 'category_id'
  | 'status'
  | 'last_interaction_at'
  | 'met_at'
  | 'created_at'
> & {
  person_categories: { name: string } | null;
};

type PeopleSortKey = 'name' | 'last_interaction' | 'created' | 'met';

function parsePeopleSort(param: string | undefined): PeopleSortKey {
  const s = param?.trim();
  if (s === 'last_interaction' || s === 'created' || s === 'met') {
    return s;
  }
  return 'name';
}

function comparePeopleListRows(
  sortKey: PeopleSortKey,
  a: PersonListRow,
  b: PersonListRow,
): number {
  if (sortKey === 'name') {
    return personShownName(a).localeCompare(personShownName(b), undefined, {
      sensitivity: 'base',
    });
  }

  const timestamp = (p: PersonListRow): number | null => {
    if (sortKey === 'last_interaction') {
      return p.last_interaction_at ? Date.parse(p.last_interaction_at) : null;
    }
    if (sortKey === 'created') {
      return Date.parse(p.created_at);
    }
    if (sortKey === 'met') {
      return p.met_at ? Date.parse(p.met_at) : null;
    }
    return null;
  };

  const av = timestamp(a);
  const bv = timestamp(b);
  if (av === null && bv === null) {
    return personShownName(a).localeCompare(personShownName(b), undefined, {
      sensitivity: 'base',
    });
  }
  if (av === null) {
    return 1;
  }
  if (bv === null) {
    return -1;
  }
  return bv - av;
}

export default async function PeoplePage(props: {
  searchParams: SearchParams;
}) {
  const ctx = await requireCrmAccess();
  const searchParams = await props.searchParams;
  const q = first(searchParams.q)?.trim() ?? '';
  const categoryIds = parseCategoryIds(searchParams.category);
  const statusInUrl = Object.hasOwn(searchParams, 'status');
  const statusFromUrl = parseStatuses(searchParams.status);
  const statusValues: PersonStatus[] =
    !statusInUrl && statusFromUrl.length === 0 ? ['active'] : statusFromUrl;
  const warmthFilter = parseWarmthFilters(searchParams.warmth);
  const sortKey = parsePeopleSort(first(searchParams.sort));

  const { data: categoryOptions, error: categoriesError } = await ctx.client
    .from('person_categories')
    .select('id, name')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  let query = ctx.client
    .from('people')
    .select(
      'id, full_name, display_name, preferred_name, category_id, status, last_interaction_at, met_at, created_at, person_categories ( name )',
    )
    .eq('user_id', ctx.userId)
    .order('full_name', { ascending: true });

  if (categoryIds.length > 0) {
    query = query.in('category_id', categoryIds);
  }
  if (statusValues.length > 0) {
    query = query.in('status', statusValues);
  }
  if (q) {
    const pattern = `%${q}%`;
    query = query.or(
      `full_name.ilike.${pattern},display_name.ilike.${pattern}`,
    );
  }

  const { data: people, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const peopleList = (people ?? []) as PersonListRow[];

  const warmthFiltered =
    warmthFilter.length > 0
      ? peopleList.filter((p) =>
          warmthFilter.includes(
            computeRelationshipWarmth({
              lastInteractionAt: p.last_interaction_at,
              metAt: p.met_at,
              createdAt: p.created_at,
            }),
          ),
        )
      : peopleList;

  const displayed = [...warmthFiltered].sort((a, b) =>
    comparePeopleListRows(sortKey, a, b),
  );

  const categoryOptionsList = (categoryOptions ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const statusFilterInitiallyOpen =
    statusInUrl && statusFromUrl.length > 0;

  return (
    <main className="crm-page">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="crm-eyebrow">Your circle</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">People</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
            Details you don’t want to forget. Let them know you care.
          </p>
        </div>
        <ButtonLink href="/people/new" variant="primary" size="lg">
          Add someone
        </ButtonLink>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <section className="card-surface order-1 rounded-[1.75rem] border border-border-soft p-6 sm:p-8 lg:order-2 lg:w-full lg:max-w-[22rem] lg:shrink-0">
          <Suspense
            fallback={
              <div
                className="min-h-[12rem] animate-pulse rounded-2xl bg-white/50"
                aria-hidden
              />
            }
          >
            <PeopleFiltersSidebar
              q={q}
              categoryIds={categoryIds}
              categoryOptions={categoryOptionsList}
              statusValues={statusValues}
              statusFilterInitiallyOpen={statusFilterInitiallyOpen}
              warmthFilter={warmthFilter}
              sortKey={sortKey}
            />
          </Suspense>
        </section>

        <section className="order-2 min-w-0 space-y-4 lg:order-1 lg:flex-1">
          {displayed.length === 0 ? (
            <div className="card-surface rounded-[1.75rem] border border-border-soft p-10 text-center text-sm text-muted">
              No one here yet, or nothing matches your filters.{' '}
              <Link
                href="/people/new"
                className="font-semibold text-accent underline-offset-4 hover:underline"
              >
                Add your first person
              </Link>
              .
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {displayed.map((person) => (
                <li key={person.id} className="flex min-h-0 min-w-0">
                  <Link
                    href={`/people/${person.id}`}
                    className="card-surface flex h-full w-full flex-col gap-2 rounded-[1.25rem] border border-border-soft p-4 transition hover:-translate-y-0.5"
                  >
                    <div className="min-w-0 shrink-0">
                      <p className="font-display text-lg leading-snug tracking-tight">
                        {personShownName(person)}
                      </p>
                      {person.preferred_name ? (
                        <p className="mt-0.5 truncate text-xs leading-snug text-muted">
                          Goes by {person.preferred_name}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-auto flex flex-wrap content-start items-center gap-1.5 text-xs text-muted">
                      <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">
                        {person.person_categories?.name ?? '—'}
                      </span>
                      <RelationshipWarmthChip
                        lastInteractionAt={person.last_interaction_at}
                        metAt={person.met_at}
                        createdAt={person.created_at}
                        size="compact"
                      />
                      {person.last_interaction_at ? (
                        <span className="rounded-full border border-border-soft px-2.5 py-0.5">
                          Last touch{' '}
                          {new Date(
                            person.last_interaction_at,
                          ).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="rounded-full border border-border-soft px-2.5 py-0.5">
                          No interactions yet
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
