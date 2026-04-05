import type { CrmTaskStatus } from '@/lib/db/database.types';

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function aiDisabledMessage() {
  return 'Add OPENAI_API_KEY to your environment to use AI features.';
}

export const TASK_DEDUP_STATUSES: CrmTaskStatus[] = [
  'suggested',
  'active',
  'snoozed',
  'done',
  'dismissed',
];

export const ACCEPTED_FACTS_CONTEXT_LIMIT = 120;
export const ACCEPTED_TASKS_CONTEXT_LIMIT = 80;
