import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PersonForm } from '@/components/people/person-form';
import { requireCrmAccess } from '@/lib/crm/guard';
import { personShownName } from '@/lib/people/list-name';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPersonPage(props: PageProps) {
  const { id } = await props.params;
  const ctx = await requireCrmAccess();

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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <Link
          href={`/people/${person.id}`}
          className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
        >
          ← Back to profile
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-tight">
          Edit {personShownName(person)}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          Keep this feeling honest — tweak what helps you show up thoughtfully
          next time.
        </p>
      </div>
      <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <PersonForm mode="edit" person={person} />
      </div>
    </main>
  );
}
