'use server';

import { revalidatePath } from 'next/cache';
import { getPrmSupabaseContext } from '@/lib/prm/context';

export type CreateCategoryResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

export async function createPersonCategory(
  nameRaw: string,
): Promise<CreateCategoryResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  const name = nameRaw.trim();
  if (!name) {
    return { ok: false, error: 'Category name is required.' };
  }
  if (name.length > 120) {
    return { ok: false, error: 'Keep the name under 120 characters.' };
  }

  const { data: top } = await ctx.client
    .from('person_categories')
    .select('sort_order')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (top?.sort_order ?? 0) + 1;

  const { data, error } = await ctx.client
    .from('person_categories')
    .insert({
      user_id: ctx.userId,
      name,
      sort_order,
    })
    .select('id, name')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'You already have a category with that name.' };
    }
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: 'Could not create category.' };
  }

  revalidatePath('/people', 'layout');
  revalidatePath('/settings');
  return { ok: true, id: data.id, name: data.name };
}

export type UpdateCategoryResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export async function updatePersonCategory(
  categoryId: string,
  nameRaw: string,
): Promise<UpdateCategoryResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  const name = nameRaw.trim();
  if (!name) {
    return { ok: false, error: 'Category name is required.' };
  }
  if (name.length > 120) {
    return { ok: false, error: 'Keep the name under 120 characters.' };
  }

  const { data: row } = await ctx.client
    .from('person_categories')
    .select('id')
    .eq('id', categoryId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!row) {
    return { ok: false, error: 'Category not found.' };
  }

  const { data, error } = await ctx.client
    .from('person_categories')
    .update({ name })
    .eq('id', categoryId)
    .eq('user_id', ctx.userId)
    .select('name')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'You already have a category with that name.' };
    }
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: 'Could not update category.' };
  }

  revalidatePath('/people', 'layout');
  revalidatePath('/settings');
  return { ok: true, name: data.name };
}

export type ReorderCategoriesResult =
  | { ok: true }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function reorderPersonCategories(
  orderedIds: string[],
): Promise<ReorderCategoriesResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  for (const id of orderedIds) {
    if (!UUID_RE.test(id)) {
      return { ok: false, error: 'Invalid category id.' };
    }
  }

  const { data: rows, error: fetchError } = await ctx.client
    .from('person_categories')
    .select('id')
    .eq('user_id', ctx.userId);

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  const owned = new Set((rows ?? []).map((r) => r.id));
  if (orderedIds.length !== owned.size) {
    return {
      ok: false,
      error: 'Reorder list must include every category exactly once.',
    };
  }
  for (const id of orderedIds) {
    if (!owned.has(id)) {
      return { ok: false, error: 'Unknown category in list.' };
    }
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await ctx.client
      .from('person_categories')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('user_id', ctx.userId);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath('/people', 'layout');
  revalidatePath('/settings');
  return { ok: true };
}
