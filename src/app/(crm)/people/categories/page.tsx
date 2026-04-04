import Link from 'next/link';
import type { Metadata } from 'next';
import { ManageCategoriesPanel } from '@/components/people/manage-categories-panel';
import { requireCrmAccess } from '@/lib/crm/guard';

export const metadata: Metadata = {
  title: 'Categories · Personal CRM',
};

export default async function ManageCategoriesPage() {
  const ctx = await requireCrmAccess();
  const { data: categories, error } = await ctx.client
    .from('person_categories')
    .select('id, name, sort_order')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <Link
          href="/people"
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          ← People
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          Settings
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Manage categories
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          These labels describe how someone fits in your life.
        </p>
      </div>

      <ManageCategoriesPanel categories={categories ?? []} />
    </main>
  );
}
