import Link from "next/link";
import { PersonForm } from "@/components/people/person-form";
import { requirePrmAccess } from "@/lib/prm/guard";

const PAGE_COPY = {
  backLink: "← Back to people",
  hero: {
    eyebrow: "Your circle",
    title: "Add someone",
    description:
      "Capture the basics now; you can always deepen the story later with notes and moments.",
  },
  categoriesLoading:
    "Categories are still loading for your account. Refresh in a moment or sign out and back in.",
} as const;

export default async function NewPersonPage() {
  const ctx = await requirePrmAccess();
  const { data: categories, error } = await ctx.client
    .from("person_categories")
    .select("id, name")
    .eq("user_id", ctx.userId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="prm-form-shell max-w-4xl">
      <div>
        <Link href="/people" className="text-sm font-semibold text-muted underline-offset-4 hover:underline">
          {PAGE_COPY.backLink}
        </Link>
        <p className="prm-eyebrow mt-4">{PAGE_COPY.hero.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{PAGE_COPY.hero.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
          {PAGE_COPY.hero.description}
        </p>
      </div>
      <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        {(categories ?? []).length === 0 ? (
          <p className="text-sm text-muted">{PAGE_COPY.categoriesLoading}</p>
        ) : (
          <PersonForm mode="create" categories={categories ?? []} />
        )}
      </div>
    </main>
  );
}
