import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import { assertLocalDevBypassAllowed, getServiceRoleSupabaseEnv } from "@/lib/env";

export function createSupabaseServiceRoleClient() {
  assertLocalDevBypassAllowed();
  const { serviceRoleKey, url } = getServiceRoleSupabaseEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
