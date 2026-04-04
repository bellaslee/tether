import { ButtonLink } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { SetupStatus } from '@/components/home/setup-status';
import { getCrmSupabaseContext } from '@/lib/crm/context';
import { getSetupStatus } from '@/lib/env';

const plannedAreas = [
  {
    name: 'People',
    description:
      'Profiles, context, and the details you want to remember before reaching out.',
  },
  {
    name: 'Timeline',
    description:
      'A shared history of interactions, from quick texts to multi-person hangouts.',
  },
  {
    name: 'Tasks',
    description:
      'Gentle follow-ups and reminders that stay grounded in real relationship context.',
  },
  {
    name: 'Ask',
    description:
      'Later phases will add grounded AI recall on top of editable source material.',
  },
] as const;

const setupSteps = [
  'Copy .env.example to .env.local.',
  'Run npx supabase start, then npx supabase status -o env to collect local credentials.',
  'Fill in the Supabase variables and add your OpenAI API key when you are ready for AI features.',
  'Run npm run dev and open http://localhost:3000.',
] as const;

export default async function Home() {
  const ctx = await getCrmSupabaseContext();
  if (ctx) {
    redirect('/people');
  }

  const setupStatus = getSetupStatus();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-8 sm:px-10 lg:px-12">
      <section className="card-surface overflow-hidden rounded-[2rem] border border-border-soft">
        <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.3fr_0.9fr] lg:px-12 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-border-soft bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Tether
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl leading-none tracking-tight text-balance sm:text-6xl">
                Remember people with warmth, context, and care.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">
                The foundation is now a real Next.js and Supabase app instead of
                a docs-only repo. This first shell keeps the tone personal,
                shows what still needs configuration, and gives us a clean base
                for people, timelines, notes, and grounded AI later on.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <ButtonLink href="/login" variant="primary" size="lg">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" variant="secondaryMuted" size="lg">
                Create account
              </ButtonLink>
              <ButtonLink
                href="https://supabase.com/docs/guides/local-development/cli/getting-started"
                variant="secondaryMuted"
                size="lg"
              >
                Local Supabase guide
              </ButtonLink>
            </div>
          </div>

          <SetupStatus status={setupStatus} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <h2 className="font-display text-3xl leading-tight">
            What this starter already proves
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-muted">
            <li>
              Next.js App Router is running from <code>src/app</code> with
              TypeScript and Tailwind.
            </li>
            <li>
              Supabase local config and the first Phase 1 migration are checked
              in under <code>supabase/</code>.
            </li>
            <li>
              Database and OpenAI helpers live under <code>src/lib</code> with
              server-only boundaries in place.
            </li>
            <li>
              The home page stays useful even before secrets are configured, so
              setup errors are visible instead of silent.
            </li>
          </ul>
        </div>

        <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <h2 className="font-display text-3xl leading-tight">
            Local setup flow
          </h2>
          <ol className="mt-6 space-y-4 text-sm leading-7 text-muted">
            {setupSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Planned product areas
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight">
              A CRM for relationships, not pipeline management
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted">
            The pages below are the next obvious milestones. They are listed
            here so the scaffold reads like the product we are actually
            building.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plannedAreas.map((area) => (
            <article
              key={area.name}
              className="rounded-[1.5rem] border border-border-soft bg-white/60 p-5"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
                {area.name}
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground/80">
                {area.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
