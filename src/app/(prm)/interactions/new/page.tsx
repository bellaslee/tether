import Link from 'next/link';
import { GlobalInteractionForm } from '@/components/interactions/global-interaction-form';
import { requirePrmAccess } from '@/lib/prm/guard';
import { toNewInteractionDatetimeLocalInputValueInZone } from '@/lib/datetime';
import {
  defaultInteractionTypeId as pickDefaultInteractionTypeId,
  type InteractionTypeOption,
} from '@/lib/interactions/type-options';

export default async function NewInteractionPage() {
  const ctx = await requirePrmAccess();

  const { data: people, error } = await ctx.client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', ctx.userId)
    .order('full_name', { ascending: true });

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

  const defaultOccurredAt = ctx.accountTimeZone
    ? toNewInteractionDatetimeLocalInputValueInZone(ctx.accountTimeZone)
    : '';

  return (
    <main className="prm-form-shell max-w-3xl">
      <div>
        <Link
          href="/timeline"
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          ← Timeline
        </Link>
        <p className="prm-eyebrow mt-4">Shared moments</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Log a shared moment
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          Optionally name who this was mainly about, then add everyone who was
          part of it under Also there. One entry keeps every timeline in sync.
        </p>
      </div>

      {(people ?? []).length === 0 ? (
        <div className="card-surface rounded-[1.75rem] border border-border-soft p-8 text-sm text-muted">
          Add at least one person before logging interactions.{' '}
          <Link
            href="/people/new"
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            Create someone
          </Link>
          .
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
