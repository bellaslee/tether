import { SiteFooter } from '@/components/app/site-footer';
import { ButtonLink } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { getAccountSupabaseContext } from '@/lib/account/context';

const PAGE_COPY = {
  badges: {
    product: 'Tether',
    status: 'Open beta',
  },
  hero: {
    title: 'Remember what matters about people.',
    lead: 'A private system that turns your conversations into memory, so you can show up better.',
    supporting:
      'If you already journal your life, you know how much a few quick notes can help. This is that habit, but for friends, so you can pick up where you really left off.',
    signUp: 'Sign up',
    signIn: 'Sign in',
    footnote:
      'Capture what mattered while it is fresh. Before you see them again, you already have a thread to follow. Less replaying the last hangout in your head, more room to be there when you arrive.',
  },
  previewColumn: {
    title: 'From conversation to clarity',
    quickNote: 'A quick note',
    whatYouKeep: 'What you keep',
    beforeAgain: 'Before you see them again',
    listBullet: '·',
  },
  flowMoments: [
    {
      title: 'After a hangout',
      subtitle: 'Capture',
      body: 'Jot a few sentences while it is fresh: what you talked about, what mattered to them, what you promised yourself you would follow up on.',
    },
    {
      title: 'In the background',
      subtitle: 'Organize',
      body: 'Your notes turn into a clear picture over time—summaries you can edit, things worth remembering, and gentle prompts so nothing important slips away.',
    },
    {
      title: 'Before you see them',
      subtitle: 'Recall',
      body: 'Open their page and see what to ask about next, what is going on in their life, and what you wanted to say—without digging through old threads.',
    },
  ],
  flowPreview: {
    rawNote:
      '“Maya mentioned she is switching teams in March and wants to try pottery on weekends.”',
    structured: [
      'Career change around March',
      'Interested in pottery / weekend hobby',
    ],
    brief:
      'Ask how the new team is settling in; mention the pottery class idea if it comes up.',
  },
  closing: {
    quote:
      'It is not about knowing more people. It is about showing up for the ones you already care about.',
    signUp: 'Sign up',
    signIn: 'Sign in',
  },
} as const;

export default async function Home() {
  const ctx = await getAccountSupabaseContext();
  if (ctx) {
    redirect('/people');
  }

  const { flowMoments, flowPreview } = PAGE_COPY;

  return (
    <>
      <main className="shell-gutter-x mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 py-8">
        <section className="card-surface overflow-hidden rounded-[2rem] border border-border-soft border-t-2 border-t-accent-sun/55">
          <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:px-12 lg:py-12">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-accent-sky/50 bg-accent-sky-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  {PAGE_COPY.badges.product}
                </div>
                <div className="inline-flex items-center rounded-full border border-accent-soft bg-accent-soft/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground/80">
                  {PAGE_COPY.badges.status}
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-4xl leading-none tracking-tight text-balance sm:text-6xl">
                  {PAGE_COPY.hero.title}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-foreground/90">
                  {PAGE_COPY.hero.lead}
                </p>
                <p className="max-w-2xl text-base leading-7 text-muted">
                  {PAGE_COPY.hero.supporting}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ButtonLink href="/signup" variant="primary" size="lg">
                  {PAGE_COPY.hero.signUp}
                </ButtonLink>
                <ButtonLink href="/login" variant="secondaryMuted" size="lg">
                  {PAGE_COPY.hero.signIn}
                </ButtonLink>
              </div>
              <p className="text-sm leading-6 text-muted">
                {PAGE_COPY.hero.footnote}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                {PAGE_COPY.previewColumn.title}
              </p>
              <div className="space-y-3 rounded-[1.5rem] border border-border-soft border-l-[3px] border-l-accent-sky/75 bg-surface/80 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {PAGE_COPY.previewColumn.quickNote}
                </p>
                <p className="text-sm italic leading-7 text-foreground/85">
                  {flowPreview.rawNote}
                </p>
              </div>
              <div className="space-y-2 rounded-[1.5rem] border border-border-soft border-l-[3px] border-l-accent-sun/75 bg-surface/80 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {PAGE_COPY.previewColumn.whatYouKeep}
                </p>
                <ul className="space-y-2 text-sm leading-7 text-foreground/85">
                  {flowPreview.structured.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-accent" aria-hidden="true">
                        {PAGE_COPY.previewColumn.listBullet}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 rounded-[1.5rem] border border-border-soft border-l-[3px] border-l-accent/75 bg-surface/80 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {PAGE_COPY.previewColumn.beforeAgain}
                </p>
                <p className="text-sm leading-7 text-foreground/90">
                  {flowPreview.brief}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {flowMoments.map((block, i) => (
            <article
              key={block.title}
              className={`card-surface flex flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8 ${
                i === 0
                  ? 'border-t-2 border-t-accent-sun/50'
                  : i === 1
                    ? 'border-t-2 border-t-accent-sky/45'
                    : 'border-t-2 border-t-accent/40'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {block.subtitle}
              </p>
              <h2 className="mt-2 font-display text-xl leading-tight sm:text-2xl">
                {block.title}
              </h2>
              <p className="mt-4 flex-1 text-sm leading-7 text-muted">
                {block.body}
              </p>
            </article>
          ))}
        </section>

        <section className="card-surface rounded-[1.75rem] border border-border-soft px-6 py-10 text-center sm:px-10">
          <blockquote className="mx-auto max-w-2xl font-display text-xl leading-snug tracking-tight text-balance sm:text-3xl">
            {PAGE_COPY.closing.quote}
          </blockquote>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" variant="primary" size="lg">
              {PAGE_COPY.closing.signUp}
            </ButtonLink>
            <ButtonLink href="/login" variant="secondaryMuted" size="lg">
              {PAGE_COPY.closing.signIn}
            </ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
