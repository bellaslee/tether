create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) > 0),
  preferred_name text,
  category text not null check (category in ('friend', 'close_friend', 'acquaintance', 'networking', 'mentor', 'family')),
  status text not null default 'active' check (status in ('active', 'dormant', 'archived')),
  birthday date,
  pronouns text,
  location text,
  occupation text,
  company text,
  how_you_met text,
  relationship_context text,
  last_interaction_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.contact_methods (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  type text not null check (type in ('phone', 'email', 'instagram', 'linkedin', 'discord', 'address', 'other')),
  value text not null check (char_length(trim(value)) > 0),
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null,
  type text not null check (type in ('hangout', 'text', 'call', 'dinner', 'party', 'coffee_chat', 'meeting', 'other')),
  direction text check (direction in ('inbound', 'outbound', 'mutual')),
  title text,
  raw_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.interaction_people (
  interaction_id uuid not null references public.interactions (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  role text not null default 'attendee' check (role in ('primary', 'attendee')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (interaction_id, person_id)
);

create index people_user_id_full_name_idx
  on public.people (user_id, full_name);

create index people_user_id_status_idx
  on public.people (user_id, status);

create index people_user_id_category_idx
  on public.people (user_id, category);

create index people_user_id_last_interaction_at_idx
  on public.people (user_id, last_interaction_at desc nulls last);

create index contact_methods_person_id_idx
  on public.contact_methods (person_id);

create unique index contact_methods_primary_per_person_idx
  on public.contact_methods (person_id)
  where is_primary;

create index interactions_user_id_occurred_at_idx
  on public.interactions (user_id, occurred_at desc);

create index interaction_people_person_id_idx
  on public.interaction_people (person_id);

create trigger set_people_updated_at
before update on public.people
for each row
execute function public.set_updated_at();

create trigger set_contact_methods_updated_at
before update on public.contact_methods
for each row
execute function public.set_updated_at();

create trigger set_interactions_updated_at
before update on public.interactions
for each row
execute function public.set_updated_at();

alter table public.people enable row level security;
alter table public.contact_methods enable row level security;
alter table public.interactions enable row level security;
alter table public.interaction_people enable row level security;

create policy "people_select_own"
on public.people
for select
using (auth.uid() = user_id);

create policy "people_insert_own"
on public.people
for insert
with check (auth.uid() = user_id);

create policy "people_update_own"
on public.people
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "people_delete_own"
on public.people
for delete
using (auth.uid() = user_id);

create policy "contact_methods_select_own"
on public.contact_methods
for select
using (
  exists (
    select 1
    from public.people
    where people.id = contact_methods.person_id
      and people.user_id = auth.uid()
  )
);

create policy "contact_methods_insert_own"
on public.contact_methods
for insert
with check (
  exists (
    select 1
    from public.people
    where people.id = contact_methods.person_id
      and people.user_id = auth.uid()
  )
);

create policy "contact_methods_update_own"
on public.contact_methods
for update
using (
  exists (
    select 1
    from public.people
    where people.id = contact_methods.person_id
      and people.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.people
    where people.id = contact_methods.person_id
      and people.user_id = auth.uid()
  )
);

create policy "contact_methods_delete_own"
on public.contact_methods
for delete
using (
  exists (
    select 1
    from public.people
    where people.id = contact_methods.person_id
      and people.user_id = auth.uid()
  )
);

create policy "interactions_select_own"
on public.interactions
for select
using (auth.uid() = user_id);

create policy "interactions_insert_own"
on public.interactions
for insert
with check (auth.uid() = user_id);

create policy "interactions_update_own"
on public.interactions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "interactions_delete_own"
on public.interactions
for delete
using (auth.uid() = user_id);

create policy "interaction_people_select_own"
on public.interaction_people
for select
using (
  exists (
    select 1
    from public.people
    join public.interactions
      on interactions.id = interaction_people.interaction_id
    where people.id = interaction_people.person_id
      and people.user_id = auth.uid()
      and interactions.user_id = auth.uid()
  )
);

create policy "interaction_people_insert_own"
on public.interaction_people
for insert
with check (
  exists (
    select 1
    from public.people
    join public.interactions
      on interactions.id = interaction_people.interaction_id
    where people.id = interaction_people.person_id
      and people.user_id = auth.uid()
      and interactions.user_id = auth.uid()
  )
);

create policy "interaction_people_delete_own"
on public.interaction_people
for delete
using (
  exists (
    select 1
    from public.people
    join public.interactions
      on interactions.id = interaction_people.interaction_id
    where people.id = interaction_people.person_id
      and people.user_id = auth.uid()
      and interactions.user_id = auth.uid()
  )
);
