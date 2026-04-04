import Link from 'next/link';
import { InteractionDeleteButton } from '@/components/interactions/interaction-delete-button';
import { requireCrmAccess } from '@/lib/crm/guard';
import { formatInteractionType } from '@/lib/domain/labels';
import { personShownName } from '@/lib/people/list-name';

export default async function TimelinePage() {
  const ctx = await requireCrmAccess();

  const { data: interactions, error } = await ctx.client
    .from('interactions')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const interactionIds = (interactions ?? []).map((row) => row.id);
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
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          Across your CRM
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Timeline</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          Every row is one real moment. People listed together shared that
          memory — it is not duplicated in the database.
        </p>
      </header>

      <ol className="space-y-5">
        {(interactions ?? []).length === 0 ? (
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
          (interactions ?? []).map((interaction) => {
            const people = peopleByInteraction.get(interaction.id) ?? [];
            return (
              <li
                key={interaction.id}
                className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {formatDateTime(interaction.occurred_at)} ·{' '}
                      {formatInteractionType(interaction.type)}
                      {interaction.direction
                        ? ` · ${interaction.direction}`
                        : ''}
                    </p>
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
                          <Link
                            key={`${interaction.id}-${person.id}`}
                            href={`/people/${person.id}`}
                            className="rounded-full border border-border-soft bg-white/70 px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-white"
                          >
                            {personShownName(person)}
                            {person.role === 'primary' ? ' · main' : ''}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <InteractionDeleteButton interactionId={interaction.id} />
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
