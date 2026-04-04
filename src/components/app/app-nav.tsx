import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import type { CrmSupabaseContext } from "@/lib/crm/context";

type AppNavProps = {
  context: Pick<CrmSupabaseContext, "bypass">;
};

export function AppNav({ context }: AppNavProps) {
  return (
    <header className="border-b border-border-soft bg-surface-strong/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/people" className="font-display text-xl tracking-tight text-foreground">
            Personal CRM
          </Link>
          <nav aria-label="Main" className="flex flex-wrap gap-4 text-sm font-semibold text-muted">
            <Link href="/people" className="transition hover:text-foreground">
              People
            </Link>
            <Link
              href="/people/categories"
              className="transition hover:text-foreground"
            >
              Categories
            </Link>
            <Link href="/timeline" className="transition hover:text-foreground">
              Timeline
            </Link>
            <Link href="/interactions/new" className="transition hover:text-foreground">
              Log interaction
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {context.bypass ? (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              Local dev (no sign-in)
            </span>
          ) : (
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full border border-border-soft bg-white/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white"
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
