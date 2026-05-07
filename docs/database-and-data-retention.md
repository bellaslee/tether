# Database overview and data retention

This document describes what Tether stores in Postgres (via Supabase), what kinds of information those tables hold, and how **declined or hidden** items behave—especially AI candidate facts and suggested reminders that you dismiss rather than delete.

It reflects the current implementation. For historical schema rationale, see [phase-1-mvp-schema-design.md](./phase-1-mvp-schema-design.md). SQL migrations under `supabase/migrations/` are the source of truth for columns and constraints.

## Where data lives

- **Database:** Supabase-hosted PostgreSQL (or local Supabase in development).
- **Ownership:** Core tables include `user_id` and use **row-level security (RLS)** so each authenticated user only reads and writes their own rows.
- **Auth identities:** Handled by Supabase Auth (`auth.users`). Application tables reference that user id; login credentials and auth metadata are managed by Supabase, not duplicated in app tables.

## Tables at a glance

Grouped by role in the product:

| Area | Tables | What they hold |
|------|--------|----------------|
| People and contacts | `people`, `contact_methods`, `person_categories`, `person_connections`, `connection_types` | Names, optional profile fields, how you know someone, contact methods, custom categories, relationship edges between people. |
| Moments / timeline | `interactions`, `interaction_people`, `interaction_types` | When something happened, type, title, freeform `raw_note`, links to one or more people. |
| Quick logging | `quick_log_presets` | Saved shortcuts for logging (labels, default attendees, times, etc.). |
| AI memory (facts & follow-ups) | `facts`, `tasks`, `relationship_summaries` | Extracted or manual facts, reminders/tasks, generated relationship briefs; each ties to people and optionally to a specific interaction. |
| Search / Ask | `document_embeddings` | Text chunks and vector embeddings for semantic retrieval over interaction notes and (non-dismissed) facts. |
| Product telemetry | `usage_events` | First-party events (screens, features, LLM usage metadata). Stored with a JSON `properties` field; **by convention** this should not contain identifiable personal content about third parties. |

Supporting columns on `people` (for example `interaction_count`, `relationship_hearts_baseline_halves`, `last_interaction_at`) hold **derived or preference** data maintained by the app for UX, not separate “secret” copies of your notes.

## What you enter vs what the system adds

- **You supply:** person profiles, contact info, interaction notes (`interactions.raw_note`), titles, types, and any manual edits to facts or tasks.
- **The system may add:** AI candidate facts and suggested tasks, relationship summaries, embedding rows, model/extractor metadata on facts and tasks (`extractor_metadata`, `suggester_metadata`, `model_metadata`), hashes used to avoid redundant AI runs, and usage events.

Interaction rows may store `memory_ai_input_hash`: a **digest** of note text (and related fingerprinting) used to decide whether the “suggest memory” flow has already been applied for the current note—not a second full copy of the note beyond `raw_note`.

## Facts: statuses and what is retained

Facts live in `facts` with `review_status` in:

- `candidate` — proposed (often by extraction); shown in review UI.
- `accepted` — approved structured memory.
- `dismissed` — you declined the suggestion (or dismissed after editing workflows); the row **remains in the database**.

### What happens when you dismiss a fact (vs delete)

| Action | Row in `facts` | Typical UI / Ask context | Embeddings (`document_embeddings`) | Re-use in AI |
|--------|----------------|---------------------------|--------------------------------------|----------------|
| **Dismiss** | Kept; `review_status = 'dismissed'` | Hidden from normal person/timeline views that only show active memory; excluded from “Ask” recent-facts context | Removed and not rebuilt while status stays dismissed | Declined text for the **same interaction** can be passed back into extraction prompts so the model is less likely to repeat it; dismissed bodies also participate in **deduplication** against new candidates for that person |
| **Delete** | Row removed | Gone | Embeddings for that fact deleted | No longer in dedup sets |

So “declined” facts are **not shown as accepted memory**, but the **text can still be stored** and used **inside the product** for deduplication and careful reuse in suggestion workflows—not as public-facing memory.

## Tasks (reminders): statuses and what is retained

Tasks live in `tasks` with `status` including:

- `suggested` — AI-suggested follow-up.
- `active`, `snoozed`, `done` — normal lifecycle.
- `dismissed` — you declined the suggestion; the row **remains**.

Dismissed tasks are **excluded** from lists meant for actionable reminders (for example the reminders page and person views filter them out). They are **still included** when the app builds signatures for **task deduplication**, so new suggestions are less likely to duplicate something you already turned down. For the **same interaction**, declined reminder titles/descriptions can be loaded and passed into suggestion prompts (alongside declined facts) so repeat suggestions stay aligned with your choices.

Hard-deleting a task row (if the UI offers it) removes it entirely and removes it from those dedup sets.

## Relationship summaries

`relationship_summaries` stores generated text (`content`), links to source interactions and facts (`source_interaction_ids`, `source_fact_ids`), and `model_metadata`. There is no separate “dismissed summary” state in the same way as facts; managing these rows is typically refresh/replace or delete, depending on feature behavior.

## Semantic search embeddings

`document_embeddings` stores chunked text plus vectors for:

- Interaction notes (`source_type = 'interaction_note'`).
- Facts (`source_type = 'fact'`), **only while the fact is not dismissed**—dismissal deletes fact embeddings and sync skips rebuilding them until status changes.

So dismissed facts fall out of vector retrieval; the underlying fact row may still exist for the reasons above.

## Usage and LLM metadata

- **`usage_events`:** Aggregates product and LLM call logging. Designed for analytics and debugging, not as the canonical store of relationship content.
- **Fact/task metadata JSON:** Often records model id, prompt version, pipeline name—useful for auditing what produced a row, not a substitute for your notes.

## What is not persisted in Postgres

Examples of state that does **not** show up as durable rows in these tables:

- **Ephemeral UI only:** Some surfaces (for example in-chat proposal dismissal) may track “dismissed” only in the browser session unless an action explicitly writes to the database.
- **Secrets:** API keys and service credentials stay in environment configuration, not in user tables.

## Practical takeaway

- **Declining** an AI fact or suggested reminder is a **soft rejection**: the app keeps enough structured text to avoid nagging you with the same suggestion and to improve future extraction, but it **does not treat dismissed rows as approved memory** in the UI or in embeddings the same way as accepted facts.
- **Deleting** removes the row (and related embeddings where applicable) and takes that content out of deduplication and prompts driven by stored rows.

If you need a future “purge all dismissed candidates” or retention TTL, that would be a product/schema change; today the schema allows long-lived storage of dismissed rows until you delete them or delete the owning interaction/person (with cascades as defined in migrations).
