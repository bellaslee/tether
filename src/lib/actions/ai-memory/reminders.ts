'use server';

import { revalidatePath } from 'next/cache';
import type { CrmTaskStatus } from '@/lib/db/database.types';
import { isUuid } from './constants';
import { requireCrmForAiAction } from './guard';
import type { AiMemoryActionResult } from './types';

export async function createManualReminder(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const personId = String(formData.get('person_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const descriptionRaw = String(formData.get('description') ?? '').trim();
  const description = descriptionRaw || null;

  if (!isUuid(personId)) {
    return { error: 'Invalid person.' };
  }
  if (!title) {
    return { error: 'Give this reminder a short title.' };
  }

  const session = await requireCrmForAiAction();
  if (!session.ctx) {
    return { error: session.error };
  }
  const { ctx } = session;

  const { data: person, error: pErr } = await ctx.client
    .from('people')
    .select('id')
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (pErr || !person) {
    return { error: 'Person not found.' };
  }

  const { error: insErr } = await ctx.client.from('tasks').insert({
    user_id: ctx.userId,
    person_id: personId,
    interaction_id: null,
    title,
    description,
    status: 'active',
    suggester_metadata: { source: 'manual' },
  });

  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath(`/people/${personId}`);
  revalidatePath('/reminders');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateCrmTask(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const taskId = String(formData.get('task_id') ?? '').trim();
  const intent = String(formData.get('intent') ?? '').trim();
  if (!isUuid(taskId)) {
    return { error: 'Invalid task.' };
  }

  const session = await requireCrmForAiAction();
  if (!session.ctx) {
    return { error: session.error };
  }
  const { ctx } = session;

  const { data: existing, error: exErr } = await ctx.client
    .from('tasks')
    .select('id, person_id')
    .eq('id', taskId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (exErr || !existing) {
    return { error: 'Task not found.' };
  }

  const revalidate = () => {
    if (existing.person_id) {
      revalidatePath(`/people/${existing.person_id}`);
    }
    revalidatePath('/timeline');
    revalidatePath('/reminders');
    revalidatePath('/dashboard');
  };

  if (intent === 'delete') {
    const { error } = await ctx.client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', ctx.userId);
    if (error) {
      return { error: error.message };
    }
    revalidate();
    return { ok: true };
  }

  if (intent === 'save') {
    const title = String(formData.get('title') ?? '').trim();
    const descriptionRaw = String(formData.get('description') ?? '').trim();
    const description = descriptionRaw || null;
    if (!title) {
      return { error: 'Reminder title cannot be empty.' };
    }
    const { error } = await ctx.client
      .from('tasks')
      .update({ title, description })
      .eq('id', taskId)
      .eq('user_id', ctx.userId)
      .in('status', ['suggested', 'active', 'snoozed', 'done']);
    if (error) {
      return { error: error.message };
    }
    revalidate();
    return { ok: true };
  }

  let status: CrmTaskStatus | null = null;
  let snoozed_until: string | null = null;
  if (intent === 'activate') status = 'active';
  if (intent === 'dismiss') status = 'dismissed';
  if (intent === 'done') status = 'done';
  if (intent === 'snooze') {
    status = 'snoozed';
    snoozed_until = new Date(Date.now() + 7 * 86400000).toISOString();
  }

  if (!status) {
    return { error: 'Unknown action.' };
  }

  const { error } = await ctx.client
    .from('tasks')
    .update({ status, snoozed_until })
    .eq('id', taskId)
    .eq('user_id', ctx.userId);

  if (error) {
    return { error: error.message };
  }
  revalidate();
  return { ok: true };
}
