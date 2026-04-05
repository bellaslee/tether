import { ButtonLink } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { SetupStatus } from '@/components/home/setup-status';
import { getCrmSupabaseContext } from '@/lib/crm/context';
import { getSetupStatus } from '@/lib/env';

const flowMoments = [
  {
    title: 'After a hangout',
    subtitle: 'Capture',
    body:
      'Jot a few sentences while it is fresh: what you talked about, what mattered to them, what you promised yourself you would follow up on.',
  },
  {
    title: 'In the background',
    subtitle: 'Organize',
    body:
      'Your notes turn into a clear picture over time—summaries you can edit, things worth remembering, and gentle prompts so nothing important slips away.',
  },
  {
    title: 'Before you see them',
    subtitle: 'Recall',
    body:
      'Open their page and see what to ask about next, what is going on in their life, and what you wanted to say—without digging through old threads.',
  },
] as const;

const flowPreview = {
  rawNote:
    '“Maya mentioned she is switching teams in March and wants to try pottery on weekends.”',
  structured: [
    'Career change around March',
    'Interested in pottery / weekend hobby',
  ],
  brief:
    'Ask how the new team is settling in; mention the pottery class idea if it comes up.',
} as const;

const upcomingFeatures = [
  {
    name: 'Reminders that make sense',
    description:
      'Follow-ups tied to real context—not generic nudges—so you reconnect with intention.',
  },
  {
    name: 'Ask your memory',
    description:
      'Pose questions in plain language and get answers grounded in what you actually wrote, with room to edit and correct.',
  },
  {
    name: 'Smarter recall across people',
    description:
      'Search and surface moments across your circle when fuzzy memory is not enough.',
  }
] as const;

const setupSteps = [
  'Copy .env.example to .env.local.',
  'Run npx supabase start, then npx supabase status -o env to collect local credentials.',
  'Fill in the Supabase variables and add your OpenAI API key when you are ready for memory features.',
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
        <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:px-12 lg:py-12">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-full border border-border-soft bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                Tether
              </div>
              <div className="inline-flex items-center rounded-full border border-accent-soft bg-accent-soft/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground/80">
                Open beta
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl leading-none tracking-tight text-balance sm:text-6xl">
                Remember what matters about people.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-foreground/90">
                A private system that turns your conversations into memory, so
                you can show up better.
              </p>
              <p className="max-w-2xl text-base leading-7 text-muted">
                If you already journal your life, you know how much a few
                quick notes can help. This is that habit, but for friends, so you can pick
                up where you really left off.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <ButtonLink href="/signup" variant="primary" size="lg">
                Sign up
              </ButtonLink>
              <ButtonLink href="/login" variant="secondaryMuted" size="lg">
                Sign in
              </ButtonLink>
            </div>
            <p className="text-sm leading-6 text-muted">
              Capture what mattered while it is fresh. Before you see them
              again, you already have a thread to follow. Less replaying the last
              hangout in your head, more room to be there when you arrive.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              From conversation to clarity
            </p>
            <div className="space-y-3 rounded-[1.5rem] border border-border-soft bg-white/72 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                A quick note
              </p>
              <p className="text-sm italic leading-7 text-foreground/85">
                {flowPreview.rawNote}
              </p>
            </div>
            <div className="space-y-2 rounded-[1.5rem] border border-border-soft bg-white/72 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                What you keep
              </p>
              <ul className="space-y-2 text-sm leading-7 text-foreground/85">
                {flowPreview.structured.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-accent" aria-hidden="true">
                      ·
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.5rem] border border-accent-soft bg-accent-soft/40 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Before you see them again
              </p>
              <p className="mt-2 text-sm leading-7 text-foreground/90">
                {flowPreview.brief}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {flowMoments.map((block) => (
          <article
            key={block.title}
            className="card-surface flex flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {block.subtitle}
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight">
              {block.title}
            </h2>
            <p className="mt-4 flex-1 text-sm leading-7 text-muted">
              {block.body}
            </p>
          </article>
        ))}
      </section>

      <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              On the roadmap
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight">
              Upcoming features
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted">
            The core idea is simple: private memory you control, not a contact
            database or a sales tool. Here is what we are building toward next.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcomingFeatures.map((item) => (
            <article
              key={item.name}
              className="rounded-[1.5rem] border border-border-soft bg-white/60 p-5"
            >
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="card-surface rounded-[1.75rem] border border-border-soft px-6 py-10 text-center sm:px-10">
        <blockquote className="mx-auto max-w-2xl font-display text-2xl leading-snug tracking-tight text-balance sm:text-3xl">
          It is not about knowing more people. It is about showing up for the
          ones you already care about.
        </blockquote>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/signup" variant="primary" size="lg">
            Sign up
          </ButtonLink>
          <ButtonLink href="/login" variant="secondaryMuted" size="lg">
            Sign in
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SetupStatus status={setupStatus} />

        <div className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <h2 className="font-display text-3xl leading-tight">
            Running locally
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            If you are developing Tether on your machine, wire Supabase and
            optional keys using the checklist beside this box, then follow the
            steps below.
          </p>
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
          <div className="mt-6">
            <ButtonLink
              href="https://supabase.com/docs/guides/local-development/cli/getting-started"
              variant="secondaryMuted"
            >
              Local Supabase guide
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
