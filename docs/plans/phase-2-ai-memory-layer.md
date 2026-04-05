# Phase 2: AI memory layer (facts, summaries, reminders) with PII-safe LLM boundaries

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Repository ExecPlan authoring rules live at `.agent/PLANS.md`. This document must be maintained in accordance with that file.

**Prerequisites (checked in):** Phase 1 CRM data model and UI are implemented per `docs/plans/phase-1-core-crm.md` and migrations under `supabase/migrations/`. Tables `people`, `contact_methods`, `interactions`, and `interaction_people` exist with RLS. Server data access uses `src/lib/db/server.ts` (and optional service-role path for local dev bypass). A minimal OpenAI client stub exists at `src/lib/ai/openai.ts`.

---

## Purpose / Big Picture

After this work, a signed-in user can turn raw interaction notes into **reviewable candidate facts**, generate **relationship briefs** grounded in stored sources, and receive **suggested follow-up tasks**—all without sending **personally identifiable information** from the database to the language model. **Personally identifiable information** means data that identifies or contacts a specific individual when combined with normal use of the app, including legal or preferred names, display names, birth dates, exact addresses, phone numbers, email addresses, social handles tied to a person, and similar fields stored on `people` or `contact_methods`.

The model may still see **user-authored note text** from `interactions.raw_note` when extraction or summarization requires it; that text is the user’s own words. The **non‑negotiable** product rule for this phase is that **structured profile and contact fields from Postgres must never appear in model prompts**, and **people must be referred to by stable opaque identifiers** (`people.id`, a UUID) in everything the model sees. **Human-readable labels** come from **local code** after the model responds, using helpers that prefer **`display_name`** and fall back to `full_name` only when needed (reuse `personShownName` in `src/lib/people/list-name.ts` for list-style labeling; keep the person detail page policy from that module’s comment if it still applies).

Users can **accept, edit, or delete** extracted facts and **keep, edit, snooze, or dismiss** suggested tasks. Summaries and facts remain **traceable** to source interactions. When the pipeline would otherwise surface contact details, the **model output format** should use **placeholders** (for example a literal token like `{{contact:primary_phone:person_id}}` or a structured JSON field that names a resolver key, not a phone number string from the model). **Resolving placeholders to real phone numbers, emails, or similar** happens only in **server-side helpers** when the UI explicitly needs them (for example a “Reveal contact” control or a dedicated contact panel), not by default in every AI blurb.

**How to see it working:** From a person’s timeline, run extraction on an interaction; open a review UI for new rows in a `facts` table; generate a relationship brief on the person page; trigger task suggestions; confirm in logs or a dedicated debug mode (optional) that outbound prompts contain **UUIDs for people**, not names or DOB, and that rendered UI shows **names from local resolution** only.

---

## Progress

- [ ] (YYYY-MM-DD) Add Phase 2 schema migration(s): `facts`, `relationship_summaries`, `tasks` (or equivalent names), with `user_id`, foreign keys, timestamps, source references, and RLS consistent with Phase 1 patterns.
- [ ] (YYYY-MM-DD) Implement `src/lib/ai/pii/` (or similar): canonical list of **forbidden prompt fields**, **note placeholderization** for linked people (replace known names with `[person:<uuid>]` using locally loaded aliases, without sending those names to the model in structured headers), and **post-model resolution** from UUID to display-oriented labels for UI.
- [ ] (YYYY-MM-DD) Implement OpenAI **Responses API** clients and versioned prompts under `src/lib/ai/` (no prompts embedded in large UI files), with structured outputs for extraction and task suggestion.
- [ ] (YYYY-MM-DD) Server actions or route handlers for: run extraction on one interaction; list/review/update/delete facts; generate and refresh summaries; suggest tasks; optional “refresh summaries after new interaction” hook (manual button first; automatic refresh can be a follow-up if it risks cost loops).
- [ ] (YYYY-MM-DD) UI on person detail and/or interaction views: fact review, summary panel, suggested tasks, source links back to interactions.
- [ ] (YYYY-MM-DD) Wire `OPENAI_API_KEY` (and any model name env vars) in `src/lib/env.ts` and `.env.example`; document local testing.
- [ ] (YYYY-MM-DD) Run `npm run lint` and `npm run build`; execute validation scenarios from `docs/personal-crm-user-stories.md` Phase 2 and this plan’s Validation section.

Use timestamps on items as they complete, per `.agent/PLANS.md`.

---

## Surprises & Discoveries

Document unexpected API limits, token costs, parsing edge cases, or RLS surprises here with short evidence (log snippet or test output).

- Observation: (none yet)  
  Evidence: (none yet)

---

## Decision Log

- **Decision:** Treat **database-backed identity and contact fields** as **forbidden in LLM prompts**; identify people by **`people.id` (UUID)** only in model-visible structured data and in placeholder substitution inside notes before send.  
  **Rationale:** Minimizes sharing of structured PII with a third-party inference provider; aligns with the product owner’s requirement to resolve names locally.  
  **Date:** 2026-04-04 / User + Assistant

- **Decision:** Prefer **`display_name`** over **`full_name`** when resolving UUIDs to labels for **AI-derived UI** (chips, list headings for suggestions), using shared helpers so behavior stays consistent with the people list.  
  **Rationale:** Display names are the user’s chosen casual label; full names are more identifying and should not be sent to the model, and need not be the default for secondary UI when a display name exists.  
  **Date:** 2026-04-04 / User

- **Decision:** Use **OpenAI Responses API** for new AI features per `AGENTS.md`.  
  **Rationale:** Single supported API shape for the project going forward.  
  **Date:** 2026-04-04 / AGENTS.md

- **Decision:** **Candidate facts** and **suggested tasks** remain **editable and deletable**; nothing is silently written as unquestioned truth.  
  **Rationale:** Trust and reviewability from `AGENTS.md` and user stories.  
  **Date:** 2026-04-04 / Docs

- **Decision:** For **contact details** in model-generated prose, use an explicit **placeholder protocol** resolved only by **server-side helpers** when the product requests it, not inlined guessed numbers from the model.  
  **Rationale:** The model must not output or infer phone numbers and similar; the database remains source of truth.  
  **Date:** 2026-04-04 / User

---

## Outcomes & Retrospective

Summarize what shipped versus `docs/personal-crm-user-stories.md` Phase 2, any deferred automation (for example summary refresh triggers), measured rough token cost per operation, and lessons about placeholder hygiene on note text. Update when the plan completes.

---

## Context and Orientation

**Phase 2 user stories** live in `docs/personal-crm-user-stories.md` under “Phase 2: AI Memory Layer.” They cover fact extraction from interactions, human review of facts, relationship summaries, next-meeting-style briefs, summary refresh after activity, task extraction from notes, and review of reminder suggestions.

**Phase 1 schema** in `docs/phase-1-mvp-schema-design.md` intentionally omitted `facts`, `relationship_summaries`, and `tasks`. This phase adds them via new migrations. Each new table should include **`user_id`** (or strict RLS via join ownership to `people` / `interactions` that already carry `user_id`) so policies stay simple.

**Existing code paths:** People and interactions are loaded in App Router pages under `src/app/(crm)/`. OpenAI is not yet wired beyond `createOpenAiClient()` in `src/lib/ai/openai.ts`. Environment validation belongs in `src/lib/env.ts`.

**Terms:**

- **Language model** or **model** means the remote neural text service (OpenAI) invoked over HTTPS.

- **Prompt** means the combined instructions and user content sent in one inference request.

- **Local resolution** means TypeScript code running on the Next.js server (or trusted server actions) that reads Postgres via Supabase and maps UUIDs to display strings or contact rows.

- **Placeholder** means a deliberate token or structured field in model output that the UI or server replaces with real data from the database **after** inference, only when appropriate.

**Phase 3 cross-reference:** When you add the **semantic recall and Ask interface** (`docs/personal-crm-user-stories.md`, “Phase 3: Semantic Recall and Ask Interface”), treat the PII module from Milestone B (`src/lib/ai/pii/`, placeholderization, forbidden-field list, UUID-in / resolve-locally-out) as the **single shared boundary** for every outbound LLM call. Retrieval can still use embeddings over stored text, but **question prompts, reranker context, and answer composition** sent to the model should follow the same rules: person identity as UUID in structured paths, display names and contact values only after local resolution, and user questions optionally scrubbed or constrained the same way as `raw_note`. When Phase 3 gets its own ExecPlan, it should reference this document rather than redefining PII rules.

---

## Plan of Work

### Milestone A — Schema and RLS

Add a migration under `supabase/migrations/` defining tables roughly along these lines (adjust names to match existing naming conventions in the repo, but keep the intent):

**`facts`** (or `person_facts`): `id`, `user_id`, `person_id` (FK `people`), optional `interaction_id` (FK `interactions`), `body` or structured fields for fact text, a **review status** (for example candidate / accepted / dismissed), `created_at`, `updated_at`, optional metadata JSON for model version and extractor version. Facts must be **owned** by the same user as the person.

**`relationship_summaries`**: `id`, `user_id`, `person_id`, `kind` (for example `profile_brief` vs `next_meeting`), `content` text (or structured blocks), `source_interaction_ids` or a join table for traceability, model metadata, `created_at`, `updated_at`.

**`tasks`**: `id`, `user_id`, `person_id` optional, `interaction_id` optional, `title`, `description`, `status` (suggested / active / done / dismissed / snoozed), `due_at` optional, `snoozed_until` optional, timestamps.

Add indexes for the read paths: by `person_id`, by `user_id`, by `interaction_id`, by `status`. Add **RLS policies** mirroring Phase 1: users only see and mutate rows whose `user_id` matches `auth.uid()`, with no broad anon access. Apply migrations locally with the project’s standard command (for example `npx supabase db push --local` from the repo root) after adding SQL.

Regenerate Supabase TypeScript types if the project uses a generator for `src/lib/db/database.types.ts`.

### Milestone B — PII boundary module (required before any feature prompts)

Create a small, well-tested module (for example `src/lib/ai/pii/redact.ts` and `src/lib/ai/pii/resolve.ts`) that centralizes rules. Design it so **Phase 3 Ask-my-CRM** can import the same helpers without a parallel policy (see **Phase 3 cross-reference** under Context and Orientation). **Forbidden for prompts** when loaded from the database: `people.full_name`, `people.display_name`, `people.preferred_name`, `people.birthday`, `people.location`, `people.pronouns`, `people.occupation`, `people.company`, and all `contact_methods` rows (types and values), plus any future column explicitly marked sensitive in this plan’s Decision Log. **Allowed:** `people.id`, `people.category`, `people.status`, and coarse non-identifying enums if truly needed for tone (justify in Decision Log if you add more).

**Note text (`raw_note`):** Before sending a note to the model, run a **local placeholderization** step: for every `person_id` linked to the interaction via `interaction_people`, load **name aliases** (display name, preferred name, full name) **only in server memory**, build a longest-match or safe replacement strategy, and replace occurrences in the note string with a neutral token such as `[person:<uuid>]` so the model learns facts about “the person identified by this id” without receiving the legal name from the column. This does not guarantee removal of names the user typed that are not in the database; it **does** guarantee structured names from profiles are not duplicated into the prompt. Document that residual risk in `Surprises & Discoveries` if user testing shows gaps.

**After the model returns:** Any structured `person_id` in JSON should be turned into UI labels via **`personShownName`** and a small loader that fetches `{ display_name, full_name }` for referenced IDs in one query. **Never** ask the model to output a person’s phone or email; if prose needs “contact hint,” output a placeholder key the client sends back to a **server-only** resolver (for example `getPrimaryContact(personId, 'phone')`) when the user invokes an explicit action.

### Milestone C — Fact extraction

Implement a server-only pipeline: load interaction by id (authorize via RLS), load linked `person_id` list, build **redacted note** and **person id list**, call Responses API with a **versioned prompt** under `src/lib/ai/prompts/extract-facts.ts` (name illustrative), parse **structured output** into candidate fact rows. Write rows as **review status = candidate**. Link each fact to `interaction_id` and the correct `person_id` when the model targets a specific subject; for multi-person interactions, require the model to emit `person_id` from the provided list only.

**UI:** On interaction or person timeline, a control “Suggest facts” (or automatic run on save—pick one and record in Decision Log; automatic runs increase cost). A fact review panel lists candidates with accept / edit / delete.

### Milestone D — Relationship summaries

Two summary kinds align with user stories: a **profile-style brief** and a **next-meeting brief**. Inputs to the model should include **accepted facts** (text only, no names if facts accidentally contain names—optional future lint) and **placeholderized interaction snippets** for recent history, plus **person UUID** and maybe category/status. **Do not** pass DOB or contact info.

Store results in `relationship_summaries` with enough **source linkage** to satisfy “show why this exists” (for example store arrays of interaction ids or fact ids used). **Refresh:** implement at least **manual** “Refresh summary”; optional hook after new interaction can be deferred with a recorded decision if automatic refresh is too costly.

### Milestone E — Task suggestions

Similar pipeline: placeholderized note, person ids, structured output for suggested tasks. Insert as **status = suggested**. UI to convert to a normal task, edit, snooze, or dismiss. If snooze stores a timestamp, enforce it in queries so snoozed items stay hidden until due.

### Milestone F — Configuration, failure modes, and docs

Extend `src/lib/env.ts` and `.env.example` with `OPENAI_API_KEY` and a **default model name** constant or env var. If the key is missing, AI buttons should **fail gracefully** with a clear message; core CRM pages must still load per `AGENTS.md`.

Optional: add a **development-only** logging flag that prints **redacted** prompt previews (never log secrets, never log unredacted notes in production).

---

## Concrete Steps

All commands assume the repository root as working directory unless stated otherwise.

1. After authoring SQL, apply locally:

        npx supabase db push --local

   Expect success with no migration errors. If Supabase is not running, start it per `initialize-project` docs.

2. Install OpenAI SDK if not already present (the repo may already list `openai`):

        npm install

3. Run quality gates:

        npm run lint
        npm run build

4. Run the dev server and walk through the Validation scenarios:

        npm run dev

---

## Validation and Acceptance

Phrase checks as observable behavior.

**PII boundary (required):** With debug logging enabled for prompts in development only, trigger fact extraction for an interaction linked to a person whose profile contains a distinctive `full_name`, `display_name`, `birthday`, and a primary phone. Inspect the logged prompt (or a test fixture that captures the request body): it must **not** contain those strings. It **must** contain the person’s UUID and placeholder tokens in the note if the note originally used the person’s name from the profile.

**Fact extraction:** Given an interaction with a substantive `raw_note`, running extraction creates **candidate** facts linked to that interaction and person; the user can accept one, edit its text, and delete another.

**Summaries:** Generating a profile brief writes a `relationship_summaries` row; the UI shows the brief and a way to see **which interactions or facts** grounded it (ids or links).

**Tasks:** Suggested tasks appear from a note mentioning a follow-up; the user can dismiss or accept.

**Auth isolation:** A second local user cannot load another user’s facts, summaries, or tasks (RLS).

**Graceful degradation:** With `OPENAI_API_KEY` unset, CRM pages work; AI actions show a helpful error.

---

## Idempotence and Recovery

Migrations should be forward-only and additive. If a migration partially fails, use Supabase’s documented repair flow or reset local DB in development. Re-running `npm run build` and `npm run lint` is safe.

Fact extraction should be **idempotent** if the product chooses “run again”: either replace prior **candidate** facts for that interaction or dedupe by a hash of inputs; record the chosen approach in the Decision Log to avoid duplicate candidates confusing users.

---

## Artifacts and Notes

Inductive examples belong here as the implementation produces them (sample JSON schema from the model, sample prompt skeleton with placeholders). Keep excerpts short.

---

## Interfaces and Dependencies

**Dependency:** `openai` npm package (already used in `src/lib/ai/openai.ts`). Prefer the **Responses API** surface documented by OpenAI for this project.

**Required server-only functions (names illustrative; implement as needed):**

- `buildExtractionPrompt(input: { interactionId: string; personIds: string[]; redactedNote: string }): ...`

- `placeholderizeNote(note: string, aliasMap: Map<string, string /* uuid */>): string` where `aliasMap` keys are known aliases and values are UUIDs, never sent as names in parallel structured fields.

- `resolvePersonLabels(ids: string[], userId: string): Promise<Map<string, string>>` using `personShownName` rules.

- `resolveContactPlaceholder(personId: string, kind: 'primary_phone' | 'primary_email', userId: string): Promise<string | null>` for explicit UI actions only.

**API routes or server actions:** Prefer server actions next to existing patterns in `src/lib/actions/` for mutations and loading.

---

## Revision history

- **2026-04-04:** Initial ExecPlan authored for Phase 2 with non-negotiable PII-safe LLM boundaries, UUID identity in prompts, local display-name resolution, and placeholder-based contact handling per product owner direction.

- **2026-04-04:** Added explicit **Phase 3** cross-reference so semantic search and Ask-my-CRM reuse the same `src/lib/ai/pii/` boundary; future Phase 3 ExecPlan should cite this plan for PII rules instead of duplicating them.
