import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import {
  PersonLogInteractionProvider,
  TimelineLogInteractionPrimaryButton,
} from '@/components/people/person-log-interaction-context';
import { QuickLogPresetStrip } from '@/components/people/quick-log-preset-strip';
import { InteractionEditDisclosure } from '@/components/interactions/interaction-edit-disclosure';
import { InteractionNotePreview } from '@/components/interactions/interaction-note-preview';
import { InteractionMemorySuggestButton } from '@/components/interactions/interaction-memory-suggest-button';
import { InteractionDeleteButton } from '@/components/interactions/interaction-delete-button';
import { InteractionMetaChips } from '@/components/interactions/interaction-meta-chips';
import { requirePrmAccess } from '@/lib/prm/guard';
import { formatDateTimeInTimeZone } from '@/lib/datetime';
import type { Tables } from '@/lib/db/database.types';
import { type InteractionTypeOption } from '@/lib/interactions/type-options';
import { toQuickLogPresetCardModel } from '@/lib/quick-log/preset-card-model';
import { partitionTimelineByOccurrence } from '@/lib/interactions/timeline-partition';
import { hasOpenAiApiKey } from '@/lib/env';
import {
  interactionHasMemorySuggestNote,
  interactionMemorySuggestionsAlreadyApplied,
} from '@/lib/interactions/memory-suggest-visibility';
import type { PersonOption } from '@/components/people/attendee-picker';
import { personShownName } from '@/lib/people/list-name';
import { fetchInteractionPeopleLinksForUserInteractions } from '@/lib/interactions/interaction-people-queries';

const PAGE_COPY = {
  hero: {
    eyebrow: 'Across your circle',
    title: 'Timeline',
    description:
      'Plans you are looking forward to and moments you have already shared. People listed together were part of the same entry — it lives once in the database.',
  },
  logInteraction: 'Log interaction',
  empty: {
    lead: "Nothing logged yet. Start from a person's page or",
    addMomentLink: 'add a multi-person moment',
    trailing: '.',
  },
  sections: {
    upcoming: {
      id: 'timeline-upcoming-heading',
      title: 'Upcoming',
    },
    past: {
      id: 'timeline-past-heading',
      title: 'Past',
    },
  },
} as const;

type InteractionWithType = Tables<'interactions'> & {
  interaction_types: { name: string } | null;
};

type PersonChip = {
  id: string;
  full_name: string;
  display_name: string | null;
  role: string;
};

export default async function TimelinePage() {
  const ctx = await requirePrmAccess();
  const displayTimeZone = ctx.accountTimeZone ?? 'UTC';

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
    .select(
      'id, full_name, display_name, last_interaction_at, met_at, created_at, interaction_count, person_categories ( name )',
    )
    .eq('user_id', ctx.userId);

  if (allPeopleError) {
    throw new Error(allPeopleError.message);
  }

  const allPeople = (allPeopleRows ?? []) as PersonOption[];

  const { data: quickLogPresetRows, error: quickLogPresetError } =
    await ctx.client
      .from('quick_log_presets')
      .select(
        'id, label, primary_person_id, interaction_type_id, interaction_title, attendee_person_ids, time_local, sort_order, created_at, interaction_types ( name )',
      )
      .eq('user_id', ctx.userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

  if (quickLogPresetError) {
    throw new Error(quickLogPresetError.message);
  }

  const globalQuickLogPresets = (quickLogPresetRows ?? []).map((row) =>
    toQuickLogPresetCardModel(
      row as Parameters<typeof toQuickLogPresetCardModel>[0],
    ),
  );

  const quickLogPeopleById = new Map(allPeople.map((p) => [p.id, p]));

  const { data: interactions, error } = await ctx.client
    .from('interactions')
    .select('*, interaction_types ( name )')
    .eq('user_id', ctx.userId)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const interactionList = (interactions ?? []) as InteractionWithType[];
  const { upcoming, past } = partitionTimelineByOccurrence(interactionList);
  const interactionIds = interactionList.map((row) => row.id);
  const peopleByInteraction = new Map<string, PersonChip[]>();

  const memorySuggestAvailable = hasOpenAiApiKey();

  if (interactionIds.length > 0) {
    const linkRes = await fetchInteractionPeopleLinksForUserInteractions(
      ctx.client,
      ctx.userId,
      interactionIds,
    );
    if ('error' in linkRes) {
      throw new Error(linkRes.error);
    }

    const linkRows = linkRes.ok;
    const personIds = [...new Set(linkRows.map((row) => row.person_id))];
    const { data: peopleRows, error: peopleError } = await ctx.client
      .from('people')
      .select('id, full_name, display_name')
      .eq('user_id', ctx.userId)
      .in('id', personIds);

    if (peopleError) {
      throw new Error(peopleError.message);
    }

    const personById = new Map((peopleRows ?? []).map((row) => [row.id, row]));

    for (const row of linkRows) {
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
    <main className="prm-page">
      <PersonLogInteractionProvider
        defaultPrimaryPersonId={null}
        sessionTimeZone={ctx.accountTimeZone}
        allPeople={allPeople}
        interactionTypes={interactionTypeOptions}
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="prm-eyebrow">{PAGE_COPY.hero.eyebrow}</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">
              {PAGE_COPY.hero.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
              {PAGE_COPY.hero.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            <TimelineLogInteractionPrimaryButton />
            <ButtonLink href="/interactions/new" variant="secondary" size="lg">
              {PAGE_COPY.logInteraction}
            </ButtonLink>
          </div>
        </header>

        <div className="mt-6">
          <QuickLogPresetStrip
            presets={globalQuickLogPresets}
            peopleById={quickLogPeopleById}
          />
        </div>

      {interactionList.length === 0 ? (
        <ol className="space-y-5">
          <li className="card-surface rounded-[1.75rem] border border-border-soft p-8 text-sm text-muted">
            {PAGE_COPY.empty.lead}{' '}
            <Link
              href="/interactions/new"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              {PAGE_COPY.empty.addMomentLink}
            </Link>
            {PAGE_COPY.empty.trailing}
          </li>
        </ol>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 ? (
            <section aria-labelledby={PAGE_COPY.sections.upcoming.id}>
              <h2
                id={PAGE_COPY.sections.upcoming.id}
                className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
              >
                {PAGE_COPY.sections.upcoming.title}
              </h2>
              <ol className="space-y-6">
                {upcoming.map((interaction) => (
                  <GlobalTimelineRow
                    key={interaction.id}
                    interaction={interaction}
                    isUpcoming
                    displayTimeZone={displayTimeZone}
                    sessionTimeZone={ctx.accountTimeZone}
                    peopleByInteraction={peopleByInteraction}
                    allPeople={allPeople}
                    interactionTypeOptions={interactionTypeOptions}
                    memorySuggestAvailable={memorySuggestAvailable}
                  />
                ))}
              </ol>
            </section>
          ) : null}
          {past.length > 0 ? (
            <section aria-labelledby={PAGE_COPY.sections.past.id}>
              {upcoming.length > 0 ? (
                <h2
                  id={PAGE_COPY.sections.past.id}
                  className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                >
                  {PAGE_COPY.sections.past.title}
                </h2>
              ) : null}
              <ol className="space-y-6">
                {past.map((interaction) => (
                  <GlobalTimelineRow
                    key={interaction.id}
                    interaction={interaction}
                    isUpcoming={false}
                    displayTimeZone={displayTimeZone}
                    sessionTimeZone={ctx.accountTimeZone}
                    peopleByInteraction={peopleByInteraction}
                    allPeople={allPeople}
                    interactionTypeOptions={interactionTypeOptions}
                    memorySuggestAvailable={memorySuggestAvailable}
                  />
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      )}
      </PersonLogInteractionProvider>
    </main>
  );
}

function GlobalTimelineRow({
  interaction,
  isUpcoming,
  displayTimeZone,
  sessionTimeZone,
  peopleByInteraction,
  allPeople,
  interactionTypeOptions,
  memorySuggestAvailable,
}: {
  interaction: InteractionWithType;
  isUpcoming: boolean;
  displayTimeZone: string;
  sessionTimeZone: string | null;
  peopleByInteraction: Map<string, PersonChip[]>;
  allPeople: PersonOption[];
  interactionTypeOptions: InteractionTypeOption[];
  memorySuggestAvailable: boolean;
}) {
  const people = peopleByInteraction.get(interaction.id) ?? [];
  const primaryPersonId = people.find((p) => p.role === 'primary')?.id ?? '';
  const attendeeIds = people
    .filter((p) => p.role === 'attendee')
    .map((p) => p.id);

  const showMemorySuggestSlot =
    memorySuggestAvailable &&
    people.length > 0 &&
    interactionHasMemorySuggestNote(interaction.raw_note);
  const memorySuggestAlreadyDone = interactionMemorySuggestionsAlreadyApplied(
    interaction.raw_note,
    interaction.memory_ai_input_hash,
  );

  const cardClass = isUpcoming
    ? 'card-surface rounded-[1.75rem] border-2 border-dashed border-accent/40 bg-accent-soft/20 p-6 sm:p-8'
    : 'card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8';

  return (
    <li className={cardClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {formatDateTimeInTimeZone(
                interaction.occurred_at,
                displayTimeZone,
              )}
            </span>
            <InteractionMetaChips
              typeName={interaction.interaction_types?.name}
              showUpcoming={isUpcoming}
            />
          </div>
          {interaction.title ? (
            <p className="font-display text-2xl [overflow-wrap:anywhere]">
              {interaction.title}
            </p>
          ) : null}
          {interaction.raw_note ? (
            <InteractionNotePreview
              key={`${interaction.id}-${interaction.updated_at}`}
              note={interaction.raw_note}
              interactionId={interaction.id}
            />
          ) : null}
          {people.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {people.map((person) => (
                <ButtonLink
                  key={`${interaction.id}-${person.id}`}
                  href={`/people/${person.id}`}
                  variant={
                    person.id === primaryPersonId ? 'primary' : 'secondary'
                  }
                  size="chip"
                >
                  {personShownName(person)}
                </ButtonLink>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col items-center gap-2 min-w-0 sm:w-auto sm:max-w-md sm:items-end">
          {showMemorySuggestSlot ? (
            <InteractionMemorySuggestButton
              interactionId={interaction.id}
              alreadySuggested={memorySuggestAlreadyDone}
            />
          ) : null}
          {allPeople.length > 0 ? (
            <InteractionEditDisclosure
              interactionId={interaction.id}
              occurredAtIso={interaction.occurred_at}
              sessionTimeZone={sessionTimeZone}
              defaultInteractionTypeId={interaction.interaction_type_id}
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
}

