import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactMethodAddDisclosure } from '@/components/people/contact-method-add-disclosure';
import { ContactMethodRow } from '@/components/people/contact-method-row';
import { RelationshipWarmthChip } from '@/components/people/relationship-warmth-chip';
import { PersonDetailHeader } from '@/components/people/person-detail-header';
import { InteractionEditDisclosure } from '@/components/interactions/interaction-edit-disclosure';
import { InteractionDeleteButton } from '@/components/interactions/interaction-delete-button';
import { getCrmSupabaseContext } from '@/lib/crm/context';
import { requireCrmAccess } from '@/lib/crm/guard';
import { InteractionMetaChips } from '@/components/interactions/interaction-meta-chips';
import { formatStatus } from '@/lib/domain/labels';
import { formatMonthYear, toDatetimeLocalInputValue } from '@/lib/datetime';
import type { Tables } from '@/lib/db/database.types';
import {
  defaultInteractionTypeId as pickDefaultInteractionTypeId,
  type InteractionTypeOption,
} from '@/lib/interactions/type-options';
import { partitionPersonTimelineRows } from '@/lib/interactions/timeline-partition';
import {
  defaultConnectionTypeId as pickDefaultConnectionTypeId,
  type ConnectionTypeOption,
} from '@/lib/people/connection-type-options';
import { PersonConnectionsPanel } from '@/components/people/person-connections-panel';
import { PersonMemorySection } from '@/components/ai/person-memory-section';
import { hasOpenAiApiKey } from '@/lib/env';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
};

function first(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

type PersonWithCategory = Tables<'people'> & {
  person_categories: { name: string } | null;
};

type InteractionWithType = Tables<'interactions'> & {
  interaction_types: { name: string } | null;
};

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { title: 'Person · Personal CRM' };
  }
  const { data } = await ctx.client
    .from('people')
    .select('full_name')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (!data) {
    return { title: 'Person' };
  }
  return { title: `${data.full_name} · Personal CRM` };
}

export default async function PersonDetailPage(props: PageProps) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const tab =
    first(searchParams.tab) === 'details' ? 'details' : 'overview';

  const ctx = await requireCrmAccess();

  const { data: personRow, error: personError } = await ctx.client
    .from('people')
    .select('*, person_categories ( name )')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (personError) {
    throw new Error(personError.message);
  }
  if (!personRow) {
    notFound();
  }

  const person = personRow as PersonWithCategory;

  const { data: contactMethods } = await ctx.client
    .from('contact_methods')
    .select('*')
    .eq('person_id', id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  const { data: allPeople } = await ctx.client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', ctx.userId)
    .order('full_name', { ascending: true });

  const { data: interactionTypeRows } = await ctx.client
    .from('interaction_types')
    .select('id, name')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  const interactionTypeOptions: InteractionTypeOption[] = (
    interactionTypeRows ?? []
  ).map((row) => ({ id: row.id, name: row.name }));
  const defaultInteractionTypeId = pickDefaultInteractionTypeId(
    interactionTypeOptions,
  );

  const { data: connectionTypeRows } = await ctx.client
    .from('connection_types')
    .select('id, name')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  const connectionTypeOptions: ConnectionTypeOption[] = (
    connectionTypeRows ?? []
  ).map((row) => ({ id: row.id, name: row.name }));
  const defaultConnectionTypeId = pickDefaultConnectionTypeId(
    connectionTypeOptions,
  );

  const { data: personConnectionRows, error: personConnectionsError } =
    await ctx.client
      .from('person_connections')
      .select(
        `
        id,
        notes,
        connection_types ( name ),
        related_person:people!person_connections_related_person_id_fkey (
          id,
          full_name,
          display_name
        )
      `,
      )
      .eq('person_id', id)
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: true });

  if (personConnectionsError) {
    throw new Error(personConnectionsError.message);
  }

  type ConnectionRowDb = {
    id: string;
    notes: string | null;
    connection_types: { name: string } | null;
    related_person: {
      id: string;
      full_name: string;
      display_name: string | null;
    } | null;
  };

  const connectionListItems = (personConnectionRows ?? []).map((raw) => {
    const row = raw as unknown as ConnectionRowDb;
    const rel = row.related_person;
    const label =
      rel?.display_name?.trim() || rel?.full_name || 'Unknown';
    return {
      id: row.id,
      typeName: row.connection_types?.name ?? '—',
      relatedId: rel?.id ?? '',
      relatedLabel: label,
      notes: row.notes,
    };
  });

  const { data: links } = await ctx.client
    .from('interaction_people')
    .select('interaction_id, role')
    .eq('person_id', id);

  const interactionIds = (links ?? []).map((row) => row.interaction_id);
  const roleByInteraction = new Map(
    (links ?? []).map((row) => [row.interaction_id, row.role]),
  );

  const participantsByInteraction = new Map<
    string,
    { primaryPersonId: string; attendeeIds: string[] }
  >();

  let timelineRows: Array<{
    interaction: InteractionWithType;
    role: string;
  }> = [];
  if (interactionIds.length > 0) {
    const { data: fullTimelineLinks, error: fullLinksError } = await ctx.client
      .from('interaction_people')
      .select('interaction_id, person_id, role')
      .in('interaction_id', interactionIds);

    if (fullLinksError) {
      throw new Error(fullLinksError.message);
    }

    const grouped = new Map<
      string,
      Array<{ person_id: string; role: string }>
    >();
    for (const row of fullTimelineLinks ?? []) {
      const list = grouped.get(row.interaction_id) ?? [];
      list.push({ person_id: row.person_id, role: row.role });
      grouped.set(row.interaction_id, list);
    }
    for (const [intId, plist] of grouped) {
      const primary = plist.find((p) => p.role === 'primary');
      const primaryPersonId = primary?.person_id ?? '';
      const attendeeIds = plist
        .filter((p) => p.role === 'attendee')
        .map((p) => p.person_id);
      participantsByInteraction.set(intId, {
        primaryPersonId,
        attendeeIds,
      });
    }

    const { data: interactions, error: timelineError } = await ctx.client
      .from('interactions')
      .select('*, interaction_types ( name )')
      .eq('user_id', ctx.userId)
      .in('id', interactionIds)
      .order('occurred_at', { ascending: false });

    if (timelineError) {
      throw new Error(timelineError.message);
    }

    const typed = (interactions ?? []) as InteractionWithType[];
    timelineRows = typed.map((interaction) => ({
      interaction,
      role: roleByInteraction.get(interaction.id) ?? 'attendee',
    }));
  }

  const { upcoming: upcomingTimelineRows, past: pastTimelineRows } =
    partitionPersonTimelineRows(timelineRows);

  const hasRecentNotes = timelineRows.some(
    (row) => (row.interaction.raw_note ?? '').trim().length > 0,
  );

  const defaultOccurredAt = toDatetimeLocalInputValue(
    new Date(person.created_at),
  );
  const otherPeople = (allPeople ?? []).filter((p) => p.id !== person.id);
  const otherPeopleOptions = otherPeople.map((p) => ({
    id: p.id,
    label: p.display_name?.trim() || p.full_name,
  }));
  const subjectName =
    person.display_name?.trim() || person.full_name;

  const aiEnabled = hasOpenAiApiKey();

  const { data: factRows, error: factsError } = await ctx.client
    .from('facts')
    .select('*')
    .eq('person_id', id)
    .eq('user_id', ctx.userId)
    .in('review_status', ['candidate', 'accepted'])
    .order('created_at', { ascending: false });

  if (factsError) {
    throw new Error(factsError.message);
  }

  const { data: summaryRows, error: summariesError } = await ctx.client
    .from('relationship_summaries')
    .select('*')
    .eq('person_id', id)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  if (summariesError) {
    throw new Error(summariesError.message);
  }

  const { data: taskRows, error: tasksError } = await ctx.client
    .from('tasks')
    .select('*')
    .eq('person_id', id)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const sourceInteractionIds = new Set<string>();
  for (const s of summaryRows ?? []) {
    for (const sid of s.source_interaction_ids ?? []) {
      sourceInteractionIds.add(sid);
    }
  }

  const interactionLabels = new Map<string, string>();
  if (sourceInteractionIds.size > 0) {
    const { data: intMeta, error: intMetaError } = await ctx.client
      .from('interactions')
      .select('id, occurred_at')
      .eq('user_id', ctx.userId)
      .in('id', [...sourceInteractionIds]);

    if (intMetaError) {
      throw new Error(intMetaError.message);
    }
    for (const row of intMeta ?? []) {
      interactionLabels.set(row.id, formatDateTime(row.occurred_at));
    }
  }

  const tabLinkBase =
    'inline-flex border-b-2 px-1 pb-3 text-sm font-semibold transition sm:text-base';
  const tabLinkActive = `${tabLinkBase} border-accent text-foreground`;
  const tabLinkInactive = `${tabLinkBase} border-transparent text-muted hover:text-foreground/80`;

  return (
    <main className="crm-page">
      <PersonDetailHeader
        afterTitle={
          <nav
            className="-mb-px flex w-full gap-8 border-b border-border-soft"
            aria-label="Profile sections"
          >
            <Link
              href={`/people/${person.id}`}
              className={tab === 'overview' ? tabLinkActive : tabLinkInactive}
            >
              Overview
            </Link>
            <Link
              href={`/people/${person.id}?tab=details`}
              className={tab === 'details' ? tabLinkActive : tabLinkInactive}
            >
              Details
            </Link>
          </nav>
        }
        editHref={`/people/${person.id}/edit`}
        personId={person.id}
        otherPeople={otherPeople}
        defaultOccurredAt={defaultOccurredAt}
        interactionTypes={interactionTypeOptions}
        defaultInteractionTypeId={defaultInteractionTypeId}
      >
        <div>
          <Link
            href="/people"
            className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
          >
            ← People
          </Link>
          <p className="crm-eyebrow mt-4">Profile</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl tracking-tight">
              {person.full_name}
            </h1>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {person.person_categories?.name ?? '—'}
            </span>
            <span className="rounded-full border border-border-soft px-3 py-1 text-xs font-semibold text-muted">
              {formatStatus(person.status)}
            </span>
            <RelationshipWarmthChip
              lastInteractionAt={person.last_interaction_at}
              metAt={person.met_at}
              createdAt={person.created_at}
            />
          </div>
          {person.preferred_name ? (
            <p className="mt-2 text-sm text-muted">
              Goes by {person.preferred_name}
            </p>
          ) : null}
        </div>
      </PersonDetailHeader>

      {tab === 'overview' ? (
        <>
        <div className="flex min-w-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <section
            className="card-surface min-w-0 rounded-[1.75rem] border border-border-soft p-6 sm:p-8 lg:sticky lg:top-6"
            aria-label="Relationship context"
          >
            <h2 className="font-display text-2xl">Context</h2>
            <div className="mt-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <DetailItem label="Pronouns" value={person.pronouns} />
                <DetailItem
                  label="Birthday"
                  value={
                    person.birthday ? formatDateOnly(person.birthday) : null
                  }
                />
                <DetailItem
                  label="Met"
                  value={
                    person.met_at ? formatMonthYear(person.met_at) : null
                  }
                />
                <DetailItem label="Location" value={person.location} />
                <DetailItem label="Occupation" value={person.occupation} />
                <DetailItem label="Company" value={person.company} />
                <DetailItem
                  label="Last interaction"
                  value={
                    person.last_interaction_at
                      ? formatDateTime(person.last_interaction_at)
                      : null
                  }
                />
                <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    How you met
                  </p>
                  <p className="mt-1 leading-7 text-foreground/90">
                    {person.how_you_met ?? '—'}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Relationship context
                  </p>
                  <p className="mt-1 leading-7 text-foreground/90">
                    {person.relationship_context ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            className="card-surface min-w-0 space-y-6 rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
            aria-labelledby="person-timeline-heading"
          >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="person-timeline-heading"
                  className="font-display text-2xl tracking-tight"
                >
                  Timeline
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
                  Plans you are looking forward to and moments you have already
                  shared.
                </p>
              </div>
              <Link
                href="/timeline"
                className="shrink-0 text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                View global timeline
              </Link>
            </header>

            {timelineRows.length === 0 ? (
              <p className="rounded-2xl border border-border-soft bg-white/50 px-6 py-8 text-sm text-muted">
                Nothing logged yet. Use{' '}
                <span className="font-semibold text-foreground">
                  Log interaction
                </span>{' '}
                at the top when you remember something, or{' '}
                <Link
                  href="/interactions/new"
                  className="font-semibold text-accent underline-offset-4 hover:underline"
                >
                  add a multi-person moment
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-10">
                {upcomingTimelineRows.length > 0 ? (
                  <div aria-labelledby="person-timeline-upcoming-heading">
                    <h3
                      id="person-timeline-upcoming-heading"
                      className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                    >
                      Upcoming
                    </h3>
                    <ol className="space-y-6">
                      {upcomingTimelineRows.map(({ interaction, role }) => (
                        <PersonTimelineRow
                          key={interaction.id}
                          interaction={interaction}
                          role={role}
                          isUpcoming
                          participants={
                            participantsByInteraction.get(interaction.id) ?? {
                              primaryPersonId: '',
                              attendeeIds: [] as string[],
                            }
                          }
                          allPeople={allPeople ?? []}
                          interactionTypeOptions={interactionTypeOptions}
                        />
                      ))}
                    </ol>
                  </div>
                ) : null}
                {pastTimelineRows.length > 0 ? (
                  <div aria-labelledby="person-timeline-past-heading">
                    {upcomingTimelineRows.length > 0 ? (
                      <h3
                        id="person-timeline-past-heading"
                        className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                      >
                        Past
                      </h3>
                    ) : null}
                    <ol className="space-y-6">
                      {pastTimelineRows.map(({ interaction, role }) => (
                        <PersonTimelineRow
                          key={interaction.id}
                          interaction={interaction}
                          role={role}
                          isUpcoming={false}
                          participants={
                            participantsByInteraction.get(interaction.id) ?? {
                              primaryPersonId: '',
                              attendeeIds: [] as string[],
                            }
                          }
                          allPeople={allPeople ?? []}
                          interactionTypeOptions={interactionTypeOptions}
                        />
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
        <PersonMemorySection
          personId={person.id}
          aiEnabled={aiEnabled}
          hasRecentNotes={hasRecentNotes}
          facts={factRows ?? []}
          summaries={summaryRows ?? []}
          tasks={taskRows ?? []}
          interactionLabels={interactionLabels}
        />
        </>
      ) : (
        <section
          className="flex flex-col gap-8 lg:grid lg:min-h-[28rem] lg:grid-cols-2 lg:items-stretch"
          aria-label="Contact methods and connections"
        >
          <div className="card-surface flex min-h-0 h-full flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
            <h2 className="shrink-0 font-display text-2xl">Stay in touch</h2>
            <ul className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto">
              {(contactMethods ?? []).length === 0 ? (
                <li className="text-sm text-muted">No contact methods yet.</li>
              ) : (
                (contactMethods ?? []).map((method) => (
                  <ContactMethodRow
                    key={`${method.id}-${method.updated_at}`}
                    personId={person.id}
                    method={method}
                  />
                ))
              )}
            </ul>
            <div className="mt-6 shrink-0">
              <ContactMethodAddDisclosure personId={person.id} />
            </div>
          </div>

          <PersonConnectionsPanel
            className="min-h-0 h-full"
            personId={person.id}
            subjectName={subjectName}
            connections={connectionListItems}
            otherPeople={otherPeopleOptions}
            connectionTypes={connectionTypeOptions}
            defaultConnectionTypeId={defaultConnectionTypeId}
          />
        </section>
      )}
    </main>
  );
}

function PersonTimelineRow({
  interaction,
  role,
  isUpcoming,
  participants,
  allPeople,
  interactionTypeOptions,
}: {
  interaction: InteractionWithType;
  role: string;
  isUpcoming: boolean;
  participants: { primaryPersonId: string; attendeeIds: string[] };
  allPeople: Array<{
    id: string;
    full_name: string;
    display_name: string | null;
  }>;
  interactionTypeOptions: InteractionTypeOption[];
}) {
  const cardClass = isUpcoming
    ? 'card-surface rounded-[1.75rem] border-2 border-dashed border-accent/40 bg-accent-soft/20 p-6 sm:p-8'
    : 'card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8';

  return (
    <li className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {formatDateTime(interaction.occurred_at)}
            </span>
            <InteractionMetaChips
              typeName={interaction.interaction_types?.name}
              direction={interaction.direction}
              showUpcoming={isUpcoming}
            />
            {role === 'primary' ? (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] text-accent">
                Primary in this memory
              </span>
            ) : null}
          </div>
          {interaction.title ? (
            <p className="font-display text-2xl">{interaction.title}</p>
          ) : null}
          {interaction.raw_note ? (
            <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-foreground/90">
              {interaction.raw_note}
            </p>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:max-w-md sm:items-end">
          {allPeople.length > 0 ? (
            <InteractionEditDisclosure
              interactionId={interaction.id}
              defaultOccurredAt={toDatetimeLocalInputValue(
                new Date(interaction.occurred_at),
              )}
              defaultInteractionTypeId={interaction.interaction_type_id}
              defaultDirection={interaction.direction ?? ''}
              defaultTitle={interaction.title ?? ''}
              defaultRawNote={interaction.raw_note ?? ''}
              primaryPersonId={participants.primaryPersonId}
              attendeeIds={participants.attendeeIds}
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

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 font-medium">
        {value && value.length > 0 ? value : '—'}
      </p>
    </div>
  );
}

function formatDateOnly(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
