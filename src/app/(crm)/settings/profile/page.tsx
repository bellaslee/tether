import Link from 'next/link';
import type { Metadata } from 'next';
import { ProfileSettingsForms } from '@/components/app/profile-settings-forms';
import { requireCrmAccess } from '@/lib/crm/guard';
import { createSupabaseServerClient } from '@/lib/db/server';

export const metadata: Metadata = {
  title: 'Profile settings · Personal CRM',
};

export default async function ProfileSettingsPage() {
  await requireCrmAccess();

  const client = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error(error?.message ?? 'Not signed in.');
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const rawName = meta?.full_name;
  const defaultName =
    typeof rawName === 'string' && rawName.trim().length > 0 ? rawName.trim() : '';

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <Link
          href="/people"
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          ← People
        </Link>
        <p className="crm-eyebrow mt-4">Your account</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Profile settings
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          Update how you appear and keep your password current.
        </p>
      </div>

      {user.email ? (
        <div className="rounded-2xl border border-border-soft bg-white/60 px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Email
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{user.email}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Email sign-in is managed by your auth provider. Contact support or
            your project admin if you need to change it.
          </p>
        </div>
      ) : null}

      <ProfileSettingsForms defaultName={defaultName} />
    </main>
  );
}
