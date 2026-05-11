import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PersonDeleteSection } from '@/components/people/person-delete-section';
import { PersonForm } from '@/components/people/person-form';
import { requireAccountAccess } from '@/lib/account/guard';
import { personShownName } from '@/lib/people/list-name';

const PAGE_COPY = {
  backLink: '← Back to profile',
  hero: {
    titlePrefix: 'Edit ',
    subtitle: 'Update their profile fields. To remove them from the app, use Delete at the bottom.',
  },
  categoriesLoading:
    'Categories are still loading for your account. Refresh in a moment or sign out and back in.',
} as const;

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPersonPage(props: PageProps) {
  const { id } = await props.params;
  const ctx = await requireAccountAccess();

  const { data: person, error } = await ctx.client
    .from('people')
    .select('*')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!person) {
    notFound();
  }

  const { data: categories, error: categoriesError } = await ctx.client
    .from('person_categories')
    .select('id, name')
    .eq('user_id', ctx.userId)
    .order('sort_order', { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  return (
    <main className="form-shell max-w-4xl">
      <div>
        <Link
          href={`/people/${person.id}`}
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          {PAGE_COPY.backLink}
        </Link>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          {PAGE_COPY.hero.titlePrefix}
          {personShownName(person)}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
          {PAGE_COPY.hero.subtitle}
        </p>
      </div>
      <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        {(categories ?? []).length === 0 ? (
          <p className="text-sm text-muted">{PAGE_COPY.categoriesLoading}</p>
        ) : (
          <PersonForm mode="edit" person={person} categories={categories ?? []} />
        )}
      </div>
      <div className="mt-8">
        <PersonDeleteSection
          personId={person.id}
          personLabel={personShownName(person)}
        />
      </div>
    </main>
  );
}
