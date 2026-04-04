'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { PersonStatus } from '@/lib/db/database.types';
import { getCrmSupabaseContext } from '@/lib/crm/context';
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
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const full_name = String(formData.get('full_name') ?? '').trim();
  const categoryIdRaw = String(formData.get('category_id') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? 'active');
  const display_name = optionalString(formData.get('display_name'));
  const preferred_name = optionalString(formData.get('preferred_name'));
  const pronouns = optionalString(formData.get('pronouns'));
  const location = optionalString(formData.get('location'));
  const occupation = optionalString(formData.get('occupation'));
  const company = optionalString(formData.get('company'));
  const how_you_met = optionalString(formData.get('how_you_met'));
  const relationship_context = optionalString(
    formData.get('relationship_context'),
  );
  const birthday = optionalString(formData.get('birthday'));

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
      preferred_name,
      pronouns,
      location,
      occupation,
      company,
      how_you_met,
      relationship_context,
      birthday: birthday || null,
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
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const full_name = String(formData.get('full_name') ?? '').trim();
  const categoryIdRaw = String(formData.get('category_id') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? 'active');
  const display_name = optionalString(formData.get('display_name'));
  const preferred_name = optionalString(formData.get('preferred_name'));
  const pronouns = optionalString(formData.get('pronouns'));
  const location = optionalString(formData.get('location'));
  const occupation = optionalString(formData.get('occupation'));
  const company = optionalString(formData.get('company'));
  const how_you_met = optionalString(formData.get('how_you_met'));
  const relationship_context = optionalString(
    formData.get('relationship_context'),
  );
  const birthday = optionalString(formData.get('birthday'));

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
      preferred_name,
      pronouns,
      location,
      occupation,
      company,
      how_you_met,
      relationship_context,
      birthday: birthday || null,
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

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}
