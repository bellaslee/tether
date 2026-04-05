# Architecture remediation: security, tenancy, and Supabase hygiene

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If the repository’s authoring guide is checked in, it lives at [.agent/PLANS.md](/.agent/PLANS.md) from the repository root; maintain this document in accordance with that guide.

## Purpose / Big Picture

After this work, the database and application behave the same for real users, but the system is easier to trust: **each logged-in user can access only their own PRM data**—no other account, including another legitimate user of the same deployment, may read or change their people, notes, facts, reminders, or related rows. **Local development uses normal Supabase sign-in only**—the optional **local dev auth bypass** (service role client and `PRM_LOCAL_DEV_*` env vars) is **removed entirely**, so the app never holds a key that skips row level security for ordinary requests. Postgres functions follow Supabase security lint expectations, row-level security policies avoid per-row auth re-evaluation where possible, and foreign keys used in joins and deletes are indexed. A developer can run the Supabase database linter (or equivalent) and see these warning classes cleared or explicitly accepted with documented rationale.

## Architecture review summary (prioritized issues)

The list below merges static review of this repository with the Supabase linter output you provided. Severity reflects impact if unaddressed, not current exploit certainty.

### Critical

**Remove local dev bypass.** The codebase currently supports an optional path where [src/lib/prm/context.ts](/src/lib/prm/context.ts) returns a **service role** Supabase client from [src/lib/db/service-role.ts](/src/lib/db/service-role.ts), which **does not enforce RLS**. That path is gated in [src/lib/env.ts](/src/lib/env.ts), but eliminating it removes an entire class of misconfiguration and tenancy bugs. This ExecPlan treats **removal of that feature** as mandatory, not optional.

After removal, every server request that touches PRM data uses the cookie-backed server client ([src/lib/db/server.ts](/src/lib/db/server.ts)) with the **anon** key and **RLS**, matching production behavior locally.

### High

**1. Postgres functions with mutable `search_path` (Supabase `function_search_path_mutable`).** The linter flags `public.set_updated_at`, `public.enforce_person_connection_people_owner`, `public.enforce_person_category_owner`, `public.enforce_interaction_type_owner`, and `public.enforce_connection_type_owner`. These run as trigger bodies (invoker, not the `security definer` seed triggers that already set `search_path` in later migrations). Without a fixed `search_path`, the class of risk is search-path hijacking for objects resolved inside the function. Remediation: add `set search_path = public` (or `pg_catalog, public` per project convention) on each `CREATE OR REPLACE FUNCTION`, matching the pattern already used on `seed_default_*` functions in [supabase/migrations/20260404220000_person_categories.sql](/supabase/migrations/20260404220000_person_categories.sql) and related files.

**2. Junction-table queries (optional hardening after bypass removal).** While bypass existed, queries that hit `interaction_people` using only `person_id` or `interaction_id` relied on application scoping when the client was the service role. Once only the RLS-backed client remains, Postgres policies again constrain cross-tenant access. Optional follow-up: add small server-only helpers that join through `interactions.user_id` or `people.user_id` for clarity and easier auditing; not required for correctness after bypass removal.

### Medium

**3. RLS policies re-evaluating `auth.uid()` per row (Supabase `auth_rls_initplan`).** Policies across `people`, `contact_methods`, `interactions`, `interaction_people`, `person_categories`, `interaction_types`, `connection_types`, `person_connections`, `facts`, `relationship_summaries`, and `tasks` use `auth.uid() = user_id` (and subqueries that call `auth.uid()`). The linter recommends wrapping calls as `(select auth.uid())` so the planner treats them as initplan-stable. Remediation: one new migration that drops and recreates affected policies (or uses `ALTER POLICY` where supported) with the subselect form; spot-check `EXPLAIN` on hot paths (people list, timeline).

**4. Large server action surface.** [src/lib/actions/ai-memory.ts](/src/lib/actions/ai-memory.ts) is very large (hundreds of lines). That increases the chance of inconsistent authorization or error handling. Remediation: split by concern (extract facts, summaries, tasks, persistence) and keep a single internal “require AI context + ownership” gate.

**5. Route protection model.** [middleware.ts](/middleware.ts) refreshes the Supabase session but does not redirect unauthenticated users; [src/app/(prm)/layout.tsx](/src/app/(prm)/layout.tsx) uses `requirePrmAccess`. That is acceptable if every sensitive route stays under `(prm)`. Remediation: document the convention; optionally add matcher-based redirects later—avoid duplicating logic in both places without a clear rule.

### Low

**6. Unindexed foreign keys (Supabase `unindexed_foreign_keys`, INFO).** Covering indexes are missing for: `connection_types.inverse_type_id`, `interactions.interaction_type_id`, `people.category_id`, and `person_connections` FK columns (`connection_type_id`, `person_id`, `related_person_id`). Remediation: add btree indexes in a migration; validate against real query plans (deletes, type lookups, category filters).

**7. Unused indexes (Supabase `unused_index`, INFO).** `people_user_id_status_idx` and `people_user_id_category_id_idx` reported unused—likely workload-dependent. Remediation: confirm with production or staging statistics before dropping; keep if upcoming features filter on those columns.

## Data isolation and access control (must-have)

This is a **non-negotiable product requirement**, not an implementation detail. **Only the currently authenticated user may read or write their own tenant data in Postgres.** Another person with a valid account on the same app must not see or modify the first user’s rows by using the UI, crafted requests, or guessed UUIDs in URLs or forms.

**Primary enforcement: row level security (RLS).** Supabase attaches the signed-in user’s identity to the database session as `auth.uid()`. Policies on user-scoped tables must continue to allow access only when that identity matches the row’s owner (typically `user_id`, or indirect ownership through joins to `people` / `interactions` as already used for `contact_methods` and `interaction_people`). Any new table that stores per-user PRM data must ship with RLS enabled and matching policies in the same migration. Removing the dev bypass ensures routine app traffic always goes through a client subject to these policies.

**Application layer.** Server Components, server actions, and API route handlers must obtain the Supabase client and effective `userId` from [src/lib/prm/context.ts](/src/lib/prm/context.ts) (or the same session pattern), not from unvalidated client input. On insert and update, set `user_id` from that server-derived `userId`. On actions that accept entity ids (`person_id`, `interaction_id`, and so on), scope queries with `.eq('user_id', ctx.userId)` or equivalent joins so another user’s ids yield empty results or generic “not found” errors—never another user’s payload.

**API routes.** Every handler under [src/app/api](/src/app/api) that touches PRM data or user-specific AI features must require an authenticated PRM context (the same pattern as [src/app/api/transcribe/route.ts](/src/app/api/transcribe/route.ts) using `getPrmSupabaseContext()`) before performing work. Do not add routes that use a service role key for end-user traffic.

**Verification.** After bypass removal, run a **two-account manual test**: create data as user A, sign in as user B, and confirm that lists, detail URLs, and server actions cannot surface or mutate A’s rows. Optionally, in Supabase SQL, run `set role authenticated` and `set request.jwt.claim.sub` to B’s uuid (per Supabase docs for local testing) and confirm `select` on tenant tables returns only B’s rows.

---

## Progress

- [ ] (2026-04-05) Record baseline: export current Supabase linter output after migrations applied (re-run in Supabase dashboard or CLI and attach JSON when convenient).
- [x] (2026-04-05) **Remove local dev bypass:** deleted `src/lib/db/service-role.ts`; stripped bypass env/helpers from `src/lib/env.ts` and the fourth setup-status row; `getPrmSupabaseContext` always uses the cookie server client; updated `app-nav`, `user-menu`, `profile` action/page, `.env.example`, and `README.md`. Historical plan docs may still mention bypass for archive context.
- [x] (2026-04-05) Migration `20260411140000_supabase_security_hardening.sql`: `set search_path = public` on `set_updated_at`, `enforce_person_category_owner`, `enforce_interaction_type_owner`, `enforce_connection_type_owner`, `enforce_person_connection_people_owner`; applied with `npx supabase db push --local`.
- [x] (2026-04-05) Same migration: RLS policies recreated with `(select auth.uid())` on all tenant tables listed in the plan; re-run DB linter to confirm `auth_rls_initplan` is clear.
- [x] (2026-04-05) Same migration: btree indexes for `connection_types.inverse_type_id`, `interactions.interaction_type_id`, `people.category_id`, and `person_connections` FK columns.
- [x] (2026-04-05) **Data isolation audit (static):** all user-scoped `public` tables from migrations have RLS + own-row policies; PRM server actions and `src/app/api/transcribe/route.ts` gate on `getPrmSupabaseContext()` / session. **Two-account manual test:** not run in this session—perform before release and record below.
- [x] (2026-04-05) Optional: junction-table helper refactor — `src/lib/interactions/interaction-people-queries.ts` (`interactions!inner(user_id)`); wired through loaders, interaction actions, last-touch, category audit, timeline and person pages, and AI summary/suggest paths.
- [x] (2026-04-05) Optional: split AI memory actions into `src/lib/actions/ai-memory/*` (`constants`, `types`, `guard`, `loaders`, `extract-suggest`, `facts`, `reminders`, `summaries`). Client imports reference concrete modules (Next.js disallows `use server` barrel re-exports).

## Surprises & Discoveries

- Observation: `npx supabase db push --local` still prints “remote database” in the prompt text while applying to the linked local instance.
  Evidence: CLI output during migration apply (2026-04-05).
- Observation: A Next.js App Router file with `'use server'` may not re-export actions from other files (and may not mix `export type` with those re-exports); importers must target the defining module or a types-only entry.
  Evidence: `next build` failure on `ai-memory/index.ts` barrel (2026-04-05).

## Decision Log

- Decision: Treat Supabase INFO-level unused-index hints as non-actionable until validated against realistic traffic.
  Rationale: Indexes support planned filters and cost little on a small Tether deployment until proven otherwise.
  Date/Author: 2026-04-05 / architecture review

- Decision: Remove local dev auth bypass entirely; local development will use normal Supabase sign-in.
  Rationale: Owner no longer needs the convenience mode; dropping the service role path from the app removes RLS-skipping behavior and simplifies tenancy reasoning.
  Date/Author: 2026-04-05 / product owner request (recorded in ExecPlan)

- Decision: Treat **per-user data isolation** as an explicit acceptance criterion: RLS plus server-derived `user_id`, verified by a two-account manual test.
  Rationale: The product stores sensitive relationship data; “only I can see my PRM” must be demonstrable, not assumed.
  Date/Author: 2026-04-05 / product owner request (recorded in ExecPlan)

## Outcomes & Retrospective

- **Shipped:** Local dev auth bypass removed; single migration covers function `search_path`, RLS initplan form, and FK indexes. Junction-table reads use shared helpers; AI memory server actions live under `src/lib/actions/ai-memory/`. `npm run lint` and `npm run build` succeed.
- **Middleware:** Documented in-code that `(prm)` layout owns auth redirects (`middleware.ts` comment).
- **Linter:** Re-run Supabase database linter after deploy to confirm warning classes cleared; unused-index INFO remains waived per Decision Log.
- **Two-account cross-tenant test:** Pending manual verification by the owner (create data as user A, sign in as B, confirm no leakage via lists, URLs, or actions).

## Context and Orientation

This app is a Next.js App Router project under [src/app](/src/app). Authenticated PRM pages live under `src/app/(prm)` and receive a Supabase client plus effective `userId` from [src/lib/prm/context.ts](/src/lib/prm/context.ts) via [src/lib/prm/guard.ts](/src/lib/prm/guard.ts). Schema changes belong in [supabase/migrations](/supabase/migrations) as timestamped SQL files. **Row level security** means Postgres filters rows for the anon/authenticated role so one user cannot read or write another’s data even if the app mis-scopes a query. After bypass removal, the app **does not** use a Supabase service role key in application code for user requests; local and production both rely on the server client and RLS. The combination of RLS and server-derived `user_id` on writes is what enforces **single-tenant data isolation per account**.

## Plan of Work

First, **remove the local dev bypass** end to end so no code path imports [src/lib/db/service-role.ts](/src/lib/db/service-role.ts) and `getPrmSupabaseContext` never returns a service role client. Follow the file list in `Progress` above. After edits, `npm run build` must succeed and signing in locally must be the only way to use PRM routes.

Second, add a forward-only migration that replaces the five trigger functions to include an explicit `set search_path` clause, using `create or replace function` with the same signatures and bodies as today. Prefer `set search_path = public` to match existing seed triggers.

Third, add a migration that recreates RLS policies to use `(select auth.uid())` instead of bare `auth.uid()` in `using` and `with check` expressions, including nested `exists` subqueries that compare to `auth.uid()`. Work table-by-table to avoid partial application; keep policy names identical so application code does not change.

Fourth, add indexes: `connection_types (inverse_type_id)`, `interactions (interaction_type_id)`, `people (category_id)`, `person_connections (connection_type_id)`, `person_connections (person_id)`, `person_connections (related_person_id)`—use names consistent with existing index naming in early migrations.

Fifth, execute the **data isolation audit** in `Progress`: validate RLS coverage on all tenant tables, review server actions and API routes for unsafe patterns, and complete the two-account manual test so you have evidence that user B cannot access user A’s data.

Sixth, optionally refactor junction-table reads into small server-only helpers for clarity; this is not required for security once bypass is gone and RLS is trusted.

## Concrete Steps

From the repository root, with Supabase CLI available:

1. Implement **Remove local dev bypass** per the `Progress` checklist (TypeScript/React/env/docs). Run `npm run lint` and `npm run build` after this step; confirm PRM flows only work when signed in.
2. Create a new file under `supabase/migrations/` with a timestamp after existing files, containing the SQL for function `search_path`, policy updates, and indexes (or split into separate migrations if you prefer smaller steps).
3. Apply to local database: `npx supabase db push --local` (or your team’s standard command from AGENTS.md).
4. Run the app: `npm run dev` (once dependencies are installed). Sign in with Supabase auth and exercise timeline, person detail, and AI memory flows (no bypass path).
5. Run `npm run lint` and `npm run build` before merging.

Re-run the Supabase database linter in the dashboard or CLI and compare to the baseline captured in Progress.

## Validation and Acceptance

Behavioral acceptance: as a signed-in user, create a person, add an interaction with a note, run any AI memory action if configured, and open the timeline; all data remains scoped to that user. Unauthenticated access to `(prm)` routes redirects to login. There is no way to enable a no-sign-in mode via environment variables.

**Cross-tenant acceptance:** with two distinct accounts, user A creates identifiable records; while signed in as user B, those records never appear in lists or searches, person or interaction URLs for A’s ids do not reveal A’s data (for example `notFound` or empty), and server actions invoked with A’s ids do not succeed for B. This proves **only the logged-in user can access their own data**; everyone else is excluded.

Technical acceptance: Supabase warnings `function_search_path_mutable` for the five named functions are gone; `auth_rls_initplan` warnings for listed policies are gone or explicitly documented as false positives with evidence; new indexes exist and `npm run build` succeeds.

## Idempotence and Recovery

Migrations should use `create or replace` for functions and `drop policy` / `create policy` pairs with fixed names. If a migration fails halfway, restore from backup or reset local Supabase and reapply the full chain. Do not edit applied migration files in place on shared environments; add a new migration to correct mistakes.

## Artifacts and Notes

Supabase remediation references (external, for humans): [Function search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [Auth RLS initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan), [Unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## Interfaces and Dependencies

No new npm dependencies are required. SQL targets Postgres as provided by Supabase. After bypass removal, `PrmSupabaseContext` should no longer include a `bypass` flag; navigation and profile UI assume a normal session (email/metadata from Supabase auth when available). Optional application helpers should live under `src/lib/` with `import "server-only"` where appropriate, accept `SupabaseClient<Database>` and `userId: string`, and return typed results or error objects consistent with existing action patterns. **Tenancy rule:** any code path that writes or reads tenant tables must remain consistent with the guarantee that **only the session user’s rows are visible or mutable**—RLS is the backstop; application scoping is the primary ergonomic layer.

---

Revision note (2026-04-05): Initial architecture review plus Supabase linter JSON; mandatory local dev bypass removal; Critical/High reordered; optional junction-table hardening; **Data isolation and access control** section with RLS + app-layer rules, two-account verification, Progress audit item, Plan of Work step, Validation “cross-tenant acceptance,” Context/Interfaces/Purpose updates, and Decision Log entry for per-user isolation as acceptance criterion.
