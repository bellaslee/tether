import "server-only";

import { redirect } from "next/navigation";
import { getCrmSupabaseContext, type CrmSupabaseContext } from "@/lib/crm/context";

export async function requireCrmAccess(): Promise<CrmSupabaseContext> {
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}
