import Link from "next/link";
import { PersonForm } from "@/components/people/person-form";

export default function NewPersonPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <Link href="/people" className="text-sm font-semibold text-muted underline-offset-4 hover:underline">
          ← Back to people
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-tight">Add someone</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          Capture the basics now; you can always deepen the story later with notes and moments.
        </p>
      </div>
      <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <PersonForm mode="create" />
      </div>
    </main>
  );
}
