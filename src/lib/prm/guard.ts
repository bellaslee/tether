import "server-only";

import { redirect } from "next/navigation";
import { getPrmSupabaseContext, type PrmSupabaseContext } from "@/lib/prm/context";

export async function requirePrmAccess(): Promise<PrmSupabaseContext> {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}
