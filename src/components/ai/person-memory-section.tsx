import { generateRelationshipSummary } from '@/lib/actions/ai-memory/summaries';
import type { Tables } from '@/lib/db/database.types';
import {
  PersonFactsMemorySection,
  PersonRemindersMemorySection,
} from '@/components/ai/person-memory-card-panels';
import { RelationshipBriefCard } from '@/components/ai/relationship-brief-card';
import { SummaryRefreshForm } from '@/components/ai/summary-refresh-forms';
import { panelTopAccentAt } from '@/lib/ui/panel-top-accent';

type SummaryRow = Tables<'relationship_summaries'>;

const memoryCardClass =
  'card-surface flex min-h-0 h-full min-w-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8';

type BriefsProps = {
  personId: string;
  aiEnabled: boolean;
  summaries: SummaryRow[];
  interactionLabels: Map<string, string>;
  /** Index into rotating sun / sky / coral top border (optional). */
  topAccentIndex?: number;
};

export function PersonBriefsSection({
  personId,
  aiEnabled,
  summaries,
  interactionLabels,
  topAccentIndex,
}: BriefsProps) {
  const profileBrief = summaries.find((s) => s.kind === 'profile_brief');
  const nextMeeting = summaries.find((s) => s.kind === 'next_meeting');
  const interactionLabelRecord = Object.fromEntries(interactionLabels);
  const accent =
    topAccentIndex !== undefined ? ` ${panelTopAccentAt(topAccentIndex)}` : '';

  return (
    <section
      className={`${memoryCardClass}${accent}`}
      aria-labelledby="person-memory-briefs-heading"
    >
      <h2
        id="person-memory-briefs-heading"
        className="shrink-0 font-display text-xl tracking-tight text-foreground sm:text-2xl"
      >
        Briefs
      </h2>
      <p className="mt-1 shrink-0 text-sm text-muted">
        Relationship summaries you can refresh from recent notes.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          {profileBrief ? (
            <RelationshipBriefCard
              key={`${profileBrief.id}-${profileBrief.updated_at}`}
              kindLabel="Profile brief"
              summary={profileBrief}
              interactionLabels={interactionLabelRecord}
            />
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Profile brief
              </p>
              <p className="rounded-2xl border border-border-soft bg-surface/70 px-4 py-6 text-sm text-muted">
                No profile brief yet.
              </p>
            </>
          )}
          <SummaryRefreshForm
            personId={personId}
            aiEnabled={aiEnabled}
            action={generateRelationshipSummary}
            kind="profile_brief"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {nextMeeting ? (
            <RelationshipBriefCard
              key={`${nextMeeting.id}-${nextMeeting.updated_at}`}
              kindLabel="Before you meet"
              summary={nextMeeting}
              interactionLabels={interactionLabelRecord}
            />
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Before you meet
              </p>
              <p className="rounded-2xl border border-border-soft bg-surface/70 px-4 py-6 text-sm text-muted">
                No next-meeting brief yet.
              </p>
            </>
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
