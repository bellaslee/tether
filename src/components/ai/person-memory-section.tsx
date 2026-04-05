import Link from 'next/link';
import { generateRelationshipSummary, updateCrmTask, updateFactReview } from '@/lib/actions/ai-memory';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import type { Tables } from '@/lib/db/database.types';
import {
  SuggestFactsControl,
  SuggestFollowUpsControl,
} from '@/components/ai/person-memory-ai-toolbar';
import { SummaryRefreshForm } from '@/components/ai/summary-refresh-forms';
import { FactReviewForms } from '@/components/ai/fact-review-forms';
import { TaskReviewForms } from '@/components/ai/task-review-forms';

type FactRow = Tables<'facts'>;
type SummaryRow = Tables<'relationship_summaries'>;
type TaskRow = Tables<'tasks'>;

function taskVisible(row: TaskRow) {
  if (row.status !== 'snoozed') return true;
  if (!row.snoozed_until) return true;
  return new Date(row.snoozed_until) <= new Date();
}

const memoryCardClass =
  'card-surface min-w-0 rounded-[1.75rem] border border-border-soft p-6 sm:p-8';

type Props = {
  personId: string;
  aiEnabled: boolean;
  hasRecentNotes: boolean;
  facts: FactRow[];
  summaries: SummaryRow[];
  tasks: TaskRow[];
  interactionLabels: Map<string, string>;
};

export function PersonMemorySection({
  personId,
  aiEnabled,
  hasRecentNotes,
  facts,
  summaries,
  tasks,
  interactionLabels,
}: Props) {
  const profileBrief = summaries.find((s) => s.kind === 'profile_brief');
  const nextMeeting = summaries.find((s) => s.kind === 'next_meeting');
  const visibleTasks = tasks.filter(taskVisible);

  return (
    <div className="flex flex-col gap-8">
      <section
        className={memoryCardClass}
        aria-labelledby="person-memory-briefs-heading"
      >
        <h2
          id="person-memory-briefs-heading"
          className="font-display text-2xl tracking-tight text-foreground"
        >
          Briefs
        </h2>
        <p className="mt-1 text-sm text-muted">
          Relationship summaries you can refresh from recent notes.
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
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

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section
          className={memoryCardClass}
          aria-labelledby="person-memory-facts-heading"
        >
          <header className="flex flex-row items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3
                id="person-memory-facts-heading"
                className="font-display text-xl tracking-tight text-foreground"
              >
                Facts
              </h3>
              <p className="mt-1 text-sm text-muted">
                Review and accept what you want to keep on this profile.
              </p>
            </div>
            <div className="shrink-0">
              <SuggestFactsControl
                personId={personId}
                aiEnabled={aiEnabled}
                hasRecentNotes={hasRecentNotes}
              />
            </div>
          </header>
          <div className="mt-6">
            {facts.length === 0 ? (
              <p className="text-sm text-muted">
                Use{' '}
                <span className="font-medium text-foreground/80">
                  Suggest facts
                </span>{' '}
                when you have timeline notes—candidates show up here for
                review.
              </p>
            ) : (
              <ul className="space-y-4">
                {facts.map((fact) => (
                  <li key={fact.id}>
                    <FactReviewForms
                      key={`${fact.id}-${fact.updated_at}`}
                      fact={fact}
                      action={updateFactReview}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          className={memoryCardClass}
          aria-labelledby="person-memory-tasks-heading"
        >
          <header className="flex flex-row items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3
                id="person-memory-tasks-heading"
                className="font-display text-xl tracking-tight text-foreground"
              >
                Open loops &amp; reminders
              </h3>
              <p className="mt-1 text-sm text-muted">
                Follow-up ideas grounded in your notes—delete or snooze anytime.
              </p>
            </div>
            <div className="shrink-0">
              <SuggestFollowUpsControl
                personId={personId}
                aiEnabled={aiEnabled}
                hasRecentNotes={hasRecentNotes}
              />
            </div>
          </header>
          {visibleTasks.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              No active suggestions. Use{' '}
              <span className="font-medium text-foreground/80">
                Suggest follow-ups
              </span>{' '}
              when something should not slip.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {visibleTasks.map((task) => (
                <li key={task.id}>
                  <TaskReviewForms task={task} action={updateCrmTask} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

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
