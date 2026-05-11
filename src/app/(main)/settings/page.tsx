import Link from 'next/link';
import type { Metadata } from 'next';
import { ManageCategoriesPanel } from '@/components/people/manage-categories-panel';
import { ManageConnectionTypesPanel } from '@/components/people/manage-connection-types-panel';
import { ManageInteractionTypesPanel } from '@/components/timeline/manage-interaction-types-panel';
import { requireAccountAccess } from '@/lib/account/guard';

const PAGE_COPY = {
  meta: {
    title: 'Label settings · Tether',
  },
  backLink: '← People',
  hero: {
    title: 'Label settings',
    subtitle:
      'Edit the names for person categories, how two people can be linked, and timeline moment types. Changes apply everywhere.',
  },
  nav: {
    ariaLabel: 'Label settings sections',
    personCategories: 'Person categories',
    connectionTypes: 'Connection types',
    timelineTypes: 'Timeline types',
  },
  sections: {
    categories: {
      title: 'Person categories',
      subtitle:
        'Groups on the People page and in filters. Drag to set the default order of groups.',
    },
    connectionTypes: {
      title: 'Connection types',
      subtitle:
        'Labels for a link between two people (for example partner, sibling, coworker).',
    },
    timelineTypes: {
      title: 'Timeline types',
      subtitle:
        'Labels when you log a moment. Drag to set the order in the type picker.',
    },
  },
} as const;

export const metadata: Metadata = {
  title: PAGE_COPY.meta.title,
};

export default async function SettingsPage() {
  const ctx = await requireAccountAccess();

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
    <main className="shell-gutter-x mx-auto flex w-full max-w-2xl flex-1 flex-col gap-14 py-10">
      <div>
        <Link
          href="/people"
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          {PAGE_COPY.backLink}
        </Link>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          {PAGE_COPY.hero.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
          {PAGE_COPY.hero.subtitle}
        </p>
        <nav
          aria-label={PAGE_COPY.nav.ariaLabel}
          className="card-surface mt-6 rounded-2xl border border-border-soft p-4 sm:p-5"
        >
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-2">
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
          <h2 className="font-display text-xl tracking-tight sm:text-2xl">
            {PAGE_COPY.sections.categories.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
            {PAGE_COPY.sections.categories.subtitle}
          </p>
        </div>
        <ManageCategoriesPanel categories={categoriesRes.data ?? []} />
      </section>

      <section id="connection-types" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="font-display text-xl tracking-tight sm:text-2xl">
            {PAGE_COPY.sections.connectionTypes.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
            {PAGE_COPY.sections.connectionTypes.subtitle}
          </p>
        </div>
        <ManageConnectionTypesPanel types={connectionTypesRes.data ?? []} />
      </section>

      <section id="timeline-types" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="font-display text-xl tracking-tight sm:text-2xl">
            {PAGE_COPY.sections.timelineTypes.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
            {PAGE_COPY.sections.timelineTypes.subtitle}
          </p>
        </div>
        <ManageInteractionTypesPanel types={interactionTypesRes.data ?? []} />
      </section>
    </main>
  );
}
