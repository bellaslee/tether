'use server';

import { revalidatePath } from 'next/cache';
import { getPrmSupabaseContext } from '@/lib/prm/context';

function optionalNotes(raw: FormDataEntryValue | null): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

export type CreatePersonConnectionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPersonConnection(
  personId: string,
  relatedPersonId: string,
  connectionTypeId: string,
  notesRaw?: string | null,
): Promise<CreatePersonConnectionResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  if (!personId || !relatedPersonId || personId === relatedPersonId) {
    return { ok: false, error: 'Pick someone other than this person.' };
  }

  const { data: typeRow, error: typeError } = await ctx.client
    .from('connection_types')
    .select('id, inverse_type_id')
    .eq('id', connectionTypeId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (typeError || !typeRow) {
    return { ok: false, error: 'Connection type not found.' };
  }

  const notes = notesRaw != null ? optionalNotes(notesRaw) : null;

  const { data: inserted, error: insertError } = await ctx.client
    .from('person_connections')
    .insert({
      user_id: ctx.userId,
      person_id: personId,
      related_person_id: relatedPersonId,
      connection_type_id: connectionTypeId,
      notes,
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return {
        ok: false,
        error: 'That connection already exists for these people and type.',
      };
    }
    return { ok: false, error: insertError.message };
  }

  if (!inserted) {
    return { ok: false, error: 'Could not create connection.' };
  }

  const reciprocalTypeId =
    typeRow.inverse_type_id ?? typeRow.id;

  const { error: reciprocalError } = await ctx.client
    .from('person_connections')
    .insert({
      user_id: ctx.userId,
      person_id: relatedPersonId,
      related_person_id: personId,
      connection_type_id: reciprocalTypeId,
      notes: null,
    });

  if (reciprocalError && reciprocalError.code !== '23505') {
    await ctx.client
      .from('person_connections')
      .delete()
      .eq('id', inserted.id)
      .eq('user_id', ctx.userId);
    return { ok: false, error: reciprocalError.message };
  }

  revalidatePath(`/people/${personId}`);
  revalidatePath(`/people/${relatedPersonId}`);
  return { ok: true, id: inserted.id };
}

export type DeletePersonConnectionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deletePersonConnection(
  connectionId: string,
): Promise<DeletePersonConnectionResult> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { ok: false, error: 'You need to sign in again.' };
  }

  const { data: row, error: fetchError } = await ctx.client
    .from('person_connections')
    .select('person_id, related_person_id, connection_type_id')
    .eq('id', connectionId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (fetchError || !row) {
    return { ok: false, error: 'Connection not found.' };
  }

  const { data: typeRow } = await ctx.client
    .from('connection_types')
    .select('inverse_type_id, id')
    .eq('id', row.connection_type_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  const reciprocalTypeId =
    typeRow?.inverse_type_id ?? typeRow?.id ?? row.connection_type_id;

  const { error: delError } = await ctx.client
    .from('person_connections')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', ctx.userId);

  if (delError) {
    return { ok: false, error: delError.message };
  }

  await ctx.client
    .from('person_connections')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('person_id', row.related_person_id)
    .eq('related_person_id', row.person_id)
    .eq('connection_type_id', reciprocalTypeId);

  revalidatePath(`/people/${row.person_id}`);
  revalidatePath(`/people/${row.related_person_id}`);
  return { ok: true };
}
