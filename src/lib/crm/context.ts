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

  return { client, userId: user.id, bypass: false };
}
