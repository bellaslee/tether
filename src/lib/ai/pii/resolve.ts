import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import { personShownName } from "@/lib/people/list-name";

export async function resolvePersonLabels(
  client: SupabaseClient<Database>,
  userId: string,
  personIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(personIds)].filter(Boolean);
  const out = new Map<string, string>();
  if (unique.length === 0) {
    return out;
  }

  const { data, error } = await client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', userId)
    .in('id', unique);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    out.set(row.id, personShownName(row));
  }
  return out;
}

export type PrimaryContactKind = 'primary_phone' | 'primary_email';

export async function resolveContactPlaceholder(
  client: SupabaseClient<Database>,
  userId: string,
  personId: string,
  kind: PrimaryContactKind,
): Promise<string | null> {
  const type = kind === 'primary_phone' ? 'phone' : 'email';

  const { data: primary, error: pErr } = await client
    .from('contact_methods')
    .select('value')
    .eq('person_id', personId)
    .eq('is_primary', true)
    .eq('type', type)
    .maybeSingle();

  if (pErr) {
    throw new Error(pErr.message);
  }
  if (primary?.value) {
    const gate = await client
      .from('people')
      .select('id')
      .eq('id', personId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!gate.data) {
      return null;
    }
    return primary.value;
  }

  const { data: anyRow, error } = await client
    .from('contact_methods')
    .select('value')
    .eq('person_id', personId)
    .eq('type', type)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!anyRow?.value) {
    return null;
  }

  const gate = await client
    .from('people')
    .select('id')
    .eq('id', personId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!gate.data) {
    return null;
  }
  return anyRow.value;
}
