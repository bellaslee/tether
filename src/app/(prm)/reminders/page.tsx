import Link from 'next/link';
import type { Metadata } from 'next';
import { TaskReviewForms } from '@/components/ai/task-review-forms';
import { updateCrmTask } from '@/lib/actions/ai-memory/reminders';
import type { CrmTaskStatus, Tables } from '@/lib/db/database.types';
import { requirePrmAccess } from '@/lib/prm/guard';
import { personShownName } from '@/lib/people/list-name';

export const metadata: Metadata = {
  title: 'Reminders',
  description: 'Open loops and follow-ups across the people in your circle.',
};

type PersonLabel = Pick<Tables<'people'>, 'id' | 'full_name' | 'display_name'>;

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

function isUpcomingTask(task: Tables<'tasks'>): boolean {
  return (
    task.status === 'suggested' ||
    task.status === 'active' ||
    task.status === 'snoozed'
  );
}

function ReminderTaskRow({
  task,
  peopleById,
}: {
  task: Tables<'tasks'>;
  peopleById: Map<string, PersonLabel>;
}) {
  const person = task.person_id ? peopleById.get(task.person_id) : undefined;
  return (
    <>
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
      <TaskReviewForms
        key={`${task.id}-${task.updated_at}`}
        task={task}
        action={updateCrmTask}
      />
    </>
  );
}

export default async function RemindersPage() {
  const ctx = await requirePrmAccess();

  const { data: taskRows, error: tasksError } = await ctx.client
    .from('tasks')
    .select('*')
    .eq('user_id', ctx.userId)
    .neq('status', 'dismissed');

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
      .select('id, full_name, display_name')
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

  const openCount = tasks.filter(isUpcomingTask).length;
  const upcoming = sorted.filter(isUpcomingTask);
  const doneTasks = sorted.filter((t) => t.status === 'done');

  return (
    <main className="prm-page">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="prm-eyebrow">Follow through</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Reminders
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted max-sm:leading-8">
            Open loops from your notes, sorted with the neediest first.
          </p>
          {tasks.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              {openCount} open
              {openCount !== tasks.length
                ? ` · ${tasks.length} total including done`
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
          Your reminders
        </h2>
        {sorted.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            Nothing here yet. Add a reminder on someone’s profile, or log a
            timeline note with a follow-up—suggestions from your notes will show
            up here.{' '}
            <Link
              href="/people"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              Browse people
            </Link>
          </p>
        ) : (
          <div className="mt-6 space-y-10">
            <div>
              <h3 className="font-display text-lg tracking-tight text-foreground">
                Upcoming
              </h3>
              {upcoming.length > 0 ? (
                <ul className="mt-4 space-y-4" aria-label="Upcoming reminders">
                  {upcoming.map((task) => (
                    <li key={task.id} className="min-w-0">
                      <ReminderTaskRow task={task} peopleById={peopleById} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  Nothing open right now—you are caught up on active follow-ups.
                </p>
              )}
            </div>
            {doneTasks.length > 0 ? (
              <div className="border-t border-border-soft pt-8">
                <h3 className="font-display text-lg tracking-tight text-muted">
                  Done
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Completed reminders stay here until you edit or remove them.
                </p>
                <ul
                  className="mt-4 space-y-4 opacity-90"
                  aria-label="Completed reminders"
                >
                  {doneTasks.map((task) => (
                    <li key={task.id} className="min-w-0">
                      <ReminderTaskRow task={task} peopleById={peopleById} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
