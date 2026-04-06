import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PersonDeleteSection } from '@/components/people/person-delete-section';
import { PersonForm } from '@/components/people/person-form';
import { requirePrmAccess } from '@/lib/prm/guard';
import { personShownName } from '@/lib/people/list-name';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPersonPage(props: PageProps) {
  const { id } = await props.params;
  const ctx = await requirePrmAccess();

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
    <main className="prm-form-shell max-w-4xl">
      <div>
        <Link
          href={`/people/${person.id}`}
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          ← Back to profile
        </Link>
        <p className="prm-eyebrow mt-4">Profile</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Edit {personShownName(person)}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
          Keep this feeling honest — tweak what helps you show up thoughtfully
          next time.
        </p>
      </div>
      <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        {(categories ?? []).length === 0 ? (
          <p className="text-sm text-muted">
            Categories are still loading for your account. Refresh in a moment or sign out and back in.
          </p>
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
