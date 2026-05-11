import Link from 'next/link';
import type { Metadata } from 'next';
import { ReminderTaskRow } from '@/components/reminders/reminder-task-row';
import type { Tables } from '@/lib/db/database.types';
import { requireAccountAccess } from '@/lib/account/guard';
import {
  isUpcomingTask,
  sortTasksForRemindersList,
} from '@/lib/reminders/task-list-helpers';

const PAGE_COPY = {
  meta: {
    title: 'Reminders',
    description: 'Tasks and follow-ups you add from profiles or notes.',
  },
  hero: {
    title: 'Reminders',
    subtitle:
      "Open items come first. Add tasks from a person's page or when you save a note with a follow-up.",
  },
  counts: {
    openWord: 'open',
    totalIncludingDonePrefix: ' · ',
    totalIncludingDoneSuffix: ' total including done',
  },
  list: {
    sectionTitle: 'Your reminders',
    empty: {
      body:
        "Nothing here yet. Add a reminder from someone's profile, or attach a follow-up when you log a moment.",
      browsePeople: 'Browse people',
    },
    upcoming: {
      heading: 'Upcoming',
      ariaLabel: 'Upcoming reminders',
      caughtUp: 'Nothing open right now.',
    },
    done: {
      heading: 'Done',
      subtitle:
        'Completed tasks stay here until you edit or remove them. They stay out of the open list above.',
      ariaLabel: 'Completed reminders',
    },
  },
  taskRow: {
    unknownPerson: 'Unknown person',
    general: 'General',
  },
} as const;

export const metadata: Metadata = {
  title: PAGE_COPY.meta.title,
  description: PAGE_COPY.meta.description,
};

function remindersTaskCountSummary(openCount: number, total: number): string {
  let line = `${openCount} ${PAGE_COPY.counts.openWord}`;
  if (openCount !== total) {
    line += `${PAGE_COPY.counts.totalIncludingDonePrefix}${total}${PAGE_COPY.counts.totalIncludingDoneSuffix}`;
  }
  return line;
}

type PersonLabel = Pick<Tables<'people'>, 'id' | 'full_name' | 'display_name'>;

export default async function RemindersPage() {
  const ctx = await requireAccountAccess();

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

  const sorted = sortTasksForRemindersList(tasks);

  const openCount = tasks.filter(isUpcomingTask).length;
  const upcoming = sorted.filter(isUpcomingTask);
  const doneTasks = sorted.filter((t) => t.status === 'done');

  return (
    <main className="page-frame">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {PAGE_COPY.hero.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted max-sm:leading-8">
            {PAGE_COPY.hero.subtitle}
          </p>
          {tasks.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              {remindersTaskCountSummary(openCount, tasks.length)}
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
          className="font-display text-xl tracking-tight text-foreground sm:text-2xl"
        >
          {PAGE_COPY.list.sectionTitle}
        </h2>
        {sorted.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            {PAGE_COPY.list.empty.body}{' '}
            <Link
              href="/people"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              {PAGE_COPY.list.empty.browsePeople}
            </Link>
          </p>
        ) : (
          <div className="mt-6 space-y-10">
            <div>
              <h3 className="font-display text-lg tracking-tight text-foreground">
                {PAGE_COPY.list.upcoming.heading}
              </h3>
              {upcoming.length > 0 ? (
                <ul className="mt-4 space-y-4" aria-label={PAGE_COPY.list.upcoming.ariaLabel}>
                  {upcoming.map((task) => (
                    <li key={task.id} className="min-w-0">
                      <ReminderTaskRow
                        task={task}
                        peopleById={peopleById}
                        unknownPersonLabel={PAGE_COPY.taskRow.unknownPerson}
                        generalLabel={PAGE_COPY.taskRow.general}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {PAGE_COPY.list.upcoming.caughtUp}
                </p>
              )}
            </div>
            {doneTasks.length > 0 ? (
              <div className="border-t border-border-soft pt-8">
                <h3 className="font-display text-lg tracking-tight text-muted">
                  {PAGE_COPY.list.done.heading}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-muted max-sm:leading-8">
                  {PAGE_COPY.list.done.subtitle}
                </p>
                <ul
                  className="mt-4 space-y-4 opacity-90"
                  aria-label={PAGE_COPY.list.done.ariaLabel}
                >
                  {doneTasks.map((task) => (
                    <li key={task.id} className="min-w-0">
                      <ReminderTaskRow
                        task={task}
                        peopleById={peopleById}
                        unknownPersonLabel={PAGE_COPY.taskRow.unknownPerson}
                        generalLabel={PAGE_COPY.taskRow.general}
                      />
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
