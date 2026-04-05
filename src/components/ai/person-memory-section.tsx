import Link from 'next/link';
import { generateRelationshipSummary } from '@/lib/actions/ai-memory/summaries';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import type { Tables } from '@/lib/db/database.types';
import {
  PersonFactsMemorySection,
  PersonRemindersMemorySection,
} from '@/components/ai/person-memory-card-panels';
import { SummaryRefreshForm } from '@/components/ai/summary-refresh-forms';

type SummaryRow = Tables<'relationship_summaries'>;

const memoryCardClass =
  'card-surface flex min-h-0 h-full min-w-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8';

type BriefsProps = {
  personId: string;
  aiEnabled: boolean;
  summaries: SummaryRow[];
  interactionLabels: Map<string, string>;
};

export function PersonBriefsSection({
  personId,
  aiEnabled,
  summaries,
  interactionLabels,
}: BriefsProps) {
  const profileBrief = summaries.find((s) => s.kind === 'profile_brief');
  const nextMeeting = summaries.find((s) => s.kind === 'next_meeting');

  return (
    <section
      className={memoryCardClass}
      aria-labelledby="person-memory-briefs-heading"
    >
      <h2
        id="person-memory-briefs-heading"
        className="shrink-0 font-display text-2xl tracking-tight text-foreground"
      >
        Briefs
      </h2>
      <p className="mt-1 shrink-0 text-sm text-muted">
        Relationship summaries you can refresh from recent notes.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Profile brief
          </p>
          {profileBrief ? (
            <article className={listRowCardClassName('space-y-2')}>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                {profileBrief.content}
              </p>
              <SourceFootnote
                summary={profileBrief}
                interactionLabels={interactionLabels}
              />
            </article>
          ) : (
            <p className="rounded-2xl border border-border-soft bg-white/50 px-4 py-6 text-sm text-muted">
              No profile brief yet.
            </p>
          )}
          <SummaryRefreshForm
            personId={personId}
            aiEnabled={aiEnabled}
            action={generateRelationshipSummary}
            kind="profile_brief"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Before you meet
          </p>
          {nextMeeting ? (
            <article className={listRowCardClassName('space-y-2')}>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                {nextMeeting.content}
              </p>
              <SourceFootnote
                summary={nextMeeting}
                interactionLabels={interactionLabels}
              />
            </article>
          ) : (
            <p className="rounded-2xl border border-border-soft bg-white/50 px-4 py-6 text-sm text-muted">
              No next-meeting brief yet.
            </p>
          )}
          <SummaryRefreshForm
            personId={personId}
            aiEnabled={aiEnabled}
            action={generateRelationshipSummary}
            kind="next_meeting"
          />
        </div>
      </div>
    </section>
  );
}

export const PersonFactsSection = PersonFactsMemorySection;
export const PersonRemindersSection = PersonRemindersMemorySection;

function SourceFootnote({
  summary,
  interactionLabels,
}: {
  summary: SummaryRow;
  interactionLabels: Map<string, string>;
}) {
  const intIds = summary.source_interaction_ids ?? [];
  const factCount = (summary.source_fact_ids ?? []).length;

  if (intIds.length === 0 && factCount === 0) {
    return null;
  }

  return (
    <p className="text-xs leading-relaxed text-muted">
      Grounded in{' '}
      {factCount > 0 ? (
        <>
          {factCount} accepted fact{factCount === 1 ? '' : 's'}
          {intIds.length > 0 ? ' and ' : ''}
        </>
      ) : null}
      {intIds.length > 0 ? (
        <>
          notes from{' '}
          {intIds.map((id, i) => (
            <span key={id}>
              {i > 0 ? ', ' : null}
              <Link
                href={`/people/${summary.person_id}`}
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                {interactionLabels.get(id) ?? 'a past note'}
              </Link>
            </span>
          ))}
        </>
      ) : null}
      .
    </p>
  );
}
