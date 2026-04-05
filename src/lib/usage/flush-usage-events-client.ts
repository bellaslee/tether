'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseEnv } from '@/lib/env';
import type { Database, Json, UsageEventCategory } from '@/lib/db/database.types';

export type PendingUsageEvent = {
  category: UsageEventCategory;
  name: string;
  properties?: Json;
  duration_ms?: number | null;
};

/** Same-session insert; used for normal flushes. */
export async function insertUsageEvents(
  supabase: SupabaseClient<Database>,
  rows: PendingUsageEvent[],
): Promise<boolean> {
  if (rows.length === 0) return true;
  const payload = rows.map((r) => ({
    category: r.category,
    name: r.name,
    properties: r.properties ?? {},
    duration_ms: r.duration_ms ?? null,
  }));
  const { error } = await supabase.from('usage_events').insert(payload);
  return !error;
}

/**
 * Best-effort flush when the page may unload; uses fetch keepalive + user JWT.
 * Does not throw.
 */
export async function insertUsageEventsKeepAlive(
  supabase: SupabaseClient<Database>,
  rows: PendingUsageEvent[],
): Promise<void> {
  if (rows.length === 0) return;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const { url, anonKey } = getPublicSupabaseEnv();
    const body = JSON.stringify(
      rows.map((r) => ({
        category: r.category,
        name: r.name,
        properties: r.properties ?? {},
        duration_ms: r.duration_ms ?? null,
      })),
    );
    await fetch(`${url}/rest/v1/usage_events`, {
      method: 'POST',
      keepalive: true,
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        Prefer: 'return=minimal',
      },
      body,
    });
  } catch {
    /* ignore */
  }
}
