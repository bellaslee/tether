# Local demo script (mock PRM data)

Use this when presenting **Tether** with the **local narrative seed**. The cast and timeline tell one story: someone roughly eighteen months into a **new city and new job**, balancing an **inner circle**, **work relationships**, **family**, and **light networking**—without feeling like a sales CRM.

Fictional names and notes are safe to show on screen.

## Prerequisites

1. **Docker** running; local Supabase stack up (`npx supabase start` or `npm run db:local`).
2. Schema matches the repo: `npx supabase db reset` (applies migrations and the empty [`supabase/seed.sql`](../supabase/seed.sql)).
3. Load demo data: `npm run db:seed:demo`  
   This runs [`supabase/seed.demo.sql`](../supabase/seed.demo.sql) against the local database (see the file for credentials and idempotency).
4. App env pointed at local Supabase (`NEXT_PUBLIC_SUPABASE_*` in `.env.local`). Start the app: `npm run dev`.

## Demo login

| Field | Value |
|--------|--------|
| Email | `test@test.com` |
| Password | `password` |

## Suggested flow (in order)

### 1. Sign in

Open `/login`, sign in with the demo account.

**One-liner:** “This is a **personal** relationship memory tool—friends first—not a pipeline.”

### 2. People list (`/people`)

Scan the list once without clicking.

**Talking points**

- **Same label, different reality:** You have two **close friends**—**Sam** (constant touch) vs **Alex** (meaningful but infrequent). Same category, different recency; the product helps you notice drift without guilt.
- **Dormant, not deleted:** **Jamie** (college-era) is **dormant**—life moved on, but you’re not pretending they never mattered.
- **Roles:** Partner, coworkers, family, mentor, networking—each row exists for a **reason** in the story, not to fill a dropdown.

### 3. Person profiles (pick 4–5, ~2 minutes total)

Open in roughly this order:

1. **Jordan Lee** — Partner; high-frequency, “home base” relationship.
2. **Sam Rivera** — Close friend; recent texts and hangs (last touch should look very fresh).
3. **Alex Kim** — Close friend; **much older** last touch—contrast with Sam.
4. **Priya Desai** — Manager; steady 1:1 / roadmap rhythm.
5. **Taylor Brooks** — Networking contact with an **open task** (article follow-up).

On **Chris Patel** or **Morgan Riley**, open **connections** if your build surfaces them: **coworker** link between adjacent squads—shows the graph is a team, not a flat list.

**Optional:** **Diane Foster (Mom)** — family cadence vs friends/work.

### 4. Timeline (`/timeline`)

Scroll chronologically (newest first).

**Talking points**

- **Sounds like real notes:** Interaction text is written like someone actually logging a touchpoint—messy shorthand, reminders-to-self, and work bullets—not polished prose.
- **Multi-person moments:** Find **dinner at ours—Taylor met Sam** (inner circle + networking) and **patio lunch** with **Priya, Chris, Morgan** (cross-team work). Explains why **interactions** link multiple people once.
- **Long tail:** Older rows (**Jamie**, **Alex** deep in the past) show history without hiding who’s active today.

### 5. Facts & tasks (where the app shows them)

**Facts (examples in seed)**

- **Mom / pollinators** — concrete detail you’d want before the next call.
- **Chris / async-first** — working style for collaboration.
- **Taylor / PM pivot (candidate)** — something to treat lightly until they invite depth.

**Tasks**

- **Taylor:** Send the long-form article (closes the loop from the meetup follow-up).
- **Morgan:** Optional deck link from lunch—**suggested**, not naggy.

## Talking points by story beat

| Beat | People / UI | What to say |
|------|-------------|-------------|
| Home base | Jordan | Daily-ish partnership; warmth + recency. |
| Inner circle drift | Sam vs Alex | Intentional friendship isn’t only “how often.” |
| Work pod | Priya, Chris, Morgan; patio lunch | Trust and dependencies across squads. |
| Old chapter | Jamie | Dormant ties stay in context. |
| Networking loop | Taylor; meetup → dinner → follow-up task | Reminders tied to a **reason**. |
| Family rhythm | Diane | Calls vs hangs vs meetings—different textures. |
| Mentor | Robin | Occasional perspective, not volume. |
| Shared moments | Multi-person interactions | Timeline reflects real group moments. |

## If asked

- **Privacy:** Demo data is **fictional** and lives only in **local** Postgres unless you import it elsewhere on purpose.
- **AI (if applicable):** Anything generated should stay **editable** and traceable to sources—same idea as repository AI guidance in the authoring guidelines at the repo root.
- **Re-running the demo:** `npx supabase db reset` then `npm run db:seed:demo` gives a clean slate (seed replaces `test@test.com` when present).
