'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AccountMenuSections } from '@/components/app/account-menu-sections';
import { APP_MAIN_NAV_LINKS } from '@/components/app/app-nav-links';
import { listRowCardClassName } from '@/components/ui/list-row-card';

type AppMainNavMobileProps = {
  accountEmail?: string;
  accountDisplayName?: string | null;
};

/** Remount on route change so the menu closes without syncing state in an effect. */
export function AppMainNavMobile({
  accountEmail,
  accountDisplayName,
}: AppMainNavMobileProps) {
  const pathname = usePathname();
  return (
    <AppMainNavMobileInner
      key={pathname}
      accountEmail={accountEmail}
      accountDisplayName={accountDisplayName}
    />
  );
}

function AppMainNavMobileInner({
  accountEmail,
  accountDisplayName,
}: AppMainNavMobileProps) {
  const [open, setOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(false);
  const menuId = useId();
  const profileSectionId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      triggerRef.current?.focus();
    }
    prevOpenRef.current = open;
  }, [open]);

  const initial =
    accountDisplayName?.trim()?.[0]?.toUpperCase() ??
    accountEmail?.trim()?.[0]?.toUpperCase() ??
    null;

  const linkClass = listRowCardClassName(
    'block text-sm font-semibold text-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  );

  const drawer =
    open && typeof document !== 'undefined' ? (
      <>
        <div
          className="fixed inset-0 z-[110] bg-black/40"
          aria-hidden
          onClick={() => setOpen(false)}
        />
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          className="fixed inset-y-0 right-0 z-[111] flex h-dvh w-full max-w-sm flex-col overflow-hidden border-l border-border-soft bg-surface-strong/95 shadow-xl backdrop-blur-md"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-accent-sky/35 px-4 py-3">
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              Menu
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border-soft bg-white/60 text-foreground shadow-sm transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden strokeWidth={2} />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
          >
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border-soft bg-white/60">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-expanded={profileExpanded}
                  aria-controls={profileSectionId}
                  id={`${profileSectionId}-trigger`}
                  onClick={() => setProfileExpanded((e) => !e)}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-soft bg-white/80 text-foreground shadow-sm">
                    {initial ? (
                      <span className="font-display text-lg leading-none tracking-tight">
                        {initial}
                      </span>
                    ) : (
                      <UserIcon className="h-5 w-5 text-muted" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      Account
                    </span>
                    {accountDisplayName?.trim() ? (
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {accountDisplayName.trim()}
                      </span>
                    ) : accountEmail?.trim() ? (
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {accountEmail.trim()}
                      </span>
                    ) : null}
                  </span>
                  {profileExpanded ? (
                    <ChevronUp
                      className="h-5 w-5 shrink-0 text-muted"
                      aria-hidden
                      strokeWidth={2}
                    />
                  ) : (
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-muted"
                      aria-hidden
                      strokeWidth={2}
                    />
                  )}
                </button>
                {profileExpanded ? (
                  <div
                    id={profileSectionId}
                    role="region"
                    aria-labelledby={`${profileSectionId}-trigger`}
                    className="border-t border-border-soft pb-2"
                  >
                    <AccountMenuSections
                      accountEmail={accountEmail}
                      onNavigate={() => setOpen(false)}
                    />
                  </div>
                ) : null}
              </div>

              <nav aria-label="Main" className="flex flex-col gap-2">
                {APP_MAIN_NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </>
    ) : null;

  return (
    <div className="md:hidden shrink-0">
      <button
        ref={triggerRef}
        type="button"
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border-soft bg-white/60 text-foreground shadow-sm transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={open ? 'Close main menu' : 'Open main menu'}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden strokeWidth={2} />
        ) : (
          <Menu className="h-5 w-5" aria-hidden strokeWidth={2} />
        )}
      </button>

      {drawer ? createPortal(drawer, document.body) : null}
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
