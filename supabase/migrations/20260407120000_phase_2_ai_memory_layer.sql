-- Phase 2: candidate facts, relationship summaries, follow-up tasks (AI layer)

create table public.facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  interaction_id uuid references public.interactions (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  review_status text not null default 'candidate'
    check (review_status in ('candidate', 'accepted', 'dismissed')),
  extractor_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.relationship_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  kind text not null check (kind in ('profile_brief', 'next_meeting')),
  content text not null check (char_length(trim(content)) > 0),
  source_interaction_ids uuid[] not null default '{}',
  source_fact_ids uuid[] not null default '{}',
  model_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid references public.people (id) on delete cascade,
  interaction_id uuid references public.interactions (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'suggested'
    check (status in ('suggested', 'active', 'done', 'dismissed', 'snoozed')),
  due_at timestamptz,
  snoozed_until timestamptz,
  suggester_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index facts_user_id_idx on public.facts (user_id);
create index facts_person_id_idx on public.facts (person_id);
create index facts_interaction_id_idx on public.facts (interaction_id);
create index facts_review_status_idx on public.facts (review_status);

create index relationship_summaries_user_id_idx on public.relationship_summaries (user_id);
create index relationship_summaries_person_kind_idx
  on public.relationship_summaries (person_id, kind);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_person_id_idx on public.tasks (person_id);
create index tasks_interaction_id_idx on public.tasks (interaction_id);
create index tasks_status_idx on public.tasks (status);

create trigger set_facts_updated_at
before update on public.facts
for each row
execute function public.set_updated_at();

create trigger set_relationship_summaries_updated_at
before update on public.relationship_summaries
for each row
execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

alter table public.facts enable row level security;
alter table public.relationship_summaries enable row level security;
alter table public.tasks enable row level security;

create policy "facts_select_own"
on public.facts
for select
using (auth.uid() = user_id);

create policy "facts_insert_own"
on public.facts
for insert
with check (auth.uid() = user_id);

create policy "facts_update_own"
on public.facts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "facts_delete_own"
on public.facts
for delete
using (auth.uid() = user_id);

create policy "relationship_summaries_select_own"
on public.relationship_summaries
for select
using (auth.uid() = user_id);

create policy "relationship_summaries_insert_own"
on public.relationship_summaries
for insert
with check (auth.uid() = user_id);

create policy "relationship_summaries_update_own"
on public.relationship_summaries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "relationship_summaries_delete_own"
on public.relationship_summaries
for delete
using (auth.uid() = user_id);

create policy "tasks_select_own"
on public.tasks
for select
using (auth.uid() = user_id);

create policy "tasks_insert_own"
on public.tasks
for insert
with check (auth.uid() = user_id);

create policy "tasks_update_own"
on public.tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tasks_delete_own"
on public.tasks
for delete
using (auth.uid() = user_id);
