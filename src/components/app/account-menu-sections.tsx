'use client';

import Link from 'next/link';
import { signOutAction } from '@/lib/actions/auth';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { Button } from '@/components/ui/button';

export const ACCOUNT_MENU_ITEM_CLASS =
  'block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

type AccountMenuSectionsProps = {
  accountEmail?: string;
  onNavigate?: () => void;
  /** Pass `menuitem` when used inside `role="menu"` (desktop dropdown). */
  linkRole?: 'menuitem';
};

export function AccountMenuSections({
  accountEmail,
  onNavigate,
  linkRole,
}: AccountMenuSectionsProps) {
  return (
    <>
      {accountEmail ? (
        <p
          className="border-b border-border-soft px-3 py-2 text-xs leading-snug text-muted"
          role="presentation"
        >
          {accountEmail}
        </p>
      ) : null}

      <div className="p-1.5">
        <ThemeToggle />
        <Link
          href="/settings"
          role={linkRole}
          className={ACCOUNT_MENU_ITEM_CLASS}
          onClick={onNavigate}
        >
          Label settings
        </Link>
        <Link
          href="/settings/profile"
          role={linkRole}
          className={ACCOUNT_MENU_ITEM_CLASS}
          onClick={onNavigate}
        >
          Profile settings
        </Link>
        <form
          action={signOutAction}
          className="mt-1 border-t border-border-soft pt-1.5"
        >
          <Button
            type="submit"
            variant="secondaryMuted"
            size="sm"
            fullWidth
            className="rounded-xl"
            role={linkRole}
          >
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}
