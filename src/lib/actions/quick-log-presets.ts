'use server';

import { revalidatePath } from 'next/cache';
import { getPrmSupabaseContext } from '@/lib/prm/context';
import { assertOwnsInteractionType, assertOwnsPeople } from '@/lib/prm/assert-owns';
import { resolveQuickLogInteractionTitle } from '@/lib/interactions/quick-log-shared';
import { resolveQuickLogTimeLocal } from '@/lib/interactions/quick-log-shared';
import type { ActionResult } from '@/lib/actions/interactions';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

const MAX_PRESET_LABEL_LEN = 120;

function normalizeAttendeeIds(
  primaryPersonId: string,
  attendeeIds: string[],
): string[] {
  return [...new Set(attendeeIds.map((id) => id.trim()).filter(Boolean))]
    .filter((id) => id !== primaryPersonId)
    .sort();
}

function normalizeLabel(raw: string): string | { error: string } {
  const t = raw.trim();
  if (!t) {
    return { error: 'Enter a name for this preset.' };
  }
  if (t.length > MAX_PRESET_LABEL_LEN) {
    return { error: `Preset name must be at most ${MAX_PRESET_LABEL_LEN} characters.` };
  }
  return t;
}

export async function createQuickLogPreset(input: {
  label: string;
  primaryPersonId: string;
  interactionTypeId: string;
  interactionTitle: string;
  attendeeIds: string[];
  timeLocal?: string;
}): Promise<ActionResult & { id?: string }> {
  const label = normalizeLabel(input.label);
  if (typeof label !== 'string') {
    return { error: label.error };
  }
  const primaryPersonId = input.primaryPersonId.trim();
  if (primaryPersonId && !isUuid(primaryPersonId)) {
    return { error: 'Choose a valid main person.' };
  }
  if (!isUuid(input.interactionTypeId)) {
    return { error: 'Choose a valid interaction type.' };
  }

  const attendees = normalizeAttendeeIds(primaryPersonId, input.attendeeIds);
  const allIds = [primaryPersonId, ...attendees].filter(Boolean);
  if (allIds.length === 0) {
    return { error: 'Include at least one person in this preset.' };
  }
  const peopleGate = await assertOwnsPeople(allIds);
  if (!peopleGate.ctx) {
    return { error: peopleGate.error };
  }
  const { ctx } = peopleGate;

  const typeGate = await assertOwnsInteractionType(ctx, input.interactionTypeId);
  if ('error' in typeGate) {
    return { error: typeGate.error };
  }

  const interactionTitle = resolveQuickLogInteractionTitle(input.interactionTitle);
  const timeLocal = resolveQuickLogTimeLocal(input.timeLocal);

  const { data: row, error } = await ctx.client
    .from('quick_log_presets')
    .insert({
      user_id: ctx.userId,
      label,
      primary_person_id: primaryPersonId || null,
      interaction_type_id: input.interactionTypeId,
      interaction_title: interactionTitle,
      attendee_person_ids: attendees,
      time_local: timeLocal,
    })
    .select('id')
    .single();

  if (error || !row) {
    return { error: error?.message ?? 'Could not save preset.' };
  }

  revalidatePath('/timeline');
  revalidatePath('/people', 'layout');
  allIds.forEach((id) => revalidatePath(`/people/${id}`));

  return { ok: true, id: row.id };
}

export async function updateQuickLogPreset(
  presetId: string,
  input: {
    label: string;
    primaryPersonId: string;
    interactionTypeId: string;
    interactionTitle: string;
    attendeeIds: string[];
    timeLocal?: string;
  },
): Promise<ActionResult> {
  if (!isUuid(presetId)) {
    return { error: 'Invalid preset.' };
  }
  const label = normalizeLabel(input.label);
  if (typeof label !== 'string') {
    return { error: label.error };
  }
  const primaryPersonId = input.primaryPersonId.trim();
  if (primaryPersonId && !isUuid(primaryPersonId)) {
    return { error: 'Choose a valid main person.' };
  }
  if (!isUuid(input.interactionTypeId)) {
    return { error: 'Choose a valid interaction type.' };
  }

  const attendees = normalizeAttendeeIds(primaryPersonId, input.attendeeIds);
  const allIds = [primaryPersonId, ...attendees].filter(Boolean);
  if (allIds.length === 0) {
    return { error: 'Include at least one person in this preset.' };
  }

  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: existing, error: exErr } = await ctx.client
    .from('quick_log_presets')
    .select('id')
    .eq('id', presetId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (exErr || !existing) {
    return { error: 'Preset not found.' };
  }

  const peopleGate = await assertOwnsPeople(allIds);
  if (!peopleGate.ctx) {
    return { error: peopleGate.error };
  }

  const typeGate = await assertOwnsInteractionType(peopleGate.ctx, input.interactionTypeId);
  if ('error' in typeGate) {
    return { error: typeGate.error };
  }

  const interactionTitle = resolveQuickLogInteractionTitle(input.interactionTitle);
  const timeLocal = resolveQuickLogTimeLocal(input.timeLocal);

  const { error: upErr } = await ctx.client
    .from('quick_log_presets')
    .update({
      label,
      primary_person_id: primaryPersonId || null,
      interaction_type_id: input.interactionTypeId,
      interaction_title: interactionTitle,
      attendee_person_ids: attendees,
      time_local: timeLocal,
    })
    .eq('id', presetId)
    .eq('user_id', ctx.userId);

  if (upErr) {
    return { error: upErr.message };
  }

  revalidatePath('/timeline');
  revalidatePath('/people', 'layout');
  allIds.forEach((id) => revalidatePath(`/people/${id}`));

  return { ok: true };
}

export async function deleteQuickLogPreset(presetId: string): Promise<ActionResult> {
  if (!isUuid(presetId)) {
    return { error: 'Invalid preset.' };
  }

  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: row, error: selErr } = await ctx.client
    .from('quick_log_presets')
    .select('primary_person_id, attendee_person_ids')
    .eq('id', presetId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (selErr || !row) {
    return { error: 'Preset not found.' };
  }

  const touchIds = [
    row.primary_person_id,
    ...((row.attendee_person_ids as string[]) ?? []),
  ].filter(Boolean);

  const { error: delErr } = await ctx.client
    .from('quick_log_presets')
    .delete()
    .eq('id', presetId)
    .eq('user_id', ctx.userId);

  if (delErr) {
    return { error: delErr.message };
  }

  revalidatePath('/timeline');
  revalidatePath('/people', 'layout');
  touchIds.forEach((id) => revalidatePath(`/people/${id}`));

  return { ok: true };
}
