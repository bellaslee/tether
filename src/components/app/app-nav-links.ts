export type AppMainNavLink = {
  href: string;
  label: string;
};

export const APP_MAIN_NAV_LINKS: readonly AppMainNavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/people', label: 'People' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/reminders', label: 'Reminders' },
];
