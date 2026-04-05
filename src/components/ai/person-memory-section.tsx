import Link from 'next/link';
import { generateRelationshipSummary, updateCrmTask, updateFactReview } from '@/lib/actions/ai-memory';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import type { Tables } from '@/lib/db/database.types';
import { SummaryRefreshForms } from '@/components/ai/summary-refresh-forms';
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

type Props = {
  personId: string;
  aiEnabled: boolean;
  facts: FactRow[];
  summaries: SummaryRow[];
  tasks: TaskRow[];
  interactionLabels: Map<string, string>;
};

export function PersonMemorySection({
  personId,
  aiEnabled,
  facts,
  summaries,
  tasks,
  interactionLabels,
}: Props) {
  const profileBrief = summaries.find((s) => s.kind === 'profile_brief');
  const nextMeeting = summaries.find((s) => s.kind === 'next_meeting');
  const visibleTasks = tasks.filter(taskVisible);

  return (
    <section
      className="card-surface mt-8 space-y-10 rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
      aria-labelledby="person-memory-heading"
    >
      <header>
        <h2
          id="person-memory-heading"
          className="font-display text-2xl tracking-tight"
        >
          Memory &amp; follow-ups
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          AI suggestions stay editable. Names and contact details are filled in
          here, not sent to the model as structured profile data.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Briefs</h3>
          {profileBrief ? (
            <article className={listRowCardClassName('space-y-2')}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Profile brief
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                {profileBrief.content}
              </p>
              <SourceFootnote
                summary={profileBrief}
                interactionLabels={interactionLabels}
              />
            </article>
          ) : (
            <p className="text-sm text-muted">No profile brief yet.</p>
          )}
          {nextMeeting ? (
            <article className={listRowCardClassName('space-y-2')}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Before you meet
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                {nextMeeting.content}
              </p>
              <SourceFootnote
                summary={nextMeeting}
                interactionLabels={interactionLabels}
              />
            </article>
          ) : (
            <p className="text-sm text-muted">No next-meeting brief yet.</p>
          )}
          <SummaryRefreshForms
            personId={personId}
            aiEnabled={aiEnabled}
            action={generateRelationshipSummary}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Facts</h3>
          {facts.length === 0 ? (
            <p className="text-sm text-muted">
              Run{' '}
              <span className="font-medium text-foreground/80">
                Suggest facts
              </span>{' '}
              on a timeline note to add reviewable candidates.
            </p>
          ) : (
            <ul className="space-y-4">
              {facts.map((fact) => (
                <li key={fact.id}>
                  <FactReviewForms fact={fact} action={updateFactReview} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Open loops &amp; reminders
        </h3>
        {visibleTasks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No active suggestions. Use{' '}
            <span className="font-medium text-foreground/80">
              Suggest follow-ups
            </span>{' '}
            on a note when something should not slip.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {visibleTasks.map((task) => (
              <li key={task.id}>
                <TaskReviewForms task={task} action={updateCrmTask} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
