import Link from 'next/link';
import type { Metadata } from 'next';
import { TaskReviewForms } from '@/components/ai/task-review-forms';
import { updateCrmTask } from '@/lib/actions/ai-memory';
import type { CrmTaskStatus, Tables } from '@/lib/db/database.types';
import { requireCrmAccess } from '@/lib/crm/guard';
import { personShownName } from '@/lib/people/list-name';

export const metadata: Metadata = {
  title: 'Reminders',
  description:
    'Open loops and follow-ups across the people in your circle.',
};

type PersonLabel = Pick<
  Tables<'people'>,
  'id' | 'full_name' | 'display_name' | 'preferred_name'
>;

function statusSortRank(status: CrmTaskStatus): number {
  switch (status) {
    case 'suggested':
      return 0;
    case 'active':
      return 1;
    case 'snoozed':
      return 2;
    case 'done':
      return 3;
    case 'dismissed':
      return 4;
    default:
      return 99;
  }
}

export default async function RemindersPage() {
  const ctx = await requireCrmAccess();

  const { data: taskRows, error: tasksError } = await ctx.client
    .from('tasks')
    .select('*')
    .eq('user_id', ctx.userId);

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const tasks = (taskRows ?? []) as Tables<'tasks'>[];
  const personIds = [
    ...new Set(
      tasks.map((t) => t.person_id).filter((id): id is string => id != null),
    ),
  ];

  const peopleById = new Map<string, PersonLabel>();
  if (personIds.length > 0) {
    const { data: peopleRows, error: peopleError } = await ctx.client
      .from('people')
      .select('id, full_name, display_name, preferred_name')
      .eq('user_id', ctx.userId)
      .in('id', personIds);

    if (peopleError) {
      throw new Error(peopleError.message);
    }
    for (const p of peopleRows ?? []) {
      peopleById.set(p.id, p);
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    const sr = statusSortRank(a.status) - statusSortRank(b.status);
    if (sr !== 0) {
      return sr;
    }
    const ad = a.due_at ? Date.parse(a.due_at) : Number.POSITIVE_INFINITY;
    const bd = b.due_at ? Date.parse(b.due_at) : Number.POSITIVE_INFINITY;
    if (ad !== bd) {
      return ad - bd;
    }
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });

  const openCount = tasks.filter(
    (t) =>
      t.status === 'suggested' ||
      t.status === 'active' ||
      t.status === 'snoozed',
  ).length;

  return (
    <main className="crm-page">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="crm-eyebrow">Follow through</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Reminders</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
            Open loops from your notes and anything you added yourself—sorted
            with the neediest first.
          </p>
          {tasks.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              {openCount} open
              {openCount !== tasks.length
                ? ` · ${tasks.length} total including done or dismissed`
                : null}
            </p>
          ) : null}
        </div>
      </header>

      <section
        className="card-surface mt-8 rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
        aria-labelledby="reminders-list-heading"
      >
        <h2
          id="reminders-list-heading"
          className="font-display text-2xl tracking-tight text-foreground"
        >
          All reminders
        </h2>
        {sorted.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            Nothing here yet. Add a reminder on someone’s profile, or use{' '}
            <span className="font-medium text-foreground/80">
              Suggest follow-ups
            </span>{' '}
            from their timeline notes.{' '}
            <Link
              href="/people"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              Browse people
            </Link>
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {sorted.map((task) => {
              const person = task.person_id
                ? peopleById.get(task.person_id)
                : undefined;
              return (
                <li key={task.id} className="min-w-0">
                  {person ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      <Link
                        href={`/people/${person.id}`}
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        {personShownName(person)}
                      </Link>
                    </p>
                  ) : task.person_id ? (
                    <p className="mb-2 text-xs text-muted">Unknown person</p>
                  ) : (
                    <p className="mb-2 text-xs text-muted">General</p>
                  )}
                  <TaskReviewForms task={task} action={updateCrmTask} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
