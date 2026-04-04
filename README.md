This repository contains the initialization scaffold for a personal relationship CRM focused on friends first and networking second.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase for local auth and Postgres
- OpenAI groundwork for future Responses API features

## Getting Started

1. Install dependencies.

    npm install

2. Start the local Supabase stack.

    npx supabase start

3. Export the local Supabase environment values.

    npx supabase status -o env

4. Copy `.env.example` to `.env.local`, then paste in the local Supabase values and your `OPENAI_API_KEY` when you are ready for AI-backed features.

5. Apply migrations or rebuild the local database.

    npx supabase db reset

6. Start the app.

    npm run dev

Then open http://localhost:3000.

## Included in This Milestone

- A warm server-rendered home page that confirms the app shell is running
- `src/lib/db` helpers for Supabase browser and server clients
- `src/lib/ai/openai.ts` for server-only OpenAI client creation
- `supabase/migrations/20260404190722_phase_1_initial_schema.sql` with the Phase 1 schema and row-level security

## Validation

Run the standard checks from the repository root:

    npm run lint
    npm run build
