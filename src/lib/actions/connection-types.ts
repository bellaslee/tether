'use server';

import { revalidatePath } from 'next/cache';
import { getPrmSupabaseContext } from '@/lib/prm/context';

export type CreateConnectionTypeResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

export async function createConnectionType(
  nameRaw: string,
): Promise<CreateConnectionTypeResult> {
  const ctx = await getPrmSupabaseContext();
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
    .from('connection_types')
    .select('sort_order')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (top?.sort_order ?? 0) + 1;

  const { data, error } = await ctx.client
    .from('connection_types')
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

  revalidatePath('/people', 'layout');
  return { ok: true, id: data.id, name: data.name };
}

export type UpdateConnectionTypeResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export async function updateConnectionType(
  typeId: string,
  nameRaw: string,
): Promise<UpdateConnectionTypeResult> {
  const ctx = await getPrmSupabaseContext();
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
    .from('connection_types')
    .select('id')
    .eq('id', typeId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!row) {
    return { ok: false, error: 'Type not found.' };
  }

  const { data, error } = await ctx.client
    .from('connection_types')
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

  revalidatePath('/people', 'layout');
  return { ok: true, name: data.name };
}
