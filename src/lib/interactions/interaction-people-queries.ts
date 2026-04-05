import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, InteractionPersonRole } from '@/lib/db/database.types';

type Client = SupabaseClient<Database>;

/** Embed join shape is not in generated Database types; assert after validated queries. */
type IpRowForInteraction = {
  person_id: string;
  role: InteractionPersonRole;
  created_at: string;
};

type IpRowInteractionId = { interaction_id: string };

type IpRowFullLink = {
  interaction_id: string;
  person_id: string;
  role: InteractionPersonRole;
};

type IpRowInteractionRole = {
  interaction_id: string;
  role: InteractionPersonRole;
};

/**
 * Read `interaction_people` rows joined to `interactions` so only links owned by
 * `userId` are returned (explicit tenancy in the query shape, in addition to RLS).
 */
export async function fetchInteractionPeopleForUserInteraction(
  client: Client,
  userId: string,
  interactionId: string,
): Promise<
  | {
      ok: Array<{
        person_id: string;
        role: InteractionPersonRole;
        created_at: string;
      }>;
    }
  | { error: string }
> {
  const { data, error } = await client
    .from('interaction_people')
    .select('person_id, role, created_at, interactions!inner(user_id)')
    .eq('interaction_id', interactionId)
    .eq('interactions.user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  const rows = (data ?? []) as unknown as IpRowForInteraction[];
  return {
    ok: rows.map((row) => ({
      person_id: row.person_id,
      role: row.role,
      created_at: row.created_at,
    })),
  };
}

export async function fetchInteractionIdsForUserPerson(
  client: Client,
  userId: string,
  personId: string,
): Promise<{ ok: string[] } | { error: string }> {
  const { data, error } = await client
    .from('interaction_people')
    .select('interaction_id, interactions!inner(user_id)')
    .eq('person_id', personId)
    .eq('interactions.user_id', userId);

  if (error) {
    return { error: error.message };
  }

  const rows = (data ?? []) as unknown as IpRowInteractionId[];
  const ids = [...new Set(rows.map((row) => row.interaction_id))];
  return { ok: ids };
}

export async function fetchInteractionPeopleLinksForUserInteractions(
  client: Client,
  userId: string,
  interactionIds: string[],
): Promise<
  | {
      ok: Array<{
        interaction_id: string;
        person_id: string;
        role: InteractionPersonRole;
      }>;
    }
  | { error: string }
> {
  if (interactionIds.length === 0) {
    return { ok: [] };
  }

  const { data, error } = await client
    .from('interaction_people')
    .select('interaction_id, person_id, role, interactions!inner(user_id)')
    .in('interaction_id', interactionIds)
    .eq('interactions.user_id', userId);

  if (error) {
    return { error: error.message };
  }

  const rows = (data ?? []) as unknown as IpRowFullLink[];
  return {
    ok: rows.map((row) => ({
      interaction_id: row.interaction_id,
      person_id: row.person_id,
      role: row.role,
    })),
  };
}

export async function fetchPersonIdsForUserInteraction(
  client: Client,
  userId: string,
  interactionId: string,
): Promise<{ ok: string[] } | { error: string }> {
  const links = await fetchInteractionPeopleForUserInteraction(
    client,
    userId,
    interactionId,
  );
  if ('error' in links) {
    return links;
  }
  const ids = [...new Set(links.ok.map((r) => r.person_id))];
  return { ok: ids };
}

/** Links from a person to interactions, scoped through `interactions.user_id`. */
export async function fetchInteractionRolesForUserPerson(
  client: Client,
  userId: string,
  personId: string,
): Promise<
  | {
      ok: Array<{
        interaction_id: string;
        role: InteractionPersonRole;
      }>;
    }
  | { error: string }
> {
  const { data, error } = await client
    .from('interaction_people')
    .select('interaction_id, role, interactions!inner(user_id)')
    .eq('person_id', personId)
    .eq('interactions.user_id', userId);

  if (error) {
    return { error: error.message };
  }

  const rows = (data ?? []) as unknown as IpRowInteractionRole[];
  return {
    ok: rows.map((row) => ({
      interaction_id: row.interaction_id,
      role: row.role,
    })),
  };
}
