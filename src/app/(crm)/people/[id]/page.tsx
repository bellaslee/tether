import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactMethodAddDisclosure } from '@/components/people/contact-method-add-disclosure';
import { ContactMethodRow } from '@/components/people/contact-method-row';
import { LogMomentDisclosure } from '@/components/people/log-moment-disclosure';
import { InteractionDeleteButton } from '@/components/interactions/interaction-delete-button';
import { getCrmSupabaseContext } from '@/lib/crm/context';
import { requireCrmAccess } from '@/lib/crm/guard';
import { formatInteractionType, formatStatus } from '@/lib/domain/labels';
import { toDatetimeLocalInputValue } from '@/lib/datetime';
import type { Tables } from '@/lib/db/database.types';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
};

type PersonWithCategory = Tables<'people'> & {
  person_categories: { name: string } | null;
};

function first(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

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
  const tab = first(searchParams.tab) === 'timeline' ? 'timeline' : 'context';

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

  const { data: links } = await ctx.client
    .from('interaction_people')
    .select('interaction_id, role')
    .eq('person_id', id);

  const interactionIds = (links ?? []).map((row) => row.interaction_id);
  const roleByInteraction = new Map(
    (links ?? []).map((row) => [row.interaction_id, row.role]),
  );

  let timelineRows: Array<{
    interaction: Tables<'interactions'>;
    role: string;
  }> = [];
  if (interactionIds.length > 0) {
    const { data: interactions, error: timelineError } = await ctx.client
      .from('interactions')
      .select('*')
      .eq('user_id', ctx.userId)
      .in('id', interactionIds)
      .order('occurred_at', { ascending: false });

    if (timelineError) {
      throw new Error(timelineError.message);
    }

    timelineRows =
      interactions?.map((interaction) => ({
        interaction,
        role: roleByInteraction.get(interaction.id) ?? 'attendee',
      })) ?? [];
  }

  const defaultOccurredAt = toDatetimeLocalInputValue();
  const otherPeople = (allPeople ?? []).filter((p) => p.id !== person.id);

  const tabLinkBase =
    'inline-flex border-b-2 px-1 pb-3 text-sm font-semibold transition sm:text-base';
  const tabLinkActive = `${tabLinkBase} border-accent text-foreground`;
  const tabLinkInactive = `${tabLinkBase} border-transparent text-muted hover:text-foreground/80`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/people"
            className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
          >
            ← People
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl tracking-tight">
              {person.full_name}
            </h1>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {person.person_categories?.name ?? '—'}
            </span>
            <span className="rounded-full border border-border-soft px-3 py-1 text-xs font-semibold text-muted">
              {formatStatus(person.status)}
            </span>
          </div>
          {person.preferred_name ? (
            <p className="mt-2 text-sm text-muted">
              Goes by {person.preferred_name}
            </p>
          ) : null}
        </div>
        <Link
          href={`/people/${person.id}/edit`}
          className="inline-flex items-center justify-center rounded-full border border-border-soft bg-white/80 px-5 py-3 text-sm font-semibold transition hover:bg-white"
        >
          Edit profile
        </Link>
      </div>

      <nav
        className="-mb-px flex w-full gap-8 border-b border-border-soft"
        aria-label="Profile sections"
      >
        <Link
          href={`/people/${person.id}`}
          className={tab === 'context' ? tabLinkActive : tabLinkInactive}
        >
          Context
        </Link>
        <Link
          href={`/people/${person.id}?tab=timeline`}
          className={tab === 'timeline' ? tabLinkActive : tabLinkInactive}
        >
          Timeline
        </Link>
      </nav>

      {tab === 'context' ? (
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface space-y-6 rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
            <h2 className="font-display text-2xl">Context</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <DetailItem label="Pronouns" value={person.pronouns} />
              <DetailItem
                label="Birthday"
                value={person.birthday ? formatDateOnly(person.birthday) : null}
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
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  How you met
                </p>
                <p className="mt-1 leading-7 text-foreground/90">
                  {person.how_you_met ?? '—'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Relationship context
                </p>
                <p className="mt-1 leading-7 text-foreground/90">
                  {person.relationship_context ?? '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
              <h2 className="font-display text-2xl">Stay in touch</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                One primary keeps things simple. Marking a new primary quietly
                moves the others aside.
              </p>
              <ul className="mt-6 space-y-4">
                {(contactMethods ?? []).length === 0 ? (
                  <li className="text-sm text-muted">
                    No contact methods yet.
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
              <div className="mt-6">
                <ContactMethodAddDisclosure personId={person.id} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
            <h2 className="font-display text-2xl">Log a moment</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
              Quick memory-keeping: one entry can include other people without
              duplicating the story.
            </p>
            <div className="mt-6">
              <LogMomentDisclosure
                personId={person.id}
                otherPeople={otherPeople}
                defaultOccurredAt={defaultOccurredAt}
              />
            </div>
          </section>

          <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Timeline</h2>
                <p className="mt-2 text-sm text-muted">
                  Newest first — shared entries appear once, linked to everyone
                  involved.
                </p>
              </div>
              <Link
                href="/timeline"
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                View global timeline
              </Link>
            </div>
            <ol className="mt-8 space-y-6">
              {timelineRows.length === 0 ? (
                <li className="text-sm text-muted">
                  No interactions yet. Log a moment when you are ready.
                </li>
              ) : (
                timelineRows.map(({ interaction, role }) => (
                  <li
                    key={interaction.id}
                    className="rounded-[1.5rem] border border-border-soft bg-white/60 px-5 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {formatDateTime(interaction.occurred_at)} ·{' '}
                          {formatInteractionType(interaction.type)}
                          {interaction.direction
                            ? ` · ${interaction.direction}`
                            : ''}
                          {role === 'primary' ? (
                            <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] text-accent">
                              Primary in this memory
                            </span>
                          ) : null}
                        </p>
                        {interaction.title ? (
                          <p className="mt-2 font-display text-xl">
                            {interaction.title}
                          </p>
                        ) : null}
                        {interaction.raw_note ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                            {interaction.raw_note}
                          </p>
                        ) : null}
                      </div>
                      <InteractionDeleteButton interactionId={interaction.id} />
                    </div>
                  </li>
                ))
              )}
            </ol>
          </section>
        </>
      )}
    </main>
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
