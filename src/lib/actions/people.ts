'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { PersonStatus } from '@/lib/db/database.types';
import { getPrmSupabaseContext } from '@/lib/prm/context';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import { syncCategoryChangeTimelineEntry } from '@/lib/interactions/category-change-audit';

export type ActionResult = { error?: string; ok?: true };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isPersonStatus(value: string): value is PersonStatus {
  return PERSON_STATUSES.includes(value as PersonStatus);
}

export async function createPerson(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const full_name = String(formData.get('full_name') ?? '').trim();
  const categoryIdRaw = String(formData.get('category_id') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? 'active');
  const display_name = optionalString(formData.get('display_name'));
  const pronouns = optionalString(formData.get('pronouns'));
  const location = optionalString(formData.get('location'));
  const occupation = optionalString(formData.get('occupation'));
  const company = optionalString(formData.get('company'));
  const how_you_met = optionalString(formData.get('how_you_met'));
  const relationship_context = optionalString(
    formData.get('relationship_context'),
  );
  const birthday = optionalString(formData.get('birthday'));
  const metAtResult = parseOptionalMetAt(formData.get('met_at'));
  if (metAtResult === 'invalid') {
    return { error: 'Date met must be a valid month and year.' };
  }

  if (!full_name) {
    return { error: 'Name is required.' };
  }
  if (!isUuid(categoryIdRaw)) {
    return { error: 'Choose a valid category.' };
  }
  if (!isPersonStatus(statusRaw)) {
    return { error: 'Choose a valid status.' };
  }

  const { data: categoryRow } = await ctx.client
    .from('person_categories')
    .select('id')
    .eq('id', categoryIdRaw)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!categoryRow) {
    return { error: 'Choose a valid category.' };
  }

  const { data, error } = await ctx.client
    .from('people')
    .insert({
      user_id: ctx.userId,
      full_name,
      display_name,
      category_id: categoryIdRaw,
      status: statusRaw,
      pronouns,
      location,
      occupation,
      company,
      how_you_met,
      relationship_context,
      birthday: birthday || null,
      met_at: metAtResult,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: error?.message ?? 'Could not create person.' };
  }

  revalidatePath('/people');
  redirect(`/people/${data.id}`);
}

export async function updatePersonFormAction(
  personId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return updatePerson(personId, _prev, formData);
}

export async function updatePerson(
  personId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const full_name = String(formData.get('full_name') ?? '').trim();
  const categoryIdRaw = String(formData.get('category_id') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? 'active');
  const display_name = optionalString(formData.get('display_name'));
  const pronouns = optionalString(formData.get('pronouns'));
  const location = optionalString(formData.get('location'));
  const occupation = optionalString(formData.get('occupation'));
  const company = optionalString(formData.get('company'));
  const how_you_met = optionalString(formData.get('how_you_met'));
  const relationship_context = optionalString(
    formData.get('relationship_context'),
  );
  const birthday = optionalString(formData.get('birthday'));
  const metAtResult = parseOptionalMetAt(formData.get('met_at'));
  if (metAtResult === 'invalid') {
    return { error: 'Date met must be a valid month and year.' };
  }

  if (!full_name) {
    return { error: 'Name is required.' };
  }
  if (!isUuid(categoryIdRaw)) {
    return { error: 'Choose a valid category.' };
  }
  if (!isPersonStatus(statusRaw)) {
    return { error: 'Choose a valid status.' };
  }

  const { data: categoryRow } = await ctx.client
    .from('person_categories')
    .select('id')
    .eq('id', categoryIdRaw)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!categoryRow) {
    return { error: 'Choose a valid category.' };
  }

  const { data: personBefore, error: beforeError } = await ctx.client
    .from('people')
    .select('category_id, created_at')
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (beforeError || !personBefore) {
    return { error: beforeError?.message ?? 'Person not found.' };
  }

  const { error } = await ctx.client
    .from('people')
    .update({
      full_name,
      display_name,
      category_id: categoryIdRaw,
      status: statusRaw,
      pronouns,
      location,
      occupation,
      company,
      how_you_met,
      relationship_context,
      birthday: birthday || null,
      met_at: metAtResult,
    })
    .eq('id', personId)
    .eq('user_id', ctx.userId);

  if (error) {
    return { error: error.message };
  }

  if (personBefore.category_id !== categoryIdRaw) {
    try {
      await syncCategoryChangeTimelineEntry(
        ctx.client,
        ctx.userId,
        personId,
        personBefore.category_id,
        categoryIdRaw,
        personBefore.created_at,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      return {
        error: `Profile updated, but the timeline entry for this category change could not be saved (${msg}).`,
      };
    }
  }

  revalidatePath('/people');
  revalidatePath(`/people/${personId}`);
  revalidatePath(`/people/${personId}/edit`);
  revalidatePath('/timeline');
  redirect(`/people/${personId}`);
}

/** Removes the person and cascades related rows (contacts, facts, tasks, links, etc.). */
export async function deletePerson(personId: string): Promise<ActionResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }
  if (!isUuid(personId)) {
    return { error: 'Something went wrong. Try again.' };
  }

  const { data: row, error: fetchError } = await ctx.client
    .from('people')
    .select('id')
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }
  if (!row) {
    return { error: 'This person is no longer in your list.' };
  }

  const { error } = await ctx.client
    .from('people')
    .delete()
    .eq('id', personId)
    .eq('user_id', ctx.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/people', 'layout');
  revalidatePath('/timeline');
  revalidatePath('/reminders');
  revalidatePath(`/people/${personId}`);
  revalidatePath(`/people/${personId}/edit`);
  return { ok: true };
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

const MET_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** `YYYY-MM` from month input → `YYYY-MM-01`, or null. Invalid pattern → `invalid`. */
function parseOptionalMetAt(
  value: FormDataEntryValue | null,
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
