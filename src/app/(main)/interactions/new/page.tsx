import Link from 'next/link';
import { GlobalInteractionForm } from '@/components/interactions/global-interaction-form';
import { requireAccountAccess } from '@/lib/account/guard';
import {
  defaultInteractionTypeId as pickDefaultInteractionTypeId,
  type InteractionTypeOption,
} from '@/lib/interactions/type-options';

const PAGE_COPY = {
  backLink: '← Timeline',
  hero: {
    title: 'Log a shared moment',
    subtitle:
      "Optional: pick who it was mainly about, then add everyone else under Also there. One entry updates everyone's timeline.",
  },
  emptyPeople: {
    lead: 'Add at least one person before logging interactions.',
    createLink: 'Create someone',
    trailing: '.',
  },
} as const;

export default async function NewInteractionPage() {
  const ctx = await requireAccountAccess();

  const { data: people, error } = await ctx.client
    .from('people')
    .select(
      'id, full_name, display_name, last_interaction_at, met_at, created_at, interaction_count, relationship_hearts_baseline_halves, person_categories ( name )',
    )
    .eq('user_id', ctx.userId);

  if (error) {
    throw new Error(error.message);
  }

  const { data: interactionTypeRows, error: typesError } = await ctx.client
    .from('interaction_types')
    .select('id, name')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  if (typesError) {
    throw new Error(typesError.message);
  }

  const interactionTypeOptions: InteractionTypeOption[] = (
    interactionTypeRows ?? []
  ).map((row) => ({ id: row.id, name: row.name }));
  const defaultInteractionTypeId = pickDefaultInteractionTypeId(
    interactionTypeOptions,
  );

  const defaultOccurredAt = '';

  return (
    <main className="form-shell max-w-3xl">
      <div>
        <Link
          href="/timeline"
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
      </div>

      {(people ?? []).length === 0 ? (
        <div className="card-surface rounded-[1.75rem] border border-border-soft p-8 text-sm text-muted">
          {PAGE_COPY.emptyPeople.lead}{' '}
          <Link
            href="/people/new"
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            {PAGE_COPY.emptyPeople.createLink}
          </Link>
          {PAGE_COPY.emptyPeople.trailing}
        </div>
      ) : (
        <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <GlobalInteractionForm
            people={people ?? []}
            defaultOccurredAt={defaultOccurredAt}
            interactionTypes={interactionTypeOptions}
            defaultInteractionTypeId={defaultInteractionTypeId}
          />
        </div>
      )}
    </main>
  );
}
