import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { InteractionEditDisclosure } from '@/components/interactions/interaction-edit-disclosure';
import { InteractionDeleteButton } from '@/components/interactions/interaction-delete-button';
import { InteractionMetaChips } from '@/components/interactions/interaction-meta-chips';
import { requireCrmAccess } from '@/lib/crm/guard';
import { toDatetimeLocalInputValue } from '@/lib/datetime';
import type { Tables } from '@/lib/db/database.types';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { personShownName } from '@/lib/people/list-name';

type InteractionWithType = Tables<'interactions'> & {
  interaction_types: { name: string } | null;
};

export default async function TimelinePage() {
  const ctx = await requireCrmAccess();

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

  const { data: allPeopleRows, error: allPeopleError } = await ctx.client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', ctx.userId)
    .order('full_name', { ascending: true });

  if (allPeopleError) {
    throw new Error(allPeopleError.message);
  }

  const allPeople = allPeopleRows ?? [];

  const { data: interactions, error } = await ctx.client
    .from('interactions')
    .select('*, interaction_types ( name )')
    .eq('user_id', ctx.userId)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const interactionList = (interactions ?? []) as InteractionWithType[];
  const interactionIds = interactionList.map((row) => row.id);
  const peopleByInteraction = new Map<
    string,
    Array<{
      id: string;
      full_name: string;
      display_name: string | null;
      role: string;
    }>
  >();

  if (interactionIds.length > 0) {
    const { data: linkRows, error: linkError } = await ctx.client
      .from('interaction_people')
      .select('interaction_id, person_id, role')
      .in('interaction_id', interactionIds);

    if (linkError) {
      throw new Error(linkError.message);
    }

    const personIds = [
      ...new Set((linkRows ?? []).map((row) => row.person_id)),
    ];
    const { data: peopleRows, error: peopleError } = await ctx.client
      .from('people')
      .select('id, full_name, display_name')
      .eq('user_id', ctx.userId)
      .in('id', personIds);

    if (peopleError) {
      throw new Error(peopleError.message);
    }

    const personById = new Map((peopleRows ?? []).map((row) => [row.id, row]));

    for (const row of linkRows ?? []) {
      const p = personById.get(row.person_id);
      if (!p) {
        continue;
      }
      const list = peopleByInteraction.get(row.interaction_id) ?? [];
      list.push({
        id: row.person_id,
        full_name: p.full_name,
        display_name: p.display_name,
        role: row.role,
      });
      peopleByInteraction.set(row.interaction_id, list);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Across your Circle
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Timeline</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            Every row is one real moment. People listed together shared that
            memory — it is not duplicated in the database.
          </p>
          <p className="mt-3">
            <Link
              href="/timeline/types"
              className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Manage timeline types
            </Link>
          </p>
        </div>
        <ButtonLink href="/interactions/new" variant="primary" size="lg">
          Log interaction
        </ButtonLink>
      </header>

      <ol className="space-y-5">
        {interactionList.length === 0 ? (
          <li className="card-surface rounded-[1.75rem] border border-border-soft p-8 text-sm text-muted">
            Nothing logged yet. Start from a person&apos;s page or{' '}
            <Link
              href="/interactions/new"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              add a multi-person moment
            </Link>
            .
          </li>
        ) : (
          interactionList.map((interaction) => {
            const people = peopleByInteraction.get(interaction.id) ?? [];
            const primaryPersonId =
              people.find((p) => p.role === 'primary')?.id ?? '';
            const attendeeIds = people
              .filter((p) => p.role === 'attendee')
              .map((p) => p.id);
            return (
              <li
                key={interaction.id}
                className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {formatDateTime(interaction.occurred_at)}
                      </span>
                      <InteractionMetaChips
                        typeName={interaction.interaction_types?.name}
                        direction={interaction.direction}
                      />
                    </div>
                    {interaction.title ? (
                      <p className="font-display text-2xl">
                        {interaction.title}
                      </p>
                    ) : null}
                    {interaction.raw_note ? (
                      <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                        {interaction.raw_note}
                      </p>
                    ) : null}
                    {people.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {people.map((person) => (
                          <ButtonLink
                            key={`${interaction.id}-${person.id}`}
                            href={`/people/${person.id}`}
                            variant={
                              person.id === primaryPersonId
                                ? 'primary'
                                : 'secondary'
                            }
                            size="chip"
                          >
                            {personShownName(person)}
                          </ButtonLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:max-w-md sm:items-end">
                    {allPeople.length > 0 ? (
                      <InteractionEditDisclosure
                        interactionId={interaction.id}
                        defaultOccurredAt={toDatetimeLocalInputValue(
                          new Date(interaction.occurred_at),
                        )}
                        defaultInteractionTypeId={
                          interaction.interaction_type_id
                        }
                        defaultDirection={interaction.direction ?? ''}
                        defaultTitle={interaction.title ?? ''}
                        defaultRawNote={interaction.raw_note ?? ''}
                        primaryPersonId={primaryPersonId}
                        attendeeIds={attendeeIds}
                        people={allPeople}
                        interactionTypes={interactionTypeOptions}
                      />
                    ) : null}
                    <InteractionDeleteButton interactionId={interaction.id} />
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ol>
    </main>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
