# Deploy to production: Vercel + Supabase

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If the repository’s authoring guide is checked in, it lives at [.agent/PLANS.md](/.agent/PLANS.md) from the repository root; maintain this document in accordance with that guide.

## Purpose / Big Picture

After this work, the **Tether** CRM (this Next.js app) runs on the public internet at a stable HTTPS URL served by **Vercel**, and **all CRM data and authentication** are backed by a **hosted Supabase** Postgres project whose schema matches the SQL migrations in this repository. A real user can sign up or sign in, use people, timeline, reminders, and (if configured) AI features, with **row level security** enforcing that each account sees only its own data. **You can also load the same CRM rows you already have in local development** (people, interactions, facts, and so on) so production does not start empty—after import, signing in as your production user shows the familiar dataset.

You know it is working when you can open the production URL in a private browser window, complete email sign-up or sign-in without redirect errors, and see **your migrated dev rows** under `/people` and `/timeline` (not only empty lists); when `npm run build` succeeds in CI or locally with production-like env; and when the Supabase dashboard shows your project’s tables and applied migrations aligned with `supabase/migrations/`.

This plan does **not** require changing application code unless you discover a gap (for example a missing env var or a build setting). It is primarily **infrastructure and configuration**: create remote Supabase, apply migrations, **optionally import a data-only dump from local Postgres with `user_id` remapped to your production auth user**, create a Vercel project, wire environment variables, and configure Supabase Auth URLs for your deployment hostname(s).

## Progress

- [x] Create (or designate) a Supabase **hosted** project in the correct region; note project ref, database password, API URL, anon key, and (for admin tasks only) service role key from the Supabase dashboard. _(Project **Tether**, ref `drqtrhasxjcrtstdpjox`, region East US.)_
- [x] Link the local repo to that project with the Supabase CLI and push all migrations (`supabase db push` or equivalent) so remote schema matches `supabase/migrations/`.
- [ ] Configure Supabase **Auth** `Site URL` and **Redirect URLs** for the production Vercel URL (and preview URLs if you use preview deployments). You need this before **sign-up on the live app** to obtain **PROD_USER_ID**; if you use only the Supabase dashboard to create a user, you can do that earlier, but redirects still must be correct before you rely on the deployed UI. _(Canonical prod URL: **https://tether-kappa.vercel.app** — use **Concrete steps** §4.)_
- [x] Create a Vercel project from this Git repository; set framework to Next.js; confirm install command `npm install` and build command `npm run build` (Vercel defaults are usually correct).
- [x] Add all required and optional environment variables in Vercel (Production and Preview as appropriate); redeploy. _(Production has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Preview: add via dashboard **All preview branches** or per-branch — current Vercel CLI required a non–production-branch name for `preview`.)_ Optional: `OPENAI_API_KEY`, Upstash vars, etc.
- [x] **Seed production with dev data:** capture local `auth.users` id (**LOCAL_USER_ID**), create the production account and capture **PROD_USER_ID**, dump **local** `public` schema data only (`npx supabase db dump --local --data-only --schema public`), remap **LOCAL_USER_ID** → **PROD_USER_ID** in the dump, apply with `psql` to hosted Postgres; confirm lists on `/people` and `/timeline` after sign-in. _(Done 2026-04-05: remapped `e6db547d-…` → prod user, wiped conflicting prod rows for that user, `supabase db query --linked -f .tmp/dev-public-data-remapped.sql`.)_
- [x] Run `npm run lint` and `npm run build` locally with a `.env.production.local` or exported vars mirroring Vercel to catch issues before pushing.
- [ ] Smoke-test production: sign-in, CRUD on people and interactions, optional AI path if `OPENAI_API_KEY` is set.
- [ ] Optional: run the **two-account isolation** checks described in [docs/plans/architecture-remediation-supabase-hardening.md](/docs/plans/architecture-remediation-supabase-hardening.md) against the hosted database and app.

## Surprises & Discoveries

Document unexpected behaviors during your deployment (CLI prompts, Vercel build cache, auth redirect loops, etc.) with a short note and, when useful, the exact error string.

- Observation: `vercel env add … preview` (CLI v50.x) returned `action_required` / `git_branch_required` unless a specific Git branch is passed; using `main` failed with “Cannot set Production Branch … for a Preview Environment Variable.” Only `main` exists on the repo so far — use the Vercel dashboard to attach Supabase vars to **all preview deployments** when feature branches exist.
  Evidence: CLI JSON `reason: "git_branch_required"` and `branch_not_found` / production-branch error on `preview main`.

## Decision Log

- Decision: Treat **one** Supabase hosted project as production for this app instance; use separate Supabase projects for staging versus production if you need a non-production playground.
  Rationale: Clear data boundaries and simple rotation of keys; avoids accidental writes to prod from experiments.
  Date/Author: (set when executing)

- Decision: Store **only** the Supabase **anon** key and URL in Vercel as `NEXT_PUBLIC_*` variables; do **not** put the Supabase **service role** key in any environment variable that Next.js exposes to the browser bundle. Use the service role only in trusted server-only automation outside this app (if ever needed), not in this CRM’s runtime paths.
  Rationale: This app is designed for cookie-backed sessions and RLS; the service role bypasses RLS and must not be reachable from client code.
  Date/Author: (set when executing)

- Decision: Treat **dev data seeding** as a **one-time import** of `public` table rows from local Supabase Postgres, with **no** commitment to put that data in [supabase/seed.sql](/supabase/seed.sql) (that file is intentionally empty for a clean repo clone).
  Rationale: Real dev data is personal and changes often; dumps belong in gitignored files or a private archive, not in version control.
  Date/Author: 2026-04-05 / ExecPlan update

## Outcomes & Retrospective

Summarize here once production is live: final URLs, which Supabase project ref is production, any preview-deployment policy, and lessons (for example auth URL pitfalls or env var naming).

- **Production URL (alias):** https://tether-kappa.vercel.app  
- **Supabase project ref:** `drqtrhasxjcrtstdpjox`  
- **Migrations:** applied to hosted DB via `npx supabase db push` (2026-04-05).

## Context and Orientation

**Vercel** is a hosting platform that builds your Git branch on each push and runs the **Next.js** production server (or static/serverless hybrid as Next 16 defines). For this repo, the important command is `npm run build`, which must succeed without missing environment variables for any code path that runs at build time.

**Supabase (hosted)** is a managed Postgres plus Auth API. This app talks to Supabase using **`@supabase/ssr`** and **`@supabase/supabase-js`**. The **anon (public) key** is safe to embed in the browser: access is still limited by **RLS (row level security)**, Postgres rules that filter rows per authenticated user. The **middleware** at [middleware.ts](/middleware.ts) refreshes the session cookie on each request when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. CRM routes under `src/app/(crm)/` enforce sign-in via [src/lib/crm/guard.ts](/src/lib/crm/guard.ts) (`requireCrmAccess`).

**Environment variables** are defined for the app in [src/lib/env.ts](/src/lib/env.ts) and summarized for developers in [.env.example](/.env.example). **Production-specific behavior:** if `OPENAI_API_KEY` is set and `NODE_ENV` is `production`, the app expects **Upstash Redis** credentials for LLM rate limiting unless you explicitly set `CRM_DISABLE_LLM_RATE_LIMIT` (discouraged for real production).

**Migrations** live under [supabase/migrations/](/supabase/migrations/). The local Supabase CLI config in [supabase/config.toml](/supabase/config.toml) pins **Postgres major version 17**; your hosted project should match that major version before relying on `db push`.

**Repo seed file:** [supabase/seed.sql](/supabase/seed.sql) is intentionally empty (only a comment). It runs after `db reset` locally and is **not** where your personal dev database lives. **Seeding production with “dev data”** means exporting the rows from your **local** Supabase Postgres (Docker) and importing them into hosted Postgres after migrations.

**Why `user_id` must be remapped:** Every tenant-scoped row in `public` carries a `user_id` that must equal an `id` in Supabase **`auth.users`** on **that same database**. Your local dev user has one UUID; the account you create on production has a **different** UUID. If you restore a raw local dump into production without editing it, foreign keys and RLS will not line up with your production login. The fix is to **create your production user first**, note its `auth.users.id`, then replace your **local** dev user’s UUID everywhere it appears in the data dump with that production id before running the import (or run equivalent `UPDATE` statements after import, table by table).

**Terms:** **Site URL** in Supabase Auth is the primary application base URL used for redirects. **Redirect URLs** are an allowlist of exact callback URLs after magic links or OAuth; if your production app lives at `https://my-app.vercel.app`, that origin (and specific paths Supabase uses) must be allowed or users will see redirect errors.

## Plan of Work

Work in this order so you never point a live Vercel deployment at an empty or wrong database.

**First milestone — hosted Supabase ready.** In the Supabase dashboard, create a project (choose a region close to you and to Vercel’s deployment region if possible). Wait until the database is healthy. Install the Supabase CLI if you do not have it (`npm` can run `npx supabase` without a global install). From the repository root, run `npx supabase login` and `npx supabase link --project-ref <your-project-ref>` so the CLI targets the hosted project. Apply migrations with `npx supabase db push` (this ships pending SQL from `supabase/migrations/` to the linked remote database). Confirm in the Supabase **Table Editor** that core tables such as `people` and `interactions` exist. If `db push` fails, read the error: common causes are version mismatch, conflicting manual edits on the remote, or network; fix by aligning versions or resetting a **non-production** remote with `supabase db reset` on a dedicated dev project only—never reset production casually.

**Import dev data milestone (after migrations on hosted Postgres, and after you have a production `auth.users` row).** In practice you usually complete **Auth URL configuration** and a minimal **Vercel deploy with Supabase env** first if you create the account through the app; the **Progress** checklist reflects that order. This step is **in scope** for your deployment goal.

1. **Record your local auth user id.** With local Supabase running, open the **SQL Editor** in local Studio or run `psql` against the local DB URL from `npx supabase status` and execute `select id, email from auth.users order by created_at;`. Note the `id` for the account that owns your CRM rows (call this **LOCAL_USER_ID**).

2. **Create the production user before importing `public` data.** Either sign up through the deployed app (requires Vercel env vars, a working build, and Auth **Site URL** / **Redirect URLs** already set) or create the user from Supabase hosted **Authentication → Users** if your project offers that. In the hosted project SQL editor, run `select id, email from auth.users order by created_at desc;` and note **PROD_USER_ID** for the account that should own the imported rows.

3. **Export local data (public schema only, no DDL).** From the repository root, with Docker local stack up:

        npx supabase db dump --local --data-only --schema public -f .tmp/dev-public-data.sql

   Use a path under `.gitignore` (for example `.tmp/`) so the file is never committed. Add `.tmp/` to `.gitignore` if it is not already ignored.

4. **Remap identities in the dump file.** In `dev-public-data.sql`, replace every occurrence of **LOCAL_USER_ID** with **PROD_USER_ID** (UUID text is unique enough for a naive replace; if you had multiple dev users, restrict edits to rows you intend to move or export per-user with custom queries). If any tables reference other dev-only ids you care about, align those too.

5. **Apply the dump to hosted Postgres.** Use the **connection string** from Supabase **Project Settings → Database** (URI format; prefer the **direct** connection if the file is large, and run from a trusted machine). Example shape:

        psql "<HOSTED_POSTGRES_URI>" -v ON_ERROR_STOP=1 -f .tmp/dev-public-data.sql

   If `psql` reports duplicate key errors, your production `public` tables were not empty—either truncate tables you are replacing (destructive; only on a fresh prod) or adjust the dump. For a **brand-new** project after migrations, tables are empty and inserts should succeed.

6. **Verify.** As the production user, sign in on the live app and open `/people` and `/timeline`; counts should match what you had locally for that account. If lists are empty, check RLS is not hiding rows because `user_id` still mismatches **PROD_USER_ID**.

**Security note:** The dump file contains **personal CRM content**. Delete it after a successful import or store it encrypted; never push it to git.

**Second milestone — Auth URLs.** In Supabase **Authentication → URL configuration**, set **Site URL** to your canonical production URL (for example `https://<project>.vercel.app` or your custom domain). Add to **Redirect URLs** at minimum that same origin with the paths Supabase uses for your auth flow (email confirmation and PKCE flows often use `/` or paths under your app; if you see redirect errors in the browser, add the exact URL from the error). If you use **Vercel preview deployments** (each branch gets `*.vercel.app` URLs), either add wildcard patterns if your Supabase plan supports them, add each preview base URL as needed, or accept that previews only work when URLs are registered—many teams use a single **staging** Vercel URL plus a staging Supabase project to avoid wildcard complexity.

**Third milestone — Vercel project.** Connect the GitHub (or GitLab / Bitbucket) repository to Vercel and import it. Framework preset **Next.js**; root directory the repo root; build command `npm run build`; install `npm install`. No `vercel.json` is required today ([next.config.ts](/next.config.ts) is minimal). Trigger a first deployment; expect the build to fail until environment variables are set— that is normal.

**Fourth milestone — environment variables on Vercel.** In the Vercel project **Settings → Environment Variables**, add the variables below. Use **Production** for the live site; add **Preview** if previews should talk to a real database (often a separate Supabase project) or omit secrets on previews if previews are UI-only.

Required for any working CRM:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase **Project Settings → API**, Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the same page, **anon** `public` key.

Required for AI features (server-side only):

- `OPENAI_API_KEY` — from your OpenAI account; never commit it to git.

Strongly recommended when `OPENAI_API_KEY` is set in production:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — from an Upstash Redis database using the REST API; satisfies [src/lib/env.ts](/src/lib/env.ts) production check for LLM rate limits.

Optional:

- `OPENAI_MODEL` — overrides default `gpt-4o-mini` for Responses API calls.
- `NEXT_PUBLIC_CRM_USAGE_TRACKING` — set to `true` if you intend to enable first-party usage logging described in code comments in `env.ts`.
- `CRM_DISABLE_LLM_RATE_LIMIT` — only for emergencies; set to `true` to skip distributed limits (not recommended for production).

Redeploy after saving variables (Vercel offers **Redeploy** on the latest deployment).

**Fifth milestone — validation.** Run local `npm run lint` and `npm run build` from the repository root. For a stricter check, temporarily use production-like env (Vercel CLI can pull env, or mirror keys in a local file that is gitignored). Open the production URL, complete auth, and exercise core flows. If anything fails, use Vercel **Functions** logs and Supabase **Auth** and **API** logs to trace 401s, RLS denials, or missing env.

## Concrete Steps

All commands assume the **repository root** as the working directory unless noted.

1. **Supabase CLI login and link**

        npx supabase login
        npx supabase link --project-ref <YOUR_PROJECT_REF>

2. **Push migrations to hosted Supabase**

        npx supabase db push

   Expect CLI output indicating applied migrations; errors should name the failing SQL file.

3. **Export local dev data for import to prod** (see **Import dev data milestone** above). You can run the dump and UUID remap anytime local Supabase is up; **apply** the file with `psql` only after **PROD_USER_ID** exists (typically after steps 4–5 if you create the account via the live app).

        mkdir -p .tmp
        npx supabase db dump --local --data-only --schema public -f .tmp/dev-public-data.sql

   Replace **LOCAL_USER_ID** with **PROD_USER_ID** throughout the file, then:

        psql "<HOSTED_POSTGRES_URI>" -v ON_ERROR_STOP=1 -f .tmp/dev-public-data.sql

4. **Set Auth URLs** in the Supabase dashboard (no CLI required): **Authentication → URL configuration**. For this deployment, set **Site URL** to `https://tether-kappa.vercel.app` and add that origin (and `https://tether-kappa.vercel.app/**` if your Supabase plan supports wildcards) to **Redirect URLs** so email/password and any OAuth callbacks are allowed.

5. **Vercel:** import Git repository, configure env vars, deploy. From a machine with the Vercel CLI (optional), linking can be done with `npx vercel link` and env with `npx vercel env pull` for local testing—follow Vercel’s current CLI help for your version.

6. **Local verification**

        npm run lint
        npm run build

   Expect ESLint to complete without errors and Next.js to report a successful production build.

7. **Browser verification:** visit `https://<your-deployment>/`, sign up or sign in, navigate to `/people` and `/timeline`. If you imported dev data, you should see your existing rows; otherwise create a person and an interaction and reload. Success means no redirect to login (when signed in) and data persists.

## Validation and Acceptance

Acceptance is behavioral. **Build:** `npm run lint` exits 0; `npm run build` completes and emits a production build. **Database:** hosted Supabase lists the same logical schema you get locally after `npx supabase db reset` (tables and RLS present; no migration errors on `db push`). **Auth:** a new user can sign up and sign in on the production URL without “redirect URL not allowed” or similar errors. **CRM:** if you seeded from dev, the signed-in production user sees the same people and interactions they had locally (spot-check a few records and note text); otherwise create and read back new rows. **AI (if enabled):** trigger a feature that calls OpenAI (for example extraction or summary) and confirm it succeeds when Upstash vars are set; without Upstash in production with `OPENAI_API_KEY` set, the app’s setup messaging in `getSetupStatus()` indicates the gap—resolve by adding Upstash or temporarily accepting the emergency flag only for debugging.

For tenancy, follow the **two-account manual test** described in [docs/plans/architecture-remediation-supabase-hardening.md](/docs/plans/architecture-remediation-supabase-hardening.md) before you call the deployment “done” for multi-user trust.

## Idempotence and Recovery

**Safe to repeat:** `npx supabase db push` applies only pending migrations; re-running when nothing is pending should be a no-op. **Vercel** redeploys are safe; rolling back is done by reverting a Git commit and redeploying or using Vercel’s rollback UI.

**Risky operations:** `supabase db reset` on **hosted** data destroys data—only use on disposable projects. Never paste the **service role** key into client-accessible env. If you leak an API key, rotate it in Supabase or OpenAI immediately and update Vercel env. **Re-importing** a dev dump twice without truncating can cause **primary key conflicts**—treat the first successful import as the baseline or truncate selected tables before a re-run on a non-live database.

**Recovery from bad import:** If you imported with the wrong `user_id`, sign-in may show an empty CRM; fix with targeted `UPDATE ... SET user_id = PROD_USER_ID WHERE user_id = wrong_id` per table (only on a database you control), or restore from a Supabase backup if available and retry.

If a migration partially applied, use Supabase support and migration repair workflows documented for the CLI version you use; do not hand-edit production schema without recording the same change in a new migration file for reproducibility.

## Artifacts and Notes

Keep a private note (password manager or team vault) of: production URL, Supabase project ref, which Vercel team owns the project, and who can rotate keys. Do not commit secrets.

Example env names only (values are secret):

    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
    OPENAI_API_KEY=sk-...
    UPSTASH_REDIS_REST_URL=https://...
    UPSTASH_REDIS_REST_TOKEN=...

## Interfaces and Dependencies

- **Hosting:** Vercel, Node compatible with Next.js 16 as declared in [package.json](/package.json).
- **Database and auth:** Supabase hosted Postgres + Auth; CLI `supabase` for migrations and `supabase db dump` for local **data-only** exports (`--local --data-only --schema public`).
- **Import tooling:** `psql` (PostgreSQL client) against the hosted connection URI, or the Supabase SQL editor for smaller scripts.
- **Application env contract:** [src/lib/env.ts](/src/lib/env.ts) and [.env.example](/.env.example).
- **AI:** OpenAI API key; optional `OPENAI_MODEL`.
- **Rate limiting:** Upstash Redis REST (`@upstash/redis` / `@upstash/ratelimit`) when AI is enabled in production.

---

**Revision history**

- **2026-04-05:** Added **seed production with dev data**: `public` data-only dump from local via `npx supabase db dump --local`, `user_id` remap to production `auth.users.id`, import with `psql`; clarified that [supabase/seed.sql](/supabase/seed.sql) stays empty and dumps must not be committed.

- **Initial version (2026-04-05):** Created ExecPlan for first production deployment path using Vercel and hosted Supabase, aligned with current env and middleware behavior.
