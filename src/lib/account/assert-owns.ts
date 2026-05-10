import { getAccountSupabaseContext } from '@/lib/account/context';

export async function assertOwnsPeople(personIds: string[]) {
  const ctx = await getAccountSupabaseContext();
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

export async function assertOwnsInteractionType(
  ctx: NonNullable<Awaited<ReturnType<typeof getAccountSupabaseContext>>>,
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
