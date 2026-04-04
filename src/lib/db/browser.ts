import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/database.types";
import { getPublicSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { anonKey, url } = getPublicSupabaseEnv();

  return createBrowserClient<Database>(url, anonKey);
}
