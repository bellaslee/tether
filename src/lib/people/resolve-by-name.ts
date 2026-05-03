import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';

export type PersonNameMatch = {
  id: string;
  full_name: string;
  display_name: string | null;
};

export async function searchPeopleByName(
  client: SupabaseClient<Database>,
  userId: string,
  query: string,
  limit = 10,
): Promise<PersonNameMatch[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }
  const pattern = `%${q}%`;
  const { data, error } = await client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', userId)
    .or(`full_name.ilike.${pattern},display_name.ilike.${pattern}`)
    .order('full_name', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PersonNameMatch[];
}
