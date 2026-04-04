import Link from 'next/link';
import type { PersonStatus, Tables } from '@/lib/db/database.types';
import { requireCrmAccess } from '@/lib/crm/guard';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import { formatStatus } from '@/lib/domain/labels';
import { personShownName } from '@/lib/people/list-name';
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

function isCategoryIdFilter(value: string | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

function isStatus(value: string | undefined): value is PersonStatus {
  return !!value && PERSON_STATUSES.includes(value as PersonStatus);
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

export default async function PeoplePage(props: {
  searchParams: SearchParams;
}) {
  const ctx = await requireCrmAccess();
  const searchParams = await props.searchParams;
  const q = first(searchParams.q)?.trim() ?? '';
  const categoryFilter = first(searchParams.category);
  const statusFilter = first(searchParams.status);

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

  if (isCategoryIdFilter(categoryFilter)) {
    query = query.eq('category_id', categoryFilter);
  }
  if (isStatus(statusFilter)) {
    query = query.eq('status', statusFilter);
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Your circle
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">People</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
            Names, context, and gentle filters — nothing about pipelines or
            deals.
          </p>
        </div>
        <Link
          href="/people/new"
          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          Add someone
        </Link>
      </header>

      <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <form
          className="flex flex-col gap-4 lg:flex-row lg:items-end"
          method="get"
          action="/people"
        >
          <div className="flex-1 space-y-2">
            <label
              htmlFor="q"
              className="text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Search by name
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Start typing a name"
              className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="category"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={
                  isCategoryIdFilter(categoryFilter) ? categoryFilter : ''
                }
                className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
              >
                <option value="">Any</option>
                {(categoryOptions ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="status"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={isStatus(statusFilter) ? statusFilter : ''}
                className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
              >
                <option value="">Any</option>
                {PERSON_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatStatus(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full border border-border-soft bg-white/80 px-6 py-3 text-sm font-semibold transition hover:bg-white"
          >
            Apply
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted">
          <span className="font-semibold uppercase tracking-wide">Quick:</span>
          <Link className="underline-offset-4 hover:underline" href="/people">
            Clear filters
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        {peopleList.length === 0 ? (
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
          <ul className="grid gap-4 md:grid-cols-2">
            {peopleList.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/people/${person.id}`}
                  className="card-surface block rounded-[1.5rem] border border-border-soft p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl">
                        {personShownName(person)}
                      </p>
                      {person.display_name?.trim() &&
                      personShownName(person) !== person.full_name ? (
                        <p className="text-sm text-muted">{person.full_name}</p>
                      ) : null}
                      {person.preferred_name ? (
                        <p className="text-sm text-muted">
                          Goes by {person.preferred_name}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                      {person.person_categories?.name ?? '—'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="rounded-full border border-border-soft px-2 py-1">
                      {formatStatus(person.status)}
                    </span>
                    <RelationshipWarmthChip
                      lastInteractionAt={person.last_interaction_at}
                      metAt={person.met_at}
                      createdAt={person.created_at}
                    />
                    {person.last_interaction_at ? (
                      <span className="rounded-full border border-border-soft px-2 py-1">
                        Last touch{' '}
                        {new Date(
                          person.last_interaction_at,
                        ).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="rounded-full border border-border-soft px-2 py-1">
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
    </main>
  );
}
