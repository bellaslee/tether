# Initialize the Tether project with Next.js, Supabase, and OpenAI foundations

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository contains a checked-in ExecPlan guide at `.agent/PLANS.md`. This plan must be maintained in accordance with that file, and future contributors should update this plan in place as implementation progresses.

## Purpose / Big Picture

After this work, a contributor will be able to run a real local application instead of working from planning documents only. The repository will contain a scaffolded Next.js App Router application with TypeScript and Tailwind CSS, a local Supabase setup for authentication and Postgres-backed data, environment wiring for OpenAI, and the first database migration for the Phase 1 schema. A novice should be able to clone the repository, install dependencies, start local services, open the app in a browser, and verify that the web app and database foundation are both working.

This work matters because the project is currently in a documentation-only state. Initializing the application creates the foundation needed for Phase 1 product work such as person profiles, interaction capture, and timelines.

## Progress

- [x] (2026-04-04 19:06Z) Create the initial Next.js App Router application with TypeScript and Tailwind CSS in the repository root.
- [x] (2026-04-04 19:10Z) Add the baseline project files needed for local development, including `package.json`, `src/app`, Tailwind-enabled global styles, TypeScript config, and Next.js config.
- [x] (2026-04-04 19:10Z) Add Supabase local configuration and the first migration for the Phase 1 schema described in `docs/phase-1-mvp-schema-design.md`.
- [x] (2026-04-04 19:10Z) Add server-side environment variable handling for Supabase and OpenAI without exposing secrets to the browser.
- [x] (2026-04-04 19:10Z) Add minimal database and AI utility modules under `src/lib`.
- [x] (2026-04-04 19:10Z) Add a minimal app shell route that proves the stack is wired correctly.
- [x] (2026-04-04 20:30Z) Verify the project with install, local Supabase startup, lint, build, and an observable browser-level smoke test.

## Surprises & Discoveries

- Observation: `create-next-app` ignored the non-interactive flags and prompted for choices anyway, so initialization had to continue in an interactive temporary directory before copying files back into the repository root.
  Evidence: The CLI presented “Would you like to use the recommended Next.js defaults?” despite the original scripted flags.

- Observation: Docker is installed on the machine, but the Docker daemon was not running during validation, which blocked `npx supabase start` and therefore blocked `npx supabase db reset`.
  Evidence: `npx supabase start` failed with `Cannot connect to the Docker daemon at unix:///var/run/docker.sock.`

- Observation: `npx supabase migration list` is not useful for an unlinked local-only project because it expects a linked project ref, even when local migrations are working correctly.
  Evidence: The command returned `Cannot find project ref. Have you run supabase link?`

## Decision Log

- Decision: Initialize directly against the real target stack instead of creating a temporary JSON-backed prototype.
  Rationale: The product depends on relational data, row ownership, and future AI and vector workflows, so a throwaway persistence layer would create unnecessary rework.
  Date/Author: 2026-04-04 / Codex

- Decision: Use local Supabase instead of plain local Postgres as the default initialization target.
  Rationale: The project already intends to use Supabase for auth, Postgres, and row-level security, so local Supabase keeps local development close to production architecture.
  Date/Author: 2026-04-04 / Codex

- Decision: Keep the first migration limited to Phase 1 tables only.
  Rationale: The app needs a working relational foundation first; facts, summaries, embeddings, and imports belong to later milestones.
  Date/Author: 2026-04-04 / Codex

- Decision: Use `npx supabase` commands instead of requiring a globally installed Supabase CLI.
  Rationale: The machine did not already have `supabase` on the PATH, and repository-local instructions are more reliable for a novice contributor.
  Date/Author: 2026-04-04 / Codex

- Decision: Make the home page render useful setup guidance even when environment variables are missing instead of crashing on first load.
  Rationale: Initialization should be observable and beginner-friendly before local secrets are configured.
  Date/Author: 2026-04-04 / Codex

## Outcomes & Retrospective

The repository now contains a working Next.js App Router application, local Supabase configuration, a Phase 1 schema migration, environment-variable helpers, and server-only module boundaries for Supabase and OpenAI. A novice can install dependencies, run the web app, and open a home page that clearly identifies the project and explains any missing configuration.

The full initialization plan is now validated end to end. `npx supabase start` completed successfully, `npx supabase db reset` reapplied the checked-in migration cleanly, and direct SQL queries against the running Postgres container confirmed the `people`, `contact_methods`, `interactions`, and `interaction_people` tables along with their row-level security policies and indexes.

## Context and Orientation

The current repository contains planning documents but no application code. The key files that currently exist are `AGENTS.md`, `docs/personal-prm-user-stories.md`, and `docs/phase-1-mvp-schema-design.md`. The Phase 1 schema document defines the initial relational model for `people`, `contact_methods`, `interactions`, and `interaction_people`. The user stories document defines the MVP behavior for authentication, person profiles, interaction capture, and timeline views.

Next.js App Router is the current routing system for Next.js applications. In this repository it should be used to define pages under `src/app`, where each route is represented by a `page.tsx` file. A Server Component is a React component rendered on the server by default in this model; it should remain the default unless browser-only behavior requires `'use client'`.

Supabase is the backend platform for this project. In practical terms here, it provides a local Postgres database, user authentication, migration support, and row-level security. A migration is a checked-in SQL file that creates or changes the database schema in a repeatable way. Row-level security means the database itself enforces which rows a signed-in user can access.

The OpenAI Responses API is the intended interface for future AI features. In this initialization milestone, the goal is not to implement extraction or summaries yet, but to establish environment-variable wiring and a utility module layout so later milestones do not need to reorganize the project.

The intended top-level layout after initialization should include `src/app`, `src/components`, `src/lib`, and `supabase`. The `supabase` directory should contain local configuration and migration files. The `src/lib/db` area should contain Supabase client helpers, and `src/lib/ai` should contain OpenAI helper code or placeholders.

## Plan of Work

Begin by scaffolding the Next.js application in the repository root using the App Router, TypeScript, and Tailwind CSS. The generated structure should be adapted to match the project conventions in `AGENTS.md`: route files should live under `src/app`, reusable UI should live under `src/components` or route-local `_components`, and utility logic should live under `src/lib`.

Once the app exists, add a minimal application shell page in `src/app/page.tsx`. This page does not need final product UI. It should clearly confirm that the project is initialized, explain the planned PRM routes, and show whether required environment variables are present in server context. This gives a novice a visible way to verify that Next.js is wired correctly.

Next, initialize Supabase locally in the repository. Create the standard local configuration files under `supabase/` and add the first migration file under `supabase/migrations/`. That migration should implement the Phase 1 schema from `docs/phase-1-mvp-schema-design.md`, including `people`, `contact_methods`, `interactions`, and `interaction_people`, with constraints, indexes, and ownership columns. Keep this migration additive and limited to the current MVP scope.

After the migration exists, add utility modules under `src/lib/db` for creating the Supabase browser client and the server-side client. The browser-safe client should use the public URL and anon key. Privileged or cookie-aware access should remain server-side. In the same spirit, add `src/lib/ai` modules that load the OpenAI API key only on the server. Do not call OpenAI during initialization; only establish the module boundary and environment validation.

Add environment-variable documentation and example files so a novice can run the project locally. The repository should gain a `.env.example` that lists the required variables for Next.js, Supabase, and OpenAI. The implementation should fail clearly if required server-side environment variables are missing during features that depend on them, while the initial app shell should still render enough to guide setup.

After the stack is wired, add a lightweight proof route or health-oriented page behavior that exercises the new layers without implementing product features prematurely. A good outcome is a home page that renders successfully, a server-side check that can construct the Supabase and OpenAI helpers without crashing when variables are present, and a local database migration that applies successfully through Supabase.

Finally, validate everything end to end. Install dependencies, start local Supabase services, run the migration, run linting, run the production build, and start the Next.js dev server. Open the home page in the browser and confirm that it loads without runtime errors. Record any deviations from the plan in the living sections above.

## Concrete Steps

Run the following commands from the repository root at `/Users/bella/Developer/projects/tether`.

Scaffold the Next.js app:

    npm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"

If the scaffolder refuses to run in a non-empty directory, create the app in a temporary folder, then move the generated files into the repository root while preserving `.git` and existing docs.

Actual implementation note: this repository was non-empty, so the app was scaffolded in a temporary directory and copied into the repo root after generation.

Install Supabase CLI if it is not already available on the machine, then initialize local Supabase configuration:

    npx supabase init

Start local Supabase services once Docker is available:

    npx supabase start

Create and apply the first migration after writing the SQL:

    npx supabase migration new phase_1_initial_schema
    npx supabase db reset

Install project dependencies if the scaffold step did not do so:

    npm install

Run the Next.js quality checks:

    npm run lint
    npm run build

Start the application locally:

    npm run dev

Validation status from this implementation session:

    $ npm install
    added 373 packages

    $ npm run lint
    exited successfully

    $ npm run build
    Compiled successfully
    Finished TypeScript
    Generating static pages

    $ npx supabase start
    Started supabase local development setup

    $ npm run dev
    Local: http://localhost:3000

    $ curl -I http://localhost:3000
    HTTP/1.1 200 OK

    $ npx supabase db reset
    Applying migration 20260404190722_phase_1_initial_schema.sql
    Finished supabase db reset on branch main

    $ docker exec supabase_db_personal-prm psql -U postgres -d postgres -c "select tablename ..."
    contact_methods
    interaction_people
    interactions
    people

Expected browser outcome after opening `http://localhost:3000`:

    A simple page loads successfully.
    The page identifies the project as the personal relationship PRM.
    The page shows that the application shell is working.
    If environment variables are missing, the page or logs explain what needs to be configured instead of failing silently.

Expected Supabase outcome:

    The local Supabase stack starts successfully.
    The migration creates the four Phase 1 tables.
    Resetting the local database can recreate the schema without manual repair.

## Validation and Acceptance

Acceptance is complete when a novice can perform the following observable checks:

First, from the repository root, run `npm install`, `npx supabase start`, `npx supabase db reset`, `npm run lint`, and `npm run build` without encountering unresolved configuration errors beyond missing local secrets that are clearly documented.

Second, run `npm run dev`, open `http://localhost:3000`, and observe a rendered page that identifies the PRM project and confirms the app shell is running. The page does not need to contain real PRM features yet, but it must prove that the stack has been initialized successfully.

Third, inspect the local database through Supabase tooling and confirm that the tables `people`, `contact_methods`, `interactions`, and `interaction_people` exist with the expected ownership columns, constraints, and indexes. This can be verified by a successful `npx supabase db reset` and optional SQL inspection.

Fourth, inspect the repository tree and confirm the existence of the key files and directories:

    package.json
    next.config.ts or next.config.js
    tsconfig.json
    src/app/page.tsx
    src/app/globals.css
    src/lib/db/...
    src/lib/ai/...
    supabase/config.toml
    supabase/migrations/<timestamp>_phase_1_initial_schema.sql
    .env.example

The final implementation should leave the repository in a state where the next milestone can begin building Phase 1 product features directly instead of doing more platform setup.

## Idempotence and Recovery

The plan should be implemented in an idempotent way, meaning repeated local setup should not corrupt the repository or database. The database migration must be safe to reapply through `supabase db reset`, which drops and recreates the local database from checked-in migrations. If the Next.js scaffold command fails because the directory is not empty, retry by scaffolding in a temporary directory and copying the generated app files into place deliberately.

Do not store secrets in checked-in files. If a contributor accidentally adds real secrets, remove them immediately, rotate the affected keys, and replace the committed values with placeholders in `.env.example`.

If Supabase local startup fails because Docker is unavailable, pause the database-specific validation and continue with the application scaffold, but record that limitation in `Surprises & Discoveries`. The repository should still be left in a coherent state with migrations checked in.

## Artifacts and Notes

The most useful artifacts to capture during implementation are short command transcripts and the final project tree. As work proceeds, add concise examples here such as:

    $ npm run build
    ✓ Compiled successfully
    ✓ Generated static pages

    $ npx supabase db reset
    Applying migration <timestamp>_phase_1_initial_schema.sql
    Finished supabase db reset

    $ curl -I http://localhost:3000
    HTTP/1.1 200 OK

    $ docker exec supabase_db_personal-prm psql -U postgres -d postgres -c "select tablename ..."
    contact_methods
    interaction_people
    interactions
    people

The home page can remain intentionally simple during initialization. Its purpose is to prove the stack is operational, not to serve as final UI.

## Interfaces and Dependencies

Use these primary dependencies:

- `next`, `react`, and `react-dom` for the web application
- `typescript` for type checking
- `tailwindcss` for styling
- `@supabase/supabase-js` for application-side Supabase access
- Supabase CLI for local database and migration workflows
- `openai` for future OpenAI Responses API usage

At the end of this plan, the repository should contain stable module boundaries with names close to the following:

In `src/lib/db`, define helpers that create Supabase clients for browser-safe and server-side usage.

In `src/lib/ai`, define a server-only helper that constructs the OpenAI client from environment variables.

In `src/app/page.tsx`, define the initial application shell route.

In `supabase/migrations/<timestamp>_phase_1_initial_schema.sql`, define the Phase 1 schema from `docs/phase-1-mvp-schema-design.md`.

Revision note: Moved this ExecPlan out of `.agent/PLANS.md` and into `docs/plans/initialize-project.md` so the guide file remains a guide and plan documents live in `docs/plans`.

Revision note: Updated the plan after implementation to record the completed scaffold, the checked-in migration and helper modules, the successful Next.js validation, and the remaining Docker-daemon blocker for local Supabase runtime validation.

Revision note: Updated the plan again after Docker came online to record successful `npx supabase start`, successful `npx supabase db reset`, and direct SQL verification of the Phase 1 schema.
