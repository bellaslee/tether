import 'server-only';

import type { PersonStatus } from '@/lib/db/database.types';
import type { AccountSupabaseContext } from '@/lib/account/context';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import { syncCategoryChangeTimelineEntry } from '@/lib/interactions/category-change-audit';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isPersonStatus(value: string): value is PersonStatus {
  return PERSON_STATUSES.includes(value as PersonStatus);
}

const MET_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function parseOptionalMetAtFromString(
  value: string | null | undefined,
): string | null | 'invalid' {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  if (!MET_MONTH_RE.test(text)) {
    return 'invalid';
  }
  return `${text}-01`;
}

export type PersonUpsertFields = {
  full_name: string;
  display_name: string | null;
  category_id: string;
  status: PersonStatus;
  pronouns: string | null;
  location: string | null;
  occupation: string | null;
  company: string | null;
  how_you_met: string | null;
  relationship_context: string | null;
  birthday: string | null;
  met_at: string | null;
};

export async function insertPersonRecord(
  ctx: AccountSupabaseContext,
  input: PersonUpsertFields,
): Promise<{ id: string } | { error: string }> {
  if (!input.full_name.trim()) {
    return { error: 'Name is required.' };
  }
  if (!isUuid(input.category_id)) {
    return { error: 'Choose a valid category.' };
  }
  if (!isPersonStatus(input.status)) {
    return { error: 'Choose a valid status.' };
  }

  const { data: categoryRow } = await ctx.client
    .from('person_categories')
    .select('id')
    .eq('id', input.category_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!categoryRow) {
    return { error: 'Choose a valid category.' };
  }

  const { data, error } = await ctx.client
    .from('people')
    .insert({
      user_id: ctx.userId,
      full_name: input.full_name.trim(),
      display_name: input.display_name,
      category_id: input.category_id,
      status: input.status,
      pronouns: input.pronouns,
      location: input.location,
      occupation: input.occupation,
      company: input.company,
      how_you_met: input.how_you_met,
      relationship_context: input.relationship_context,
      birthday: input.birthday || null,
      met_at: input.met_at,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: error?.message ?? 'Could not create person.' };
  }
  return { id: data.id };
}

export async function updatePersonRecord(
  ctx: AccountSupabaseContext,
  personId: string,
  input: PersonUpsertFields,
): Promise<{ ok: true } | { error: string }> {
  if (!isUuid(personId)) {
    return { error: 'Person not found.' };
  }
  if (!input.full_name.trim()) {
    return { error: 'Name is required.' };
  }
  if (!isUuid(input.category_id)) {
    return { error: 'Choose a valid category.' };
  }
  if (!isPersonStatus(input.status)) {
    return { error: 'Choose a valid status.' };
  }

  const { data: categoryRow } = await ctx.client
    .from('person_categories')
    .select('id')
    .eq('id', input.category_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!categoryRow) {
    return { error: 'Choose a valid category.' };
  }

  const { data: personBefore, error: beforeError } = await ctx.client
    .from('people')
    .select(
      'category_id, created_at, relationship_hearts_baseline_halves',
    )
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (beforeError || !personBefore) {
    return { error: beforeError?.message ?? 'Person not found.' };
  }

  const categoryChanged = personBefore.category_id !== input.category_id;
  const relationship_hearts_baseline_halves =
    categoryChanged ? null : personBefore.relationship_hearts_baseline_halves;

  const { error } = await ctx.client
    .from('people')
    .update({
      full_name: input.full_name.trim(),
      display_name: input.display_name,
      category_id: input.category_id,
      status: input.status,
      pronouns: input.pronouns,
      location: input.location,
      occupation: input.occupation,
      company: input.company,
      how_you_met: input.how_you_met,
      relationship_context: input.relationship_context,
      birthday: input.birthday || null,
      met_at: input.met_at,
      relationship_hearts_baseline_halves,
    })
    .eq('id', personId)
    .eq('user_id', ctx.userId);

  if (error) {
    return { error: error.message };
  }

  if (personBefore.category_id !== input.category_id) {
    try {
      await syncCategoryChangeTimelineEntry(
        ctx.client,
        ctx.userId,
        personId,
        personBefore.category_id,
        input.category_id,
        personBefore.created_at,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      return {
        error: `Profile updated, but the timeline entry for this category change could not be saved (${msg}).`,
      };
    }
  }

  return { ok: true };
}
