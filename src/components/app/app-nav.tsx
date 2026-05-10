import Link from 'next/link';
import { AppMainNavMobile } from '@/components/app/app-main-nav-mobile';
import { APP_MAIN_NAV_LINKS } from '@/components/app/app-nav-links';
import { PrmGlobalSearchTrigger } from '@/components/app/prm-global-search';
import type { PrmSupabaseContext } from '@/lib/prm/context';
import { UserMenu } from '@/components/app/user-menu';

type AppNavProps = {
  context: Pick<PrmSupabaseContext, 'accountEmail' | 'accountDisplayName'>;
};

export function AppNav({ context }: AppNavProps) {
  return (
    <header className="relative z-[101] border-b border-accent-sky/35 bg-surface-strong/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:px-10 md:flex-row md:flex-wrap md:items-center md:justify-between lg:px-12">
        <div className="flex min-w-0 flex-nowrap items-center gap-3 md:gap-6">
          <Link
            href="/people"
            className="font-display text-xl tracking-tight text-foreground"
          >
            Tether
          </Link>
          <nav
            aria-label="Main"
            className="hidden flex-wrap gap-4 text-sm font-semibold text-muted md:flex"
          >
            {APP_MAIN_NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex min-w-0 w-full flex-1 items-center gap-3 md:w-auto md:max-w-xl md:justify-end">
          <PrmGlobalSearchTrigger className="min-w-0 flex-1 max-w-full md:max-w-[min(22rem,42vw)]" />
          <AppMainNavMobile
            accountEmail={context.accountEmail}
            accountDisplayName={context.accountDisplayName}
          />
          <div className="hidden shrink-0 md:block">
            <UserMenu
              accountEmail={context.accountEmail}
              accountDisplayName={context.accountDisplayName}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
