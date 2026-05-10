'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  AccountMenuSections,
} from '@/components/app/account-menu-sections';

type UserMenuProps = {
  accountEmail?: string;
  accountDisplayName?: string | null;
};

export function UserMenu({
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

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface text-foreground shadow-sm transition hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          className="card-surface absolute right-0 z-50 mt-2 min-w-[12.5rem] rounded-2xl border border-border-soft py-2"
        >
          <AccountMenuSections
            accountEmail={accountEmail}
            linkRole="menuitem"
            onNavigate={() => setOpen(false)}
          />
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
