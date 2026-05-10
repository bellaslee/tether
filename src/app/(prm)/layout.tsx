import type { ReactNode } from 'react';
import { AppNav } from '@/components/app/app-nav';
import { HashScrollAfterNavigation } from '@/components/app/hash-scroll-after-navigation';
import {
  PrmGlobalSearchProvider,
} from '@/components/app/prm-global-search';
import { PrmUsageProvider } from '@/components/app/prm-usage-provider';
import { SiteFooter } from '@/components/app/site-footer';
import { requirePrmAccess } from '@/lib/prm/guard';

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const context = await requirePrmAccess();

  return (
    <PrmGlobalSearchProvider>
      <HashScrollAfterNavigation />
      <div className="flex min-h-full flex-1 flex-col">
        <AppNav context={context} />
        <PrmUsageProvider>
          <div className="flex flex-1 flex-col">{children}</div>
        </PrmUsageProvider>
        <SiteFooter />
      </div>
    </PrmGlobalSearchProvider>
  );
}
