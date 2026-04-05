'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/settings', label: 'Label settings', exact: true },
  { href: '/settings/profile', label: 'Profile settings', exact: false },
] as const;

export function SettingsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings areas"
      className="flex flex-wrap gap-2 pb-6"
    >
      {tabs.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-accent-soft text-accent'
                : 'text-muted hover:bg-white/60 hover:text-foreground',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
