# AGENTS.md

## Project Overview

This repository is for a personal relationship PRM focused on friends first and
networking second.

The product is meant to help the user remember:

- who someone is
- how they know them
- what matters to them
- what changed recently
- what to remember before the next conversation
- when they last talked
- what open loops still exist

The product should feel warm, respectful, and useful. It should not feel like a
sales PRM.

## Product Philosophy

- Build a solid PRM first. AI is a layer on top, not the foundation.
- Optimize for trust, recall, and thoughtful follow-up.
- Friends are the primary use case. Networking support is secondary.
- Avoid creepy automation. The app should assist, not surveil.
- Every AI-generated output should be editable and traceable to source material.

## Target Stack

Unless the user says otherwise, build toward this architecture:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase for auth, Postgres, storage, and row-level security
- `pgvector` for embeddings and semantic search
- OpenAI Responses API for extraction, summaries, and question answering

Architecture defaults once the app is scaffolded:

- Next.js App Router with Server Components by default
- Tailwind-first styling
- Shared UI should live in a predictable place, preferably `src/components` or
  route-local `_components` folders
- Route files should focus on page composition, not large amounts of business
  logic or repeated JSX

## Commands

Once the Next.js app is scaffolded, prefer these standard commands:

- Install dependencies: `npm install`
- Start the dev server: `npm run dev`
- Build for production: `npm run build`
- Run linting: `npm run lint`

## Current Repo State

At the moment, this repo is mostly planning-stage.

Known existing doc:

- [docs/personal-prm-user-stories.md](/Users/bella/Developer/projects/tether/docs/personal-prm-user-stories.md)
- [docs/phase-1-mvp-schema-design.md](/Users/bella/Developer/projects/tether/docs/phase-1-mvp-schema-design.md)
- [.agent/PLANS.md](/Users/bella/Developer/projects/tether/.agent/PLANS.md)
- [docs/plans/initialize-project.md](/Users/bella/Developer/projects/tether/docs/plans/initialize-project.md)

If you add implementation code, keep it consistent with the structure below
unless the user asks for a different layout.

## ExecPlans

Use [.agent/PLANS.md](/.agent/PLANS.md) as the ExecPlan authoring guide.

Actual ExecPlan documents should live under [docs/plans](/docs/plans).

When writing complex features or significant refactors, create or update an
ExecPlan in `docs/plans/<task-name>.md`.

Create or update an ExecPlan there when:

- the task spans multiple files or systems
- the work has non-obvious sequencing
- the implementation has meaningful product or architecture tradeoffs
- the task will likely take more than one focused work session

Do not create an ExecPlan for tiny edits or straightforward one-file changes.

## Intended App Structure

Preferred project layout:

```txt
src/
  app/
    people/
      page.tsx
      [id]/
        page.tsx
    timeline/
      page.tsx
    reminders/
      page.tsx
    inbox/
      page.tsx
    ask/
      page.tsx
    api/
      ingest-note/route.ts
      generate-summary/route.ts
      ask/route.ts

  components/
    people/
    timeline/
    tasks/
    ai/

  lib/
    db/
    ai/
    retrieval/
    people/
    interactions/
    summaries/

supabase/
  migrations/
  functions/
    extract-facts/
    refresh-summary/
    embed-document/
```

Component organization guidance:

- Put route entry points in `src/app/<route>/page.tsx`
- Default to Server Components and add `'use client'` only when browser-only
  state, effects, or event handlers are required
- Keep reusable UI in `src/components` or a route-local `_components` folder
  when it is closely tied to one route
- For larger pages, separate route composition, domain/data helpers, and small
  presentational components when that improves clarity

## Core Data Model

The app should be designed around these core entities:

- `people`
- `contact_methods`
- `interactions`
- `interaction_people`
- `facts`
- `relationship_summaries`
- `tasks`
- `source_documents`
- `document_embeddings`

Important modeling rules:

- `people` is the main contact table
- `interactions` is the heart of the system
- multi-person events should be stored once and linked through
  `interaction_people`
- extracted facts must stay editable
- summaries should reference the source material they are based on
- `relationship_score` should be derived rather than manually entered

## Phase Priorities

Build in this order unless the user asks for something else.

### Phase 1

- auth
- people table
- interactions table
- person detail page
- quick note entry

### Phase 2

- AI fact extraction
- AI summary generation
- reminder tasks

### Phase 3

- embeddings
- semantic search
- ask-my-PRM workflow

### Phase 4

- Google Calendar import
- optional Gmail import
- friend mode versus networking mode behaviors

## UX Guardrails

- The app should support warmth and memory, not pipeline management
- Avoid sales-oriented wording like leads, prospects, funnel, or deal flow
- Show why a reminder or summary exists
- Let users edit or delete extracted facts easily
- Do not auto-import everything by default
- Do not auto-send messages
- Do not add broad scraping or surveillance-like behavior

## Retrieval Guidance

Use hybrid retrieval:

- structured queries first for exact operational questions
- vector search second for fuzzy recall and memory prompts

Examples that should stay structured-first:

- birthdays this month
- people not contacted in 90 days
- networking contacts in Seattle
- friends with upcoming moves

Examples that should use vector retrieval:

- who mentioned burnout recently
- which friend is into ceramics
- what should I remember before dinner with Alex

## AI Guidance

AI in this project should focus on three jobs:

- extraction
- summarization
- question answering

Preferred uses:

- extract structured candidate facts from notes and documents
- detect possible follow-ups or open loops
- generate relationship briefs
- generate recent-changes summaries
- answer natural-language questions over relationship history

Avoid:

- pretending low-confidence guesses are facts
- generating summaries without source grounding
- hiding source context from the user
- auto-taking actions on behalf of the user

## Supabase Best Practices

- Use Supabase as the default backend platform for auth, Postgres, storage, and
  row-level security
- Prefer local Supabase or local Postgres in development over temporary
  JSON-file persistence
- Keep all schema changes in migration files instead of applying manual one-off
  database edits
- **Always run Supabase migrations** when database changes are made: after adding
  or editing SQL under `supabase/migrations/`, apply them to the target database
  (for example `npx supabase db push --local` for local development, or the
  equivalent push / migration run for linked remote projects) so the live schema
  matches the repo before relying on the app or tests against that database
- Add `user_id` ownership early to user-scoped tables so RLS and future
  evolution stay straightforward
- Enable and design for row-level security from the start
- Keep policies simple and ownership-based whenever possible
- Use foreign keys, constraints, and indexes instead of relying only on
  application code for integrity
- Prefer Postgres as the source of truth; do not duplicate core relationship
  state in external systems
- Use Supabase Edge Functions only when the work benefits from being close to
  the database or needs a backend execution boundary
- Keep secrets in environment variables and never store service-role keys in
  client code
- Use the anon key only in safe client contexts and keep privileged operations
  server-side
- Treat storage as optional for later phases; do not add it until the product
  actually needs uploaded files or artifacts

## OpenAI Best Practices

- Use the OpenAI Responses API for new AI features unless the user explicitly
  asks for another API shape
- Keep prompts versioned and isolated from UI code, preferably under a dedicated
  `src/lib/ai` area
- Prefer structured outputs or clearly defined response formats when extracting
  facts, tasks, or classifications
- Design prompts so the model returns candidate memory, not unquestioned truth
- Store model outputs with source references whenever possible
- Keep humans in the review loop for extracted facts and suggested follow-ups
- Make model choice explicit in code and persist useful metadata when storing
  generated summaries
- Minimize token usage by retrieving only the relevant notes, facts, or snippets
  needed for a task
- Do not send unnecessary personal data to the model
- Avoid background AI jobs that silently change user-visible relationship memory
  without traceability
- Prefer deterministic or low-variance settings for extraction workflows and
  more flexible settings only when summarization clearly benefits
- Build graceful failure paths so the core PRM still works when AI calls fail,
  time out, or are disabled

## Database Design Best Practices

- Model the domain relationally first and add AI-derived tables later
- Keep Phase 1 schema intentionally small and correct rather than prematurely
  comprehensive
- Use UUID primary keys consistently
- Include `created_at` and `updated_at` on core mutable tables
- Use join tables for many-to-many relationships instead of denormalized arrays
- Constrain known enums with Postgres enums or `check` constraints rather than
  leaving important fields unconstrained
- Add foreign keys for real ownership and relationship integrity
- Add indexes for known read patterns, especially timeline views, user scoping,
  and per-person lookups
- Avoid storing derived fields unless they materially improve query simplicity
  or performance
- If a derived field is stored, define how it is refreshed and which source
  tables own the truth
- Keep raw source text separate from extracted facts once AI features are added
- Prefer append-friendly interaction history over overwriting past context
- Do not use JSON columns for core relational data that needs filtering,
  joining, or lifecycle rules
- Use JSON only for genuinely flexible metadata that does not deserve
  first-class columns yet
- Design tables so deleting a user cleanly cascades through their owned data
- Be deliberate about nullability: require fields that are essential to product
  behavior and leave optional context flexible

## Engineering Guidance

- Prefer server-first patterns that fit Next.js App Router
- Preserve the App Router structure when adding new routes
- Keep domain logic out of route handlers when possible
- Centralize DB access and query helpers under `src/lib`
- Keep AI prompts and parsing logic isolated from UI components
- Favor simple Postgres-backed designs over premature complexity
- Do not introduce a graph database for early versions
- Keep friend-mode defaults as the primary product path
- Use TypeScript types for props and structured domain data
- Prefer simple local types over unnecessary abstraction
- Prefer `next/link` for internal navigation
- Add client component boundaries only when needed
- Keep styling decisions near presentational components rather than inside data
  objects

## UI and Accessibility Guidance

- Favor semantic HTML and accessible markup
- Keep heading hierarchy intentional
- Use descriptive labels for buttons and form fields
- Use semantic lists for repeated peer items and description lists for labeled
  value pairs when appropriate
- Mark decorative UI with `aria-hidden="true"` when it does not convey meaning
- Keep the visual tone thoughtful, warm, and non-corporate
- Avoid marketing-heavy interface patterns or sales-dashboard aesthetics

## Tailwind and Styling Guidance

- Prefer Tailwind utility classes for layout, spacing, and state styling
- Reuse shared design tokens and CSS variables once they exist
- Avoid hardcoded one-off colors when a tokenized option is appropriate
- Add reusable styling primitives sparingly and keep them small
- Keep animations subtle and intentional
- Prefer opacity, translate, and blur transitions over flashy motion styles

## Design guide (shared UI)

This section complements **UI and Accessibility Guidance** and **Tailwind and
Styling Guidance** above. It tells implementers which shared pieces to use so
forms, errors, and list rows stay visually consistent.

### Product tone and language

Keep the friend-first, warm, non-sales PRM voice described under **Product
Philosophy** and **UX Guardrails**. Do not contradict those rules here.

### Layout and surfaces

- Primary page framing uses utilities such as `prm-page`, `card-surface`, and
  `border-border-soft` on large rounded shells (often `rounded-[1.75rem]`).
- Softer inline regions use translucent whites (`bg-white/80`, `bg-white/60`)
  and generous radius (`rounded-2xl`) for controls and nested panels.
- Prefer existing tokens from the global theme over one-off hex colors.

### Forms

- **Labeled fields (label + control + optional hint/error):** use
  `TextField` or `TextareaField` from `src/components/ui/text-field.tsx` and
  `src/components/ui/textarea-field.tsx`. They wire `htmlFor` / `id`,
  optional `hint` / `hintAfter`, and `fieldError` with `aria-*` as needed.
- **Bare inputs** (custom layouts, controlled fields in panels): use
  `FormInput` or `FormTextarea` from `src/components/ui/form-input.tsx` and
  `src/components/ui/form-textarea.tsx`. Pass `fieldSize` when the design
  calls for compact or dense rows (`default` | `compact` | `dense`); dense is
  for `flex-1` inline rename rows in settings-style lists.
- **`<select>`:** apply
  `className={formControlClassName({ size: 'default' | 'compact' })}` from
  `src/components/ui/form-control-classes.ts` so focus rings and borders match
  text fields.
- **Form- or field-level errors:** use `FieldError` from
  `src/components/ui/field-error.tsx`. Use default size for top-of-form
  alerts; `size="compact"` or `size="inline"` in tighter contexts; `size="textOnly"`
  when only red text is needed without a bordered callout.
- **Primary actions:** use `Button` / `ButtonLink` from
  `src/components/ui/button.tsx` with the existing variants.

### List and settings rows

- For repeated padded rows (`rounded-2xl border border-border-soft bg-white/60
  px-4 py-3`), use `listRowCardClassName(extra?)` or `ListRowCard` /
  `ListRowCardLi` from `src/components/ui/list-row-card.tsx`. Pass additional
  classes for flex layouts or spacing (for example `space-y-2` on list items).

### Navigation and wayfinding

- Main app chrome uses `src/components/app/app-nav.tsx` (or its successor).
- Use `next/link` (or `ButtonLink`) for internal navigation.

### Where UI code lives

- **Cross-route primitives:** `src/components/ui/` (this design guide).
- **Feature modules:** `src/components/<domain>/` (people, timeline, auth,
  etc.).
- **Single-route-only UI:** optional `src/app/.../_components/` when something
  is not reused outside that route tree.

## State Management

- Prefer URL state, server state, or local component state
- Do not introduce a global state library without a clear requirement

## Performance and Metadata

- Avoid unnecessarily large client component trees
- Prefer static or server rendering when it fits the feature
- Be mindful of bundle size when adding libraries
- Each route should export `generateMetadata` when meaningful
- Use descriptive page titles and concise descriptions

## Testing and Validation

When implementation begins, prioritize testing around:

- person creation and editing
- interaction capture and timeline rendering
- multi-person interaction correctness
- extraction review flows
- summary refresh behavior
- task creation from follow-up cues
- retrieval quality and source citation
- privacy and permission boundaries

## Documentation Expectations

When adding features, update docs when relevant:

- add or revise schema docs when tables change
- update user stories if scope changes materially
- document important architecture decisions
- keep setup instructions current once the app is scaffolded

## Change Checklist

After meaningful code changes:

- Run `npm run lint` when available
- Run `npm run build` when changing routing, config, metadata, or production
  behavior
- Keep edits focused and avoid broad refactors unless they are necessary
- Confirm no unnecessary client boundaries were introduced
- Confirm interactive elements have appropriate labels
- Confirm new UI matches the app's warm, minimal, non-sales-oriented tone

## Decision Rules for Future Agents

When making tradeoffs, prefer:

1. trust over automation
2. clarity over cleverness
3. editable structured data over opaque AI output
4. Postgres simplicity over exotic infrastructure
5. friend-first UX over professional-PRM behavior

If a proposed feature would make the app feel intrusive, transactional, or
overly automated, pause and reconsider the implementation.
