import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/db/server";
import { createSupabaseServiceRoleClient } from "@/lib/db/service-role";
import type { Database } from "@/lib/db/database.types";
import {
  getLocalDevBypassUserId,
  hasPublicSupabaseEnv,
  isLocalDevBypassAuthEnabled,
} from "@/lib/env";

export type CrmSupabaseContext = {
  client: SupabaseClient<Database>;
  userId: string;
  bypass: boolean;
  /** Set when signed in with Supabase (not local bypass). */
  accountEmail?: string;
  accountDisplayName?: string | null;
};

export async function getCrmSupabaseContext(): Promise<CrmSupabaseContext | null> {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  if (isLocalDevBypassAuthEnabled()) {
    return {
      client: createSupabaseServiceRoleClient(),
      userId: getLocalDevBypassUserId(),
      bypass: true,
    };
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

  return {
    client,
    userId: user.id,
    bypass: false,
    accountEmail: user.email ?? undefined,
    accountDisplayName,
  };
}
