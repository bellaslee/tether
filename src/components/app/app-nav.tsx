import Link from 'next/link';
import type { PrmSupabaseContext } from '@/lib/prm/context';
import { UserMenu } from '@/components/app/user-menu';

type AppNavProps = {
  context: Pick<PrmSupabaseContext, 'accountEmail' | 'accountDisplayName'>;
};

export function AppNav({ context }: AppNavProps) {
  return (
    <header className="relative z-[101] border-b border-border-soft bg-surface-strong/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12">
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/people"
            className="font-display text-xl tracking-tight text-foreground"
          >
            Tether
          </Link>
          <nav
            aria-label="Main"
            className="flex flex-wrap gap-4 text-sm font-semibold text-muted"
          >
            <Link href="/people" className="transition hover:text-foreground">
              People
            </Link>
            <Link href="/timeline" className="transition hover:text-foreground">
              Timeline
            </Link>
            <Link href="/reminders" className="transition hover:text-foreground">
              Reminders
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu
            accountEmail={context.accountEmail}
            accountDisplayName={context.accountDisplayName}
          />
        </div>
      </div>
    </header>
  );
}
