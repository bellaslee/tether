import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactMethodAddDisclosure } from '@/components/people/contact-method-add-disclosure';
import { ContactMethodRow } from '@/components/people/contact-method-row';
import type { PersonOption } from '@/components/people/attendee-picker';
import { RelationshipWarmthChip } from '@/components/people/relationship-warmth-chip';
import { PersonDetailHeader } from '@/components/people/person-detail-header';
import {
  PersonLogInteractionProvider,
  TimelineLogInteractionTrigger,
} from '@/components/people/person-log-interaction-context';
import { InteractionEditDisclosure } from '@/components/interactions/interaction-edit-disclosure';
import { InteractionNotePreview } from '@/components/interactions/interaction-note-preview';
import { InteractionMemorySuggestButton } from '@/components/interactions/interaction-memory-suggest-button';
import { InteractionDeleteButton } from '@/components/interactions/interaction-delete-button';
import { getPrmSupabaseContext } from '@/lib/prm/context';
import { requirePrmAccess } from '@/lib/prm/guard';
import { InteractionMetaChips } from '@/components/interactions/interaction-meta-chips';
import { formatStatus } from '@/lib/domain/labels';
import {
  formatCalendarDateOnly,
  formatDateTimeInTimeZone,
  formatMonthYear,
  toNewInteractionDatetimeLocalInputValueInZone,
} from '@/lib/datetime';
import type { Tables } from '@/lib/db/database.types';
import {
  defaultInteractionTypeId as pickDefaultInteractionTypeId,
  type InteractionTypeOption,
} from '@/lib/interactions/type-options';
import {
  interactionHasMemorySuggestNote,
  interactionMemorySuggestionsAlreadyApplied,
} from '@/lib/interactions/memory-suggest-visibility';
import { partitionPersonTimelineRows } from '@/lib/interactions/timeline-partition';
import {
  defaultConnectionTypeId as pickDefaultConnectionTypeId,
  type ConnectionTypeOption,
} from '@/lib/people/connection-type-options';
import { PersonConnectionsPanel } from '@/components/people/person-connections-panel';
import {
  PersonBriefsSection,
  PersonFactsSection,
  PersonRemindersSection,
} from '@/components/ai/person-memory-section';
import { hasOpenAiApiKey } from '@/lib/env';
import {
  fetchInteractionPeopleLinksForUserInteractions,
  fetchInteractionRolesForUserPerson,
} from '@/lib/interactions/interaction-people-queries';

const PAGE_COPY = {
  meta: {
    titleUnauthed: 'Person · Tether',
    titlePersonOnly: 'Person',
    titleSuffix: ' · Tether',
  },
  nav: {
    profileSectionsAria: 'Profile sections',
    tabOverview: 'Overview',
    tabDetails: 'Contact and Connections',
  },
  header: {
    backToPeople: '← People',
    eyebrow: 'Profile',
    categoryPlaceholder: '—',
  },
  overview: {
    context: {
      ariaLabel: 'Relationship context',
      title: 'Context',
      labels: {
        pronouns: 'Pronouns',
        birthday: 'Birthday',
        met: 'Met',
        location: 'Location',
        occupation: 'Occupation',
        company: 'Company',
        lastInteraction: 'Last interaction',
      },
      howYouMet: 'How you met',
      relationshipContext: 'Relationship context',
    },
    timeline: {
      headingId: 'person-timeline-heading',
      title: 'Timeline',
      description:
        'Plans you are looking forward to and moments you have already shared.',
      empty: {
        lead: 'Nothing logged yet. Use',
        logInteractionEmphasis: 'Log interaction',
        mid: 'in the header or beside this section when you remember something, or',
        addMomentLink: 'add a multi-person moment',
        trailing: '.',
      },
      upcoming: {
        headingId: 'person-timeline-upcoming-heading',
        title: 'Upcoming',
      },
      past: {
        headingId: 'person-timeline-past-heading',
        title: 'Past',
      },
    },
  },
  details: {
    sectionAria: 'Contact and Connections',
    stayInTouch: 'Stay in touch',
    noContactMethods: 'No contact methods yet.',
  },
  timelineRow: {
    primaryInMemory: 'Primary in this memory',
  },
  connections: {
    unknownRelated: 'Unknown',
    typeFallback: '—',
  },
  placeholders: {
    emptyField: '—',
  },
} as const;

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
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { title: PAGE_COPY.meta.titleUnauthed };
  }
  const { data } = await ctx.client
    .from('people')
    .select('full_name')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (!data) {
    return { title: PAGE_COPY.meta.titlePersonOnly };
  }
  return { title: `${data.full_name}${PAGE_COPY.meta.titleSuffix}` };
}

export default async function PersonDetailPage(props: PageProps) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const tabParam = first(searchParams.tab);
  const tab = tabParam === 'details' ? 'details' : 'overview';

  const ctx = await requirePrmAccess();
  const displayTimeZone = ctx.accountTimeZone ?? 'UTC';

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
    .select('id, full_name, display_name, last_interaction_at, met_at, created_at')
    .eq('user_id', ctx.userId);

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
      rel?.display_name?.trim() || rel?.full_name || PAGE_COPY.connections.unknownRelated;
    return {
      id: row.id,
      typeName: row.connection_types?.name ?? PAGE_COPY.connections.typeFallback,
      relatedId: rel?.id ?? '',
      relatedLabel: label,
      notes: row.notes,
    };
  });

  const linksRes = await fetchInteractionRolesForUserPerson(
    ctx.client,
    ctx.userId,
    id,
  );
  if ('error' in linksRes) {
    throw new Error(linksRes.error);
  }

  const links = linksRes.ok;
  const interactionIds = links.map((row) => row.interaction_id);
  const roleByInteraction = new Map(
    links.map((row) => [row.interaction_id, row.role]),
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
    const fullLinksRes = await fetchInteractionPeopleLinksForUserInteractions(
      ctx.client,
      ctx.userId,
      interactionIds,
    );
    if ('error' in fullLinksRes) {
      throw new Error(fullLinksRes.error);
    }

    const fullTimelineLinks = fullLinksRes.ok;
    const grouped = new Map<
      string,
      Array<{ person_id: string; role: string }>
    >();
    for (const row of fullTimelineLinks) {
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

  const defaultOccurredAt = ctx.accountTimeZone
    ? toNewInteractionDatetimeLocalInputValueInZone(
        ctx.accountTimeZone,
        new Date(person.created_at),
      )
    : '';
  const otherPeople = (allPeople ?? []).filter((p) => p.id !== person.id);
  const otherPeopleOptions = otherPeople.map((p) => ({
    id: p.id,
    label: p.display_name?.trim() || p.full_name,
  }));
  const subjectName =
    person.display_name?.trim() || person.full_name;

  const aiEnabled = hasOpenAiApiKey();

  let factRows: Tables<'facts'>[] = [];
  let summaryRows: Tables<'relationship_summaries'>[] = [];
  let taskRows: Tables<'tasks'>[] = [];
  const interactionLabels = new Map<string, string>();

  if (tab === 'overview') {
    const { data: factsData, error: factsError } = await ctx.client
      .from('facts')
      .select('*')
      .eq('person_id', id)
      .eq('user_id', ctx.userId)
      .in('review_status', ['candidate', 'accepted'])
      .order('created_at', { ascending: false });

    if (factsError) {
      throw new Error(factsError.message);
    }
    factRows = factsData ?? [];

    const { data: summariesData, error: summariesError } = await ctx.client
      .from('relationship_summaries')
      .select('*')
      .eq('person_id', id)
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false });

    if (summariesError) {
      throw new Error(summariesError.message);
    }
    summaryRows = summariesData ?? [];

    const { data: tasksData, error: tasksError } = await ctx.client
      .from('tasks')
      .select('*')
      .eq('person_id', id)
      .eq('user_id', ctx.userId)
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false });

    if (tasksError) {
      throw new Error(tasksError.message);
    }
    taskRows = tasksData ?? [];

    const sourceInteractionIds = new Set<string>();
    for (const s of summaryRows) {
      for (const sid of s.source_interaction_ids ?? []) {
        sourceInteractionIds.add(sid);
      }
    }

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
        interactionLabels.set(
          row.id,
          formatDateTimeInTimeZone(row.occurred_at, displayTimeZone),
        );
      }
    }
  }

  const tabLinkBase =
    'inline-flex border-b-2 px-1 pb-3 text-sm font-semibold transition sm:text-base';
  const tabLinkActive = `${tabLinkBase} border-accent text-foreground`;
  const tabLinkInactive = `${tabLinkBase} border-transparent text-muted hover:text-foreground/80`;

  return (
    <main className="prm-page">
      <PersonLogInteractionProvider>
      <PersonDetailHeader
        afterTitle={
          <nav
            className="flex w-full flex-wrap gap-x-8 gap-y-3"
            aria-label={PAGE_COPY.nav.profileSectionsAria}
          >
            <Link
              href={`/people/${person.id}`}
              className={tab === 'overview' ? tabLinkActive : tabLinkInactive}
            >
              {PAGE_COPY.nav.tabOverview}
            </Link>
            <Link
              href={`/people/${person.id}?tab=details`}
              className={tab === 'details' ? tabLinkActive : tabLinkInactive}
            >
              {PAGE_COPY.nav.tabDetails}
            </Link>
          </nav>
        }
        editHref={`/people/${person.id}/edit`}
        personId={person.id}
        allPeople={allPeople ?? []}
        defaultOccurredAt={defaultOccurredAt}
        sessionTimeZone={ctx.accountTimeZone}
        interactionTypes={interactionTypeOptions}
        defaultInteractionTypeId={defaultInteractionTypeId}
      >
        <div>
          <Link
            href="/people"
            className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
          >
            {PAGE_COPY.header.backToPeople}
          </Link>
          <p className="prm-eyebrow mt-4">{PAGE_COPY.header.eyebrow}</p>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="max-w-full font-display text-4xl tracking-tight text-balance [overflow-wrap:anywhere]">
              {person.full_name}
            </h1>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {person.person_categories?.name ?? PAGE_COPY.header.categoryPlaceholder}
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
        </div>
      </PersonDetailHeader>

      {tab === 'overview' ? (
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex min-w-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-stretch lg:gap-8">
            <section
              className="card-surface flex min-h-0 h-full min-w-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
              aria-label={PAGE_COPY.overview.context.ariaLabel}
            >
              <h2 className="shrink-0 font-display text-2xl">
                {PAGE_COPY.overview.context.title}
              </h2>
              <div className="mt-6 min-h-0 flex-1">
                <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <DetailItem
                    label={PAGE_COPY.overview.context.labels.pronouns}
                    value={person.pronouns}
                  />
                  <DetailItem
                    label={PAGE_COPY.overview.context.labels.birthday}
                    value={
                      person.birthday
                        ? formatCalendarDateOnly(person.birthday)
                        : null
                    }
                  />
                  <DetailItem
                    label={PAGE_COPY.overview.context.labels.met}
                    value={
                      person.met_at ? formatMonthYear(person.met_at) : null
                    }
                  />
                  <DetailItem
                    label={PAGE_COPY.overview.context.labels.location}
                    value={person.location}
                  />
                  <DetailItem
                    label={PAGE_COPY.overview.context.labels.occupation}
                    value={person.occupation}
                  />
                  <DetailItem
                    label={PAGE_COPY.overview.context.labels.company}
                    value={person.company}
                  />
                  <DetailItem
                    label={PAGE_COPY.overview.context.labels.lastInteraction}
                    value={
                      person.last_interaction_at
                        ? formatDateTimeInTimeZone(
                            person.last_interaction_at,
                            displayTimeZone,
                          )
                        : null
                    }
                  />
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {PAGE_COPY.overview.context.howYouMet}
                    </p>
                    <p className="mt-1 leading-7 text-foreground/90 max-sm:leading-8 [overflow-wrap:anywhere]">
                      {person.how_you_met ?? PAGE_COPY.placeholders.emptyField}
                    </p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {PAGE_COPY.overview.context.relationshipContext}
                    </p>
                    <p className="mt-1 leading-7 text-foreground/90 max-sm:leading-8 [overflow-wrap:anywhere]">
                      {person.relationship_context ??
                        PAGE_COPY.placeholders.emptyField}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <PersonBriefsSection
              personId={person.id}
              aiEnabled={aiEnabled}
              summaries={summaryRows}
              interactionLabels={interactionLabels}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <PersonFactsSection personId={person.id} facts={factRows} />
            <PersonRemindersSection personId={person.id} tasks={taskRows} />
          </div>

          <section
            className="card-surface min-w-0 space-y-6 rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
            aria-labelledby={PAGE_COPY.overview.timeline.headingId}
          >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <h2
                  id={PAGE_COPY.overview.timeline.headingId}
                  className="font-display text-2xl tracking-tight"
                >
                  {PAGE_COPY.overview.timeline.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
                  {PAGE_COPY.overview.timeline.description}
                </p>
              </div>
              <div className="flex shrink-0 justify-end sm:pt-1">
                <TimelineLogInteractionTrigger />
              </div>
            </header>

            {timelineRows.length === 0 ? (
              <p className="rounded-2xl border border-border-soft bg-white/50 px-6 py-8 text-sm text-muted">
                {PAGE_COPY.overview.timeline.empty.lead}{' '}
                <span className="font-semibold text-foreground">
                  {PAGE_COPY.overview.timeline.empty.logInteractionEmphasis}
                </span>{' '}
                {PAGE_COPY.overview.timeline.empty.mid}{' '}
                <Link
                  href="/interactions/new"
                  className="font-semibold text-accent underline-offset-4 hover:underline"
                >
                  {PAGE_COPY.overview.timeline.empty.addMomentLink}
                </Link>
                {PAGE_COPY.overview.timeline.empty.trailing}
              </p>
            ) : (
              <div className="space-y-10">
                {upcomingTimelineRows.length > 0 ? (
                  <div
                    aria-labelledby={PAGE_COPY.overview.timeline.upcoming.headingId}
                  >
                    <h3
                      id={PAGE_COPY.overview.timeline.upcoming.headingId}
                      className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                    >
                      {PAGE_COPY.overview.timeline.upcoming.title}
                    </h3>
                    <ol className="space-y-6">
                      {upcomingTimelineRows.map(({ interaction, role }) => (
                        <PersonTimelineRow
                          key={interaction.id}
                          interaction={interaction}
                          role={role}
                          isUpcoming
                          displayTimeZone={displayTimeZone}
                          sessionTimeZone={ctx.accountTimeZone}
                          participants={
                            participantsByInteraction.get(interaction.id) ?? {
                              primaryPersonId: '',
                              attendeeIds: [] as string[],
                            }
                          }
                          allPeople={allPeople ?? []}
                          interactionTypeOptions={interactionTypeOptions}
                          memorySuggestAvailable={aiEnabled}
                        />
                      ))}
                    </ol>
                  </div>
                ) : null}
                {pastTimelineRows.length > 0 ? (
                  <div
                    aria-labelledby={PAGE_COPY.overview.timeline.past.headingId}
                  >
                    {upcomingTimelineRows.length > 0 ? (
                      <h3
                        id={PAGE_COPY.overview.timeline.past.headingId}
                        className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                      >
                        {PAGE_COPY.overview.timeline.past.title}
                      </h3>
                    ) : null}
                    <ol className="space-y-6">
                      {pastTimelineRows.map(({ interaction, role }) => (
                        <PersonTimelineRow
                          key={interaction.id}
                          interaction={interaction}
                          role={role}
                          isUpcoming={false}
                          displayTimeZone={displayTimeZone}
                          sessionTimeZone={ctx.accountTimeZone}
                          participants={
                            participantsByInteraction.get(interaction.id) ?? {
                              primaryPersonId: '',
                              attendeeIds: [] as string[],
                            }
                          }
                          allPeople={allPeople ?? []}
                          interactionTypeOptions={interactionTypeOptions}
                          memorySuggestAvailable={aiEnabled}
                        />
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section
          className="flex flex-col gap-8 lg:grid lg:min-h-[28rem] lg:grid-cols-2 lg:items-stretch"
          aria-label={PAGE_COPY.details.sectionAria}
        >
          <div className="card-surface flex min-h-0 h-full flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
            <h2 className="shrink-0 font-display text-2xl">
              {PAGE_COPY.details.stayInTouch}
            </h2>
            <ul className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto">
              {(contactMethods ?? []).length === 0 ? (
                <li className="text-sm text-muted">
                  {PAGE_COPY.details.noContactMethods}
                </li>
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
      </PersonLogInteractionProvider>
    </main>
  );
}

function PersonTimelineRow({
  interaction,
  role,
  isUpcoming,
  displayTimeZone,
  sessionTimeZone,
  participants,
  allPeople,
  interactionTypeOptions,
  memorySuggestAvailable,
}: {
  interaction: InteractionWithType;
  role: string;
  isUpcoming: boolean;
  displayTimeZone: string;
  sessionTimeZone: string | null;
  participants: { primaryPersonId: string; attendeeIds: string[] };
  allPeople: PersonOption[];
  interactionTypeOptions: InteractionTypeOption[];
  memorySuggestAvailable: boolean;
}) {
  const hasLinkedPeople =
    Boolean(participants.primaryPersonId) ||
    participants.attendeeIds.length > 0;
  const showMemorySuggestSlot =
    memorySuggestAvailable &&
    hasLinkedPeople &&
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
              direction={interaction.direction}
              showUpcoming={isUpcoming}
            />
            {role === 'primary' ? (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] text-accent">
                {PAGE_COPY.timelineRow.primaryInMemory}
              </span>
            ) : null}
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
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 font-medium [overflow-wrap:anywhere]">
        {value && value.length > 0 ? value : PAGE_COPY.placeholders.emptyField}
      </p>
    </div>
  );
}

