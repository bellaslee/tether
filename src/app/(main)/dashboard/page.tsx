import Link from 'next/link';
import type { Metadata } from 'next';
import { ChatPanel } from '@/components/dashboard/chat-panel';
import { ReminderTaskRow } from '@/components/reminders/reminder-task-row';
import { ButtonLink } from '@/components/ui/button';
import { requireAccountAccess } from '@/lib/account/guard';
import { loadChatPanelServerContext } from '@/lib/chat/load-chat-panel-server-context';
import type { Tables } from '@/lib/db/database.types';
import { formatCalendarDateOnly } from '@/lib/datetime';
import { isValidIanaTimeZone } from '@/lib/timezones';
import { personShownName } from '@/lib/people/list-name';
import {
  isUpcomingTask,
  sortTasksForRemindersList,
} from '@/lib/reminders/task-list-helpers';
import { DateTime } from 'luxon';
import type { BirthdayPersonRow } from '@/lib/people/upcoming-birthdays';
import {
  normalizeBirthdayToYmd,
  upcomingBirthdaysThisAndNextMonth,
} from '@/lib/people/upcoming-birthdays';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Upcoming birthdays, open reminders, and chat.',
};

const PAGE_COPY = {
  hero: {
    title: 'Dashboard',
    subtitle: 'Upcoming birthdays, open reminders, and chat in one place.',
  },
  birthdays: {
    title: 'Upcoming birthdays',
    empty:
      'No birthdays this month or next.',
    emptyHasBirthdaysElsewhere:
      'No birthdays in this calendar month or the next. You still have birthdays on other dates; open People to review them.',
    sectionThisMonth: 'This month',
    sectionNextMonth: 'Next month',
    addSomeone: 'Add someone',
    browsePeople: 'Browse people',
    inDays: (n: number) => (n === 1 ? 'In 1 day' : `In ${n} days`),
    today: 'Today',
  },
  reminders: {
    title: 'Active reminders',
    viewAll: 'View all reminders',
    empty:
      'Nothing open right now. Add a reminder from a profile or capture a follow-up from a note.',
    unknownPerson: 'Unknown person',
    general: 'General',
  },
  chat: {
    title: 'Chat',
  },
} as const;

const DASHBOARD_REMINDER_CAP = 8;

type PersonLabel = Pick<Tables<'people'>, 'id' | 'full_name' | 'display_name'>;

export default async function DashboardPage() {
  const ctx = await requireAccountAccess();

  const [
    { data: taskRows, error: tasksError },
    chatCtx,
    { data: peopleWithBirthdays, error: birthdaysQueryError },
  ] = await Promise.all([
    ctx.client
      .from('tasks')
      .select('*')
      .eq('user_id', ctx.userId)
      .neq('status', 'dismissed'),
    loadChatPanelServerContext(ctx),
    ctx.client
      .from('people')
      .select('id, full_name, display_name, birthday, status')
      .eq('user_id', ctx.userId)
      .not('birthday', 'is', null)
      .neq('status', 'archived')
      .order('full_name', { ascending: true }),
  ]);

  if (tasksError) {
    throw new Error(tasksError.message);
  }
  if (birthdaysQueryError) {
    throw new Error(birthdaysQueryError.message);
  }

  const birthdayRows: BirthdayPersonRow[] = (peopleWithBirthdays ?? [])
    .map((row) => {
      const ymd = normalizeBirthdayToYmd(row.birthday);
      if (!ymd) return null;
      return {
        id: row.id,
        full_name: row.full_name,
        display_name: row.display_name,
        birthday: ymd,
      };
    })
    .filter((r): r is BirthdayPersonRow => r != null);

  const tasks = (taskRows ?? []) as Tables<'tasks'>[];
  const peopleById = new Map<string, PersonLabel>();
  for (const p of chatCtx.chatPeople) {
    peopleById.set(p.id, {
      id: p.id,
      full_name: p.full_name,
      display_name: p.display_name,
    });
  }

  const sortedTasks = sortTasksForRemindersList(tasks);
  const openTasks = sortedTasks
    .filter(isUpcomingTask)
    .slice(0, DASHBOARD_REMINDER_CAP);

  const rawTz =
    typeof ctx.accountTimeZone === 'string' ? ctx.accountTimeZone.trim() : '';
  const birthdayZone = rawTz && isValidIanaTimeZone(rawTz) ? rawTz : 'UTC';

  const birthdayBuckets = upcomingBirthdaysThisAndNextMonth(birthdayRows, {
    timeZone: birthdayZone,
  });
  const refMonth = DateTime.now().setZone(birthdayZone);
  const thisMonthCalendarLabel = refMonth.toFormat('MMMM yyyy');
  const nextMonthCalendarLabel = refMonth
    .plus({ months: 1 })
    .toFormat('MMMM yyyy');
  const hasBirthdayRows =
    birthdayBuckets.thisMonth.length > 0 ||
    birthdayBuckets.nextMonth.length > 0;
  const hasAnySavedBirthdays = birthdayRows.length > 0;

  return (
    <main className="page-frame">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          {PAGE_COPY.hero.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
          {PAGE_COPY.hero.subtitle}
        </p>
      </header>

      <section
        className="card-surface mt-8 rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
        aria-labelledby="dash-chat-heading"
      >
        <header className="w-full min-w-0">
          <h2
            id="dash-chat-heading"
            className="font-display text-2xl tracking-tight sm:text-3xl"
          >
            {PAGE_COPY.chat.title}
          </h2>
        </header>
        <div className="mt-6 w-full min-h-[22rem] min-w-0">
          <ChatPanel
            chatPeople={chatCtx.chatPeople}
            chatCategories={chatCtx.chatCategories}
            chatInteractionTypes={chatCtx.chatInteractionTypes}
            momentWallZone={chatCtx.momentWallZone}
          />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section
          className="card-surface flex min-h-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
          aria-labelledby="dash-birthdays-heading"
        >
          <h2
            id="dash-birthdays-heading"
            className="font-display text-xl tracking-tight text-foreground sm:text-2xl"
          >
            {PAGE_COPY.birthdays.title}
          </h2>
          {!hasBirthdayRows ? (
            <div className="mt-6 flex flex-1 flex-col justify-between gap-4">
              <p className="text-sm text-muted">
                {hasAnySavedBirthdays
                  ? PAGE_COPY.birthdays.emptyHasBirthdaysElsewhere
                  : PAGE_COPY.birthdays.empty}
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/people/new" variant="primary" size="sm">
                  {PAGE_COPY.birthdays.addSomeone}
                </ButtonLink>
                <ButtonLink href="/people" variant="secondaryMuted" size="sm">
                  {PAGE_COPY.birthdays.browsePeople}
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {birthdayBuckets.thisMonth.length > 0 ? (
                <section aria-labelledby="dash-birthdays-this-month">
                  <h3
                    id="dash-birthdays-this-month"
                    className="font-display text-base tracking-tight text-foreground"
                  >
                    {PAGE_COPY.birthdays.sectionThisMonth}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {thisMonthCalendarLabel}
                  </p>
                  <ul className="mt-4 space-y-4">
                    {birthdayBuckets.thisMonth.map((row) => (
                      <li key={row.id} className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {row.daysUntil === 0
                            ? PAGE_COPY.birthdays.today
                            : PAGE_COPY.birthdays.inDays(row.daysUntil)}
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          <Link
                            href={`/people/${row.id}`}
                            className="text-accent underline-offset-4 hover:underline"
                          >
                            {personShownName(row)}
                          </Link>
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          {formatCalendarDateOnly(row.birthday)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {birthdayBuckets.nextMonth.length > 0 ? (
                <section
                  className={
                    birthdayBuckets.thisMonth.length > 0
                      ? 'border-t border-border-soft pt-8'
                      : ''
                  }
                  aria-labelledby="dash-birthdays-next-month"
                >
                  <h3
                    id="dash-birthdays-next-month"
                    className="font-display text-base tracking-tight text-foreground"
                  >
                    {PAGE_COPY.birthdays.sectionNextMonth}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {nextMonthCalendarLabel}
                  </p>
                  <ul className="mt-4 space-y-4">
                    {birthdayBuckets.nextMonth.map((row) => (
                      <li key={row.id} className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {row.daysUntil === 0
                            ? PAGE_COPY.birthdays.today
                            : PAGE_COPY.birthdays.inDays(row.daysUntil)}
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          <Link
                            href={`/people/${row.id}`}
                            className="text-accent underline-offset-4 hover:underline"
                          >
                            {personShownName(row)}
                          </Link>
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          {formatCalendarDateOnly(row.birthday)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </section>

        <section
          className="card-surface flex min-h-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
          aria-labelledby="dash-reminders-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2
              id="dash-reminders-heading"
              className="font-display text-xl tracking-tight text-foreground sm:text-2xl"
            >
              {PAGE_COPY.reminders.title}
            </h2>
            <Link
              href="/reminders"
              className="shrink-0 text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              {PAGE_COPY.reminders.viewAll}
            </Link>
          </div>
          {openTasks.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              {PAGE_COPY.reminders.empty}
            </p>
          ) : (
            <ul
              className="mt-6 space-y-4"
              aria-label={PAGE_COPY.reminders.title}
            >
              {openTasks.map((task) => (
                <li key={task.id} className="min-w-0">
                  <ReminderTaskRow
                    task={task}
                    peopleById={peopleById}
                    unknownPersonLabel={PAGE_COPY.reminders.unknownPerson}
                    generalLabel={PAGE_COPY.reminders.general}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
