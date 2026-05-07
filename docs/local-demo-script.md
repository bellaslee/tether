# Local demo script (mock PRM data)

Use this when presenting **Tether** with the **local narrative seed**. Lead with **what makes the product respectful and trustworthy**—then let the **story** (cast + timeline) prove each point in the UI. The narrative is someone roughly eighteen months into a **new city and new job**, balancing an **inner circle**, **work relationships**, **family**, and **light networking**—without feeling like a sales CRM.

Fictional names and notes are safe to show on screen.

## Story at a glance (weave, don’t lecture)

| Thread | Who | Moral hook |
|--------|-----|------------|
| Home base | Jordan | Intimacy without treating people as “accounts.” |
| Inner circle | Sam vs Alex | Same label, different reality—no guilt algorithm. |
| Work pod | Priya, Chris, Morgan | Dependencies and trust, not pipeline stages. |
| Old chapter | Jamie | Dormant ties stay in context; nothing’s “deleted.” |
| Networking | Taylor | Open loops tied to a **reason**, not nag volume. |
| Family | Diane | Different relationship textures, same respect. |
| Mentor | Robin | Perspective over frequency. |

Refer back to this table only when you need a quick anchor—the demo flow below weaves these beats into each stop.

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

There is a **single** demo login; **relationship baselines** (heart floors) differ **per person** in the seed so `/people` looks like a real roster. If you need multiple logins for side-by-side builds, that would be a separate seed—this script assumes one tenant.

## Suggested flow (moral features first, story woven in)

### 1. Sign in

Open `/login`, sign in with the demo account.

**Lead with ethics:** The product is built for **memory and follow-through**, not surveillance or pipeline math. You’re not scoring relationships—you’re supporting intention. The ethical posture is closer to a journal + address book + reminders.

**Weave the story:** Everything you’re about to see is **fictional local data**; it exists to show how real notes and relationships could look when the tool stays **human-scale**.

**One-liner:** “This is a **personal** relationship memory tool—friends first—not a CRM funnel.”

### 2. People list (`/people`)

Scan the list once without clicking.

**Lead with ethics:** Categories and labels should clarify **care**, not compress people into funnel stages. Recency and warmth help you notice drift **without shame**.

**Hearts (glance only):** The demo seed sets **different connection baselines** per person so heart bars look varied—like a real account. **Do not** walk the audience through every row. Optionally say: “You’ll see different bars; I’ll unpack what that means on **one** relationship.”

**Weave the story:**

- **Same label, different reality:** Two **close friends**—**Sam** (constant touch) vs **Alex** (meaningful but infrequent). The list makes the contrast visible; it doesn’t declare a winner.
- **Dormant, not deleted:** **Jamie** (college-era) is **dormant**—life moved on, but you’re not pretending they never mattered.
- **Roles:** Partner, coworkers, family, mentor, networking—each row exists for a **reason** in the narrative, not to populate a dropdown.

### 3. Person profiles (~2 minutes total)

**Hearts deep-dive — pick one:** Open **Sam Rivera** and briefly explain **baseline + logged moments + recency** (hover the heart bar if your build shows it). That’s enough; treat everyone else’s hearts as **set dressing**.

**Story tour — stay light:** Glance other profiles for narrative beats **without** re-explaining hearts:

1. **Jordan Lee** — Partner; “home base” (optional if time is tight).
2. **Alex Kim** — Same **close friend** category as Sam; **older** last touch so the bar tells the drift story **next to** Sam if you flip between them—still no second lecture on mechanics.
3. **Priya Desai** — Manager; steady 1:1 rhythm.
4. **Taylor Brooks** — Networking + **open task** (article follow-up).

On **Chris Patel** or **Morgan Riley**, open **connections** if your build surfaces them: **coworker** link between adjacent squads—the graph reflects **real team ties**, not territory.

**Optional:** **Diane Foster (Mom)** — family cadence vs friends/work.

**Lead with ethics:** Detail pages are where **trust** shows up: you see **why** someone matters to you, not a lead score. Networking contacts still get **consent-shaped** follow-ups (tasks tied to real conversations).

**Weave the story:** Sam vs Alex shows **intimacy without ranking people**; Jordan / Priya / Taylor round out home, work, and light networking without needing the full hearts tour on each.

### 4. Timeline (`/timeline`)

Scroll chronologically (newest first).

**Lead with ethics:** The timeline is **your notes**, not an activity feed mined from inboxes. Multi-person events are stored **once** and linked honestly—no duplicate ghost entries.

**Weave the story:**

- **Sounds like real notes:** Interaction text reads like someone logging life—messy shorthand and work bullets—not polished PR prose.
- **Multi-person moments:** **Dinner at ours—Taylor met Sam** (inner circle + networking) and **patio lunch** with **Priya, Chris, Morgan** (cross-team work). Shows why **interactions** attach to multiple people once.
- **Long tail:** Older rows (**Jamie**, **Alex** deep in the past) preserve history without hiding who’s active today.

### 5. Facts & tasks (where the app shows them)

**Lead with ethics:** Facts are **candidate memory**—things you’d want to recall before the next touch. Tasks should **explain their reason** (why this follow-up exists) and stay **opt-in**, not naggy automation.

**Weave the story**

**Facts (examples in seed)**

- **Mom / pollinators** — concrete detail you’d want before the next call.
- **Chris / async-first** — working style for collaboration.
- **Taylor / PM pivot (candidate)** — something to treat lightly until they invite depth.

**Tasks**

- **Taylor:** Send the long-form article (closes the loop from the meetup—**reasoned** follow-up).
- **Morgan:** Optional deck link from lunch—**suggested**, not a guilt ping.

## If asked

- **Why do hearts differ on every row?** The seed sets **personal baselines** plus each person has different **logged moments** and **last touch**—so the list looks credible. In the demo you only **explain** that system once (on Sam).
- **Privacy:** Demo data is **fictional** and lives only in **local** Postgres unless you import it elsewhere on purpose.
- **AI (if applicable):** Anything generated should stay **editable** and traceable to sources—same idea as repository AI guidance in the authoring guidelines at the repo root.
- **“Is this manipulative?”** The intent is **assistive recall**—you choose what to log, what to keep, and what to act on. No auto-messaging, no scraping-by-default.
- **Re-running the demo:** `npx supabase db reset` then `npm run db:seed:demo` gives a clean slate (seed replaces `test@test.com` when present).
