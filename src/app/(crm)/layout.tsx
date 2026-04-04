import type { ReactNode } from "react";
import { AppNav } from "@/components/app/app-nav";
import { requireCrmAccess } from "@/lib/crm/guard";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const context = await requireCrmAccess();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav context={context} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
