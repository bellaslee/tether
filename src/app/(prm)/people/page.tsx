import Link from 'next/link';
import { Suspense } from 'react';
import { ButtonLink } from '@/components/ui/button';
import type { Tables } from '@/lib/db/database.types';
import { requirePrmAccess } from '@/lib/prm/guard';
import { personShownName } from '@/lib/people/list-name';
import {
  effectivePeopleListStatuses,
  parsePeopleListCategoryIds,
  parsePeopleListStatuses,
} from '@/lib/people/people-list-filter-params';
import { PeopleFiltersSidebar } from '@/components/people/people-filters-sidebar';
import { PeopleListPreferencesSync } from '@/components/people/people-list-preferences-sync';
import { PeopleRelationshipGraph } from '@/components/people/people-relationship-graph';
import { PeopleViewSortBar } from '@/components/people/people-view-sort-bar';
import type { PeopleViewOption } from '@/components/people/people-view-control';
import { PeopleListItem } from '@/components/people/people-list-item';
import {
  collapsePersonConnections,
  type CollapsedGraphLink,
} from '@/lib/people/people-graph-data';

const PAGE_COPY = {
  hero: {
    eyebrow: 'Your circle',
    title: 'People',
    description: "Details you don't want to forget. Let them know you care.",
  },
  addSomeone: 'Add someone',
  empty: {
    lead: 'No one here yet, or nothing matches your filters.',
    addFirstPerson: 'Add your first person',
    trailing: '.',
  },
  list: {
    uncategorized: 'Uncategorized',
  },
  graph: {
    noLinksLead:
      'No links yet among people matching your filters — add connections from someone’s detail page.',
  },
} as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

type PersonListRow = Pick<
  Tables<'people'>,
  | 'id'
  | 'full_name'
  | 'display_name'
  | 'category_id'
  | 'status'
  | 'last_interaction_at'
  | 'met_at'
  | 'created_at'
  | 'interaction_count'
  | 'relationship_hearts_baseline_halves'
> & {
  person_categories: { name: string } | null;
};

type PeopleSortKey = 'name' | 'last_interaction' | 'created' | 'met';

function parsePeopleView(param: string | undefined): PeopleViewOption {
  const v = param?.trim().toLowerCase();
  if (v === 'grid') {
    return 'grid';
  }
  if (v === 'graph') {
    return 'graph';
  }
  return 'categories';
}

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
  const ctx = await requirePrmAccess();
  const displayTimeZone = ctx.accountTimeZone ?? 'UTC';
  const searchParams = await props.searchParams;
  const q = first(searchParams.q)?.trim() ?? '';
  const categoryInUrl = Object.hasOwn(searchParams, 'category');
  const categoryIdsFromUrl = parsePeopleListCategoryIds(searchParams.category);
  const statusInUrl = Object.hasOwn(searchParams, 'status');
  const statusFromUrl = parsePeopleListStatuses(searchParams.status);
  const statusValues = effectivePeopleListStatuses(statusInUrl, statusFromUrl);
  const sortKey = parsePeopleSort(first(searchParams.sort));
  const viewKey = parsePeopleView(first(searchParams.view));

  const { data: categoryOptions, error: categoriesError } = await ctx.client
    .from('person_categories')
    .select('id, name, sort_order')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  let query = ctx.client
    .from('people')
    .select(
      'id, full_name, display_name, category_id, status, last_interaction_at, met_at, created_at, interaction_count, relationship_hearts_baseline_halves, person_categories ( name )',
    )
    .eq('user_id', ctx.userId)
    .order('full_name', { ascending: true });

  if (categoryInUrl && categoryIdsFromUrl.length > 0) {
    query = query.in('category_id', categoryIdsFromUrl);
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

  let graphCollapsedLinks: CollapsedGraphLink[] = [];
  if (viewKey === 'graph' && peopleList.length > 0) {
    const idSet = new Set(peopleList.map((p) => p.id));
    const { data: allConnRows, error: connError } = await ctx.client
      .from('person_connections')
      .select('person_id, related_person_id, connection_type_id')
      .eq('user_id', ctx.userId);

    if (connError) {
      throw new Error(connError.message);
    }

    const inScope = (allConnRows ?? []).filter(
      (r) => idSet.has(r.person_id) && idSet.has(r.related_person_id),
    );

    const typeIds = [...new Set(inScope.map((r) => r.connection_type_id))];
    const typeNameById = new Map<string, string>();
    if (typeIds.length > 0) {
      const { data: typeRows, error: typesError } = await ctx.client
        .from('connection_types')
        .select('id, name')
        .eq('user_id', ctx.userId)
        .in('id', typeIds);

      if (typesError) {
        throw new Error(typesError.message);
      }
      for (const t of typeRows ?? []) {
        typeNameById.set(t.id, t.name);
      }
    }

    graphCollapsedLinks = collapsePersonConnections(inScope, typeNameById);
  }

  const gridSortedPeople = [...peopleList].sort((a, b) =>
    comparePeopleListRows(sortKey, a, b),
  );

  type CategoryMeta = { name: string; sort_order: number };
  const categoryMetaById = new Map<string, CategoryMeta>();
  for (const c of categoryOptions ?? []) {
    categoryMetaById.set(c.id, { name: c.name, sort_order: c.sort_order });
  }

  const peopleByCategory = new Map<string, PersonListRow[]>();
  for (const p of peopleList) {
    const cid = p.category_id;
    const bucket = peopleByCategory.get(cid) ?? [];
    bucket.push(p);
    peopleByCategory.set(cid, bucket);
  }
  for (const [, rows] of peopleByCategory) {
    rows.sort((a, b) => comparePeopleListRows(sortKey, a, b));
  }

  const FALLBACK_SORT = 1_000_000;
  const sectionCategoryIds = [...peopleByCategory.keys()].sort((a, b) => {
    const ma = categoryMetaById.get(a) ?? {
      name: '',
      sort_order: FALLBACK_SORT,
    };
    const mb = categoryMetaById.get(b) ?? {
      name: '',
      sort_order: FALLBACK_SORT,
    };
    if (ma.sort_order !== mb.sort_order) {
      return ma.sort_order - mb.sort_order;
    }
    return ma.name.localeCompare(mb.name, undefined, { sensitivity: 'base' });
  });

  const categoryOptionsList = (categoryOptions ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const categoryFilterInitiallyOpen =
    categoryInUrl && categoryIdsFromUrl.length > 0;
  const statusFilterInitiallyOpen =
    statusInUrl && statusFromUrl.length > 0;

  return (
    <main className="prm-page">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="prm-eyebrow">{PAGE_COPY.hero.eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            {PAGE_COPY.hero.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted max-sm:leading-8">
            {PAGE_COPY.hero.description}
          </p>
        </div>
        <ButtonLink href="/people/new" variant="primary" size="lg">
          {PAGE_COPY.addSomeone}
        </ButtonLink>
      </header>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:gap-y-4">
        <section className="card-surface order-2 min-w-0 rounded-[1.75rem] border border-border-soft p-6 sm:p-8 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:w-full lg:max-w-none">
          <Suspense
            fallback={
              <div
                className="min-h-[12rem] animate-pulse rounded-2xl bg-surface/70"
                aria-hidden
              />
            }
          >
            <PeopleFiltersSidebar
              q={q}
              categoryIds={categoryIdsFromUrl}
              categoryOptions={categoryOptionsList}
              categoryFilterInitiallyOpen={categoryFilterInitiallyOpen}
              statusValues={statusValues}
              statusFilterInitiallyOpen={statusFilterInitiallyOpen}
            />
          </Suspense>
        </section>

        <section className="order-1 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
          <Suspense
            fallback={
              <div
                className="h-9 animate-pulse rounded-2xl border border-border-soft bg-surface/60"
                aria-hidden
              />
            }
          >
            <PeopleListPreferencesSync />
            <PeopleViewSortBar viewKey={viewKey} sortKey={sortKey} />
          </Suspense>
        </section>

        <section className="order-3 min-w-0 lg:order-none lg:col-start-2 lg:row-start-2">
          {peopleList.length === 0 ? (
            <div className="card-surface rounded-[1.75rem] border border-border-soft p-10 text-center text-sm text-muted">
              {PAGE_COPY.empty.lead}{' '}
              <Link
                href="/people/new"
                className="font-semibold text-accent underline-offset-4 hover:underline"
              >
                {PAGE_COPY.empty.addFirstPerson}
              </Link>
              {PAGE_COPY.empty.trailing}
            </div>
          ) : viewKey === 'grid' ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {gridSortedPeople.map((person) => (
                <PeopleListItem
                  key={person.id}
                  person={person}
                  displayTimeZone={displayTimeZone}
                  variant="stacked"
                />
              ))}
            </ul>
          ) : viewKey === 'graph' ? (
            <div className="card-surface min-w-0 overflow-hidden rounded-[1.75rem] border border-border-soft p-2 sm:p-3 lg:p-4">
              <p id="people-graph-intro" className="sr-only">
                Map of filtered people as dots; lines link mutual connections.
                Hover a dot for a name or a line for the connection type.
              </p>
              <p className="sr-only" role="status">
                {peopleList.length}{' '}
                {peopleList.length === 1 ? 'person' : 'people'},{' '}
                {graphCollapsedLinks.length}{' '}
                {graphCollapsedLinks.length === 1 ? 'link' : 'links'} visible.
              </p>
              <div aria-describedby="people-graph-intro" className="min-w-0">
                {graphCollapsedLinks.length === 0 ? (
                  <p className="mb-4 text-center text-sm text-muted sm:text-left">
                    {PAGE_COPY.graph.noLinksLead}
                  </p>
                ) : null}
                <PeopleRelationshipGraph
                  people={peopleList.map((p) => ({
                    id: p.id,
                    full_name: p.full_name,
                    display_name: p.display_name,
                  }))}
                  links={graphCollapsedLinks}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {sectionCategoryIds.map((categoryId) => {
                const sectionPeople = peopleByCategory.get(categoryId) ?? [];
                const sectionTitle =
                  categoryMetaById.get(categoryId)?.name ??
                  sectionPeople[0]?.person_categories?.name ??
                  PAGE_COPY.list.uncategorized;
                return (
                  <section key={categoryId} className="space-y-3">
                    <h2 className="font-display text-lg tracking-tight text-muted sm:text-xl">
                      {sectionTitle}
                    </h2>
                    <ul className="grid grid-cols-1 gap-3">
                      {sectionPeople.map((person) => (
                        <PeopleListItem
                          key={person.id}
                          person={person}
                          displayTimeZone={displayTimeZone}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
