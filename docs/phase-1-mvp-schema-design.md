# Phase 1 MVP Schema Design

## Purpose

This document defines the recommended Phase 1 database schema for the personal relationship CRM MVP.

Phase 1 should support:

- private authenticated access
- person profiles
- contact methods
- manual interaction capture
- multi-person interactions
- person detail timelines
- global interaction timeline

This phase intentionally does not include:

- AI fact extraction
- AI summaries
- embeddings
- semantic search
- imports from calendar or email

## Design Principles

- Start with real Postgres, not local JSON files
- Keep the schema small but relationally correct
- Support the core CRM loop before adding AI layers
- Preserve source-of-truth interaction history
- Model multi-person events correctly from the beginning
- Leave room for Phase 2 and beyond without overbuilding now

## Recommended Phase 1 Tables

Phase 1 should include these tables:

- `people`
- `contact_methods`
- `interactions`
- `interaction_people`

Auth should use Supabase Auth. Application tables should reference the authenticated owner through `user_id`.

## Why `user_id` Should Exist Now

Even if this starts as a single-user personal tool, adding `user_id` now is worth it because it:

- keeps data ownership explicit
- makes row-level security straightforward
- prevents a painful migration later
- aligns with the Phase 1 auth requirement

## Table Design

### 1. `people`

This is the core profile table.

Recommended columns:

```sql
people
- id uuid primary key
- user_id uuid not null
- full_name text not null
- preferred_name text
- category text not null
- status text not null default 'active'
- birthday date
- pronouns text
- location text
- occupation text
- company text
- how_you_met text
- relationship_context text
- met_at date (optional; month and year only, stored as the first day of that month)
- last_interaction_at timestamptz
- created_at timestamptz not null
- updated_at timestamptz not null
```

Notes:

- `full_name` is required because it is the minimum identity field.
- `preferred_name` helps the UI feel more personal.
- `category` should exist now because friend versus networking context is already part of the product vision.
- `status` helps hide dormant or archived relationships without deleting them.
- `last_interaction_at` should be maintained by application logic or a later trigger.
- Do not add `relationship_score` in Phase 1. A derived “warmth” indicator (hot / warm / cold) may be computed in the app from `last_interaction_at` and relationship tenure instead of storing a score.

Recommended `category` values:

- `friend`
- `close_friend`
- `acquaintance`
- `networking`
- `mentor`
- `family`

Recommended `status` values:

- `active`
- `dormant`
- `archived`

### 2. `contact_methods`

This stores multiple ways to reach one person.

Recommended columns:

```sql
contact_methods
- id uuid primary key
- person_id uuid not null
- type text not null
- value text not null
- is_primary boolean not null default false
- notes text
- created_at timestamptz not null
- updated_at timestamptz not null
```

Notes:

- A person can have many contact methods.
- `value` should remain flexible because contact formats vary.
- `is_primary` supports lightweight UX without extra complexity.

Recommended `type` values:

- `phone`
- `email`
- `instagram`
- `linkedin`
- `discord`
- `address`
- `other`

### 3. `interactions`

This is the heart of the system. Each row represents one real interaction or event.

Recommended columns:

```sql
interactions
- id uuid primary key
- user_id uuid not null
- occurred_at timestamptz not null
- type text not null
- direction text
- title text
- raw_note text
- created_at timestamptz not null
- updated_at timestamptz not null
```

Notes:

- `occurred_at` is required so timelines work correctly.
- `type` should exist now to support filtering and better summaries later.
- `direction` is optional in Phase 1, but useful enough to keep.
- `title` is optional because many entries will just be quick notes.
- `raw_note` is the main captured memory field and should remain freeform.
- Do not add AI fields like sentiment, extraction status, or source metadata yet.

Recommended `type` values:

- `hangout`
- `text`
- `call`
- `dinner`
- `party`
- `coffee_chat`
- `meeting`
- `other`

Recommended `direction` values:

- `inbound`
- `outbound`
- `mutual`

### 4. `interaction_people`

This join table correctly models multi-person interactions.

Recommended columns:

```sql
interaction_people
- interaction_id uuid not null
- person_id uuid not null
- role text not null default 'attendee'
- created_at timestamptz not null
```

Notes:

- This table is required in Phase 1.
- Do not store one duplicated interaction per person.
- Use a composite primary key on `(interaction_id, person_id)`.

Recommended `role` values:

- `primary`
- `attendee`

## Excluded from Phase 1

These tables should wait until later phases:

- `facts`
- `relationship_summaries`
- `tasks`
- `source_documents`
- `document_embeddings`

Why they are excluded:

- `facts` and `relationship_summaries` belong to the AI memory layer in Phase 2
- `tasks` can wait until AI follow-up suggestions or reminder workflows exist
- `source_documents` and `document_embeddings` belong to import and retrieval phases

## Relationships

Core relationships:

- one `user` has many `people`
- one `user` has many `interactions`
- one `person` has many `contact_methods`
- one `interaction` has many `interaction_people`
- one `person` has many `interaction_people`

Derived behavior:

- a person timeline is built by joining `interaction_people` to `interactions`
- the global timeline comes directly from `interactions`
- `people.last_interaction_at` can be updated from the most recent linked interaction

## Constraints and Indexes

Recommended constraints:

- foreign key from `people.user_id` to `auth.users.id`
- foreign key from `contact_methods.person_id` to `people.id`
- foreign key from `interactions.user_id` to `auth.users.id`
- foreign key from `interaction_people.interaction_id` to `interactions.id`
- foreign key from `interaction_people.person_id` to `people.id`
- composite primary key on `interaction_people (interaction_id, person_id)`

Recommended indexes:

- index `people(user_id, full_name)`
- index `people(user_id, status)`
- index `people(user_id, category)`
- index `people(user_id, last_interaction_at desc)`
- index `contact_methods(person_id)`
- index `interactions(user_id, occurred_at desc)`
- index `interactions(type)`
- index `interaction_people(person_id)`
- index `interaction_people(interaction_id)`

Recommended business rules:

- at most one primary contact method per person
- categories and statuses should be constrained with checks or enums
- interaction roles and interaction types should be constrained with checks or enums

## Row-Level Security Direction

Phase 1 should assume row-level security.

High-level rule shape:

- users can only read their own `people`
- users can only insert and update their own `people`
- users can only read their own `interactions`
- users can only insert and update their own `interactions`
- join-table access should only be allowed when both linked records belong to the same authenticated user

This can be implemented with Supabase RLS policies once the app is scaffolded.

## Suggested SQL Starter Schema

This is a practical starting point for a first migration.

```sql
create extension if not exists pgcrypto;

create table people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  preferred_name text,
  category text not null check (
    category in ('friend', 'close_friend', 'acquaintance', 'networking', 'mentor', 'family')
  ),
  status text not null default 'active' check (
    status in ('active', 'dormant', 'archived')
  ),
  birthday date,
  pronouns text,
  location text,
  occupation text,
  company text,
  how_you_met text,
  relationship_context text,
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contact_methods (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  type text not null check (
    type in ('phone', 'email', 'instagram', 'linkedin', 'discord', 'address', 'other')
  ),
  value text not null,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index contact_methods_one_primary_per_person
on contact_methods (person_id)
where is_primary = true;

create table interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  type text not null check (
    type in ('hangout', 'text', 'call', 'dinner', 'party', 'coffee_chat', 'meeting', 'other')
  ),
  direction text check (
    direction in ('inbound', 'outbound', 'mutual')
  ),
  title text,
  raw_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table interaction_people (
  interaction_id uuid not null references interactions(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  role text not null default 'attendee' check (
    role in ('primary', 'attendee')
  ),
  created_at timestamptz not null default now(),
  primary key (interaction_id, person_id)
);

create index people_user_name_idx
  on people (user_id, full_name);

create index people_user_status_idx
  on people (user_id, status);

create index people_user_category_idx
  on people (user_id, category);

create index people_user_last_interaction_idx
  on people (user_id, last_interaction_at desc);

create index contact_methods_person_idx
  on contact_methods (person_id);

create index interactions_user_occurred_at_idx
  on interactions (user_id, occurred_at desc);

create index interactions_type_idx
  on interactions (type);

create index interaction_people_person_idx
  on interaction_people (person_id);

create index interaction_people_interaction_idx
  on interaction_people (interaction_id);
```

## Phase 1 Query Patterns

This schema is designed to support these early queries well:

- list all people for the current user
- show a single person's profile
- show a single person's timeline
- list recent interactions across the whole CRM
- search people by name
- filter people by category or status
- find the most recent interaction for a person

Example person timeline query:

```sql
select i.*
from interactions i
join interaction_people ip on ip.interaction_id = i.id
where ip.person_id = $1
order by i.occurred_at desc;
```

## Open Decisions

These are reasonable to defer until implementation:

- whether to use text columns with check constraints or Postgres enums
- whether `last_interaction_at` is maintained in app code or by database trigger
- whether contact methods should support soft delete later
- whether a separate `tags` system is needed before Phase 2

## Recommendation

For the MVP, build Phase 1 on local Postgres or local Supabase with this schema, then add seed data and stubbed AI later.

This gives the project:

- a real relational foundation
- accurate timeline behavior
- correct multi-person event modeling
- a clean path into facts, summaries, tasks, and embeddings in later phases
