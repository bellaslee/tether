import type { CrmTaskStatus, Tables } from '@/lib/db/database.types';

export function statusSortRank(status: CrmTaskStatus): number {
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

export function isUpcomingTask(task: Tables<'tasks'>): boolean {
  return (
    task.status === 'suggested' ||
    task.status === 'active' ||
    task.status === 'snoozed'
  );
}

/** Same ordering as the reminders page: status rank, then due_at, then created_at. */
export function sortTasksForRemindersList(
  tasks: Tables<'tasks'>[],
): Tables<'tasks'>[] {
  return [...tasks].sort((a, b) => {
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
}
