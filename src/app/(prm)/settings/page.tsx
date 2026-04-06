import Link from 'next/link';
import type { Metadata } from 'next';
import { ManageCategoriesPanel } from '@/components/people/manage-categories-panel';
import { ManageConnectionTypesPanel } from '@/components/people/manage-connection-types-panel';
import { ManageInteractionTypesPanel } from '@/components/timeline/manage-interaction-types-panel';
import { requirePrmAccess } from '@/lib/prm/guard';

const PAGE_COPY = {
  meta: {
    title: 'Label settings · Tether',
  },
  backLink: '← People',
  hero: {
    eyebrow: 'Your workspace',
    title: 'Label settings',
    description:
      'Labels and types you use across people and the timeline. Changes apply everywhere right away.',
  },
  nav: {
    ariaLabel: 'Label settings sections',
    jumpTo: 'Jump to',
    personCategories: 'Person categories',
    connectionTypes: 'Connection types',
    timelineTypes: 'Timeline types',
  },
  sections: {
    categories: {
      title: 'Person categories',
      description:
        'How someone fits in your life — used in profiles, filters, and the order of groups on the People page.',
    },
    connectionTypes: {
      title: 'Connection types',
      description:
        'How one person relates to another — partner, sibling, coworker, or anything you add.',
    },
    timelineTypes: {
      title: 'Timeline types',
      description:
        "Kinds of moments on the timeline — plus a reserved type for category changes on someone's profile.",
    },
  },
} as const;

export const metadata: Metadata = {
  title: PAGE_COPY.meta.title,
};

export default async function SettingsPage() {
  const ctx = await requirePrmAccess();

  const [categoriesRes, connectionTypesRes, interactionTypesRes] =
    await Promise.all([
      ctx.client
        .from('person_categories')
        .select('id, name, sort_order')
        .eq('user_id', ctx.userId)
        .order('sort_order', { ascending: true }),
      ctx.client
        .from('connection_types')
        .select('id, name, sort_order')
        .eq('user_id', ctx.userId)
        .order('sort_order', { ascending: true }),
      ctx.client
        .from('interaction_types')
        .select('id, name, sort_order, slug')
        .eq('user_id', ctx.userId)
        .order('sort_order', { ascending: true }),
    ]);

  if (categoriesRes.error) {
    throw new Error(categoriesRes.error.message);
  }
  if (connectionTypesRes.error) {
    throw new Error(connectionTypesRes.error.message);
  }
  if (interactionTypesRes.error) {
    throw new Error(interactionTypesRes.error.message);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-14 px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <Link
          href="/people"
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          {PAGE_COPY.backLink}
        </Link>
        <p className="prm-eyebrow mt-4">{PAGE_COPY.hero.eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {PAGE_COPY.hero.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          {PAGE_COPY.hero.description}
        </p>
        <nav
          aria-label={PAGE_COPY.nav.ariaLabel}
          className="card-surface mt-6 rounded-2xl border border-border-soft p-4 sm:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {PAGE_COPY.nav.jumpTo}
          </p>
          <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-2">
            <li className="sm:after:mx-2 sm:after:text-muted sm:after:content-['·'] sm:last:after:content-none">
              <a
                href="#categories"
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                {PAGE_COPY.nav.personCategories}
              </a>
            </li>
            <li className="sm:after:mx-2 sm:after:text-muted sm:after:content-['·'] sm:last:after:content-none">
              <a
                href="#connection-types"
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                {PAGE_COPY.nav.connectionTypes}
              </a>
            </li>
            <li>
              <a
                href="#timeline-types"
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                {PAGE_COPY.nav.timelineTypes}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <section id="categories" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="font-display text-2xl tracking-tight">
            {PAGE_COPY.sections.categories.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            {PAGE_COPY.sections.categories.description}
          </p>
        </div>
        <ManageCategoriesPanel categories={categoriesRes.data ?? []} />
      </section>

      <section id="connection-types" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="font-display text-2xl tracking-tight">
            {PAGE_COPY.sections.connectionTypes.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            {PAGE_COPY.sections.connectionTypes.description}
          </p>
        </div>
        <ManageConnectionTypesPanel types={connectionTypesRes.data ?? []} />
      </section>

      <section id="timeline-types" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="font-display text-2xl tracking-tight">
            {PAGE_COPY.sections.timelineTypes.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            {PAGE_COPY.sections.timelineTypes.description}
          </p>
        </div>
        <ManageInteractionTypesPanel types={interactionTypesRes.data ?? []} />
      </section>
    </main>
  );
}
