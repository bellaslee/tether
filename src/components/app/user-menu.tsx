'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { signOutAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';

type UserMenuProps = {
  bypass: boolean;
  accountEmail?: string;
  accountDisplayName?: string | null;
};

export function UserMenu({
  bypass,
  accountEmail,
  accountDisplayName,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  const initial =
    accountDisplayName?.trim()?.[0]?.toUpperCase() ??
    accountEmail?.trim()?.[0]?.toUpperCase() ??
    null;

  const itemClass =
    'block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-soft bg-white/60 text-foreground shadow-sm transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
      >
        {initial ? (
          <span className="font-display text-lg leading-none tracking-tight">
            {initial}
          </span>
        ) : (
          <UserIcon className="h-5 w-5 text-muted" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          className="card-surface absolute right-0 z-50 mt-2 min-w-[12.5rem] rounded-2xl border border-border-soft py-2 shadow-[0_12px_40px_rgba(66,42,26,0.12)]"
        >
          {!bypass && accountEmail ? (
            <p
              className="border-b border-border-soft px-3 py-2 text-xs leading-snug text-muted"
              role="presentation"
            >
              {accountEmail}
            </p>
          ) : null}

          <div className="p-1.5">
            <Link
              href="/settings"
              role="menuitem"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              Label settings
            </Link>
            {!bypass ? (
              <Link
                href="/settings/profile"
                role="menuitem"
                className={itemClass}
                onClick={() => setOpen(false)}
              >
                Profile settings
              </Link>
            ) : null}
            {!bypass ? (
              <form action={signOutAction} className="mt-1 border-t border-border-soft pt-1.5">
                <Button
                  type="submit"
                  variant="secondaryMuted"
                  size="sm"
                  fullWidth
                  className="rounded-xl"
                  role="menuitem"
                >
                  Sign out
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
