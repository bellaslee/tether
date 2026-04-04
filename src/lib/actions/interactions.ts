'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { InteractionDirection } from '@/lib/db/database.types';
import { getCrmSupabaseContext } from '@/lib/crm/context';
import { INTERACTION_DIRECTIONS } from '@/lib/domain/constants';
import { refreshLastInteractionAtForPersonIds } from '@/lib/interactions/last-touch';

export type ActionResult = { error?: string; ok?: true };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isDirection(value: string): value is InteractionDirection {
  return INTERACTION_DIRECTIONS.includes(value as InteractionDirection);
}

async function assertOwnsPeople(personIds: string[]) {
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.', ctx: null };
  }
  const unique = [...new Set(personIds)];
  const { data, error } = await ctx.client
    .from('people')
    .select('id')
    .eq('user_id', ctx.userId)
    .in('id', unique);
  if (error) {
    return { error: error.message, ctx: null };
  }
  if (!data || data.length !== unique.length) {
    return { error: 'One or more people could not be found.', ctx: null };
  }
  return { ctx, error: undefined };
}

async function assertOwnsInteractionType(
  ctx: NonNullable<Awaited<ReturnType<typeof getCrmSupabaseContext>>>,
  interactionTypeId: string,
): Promise<{ ok: true } | { error: string }> {
  const { data, error } = await ctx.client
    .from('interaction_types')
    .select('id')
    .eq('id', interactionTypeId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: 'Choose a valid interaction type.' };
  }
  return { ok: true };
}

export async function createInteractionFromPerson(
  primaryPersonId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const attendeeRaw = String(formData.get('attendee_ids') ?? '').trim();
  const attendeeIds = attendeeRaw
    ? attendeeRaw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  const allIds = [
    primaryPersonId,
    ...attendeeIds.filter((id) => id !== primaryPersonId),
  ];
  const gate = await assertOwnsPeople(allIds);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  const payload = parseInteractionFields(formData);
  if ('error' in payload) {
    return { error: payload.error };
  }

  const typeGate = await assertOwnsInteractionType(ctx, payload.interaction_type_id);
  if ('error' in typeGate) {
    return { error: typeGate.error };
  }

  const { data: interaction, error: insertError } = await ctx.client
    .from('interactions')
    .insert({
      user_id: ctx.userId,
      occurred_at: payload.occurred_at,
      interaction_type_id: payload.interaction_type_id,
      direction: payload.direction,
      title: payload.title,
      raw_note: payload.raw_note,
      counts_toward_last_touch: true,
    })
    .select('id')
    .single();

  if (insertError || !interaction) {
    return { error: insertError?.message ?? 'Could not create interaction.' };
  }

  const rows = allIds.map((personId) => ({
    interaction_id: interaction.id,
    person_id: personId,
    role:
      personId === primaryPersonId
        ? ('primary' as const)
        : ('attendee' as const),
  }));

  const { error: linkError } = await ctx.client
    .from('interaction_people')
    .insert(rows);
  if (linkError) {
    await ctx.client
      .from('interactions')
      .delete()
      .eq('id', interaction.id)
      .eq('user_id', ctx.userId);
    return { error: linkError.message };
  }

  await refreshLastInteractionAtForPersonIds(ctx.client, ctx.userId, allIds);

  revalidatePath('/timeline');
  revalidatePath(`/people/${primaryPersonId}`);
  allIds.forEach((id) => revalidatePath(`/people/${id}`));
  return { ok: true };
}

export async function createGlobalInteraction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const primaryPersonId = String(
    formData.get('primary_person_id') ?? '',
  ).trim();
  const attendeeRaw = String(formData.get('attendee_ids') ?? '').trim();
  const attendeeIds = attendeeRaw
    ? attendeeRaw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  const allIds = primaryPersonId
    ? [
        primaryPersonId,
        ...attendeeIds.filter((id) => id !== primaryPersonId),
      ]
    : [...new Set(attendeeIds)];

  if (allIds.length === 0) {
    return {
      error:
        "Link at least one person — use 'Also there', or choose a main person.",
    };
  }

  const gate = await assertOwnsPeople(allIds);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  const payload = parseInteractionFields(formData);
  if ('error' in payload) {
    return { error: payload.error };
  }

  const typeGate = await assertOwnsInteractionType(ctx, payload.interaction_type_id);
  if ('error' in typeGate) {
    return { error: typeGate.error };
  }

  const { data: interaction, error: insertError } = await ctx.client
    .from('interactions')
    .insert({
      user_id: ctx.userId,
      occurred_at: payload.occurred_at,
      interaction_type_id: payload.interaction_type_id,
      direction: payload.direction,
      title: payload.title,
      raw_note: payload.raw_note,
      counts_toward_last_touch: true,
    })
    .select('id')
    .single();

  if (insertError || !interaction) {
    return { error: insertError?.message ?? 'Could not create interaction.' };
  }

  const rows = allIds.map((personId) => ({
    interaction_id: interaction.id,
    person_id: personId,
    role:
      primaryPersonId && personId === primaryPersonId
        ? ('primary' as const)
        : ('attendee' as const),
  }));

  const { error: linkError } = await ctx.client
    .from('interaction_people')
    .insert(rows);
  if (linkError) {
    await ctx.client
      .from('interactions')
      .delete()
      .eq('id', interaction.id)
      .eq('user_id', ctx.userId);
    return { error: linkError.message };
  }

  await refreshLastInteractionAtForPersonIds(ctx.client, ctx.userId, allIds);

  revalidatePath('/timeline');
  allIds.forEach((id) => revalidatePath(`/people/${id}`));
  redirect('/timeline');
}

export async function updateInteraction(
  interactionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!isUuid(interactionId)) {
    return { error: 'Invalid interaction.' };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: existing, error: existingError } = await ctx.client
    .from('interactions')
    .select('id')
    .eq('id', interactionId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: 'Interaction not found.' };
  }

  const { data: oldLinks, error: oldLinksError } = await ctx.client
    .from('interaction_people')
    .select('person_id')
    .eq('interaction_id', interactionId);

  if (oldLinksError) {
    return { error: oldLinksError.message };
  }
  const oldPersonIds = (oldLinks ?? []).map((row) => row.person_id);

  const primaryPersonId = String(
    formData.get('primary_person_id') ?? '',
  ).trim();
  const attendeeRaw = String(formData.get('attendee_ids') ?? '').trim();
  const attendeeIds = attendeeRaw
    ? attendeeRaw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  const allIds = primaryPersonId
    ? [
        primaryPersonId,
        ...attendeeIds.filter((id) => id !== primaryPersonId),
      ]
    : [...new Set(attendeeIds)];

  if (allIds.length === 0) {
    return {
      error:
        "Link at least one person — use 'Also there', or choose a main person.",
    };
  }

  const gate = await assertOwnsPeople(allIds);
  if (!gate.ctx) {
    return { error: gate.error };
  }

  const payload = parseInteractionFields(formData);
  if ('error' in payload) {
    return { error: payload.error };
  }

  const typeGate = await assertOwnsInteractionType(ctx, payload.interaction_type_id);
  if ('error' in typeGate) {
    return { error: typeGate.error };
  }

  const { error: updateError } = await ctx.client
    .from('interactions')
    .update({
      occurred_at: payload.occurred_at,
      interaction_type_id: payload.interaction_type_id,
      direction: payload.direction,
      title: payload.title,
      raw_note: payload.raw_note,
    })
    .eq('id', interactionId)
    .eq('user_id', ctx.userId);

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: deleteLinksError } = await ctx.client
    .from('interaction_people')
    .delete()
    .eq('interaction_id', interactionId);

  if (deleteLinksError) {
    return { error: deleteLinksError.message };
  }

  const rows = allIds.map((personId) => ({
    interaction_id: interactionId,
    person_id: personId,
    role:
      primaryPersonId && personId === primaryPersonId
        ? ('primary' as const)
        : ('attendee' as const),
  }));

  const { error: linkError } = await ctx.client
    .from('interaction_people')
    .insert(rows);

  if (linkError) {
    return { error: linkError.message };
  }

  const touchIds = [...new Set([...oldPersonIds, ...allIds])];
  await refreshLastInteractionAtForPersonIds(ctx.client, ctx.userId, touchIds);

  revalidatePath('/timeline');
  touchIds.forEach((pid) => revalidatePath(`/people/${pid}`));
  return { ok: true };
}

export async function deleteInteraction(
  interactionId: string,
): Promise<ActionResult> {
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: links, error: linksError } = await ctx.client
    .from('interaction_people')
    .select('person_id')
    .eq('interaction_id', interactionId);

  if (linksError) {
    return { error: linksError.message };
  }

  const personIds = (links ?? []).map((row) => row.person_id);

  const { data: interaction, error: intError } = await ctx.client
    .from('interactions')
    .select('id')
    .eq('id', interactionId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (intError || !interaction) {
    return { error: 'Interaction not found.' };
  }

  const { error: deleteError } = await ctx.client
    .from('interactions')
    .delete()
    .eq('id', interactionId)
    .eq('user_id', ctx.userId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  await refreshLastInteractionAtForPersonIds(ctx.client, ctx.userId, personIds);

  revalidatePath('/timeline');
  personIds.forEach((id) => revalidatePath(`/people/${id}`));
  return { ok: true };
}

function parseInteractionFields(formData: FormData):
  | {
      occurred_at: string;
      interaction_type_id: string;
      direction: InteractionDirection | null;
      title: string | null;
      raw_note: string | null;
    }
  | { error: string } {
  const occurredLocal = String(formData.get('occurred_at') ?? '').trim();
  const typeIdRaw = String(formData.get('interaction_type_id') ?? '').trim();
  const directionRaw = String(formData.get('direction') ?? '').trim();
  const title = optionalString(formData.get('title'));
  const raw_note = optionalString(formData.get('raw_note'));

  if (!occurredLocal) {
    return { error: 'When did this happen?' };
  }
  if (!isUuid(typeIdRaw)) {
    return { error: 'Choose a valid interaction type.' };
  }

  const occurred_at = localDatetimeToIso(occurredLocal);
  if (!occurred_at) {
    return { error: 'Use a valid date and time.' };
  }

  let direction: InteractionDirection | null = null;
  if (directionRaw) {
    if (!isDirection(directionRaw)) {
      return { error: 'Choose a valid direction.' };
    }
    direction = directionRaw;
  }

  return {
    occurred_at,
    interaction_type_id: typeIdRaw,
    direction,
    title,
    raw_note,
  };
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function localDatetimeToIso(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}
