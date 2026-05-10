# Tether

A personal relationship PRM focused on friends first and networking second:
remember who people are, how you know them, what changed recently, and what to
follow up on—without sales-PRM vibes.

## Stack

- **Next.js** 16 (App Router) with **React** 19
- **TypeScript**
- **Tailwind CSS** 4
- **Supabase** (auth, Postgres, row-level security)
- **OpenAI** (Responses API) for extraction, summaries, and suggested follow-ups
- **Zod** for validation

Domain logic and server actions live under `src/lib`; UI under `src/components`
and `src/app`. For product philosophy, phase priorities, and intended layout,
see [AGENTS.md](./AGENTS.md).

## What’s in the repo today

- **Auth:** login and signup (`/login`, `/signup`).
- **People:** list, detail, create, edit; categories; how-you-met; connection
  types and person-to-person links.
- **Interactions:** quick capture and timeline views (including by type).
- **Reminders:** tasks from the PRM data model (including AI-suggested items).
- **Settings** and app shell with primary navigation.
- **AI memory layer (Phase 2):** candidate facts, relationship summaries, and
  suggested tasks driven by server-side pipelines in `src/lib/ai` (human review
  and editing are part of the design).
- **Database:** migrations under `supabase/migrations/` (Phase 1 core schema
  plus follow-on migrations for categories, interactions, connections, and the
  AI tables). All changes go through SQL migrations.

The marketing-style home page at `/` includes setup hints; signed-in PRM routes
live under the `(main)` route group (e.g. `/people`, `/timeline`).

## Getting started

1. Install dependencies.

   ```bash
   npm install
   ```

2. Start the local Supabase stack.

   ```bash
   npx supabase start
   ```

3. Copy environment variables from Supabase.

   ```bash
   npx supabase status -o env
   ```

4. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OPENAI_API_KEY` when using AI features.
   Optional variables are described in `.env.example`.

5. Apply migrations (resets local DB to match the repo).

   ```bash
   npx supabase db reset
   ```

6. Run the app.

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Create an account via
`/signup` or sign in at `/login`.

## Validation

From the repository root:

```bash
npm run lint
npm run build
```
