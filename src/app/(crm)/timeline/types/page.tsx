import Link from 'next/link';
import type { Metadata } from 'next';
import { ManageInteractionTypesPanel } from '@/components/timeline/manage-interaction-types-panel';
import { requireCrmAccess } from '@/lib/crm/guard';

export const metadata: Metadata = {
  title: 'Timeline types · Personal CRM',
};

export default async function ManageInteractionTypesPage() {
  const ctx = await requireCrmAccess();
  const { data: types, error } = await ctx.client
    .from('interaction_types')
    .select('id, name, sort_order, slug')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <Link
          href="/timeline"
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          ← Timeline
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          Settings
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Timeline types
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          Labels for kinds of moments — plus a reserved type for category
          changes on someone&apos;s profile.
        </p>
      </div>

      <ManageInteractionTypesPanel types={types ?? []} />
    </main>
  );
}
