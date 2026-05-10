import Link from 'next/link';
import type { Metadata } from 'next';
import { ProfileSettingsForms } from '@/components/app/profile-settings-forms';
import { requirePrmAccess } from '@/lib/prm/guard';
import { createSupabaseServerClient } from '@/lib/db/server';
import { listIanaTimeZones } from '@/lib/timezones';

const PAGE_COPY = {
  meta: {
    title: 'Profile settings · Tether',
  },
  backLink: '← People',
  hero: {
    eyebrow: 'Your account',
    title: 'Profile settings',
    description: 'Update how you appear, your time zone, and your password.',
  },
  email: {
    label: 'Email',
    helper:
      'Email sign-in is managed by your auth provider. Contact support or your project admin if you need to change it.',
  },
  errors: {
    notSignedIn: 'Not signed in.',
  },
} as const;

export const metadata: Metadata = {
  title: PAGE_COPY.meta.title,
};

export default async function ProfileSettingsPage() {
  await requirePrmAccess();

  const client = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error(error?.message ?? PAGE_COPY.errors.notSignedIn);
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const rawName = meta?.full_name;
  const defaultName =
    typeof rawName === 'string' && rawName.trim().length > 0 ? rawName.trim() : '';

  const rawTz = meta?.timezone;
  const savedTimezone =
    typeof rawTz === 'string' && rawTz.trim().length > 0 ? rawTz.trim() : '';

  const baseZones = listIanaTimeZones();
  const ianaTimeZones =
    savedTimezone && !baseZones.includes(savedTimezone)
      ? [savedTimezone, ...baseZones]
      : baseZones;

  return (
    <main className="prm-shell-gutter-x mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 py-10">
      <div>
        <Link
          href="/people"
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          {PAGE_COPY.backLink}
        </Link>
        <p className="prm-eyebrow mt-4">{PAGE_COPY.hero.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          {PAGE_COPY.hero.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          {PAGE_COPY.hero.description}
        </p>
      </div>

      {user.email ? (
        <div className="rounded-2xl border border-border-soft bg-white/60 px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {PAGE_COPY.email.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{user.email}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {PAGE_COPY.email.helper}
          </p>
        </div>
      ) : null}

      <ProfileSettingsForms
        defaultName={defaultName}
        savedTimezone={savedTimezone}
        ianaTimeZones={ianaTimeZones}
      />
    </main>
  );
}
