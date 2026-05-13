import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';
import type { TaskSig } from '@/lib/ai/memory-similarity';
import {
  ACCEPTED_FACTS_CONTEXT_LIMIT,
  ACCEPTED_TASKS_CONTEXT_LIMIT,
  TASK_DEDUP_STATUSES,
} from './constants';

export type DbClient = SupabaseClient<Database>;

export async function loadAcceptedFactBodiesForPersons(
  client: DbClient,
  userId: string,
  personIds: string[],
): Promise<{ ok: string[] } | { error: string }> {
  if (personIds.length === 0) {
    return { ok: [] };
  }

  const { data, error } = await client
    .from('facts')
    .select('body')
    .eq('user_id', userId)
    .in('person_id', personIds)
    .eq('review_status', 'accepted')
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(ACCEPTED_FACTS_CONTEXT_LIMIT);

  if (error) {
    return { error: error.message };
  }

  const out: string[] = [];
  for (const row of data ?? []) {
    const b = row.body.trim();
    if (b.length > 0) {
      out.push(b);
    }
  }
  return { ok: out };
}

export async function loadAcceptedTasksForSuggest(
  client: DbClient,
  userId: string,
  personIds: string[],
): Promise<
  | { ok: Array<{ title: string; description: string | null }> }
  | { error: string }
> {
  if (personIds.length === 0) {
    return { ok: [] };
  }

  const { data, error } = await client
    .from('tasks')
    .select('title, description')
    .eq('user_id', userId)
    .in('person_id', personIds)
    .in('status', ['active', 'snoozed'])
    .order('updated_at', { ascending: false })
    .limit(ACCEPTED_TASKS_CONTEXT_LIMIT);

  if (error) {
    return { error: error.message };
  }

  const out: Array<{ title: string; description: string | null }> = [];
  for (const row of data ?? []) {
    const title = row.title.trim();
    if (title.length === 0) {
      continue;
    }
    out.push({
      title,
      description: row.description?.trim()
        ? row.description.trim()
        : null,
    });
  }
  return { ok: out };
}

export async function loadExistingFactBodiesByPerson(
  client: DbClient,
  userId: string,
  personIds: string[],
): Promise<{ ok: Map<string, string[]> } | { error: string }> {
  if (personIds.length === 0) {
    return { ok: new Map() };
  }

  const { data, error } = await client
    .from('facts')
    .select('person_id, body')
    .eq('user_id', userId)
    .in('person_id', personIds)
    .in('review_status', ['candidate', 'accepted', 'dismissed']);

  if (error) {
    return { error: error.message };
  }

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.person_id) ?? [];
    list.push(row.body);
    map.set(row.person_id, list);
  }
  return { ok: map };
}

export async function loadExistingTaskSigsForDedup(
  client: DbClient,
  userId: string,
  linkedPersonIds: string[],
  includeNullPerson: boolean,
): Promise<{ ok: TaskSig[] } | { error: string }> {
  const out: TaskSig[] = [];

  if (linkedPersonIds.length > 0) {
    const { data, error } = await client
      .from('tasks')
      .select('person_id, title, description')
      .eq('user_id', userId)
      .in('status', [...TASK_DEDUP_STATUSES])
      .in('person_id', linkedPersonIds);

    if (error) {
      return { error: error.message };
    }
    for (const row of data ?? []) {
      out.push({
        person_id: row.person_id,
        title: row.title,
        description: row.description,
      });
    }
  }

  if (includeNullPerson) {
    const { data, error } = await client
      .from('tasks')
      .select('person_id, title, description')
      .eq('user_id', userId)
      .in('status', [...TASK_DEDUP_STATUSES])
      .is('person_id', null);

    if (error) {
      return { error: error.message };
    }
    for (const row of data ?? []) {
      out.push({
        person_id: row.person_id,
        title: row.title,
        description: row.description,
      });
    }
  }

  return { ok: out };
}
