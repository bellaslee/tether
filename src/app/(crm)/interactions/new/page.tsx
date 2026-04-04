import Link from "next/link";
import { GlobalInteractionForm } from "@/components/interactions/global-interaction-form";
import { requireCrmAccess } from "@/lib/crm/guard";
import { toDatetimeLocalInputValue } from "@/lib/datetime";

export default async function NewInteractionPage() {
  const ctx = await requireCrmAccess();

  const { data: people, error } = await ctx.client
    .from("people")
    .select("id, full_name")
    .eq("user_id", ctx.userId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const defaultOccurredAt = toDatetimeLocalInputValue();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <div>
        <Link href="/timeline" className="text-sm font-semibold text-muted underline-offset-4 hover:underline">
          ← Timeline
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-tight">Log a shared moment</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          Pick who this was mainly about, then link anyone else who was part of it. One entry, everyone&apos;s timelines stay in sync.
        </p>
      </div>

      {(people ?? []).length === 0 ? (
        <div className="card-surface rounded-[1.75rem] border border-border-soft p-8 text-sm text-muted">
          Add at least one person before logging interactions.{" "}
          <Link href="/people/new" className="font-semibold text-accent underline-offset-4 hover:underline">
            Create someone
          </Link>
          .
        </div>
      ) : (
        <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <GlobalInteractionForm people={people ?? []} defaultOccurredAt={defaultOccurredAt} />
        </div>
      )}
    </main>
  );
}
