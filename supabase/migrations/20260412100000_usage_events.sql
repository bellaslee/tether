-- First-party usage telemetry: screens, feature events, LLM call metadata (no PII in properties by convention).

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null
    check (category in ('screen', 'feature', 'llm')),
  name text not null check (char_length(trim(name)) > 0),
  properties jsonb not null default '{}'::jsonb,
  duration_ms integer
    check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index usage_events_user_category_created_idx
  on public.usage_events (user_id, category, created_at desc);

create index usage_events_user_name_created_idx
  on public.usage_events (user_id, name, created_at desc);

alter table public.usage_events enable row level security;

create policy "usage_events_select_own"
on public.usage_events
for select
using (auth.uid() = user_id);

create policy "usage_events_insert_own"
on public.usage_events
for insert
with check (auth.uid() = user_id);
