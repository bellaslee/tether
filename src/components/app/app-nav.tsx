import Link from 'next/link';
import { AppMainNavMobile } from '@/components/app/app-main-nav-mobile';
import { APP_MAIN_NAV_LINKS } from '@/components/app/app-nav-links';
import { GlobalSearchTrigger } from '@/components/app/global-search';
import type { AccountSupabaseContext } from '@/lib/account/context';
import { UserMenu } from '@/components/app/user-menu';

type AppNavProps = {
  context: Pick<AccountSupabaseContext, 'accountEmail' | 'accountDisplayName'>;
};

export function AppNav({ context }: AppNavProps) {
  return (
    <header className="relative z-[101] border-b border-accent-sky/35 bg-surface-strong/80 backdrop-blur-md">
      <div className="app-nav-inner shell-gutter-x mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
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
          <GlobalSearchTrigger className="min-w-0 flex-1 max-w-full md:max-w-[min(22rem,42vw)]" />
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
