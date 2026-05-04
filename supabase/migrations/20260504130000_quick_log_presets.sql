-- Saved quick log configurations (people, type, title) for one-tap reuse.

create table public.quick_log_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null
    check (char_length(trim(label)) > 0 and char_length(trim(label)) <= 120),
  primary_person_id uuid not null references public.people (id) on delete cascade,
  interaction_type_id uuid not null references public.interaction_types (id) on delete cascade,
  interaction_title text not null
    default 'Quick log'
    check (
      char_length(trim(interaction_title)) > 0
      and char_length(trim(interaction_title)) <= 500
    ),
  attendee_person_ids uuid[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint quick_log_presets_attendees_exclude_primary
    check (not (primary_person_id = any (attendee_person_ids)))
);

create index quick_log_presets_user_sort_created_idx
  on public.quick_log_presets (user_id, sort_order, created_at desc);

create trigger set_quick_log_presets_updated_at
before update on public.quick_log_presets
for each row
execute function public.set_updated_at();

alter table public.quick_log_presets enable row level security;

create policy "quick_log_presets_select_own"
on public.quick_log_presets
for select
using (auth.uid() = user_id);

create policy "quick_log_presets_insert_own"
on public.quick_log_presets
for insert
with check (auth.uid() = user_id);

create policy "quick_log_presets_update_own"
on public.quick_log_presets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "quick_log_presets_delete_own"
on public.quick_log_presets
for delete
using (auth.uid() = user_id);
