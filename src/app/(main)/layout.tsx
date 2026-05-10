import type { ReactNode } from 'react';
import { AccountTimezoneBootstrap } from '@/components/app/account-timezone-bootstrap';
import { AppNav } from '@/components/app/app-nav';
import { HashScrollAfterNavigation } from '@/components/app/hash-scroll-after-navigation';
import {
  GlobalSearchProvider,
} from '@/components/app/global-search';
import { UsageProvider } from '@/components/app/usage-provider';
import { SiteFooter } from '@/components/app/site-footer';
import { requireAccountAccess } from '@/lib/account/guard';

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const context = await requireAccountAccess();

  return (
    <GlobalSearchProvider>
      <AccountTimezoneBootstrap needsSync={!context.accountTimeZone} />
      <HashScrollAfterNavigation />
      <div className="flex min-h-full flex-1 flex-col">
        <AppNav context={context} />
        <UsageProvider>
          <div className="flex flex-1 flex-col">{children}</div>
        </UsageProvider>
        <SiteFooter />
      </div>
    </GlobalSearchProvider>
  );
}
