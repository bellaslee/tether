'use server';

import { revalidatePath } from 'next/cache';
import { getCrmSupabaseContext } from '@/lib/crm/context';

export type CreateCategoryResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

export async function createPersonCategory(
  nameRaw: string,
): Promise<CreateCategoryResult> {
  const ctx = await getCrmSupabaseContext();
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
  return { ok: true, id: data.id, name: data.name };
}

export type UpdateCategoryResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export async function updatePersonCategory(
  categoryId: string,
  nameRaw: string,
): Promise<UpdateCategoryResult> {
  const ctx = await getCrmSupabaseContext();
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
  return { ok: true, name: data.name };
}
