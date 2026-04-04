import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { anonKey, url } = getPublicSupabaseEnv();

  return createBrowserClient(url, anonKey);
}
