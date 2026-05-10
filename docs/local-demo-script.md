# Local demo script

Use this when presenting **Tether** locally. Open with why the product is **trustworthy**: memory and follow-through you control—not surveillance, pipeline scoring, or automatic outreach. Everything below assumes a **warm, friend-first PRM** tone (see repo authoring guidelines).

Demo names and journal-style notes are **fictional** and safe to show on screen.

## Cast (quick anchor)

| Who | Role in the story |
|-----|-------------------|
| **Jun** | Partner — use for hearts deep-dive and **live logging + AI** |
| **Stella** | Sister — family texture on the roster |
| **Jen** | Friend — standing hangouts and facts in seeded data |
| **Hazel** | Old college friend, **dormant** — drift without deleting history |

## Prerequisites

1. **Docker** running; local Supabase up (`npx supabase start` or your usual stack command).
2. Schema applied (`npx supabase db reset` or migrations pushed) and app env pointed at that database (`NEXT_PUBLIC_SUPABASE_*` in `.env.local`).
3. **`npm run dev`** — presenter and browser on the same build.
4. A signed-in **demo tenant** that already includes Jun, Stella, Jen, and Hazel (categories and sample timeline/facts optional but helpful).  
   - The packaged **`npm run db:seed:demo`** script loads a **different** fictional cast (see [`supabase/seed.demo.sql`](../supabase/seed.demo.sql)).  
   - For this script’s **Jun / Stella / Jen / Hazel** narrative, use an account you’ve set up yourself or run the journal-demo SQL under [`supabase/scripts/`](../supabase/scripts/) (see comments in those files for the demo user id / email).
5. **AI steps (4 and 6):** `OPENAI_API_KEY` configured where the server can read it. Without it, say you’ll skip extraction/chat or show recorded screenshots.

## Demo login

Use whichever account holds your demo roster (often a shared local user). Example:

| Field | Value |
|--------|--------|
| Email | Your demo user (e.g. `test@test.com`) |
| Password | However that user was created (Supabase Studio, [`supabase/seed.demo.sql`](../supabase/seed.demo.sql), etc.) |

---

## Flow (follow in order)

### Sign in (setup beat)

Open `/login`, sign in.

**One-liner:** “Personal relationship memory—friends first—not a sales CRM.”

---

### 1. People list (`/people`)

Stay on the directory first.

**Show:** Categories, last touch, interaction counts, and **heart bars** as a glanceable picture of care—not a leaderboard.

**Point to the cast:** Jun (partner), Stella (sister), Jen (friend), Hazel (dormant). Mention that **dormant** keeps context without pretending you talk weekly.

---

### 2. Jun — profile + hearts (`/people/[jun-id]`)

Open **Jun**.

**Hearts:** Explain once—baseline (“how close this relationship tends to feel”), plus recent moments and recency. Optionally hover or use whatever hint your build exposes. Do **not** repeat the full lecture on every person.

**Glance:** Facts and existing interactions set the stage for what you’ll add live in step 3.

---

### 3. Log a new interaction for Jun + save a preset

From Jun’s profile, open **Log interaction** (timeline area / primary action).

**Show:**

- Pick type, title, and a short **journal-style note** (where you went, what you talked about, anything you’d want to remember later—same energy as “we got pizza… then she told me she’s moving…”).
- Log it on the calendar / save so it appears on their timeline.

Then **save a preset** from the same flow: use **Save preset** so “Log presets” can reuse this shape later (type, title pattern, people, time). Mention presets also appear from **`/timeline`** via **Log presets** when you want a global shortcut.

**Ethics beat:** You chose what to record; nothing is mined from inboxes.

---

### 4. Suggest facts & follow-ups (that new interaction)

Scroll to the **interaction you just added** (still on Jun’s profile, or open it from the timeline in step 5 if your layout prefers).

Click **Suggest facts & follow-ups**.

**Show:**

- **Candidate facts** tied to the note—short, declarative memory (review, accept, dismiss).
- **Suggested tasks** if the pipeline surfaces them.

**Ethics beat:** AI proposes; **you confirm**. Facts stay editable; nothing silently overwrites the relationship record.

If the button reads **Facts & follow-ups already suggested**, use a fresh note or a different interaction so the audience sees one full cycle—or explain idempotency in one sentence.

---

### 5. Timeline (`/timeline`)

Open the global timeline.

**Show:** Newest-first **moments**, your language preserved, Jun’s new row alongside older history. If you have a **multi-person** interaction elsewhere in seed data, point out one event linked to multiple people once—no duplicate ghost entries.

Contrast **timeline** (what happened) with **facts** on profiles (durable things to recall next time).

---

### 6. Demo AI capabilities (`/chat`)

Open **Chat** (“Ask Tether”).

**Show:**

- Ask a **natural-language** question over stored notes and facts (e.g. “What do I know about Jun’s schedule stress?” or “Who did I talk to about ceramics?”).
- When the assistant proposes **timeline or profile updates**, walk through **review before anything saves**—same trust posture as step 4.

**Close:** AI is for extraction, recall, and drafting **candidate** updates—not for autonomous messaging or hidden scoring.

---

## If asked

- **Manipulative?** Assistive recall only; no auto-send, no scraping-by-default.
- **Privacy:** Local Postgres stays on your machine unless you deploy or export data elsewhere.
- **Hearts differ per row:** Baselines + logged history make the list credible; you only **explain** hearts in depth once (on Jun).
- **Fresh demo DB:** Reset/migrate your local DB, reload seed or SQL patches for `test@test.com`, then sign in again.
