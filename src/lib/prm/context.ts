import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/db/server";
import type { Database } from "@/lib/db/database.types";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { isValidIanaTimeZone } from "@/lib/timezones";

export type PrmSupabaseContext = {
  client: SupabaseClient<Database>;
  userId: string;
  accountEmail?: string;
  accountDisplayName?: string | null;
  /** Saved IANA zone from auth user_metadata, or null if unset. */
  accountTimeZone: string | null;
};

export async function getPrmSupabaseContext(): Promise<PrmSupabaseContext | null> {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  const client = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const rawName = meta?.full_name;
  const accountDisplayName =
    typeof rawName === 'string' && rawName.trim().length > 0
      ? rawName.trim()
      : null;

  const rawTz = meta?.timezone;
  const trimmedTz =
    typeof rawTz === 'string' && rawTz.trim().length > 0 ? rawTz.trim() : '';
  const accountTimeZone =
    trimmedTz && isValidIanaTimeZone(trimmedTz) ? trimmedTz : null;

  return {
    client,
    userId: user.id,
    accountEmail: user.email ?? undefined,
    accountDisplayName,
    accountTimeZone,
  };
}
