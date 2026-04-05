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
      className="flex flex-wrap gap-4 pb-6 text-sm font-semibold text-muted"
    >
      {tabs.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              'transition hover:text-foreground',
              active ? 'text-foreground' : 'text-muted',
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
