'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calendarDateLocalNoonToUtcIso } from '@/lib/datetime';
import { getPrmSupabaseContext } from '@/lib/prm/context';
import { resolvePreferredIanaTimeZone } from '@/lib/timezones';
import { refreshLastInteractionAtForPersonIds } from '@/lib/interactions/last-touch';
import {
  countsTowardLastTouch,
  resolveCountsTowardLastTouchOnUpdate,
} from '@/lib/interactions/upcoming';
import { fetchInteractionPeopleForUserInteraction } from '@/lib/interactions/interaction-people-queries';
import { parseInteractionFieldsFromValues } from '@/lib/interactions/parse-interaction-fields';
import { tryCreateOpenAiClient } from '@/lib/ai/openai';
import {
  deleteEmbeddingsForSource,
  syncInteractionNoteEmbeddings,
} from '@/lib/retrieval/sync-embeddings';
import { assertOwnsInteractionType, assertOwnsPeople } from '@/lib/prm/assert-owns';
import {
  resolveQuickLogInteractionTitle,
  type QuickLogCalendarOptions,
} from '@/lib/interactions/quick-log-shared';

export type ActionResult = { error?: string; ok?: true };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type { QuickLogCalendarOptions };

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

  const wallClockZone = resolvePreferredIanaTimeZone(
    ctx.accountTimeZone,
    formData,
  );
  const payload = parseInteractionFields(formData, wallClockZone);
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
      title: payload.title,
      raw_note: payload.raw_note,
      counts_toward_last_touch: countsTowardLastTouch(payload.occurred_at),
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

  const openai = tryCreateOpenAiClient();
  if (openai) {
    try {
      await syncInteractionNoteEmbeddings({
        client: ctx.client,
        openai,
        userId: ctx.userId,
        interactionId: interaction.id,
      });
    } catch (e) {
      console.error('[createInteractionFromPerson] embeddings', e);
    }
  }

  revalidatePath('/timeline');
  revalidatePath('/people', 'layout');
  revalidatePath(`/people/${primaryPersonId}`);
  allIds.forEach((id) => revalidatePath(`/people/${id}`));

  return { ok: true };
}

const CALENDAR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUICK_LOG_DATES = 62;

export async function quickLogInteractionsForPersonOnCalendarDates(
  primaryPersonId: string,
  calendarDates: string[],
  options: QuickLogCalendarOptions,
): Promise<ActionResult> {
  if (!isUuid(primaryPersonId)) {
    return { error: 'Choose who this moment is mainly about.' };
  }
  const attendeeIds = [...new Set((options.attendeeIds ?? []).map((id) => id.trim()).filter(Boolean))]
    .filter((id) => id !== primaryPersonId)
    .sort();

  const allPersonIds = [primaryPersonId, ...attendeeIds];
  const gate = await assertOwnsPeople(allPersonIds);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  if (!isUuid(options.interactionTypeId)) {
    return { error: 'Choose a valid interaction type.' };
  }

  const typeGate = await assertOwnsInteractionType(ctx, options.interactionTypeId);
  if ('error' in typeGate) {
    return { error: typeGate.error };
  }

  const fd = new FormData();
  const hint = options.wallTimeZoneHint?.trim();
  if (hint) {
    fd.set('wall_time_zone', hint);
  }
  const zone = resolvePreferredIanaTimeZone(ctx.accountTimeZone, fd);

  const uniqueSorted = [
    ...new Set(
      calendarDates.map((d) => d.trim()).filter((d) => CALENDAR_DATE_RE.test(d)),
    ),
  ].sort();

  if (uniqueSorted.length === 0) {
    return { error: 'Select at least one date.' };
  }
  if (uniqueSorted.length > MAX_QUICK_LOG_DATES) {
    return {
      error: `You can add at most ${MAX_QUICK_LOG_DATES} days at once.`,
    };
  }

  const resolvedTitle = resolveQuickLogInteractionTitle(options.title);

  const interactionRows: {
    user_id: string;
    occurred_at: string;
    interaction_type_id: string;
    title: string;
    raw_note: null;
    counts_toward_last_touch: boolean;
  }[] = [];

  for (const date of uniqueSorted) {
    const occurredAt = calendarDateLocalNoonToUtcIso(date, zone);
    if (!occurredAt) {
      return { error: `Could not interpret date: ${date}` };
    }
    interactionRows.push({
      user_id: ctx.userId,
      occurred_at: occurredAt,
      interaction_type_id: options.interactionTypeId,
      title: resolvedTitle,
      raw_note: null,
      counts_toward_last_touch: countsTowardLastTouch(occurredAt),
    });
  }

  const { data: inserted, error: insertError } = await ctx.client
    .from('interactions')
    .insert(interactionRows)
    .select('id');

  if (insertError || !inserted || inserted.length !== interactionRows.length) {
    return { error: insertError?.message ?? 'Could not create interactions.' };
  }

  const linkRows = inserted.flatMap((row) =>
    allPersonIds.map((personId) => ({
      interaction_id: row.id,
      person_id: personId,
      role:
        personId === primaryPersonId
          ? ('primary' as const)
          : ('attendee' as const),
    })),
  );

  const { error: linkError } = await ctx.client
    .from('interaction_people')
    .insert(linkRows);

  if (linkError) {
    const ids = inserted.map((r) => r.id);
    await ctx.client
      .from('interactions')
      .delete()
      .in('id', ids)
      .eq('user_id', ctx.userId);
    return { error: linkError.message };
  }

  await refreshLastInteractionAtForPersonIds(ctx.client, ctx.userId, allPersonIds);

  const openai = tryCreateOpenAiClient();
  if (openai) {
    for (const row of inserted) {
      try {
        await syncInteractionNoteEmbeddings({
          client: ctx.client,
          openai,
          userId: ctx.userId,
          interactionId: row.id,
        });
      } catch (e) {
        console.error('[quickLogInteractions] embeddings', e);
      }
    }
  }

  revalidatePath('/timeline');
  revalidatePath('/people', 'layout');
  allPersonIds.forEach((id) => revalidatePath(`/people/${id}`));

  return { ok: true };
}

export async function insertGlobalInteractionCore(
  formData: FormData,
): Promise<{ id: string; personIds: string[] } | { error: string }> {
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
        'Link at least one person — add them under People (and optionally mark a main person).',
    };
  }

  const gate = await assertOwnsPeople(allIds);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  const wallClockZone = resolvePreferredIanaTimeZone(
    ctx.accountTimeZone,
    formData,
  );
  const payload = parseInteractionFields(formData, wallClockZone);
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
      title: payload.title,
      raw_note: payload.raw_note,
      counts_toward_last_touch: countsTowardLastTouch(payload.occurred_at),
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

  const openai = tryCreateOpenAiClient();
  if (openai) {
    try {
      await syncInteractionNoteEmbeddings({
        client: ctx.client,
        openai,
        userId: ctx.userId,
        interactionId: interaction.id,
      });
    } catch (e) {
      console.error('[insertGlobalInteractionCore] embeddings', e);
    }
  }

  return { id: interaction.id, personIds: allIds };
}

export async function createGlobalInteraction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const created = await insertGlobalInteractionCore(formData);
  if ('error' in created) {
    return { error: created.error };
  }

  revalidatePath('/timeline');
  revalidatePath('/people', 'layout');
  created.personIds.forEach((id) => revalidatePath(`/people/${id}`));

  redirect('/timeline');
}

export type UpdateInteractionCoreResult =
  | { ok: true; touchIds: string[] }
  | { error: string };

export async function updateInteractionCore(
  interactionId: string,
  formData: FormData,
): Promise<UpdateInteractionCoreResult> {
  if (!isUuid(interactionId)) {
    return { error: 'Invalid interaction.' };
  }

  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: existing, error: existingError } = await ctx.client
    .from('interactions')
    .select('id, occurred_at, counts_toward_last_touch')
    .eq('id', interactionId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: 'Interaction not found.' };
  }

  const oldLinksRes = await fetchInteractionPeopleForUserInteraction(
    ctx.client,
    ctx.userId,
    interactionId,
  );
  if ('error' in oldLinksRes) {
    return { error: oldLinksRes.error };
  }
  const oldPersonIds = oldLinksRes.ok.map((row) => row.person_id);

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
        'Link at least one person — add them under People (and optionally mark a main person).',
    };
  }

  const gate = await assertOwnsPeople(allIds);
  if (!gate.ctx) {
    return { error: gate.error };
  }

  const wallClockZone = resolvePreferredIanaTimeZone(
    ctx.accountTimeZone,
    formData,
  );
  const payload = parseInteractionFields(formData, wallClockZone);
  if ('error' in payload) {
    return { error: payload.error };
  }

  const typeGate = await assertOwnsInteractionType(ctx, payload.interaction_type_id);
  if ('error' in typeGate) {
    return { error: typeGate.error };
  }

  const countsToward = resolveCountsTowardLastTouchOnUpdate(
    existing.occurred_at,
    existing.counts_toward_last_touch,
    payload.occurred_at,
  );

  const { error: updateError } = await ctx.client
    .from('interactions')
    .update({
      occurred_at: payload.occurred_at,
      interaction_type_id: payload.interaction_type_id,
      title: payload.title,
      raw_note: payload.raw_note,
      counts_toward_last_touch: countsToward,
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

  const openai = tryCreateOpenAiClient();
  if (openai) {
    try {
      await syncInteractionNoteEmbeddings({
        client: ctx.client,
        openai,
        userId: ctx.userId,
        interactionId,
      });
    } catch (e) {
      console.error('[updateInteractionCore] embeddings', e);
    }
  }

  return { ok: true, touchIds };
}

export async function updateInteraction(
  interactionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const result = await updateInteractionCore(interactionId, formData);
  if ('error' in result) {
    return { error: result.error };
  }

  revalidatePath('/timeline');
  revalidatePath('/people', 'layout');
  result.touchIds.forEach((pid) => revalidatePath(`/people/${pid}`));

  return { ok: true };
}

export async function deleteInteraction(
  interactionId: string,
): Promise<ActionResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const linksRes = await fetchInteractionPeopleForUserInteraction(
    ctx.client,
    ctx.userId,
    interactionId,
  );
  if ('error' in linksRes) {
    return { error: linksRes.error };
  }

  const personIds = linksRes.ok.map((row) => row.person_id);

  const { data: interaction, error: intError } = await ctx.client
    .from('interactions')
    .select('id')
    .eq('id', interactionId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (intError || !interaction) {
    return { error: 'Interaction not found.' };
  }

  await deleteEmbeddingsForSource(
    ctx.client,
    ctx.userId,
    'interaction_note',
    interactionId,
  );

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
  revalidatePath('/people', 'layout');
  personIds.forEach((id) => revalidatePath(`/people/${id}`));
  return { ok: true };
}

function parseInteractionFields(
  formData: FormData,
  wallClockZone: string,
):
  | {
      occurred_at: string;
      interaction_type_id: string;
      title: string | null;
      raw_note: string | null;
    }
  | { error: string } {
  const occurredLocal = String(formData.get('occurred_at') ?? '').trim();
  const typeIdRaw = String(formData.get('interaction_type_id') ?? '').trim();
  const title = optionalString(formData.get('title'));
  const raw_note = optionalString(formData.get('raw_note'));
  return parseInteractionFieldsFromValues(
    wallClockZone,
    occurredLocal,
    typeIdRaw,
    title,
    raw_note,
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}
