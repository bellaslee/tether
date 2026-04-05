import type { ReactNode } from 'react';
import { AppNav } from '@/components/app/app-nav';
import { PrmUsageProvider } from '@/components/app/prm-usage-provider';
import { SiteFooter } from '@/components/app/site-footer';
import { requirePrmAccess } from '@/lib/prm/guard';

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const context = await requirePrmAccess();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav context={context} />
      <PrmUsageProvider>
        <div className="flex flex-1 flex-col">{children}</div>
      </PrmUsageProvider>
      <SiteFooter />
    </div>
  );
}
