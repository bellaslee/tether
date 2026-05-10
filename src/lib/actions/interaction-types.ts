'use server';

import { revalidatePath } from 'next/cache';
import { getAccountSupabaseContext } from '@/lib/account/context';

export type CreateInteractionTypeResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

export async function createInteractionType(
  nameRaw: string,
): Promise<CreateInteractionTypeResult> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  const name = nameRaw.trim();
  if (!name) {
    return { ok: false, error: 'Name is required.' };
  }
  if (name.length > 120) {
    return { ok: false, error: 'Keep the name under 120 characters.' };
  }

  const { data: top } = await ctx.client
    .from('interaction_types')
    .select('sort_order')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (top?.sort_order ?? 0) + 1;

  const { data, error } = await ctx.client
    .from('interaction_types')
    .insert({
      user_id: ctx.userId,
      name,
      sort_order,
    })
    .select('id, name')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'You already have a type with that name.' };
    }
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: 'Could not create type.' };
  }

  revalidatePath('/timeline', 'layout');
  return { ok: true, id: data.id, name: data.name };
}

export type UpdateInteractionTypeResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export async function updateInteractionType(
  typeId: string,
  nameRaw: string,
): Promise<UpdateInteractionTypeResult> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  const name = nameRaw.trim();
  if (!name) {
    return { ok: false, error: 'Name is required.' };
  }
  if (name.length > 120) {
    return { ok: false, error: 'Keep the name under 120 characters.' };
  }

  const { data: row } = await ctx.client
    .from('interaction_types')
    .select('id')
    .eq('id', typeId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!row) {
    return { ok: false, error: 'Type not found.' };
  }

  const { data, error } = await ctx.client
    .from('interaction_types')
    .update({ name })
    .eq('id', typeId)
    .eq('user_id', ctx.userId)
    .select('name')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'You already have a type with that name.' };
    }
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: 'Could not update type.' };
  }

  revalidatePath('/timeline', 'layout');
  return { ok: true, name: data.name };
}

export type ReorderInteractionTypesResult =
  | { ok: true }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function reorderInteractionTypes(
  orderedIds: string[],
): Promise<ReorderInteractionTypesResult> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  for (const id of orderedIds) {
    if (!UUID_RE.test(id)) {
      return { ok: false, error: 'Invalid type id.' };
    }
  }

  const { data: rows, error: fetchError } = await ctx.client
    .from('interaction_types')
    .select('id')
    .eq('user_id', ctx.userId);

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  const owned = new Set((rows ?? []).map((r) => r.id));
  if (orderedIds.length !== owned.size) {
    return {
      ok: false,
      error: 'Reorder list must include every timeline type exactly once.',
    };
  }
  for (const id of orderedIds) {
    if (!owned.has(id)) {
      return { ok: false, error: 'Unknown type in list.' };
    }
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await ctx.client
      .from('interaction_types')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('user_id', ctx.userId);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath('/timeline', 'layout');
  revalidatePath('/people', 'layout');
  revalidatePath('/settings');
  revalidatePath('/interactions/new');
  return { ok: true };
}
