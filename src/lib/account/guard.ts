import "server-only";

import { redirect } from "next/navigation";
import { getAccountSupabaseContext, type AccountSupabaseContext } from "@/lib/account/context";

export async function requireAccountAccess(): Promise<AccountSupabaseContext> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}
