-- User-defined person categories with a fixed default seed per user.

create table public.person_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint person_categories_user_id_name_key unique (user_id, name)
);

create index person_categories_user_id_sort_idx
  on public.person_categories (user_id, sort_order, name);

create trigger set_person_categories_updated_at
before update on public.person_categories
for each row
execute function public.set_updated_at();

alter table public.person_categories enable row level security;

create policy "person_categories_select_own"
on public.person_categories
for select
using (auth.uid() = user_id);

create policy "person_categories_insert_own"
on public.person_categories
for insert
with check (auth.uid() = user_id);

create policy "person_categories_update_own"
on public.person_categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "person_categories_delete_own"
on public.person_categories
for delete
using (auth.uid() = user_id);

-- Link people to categories (column added before backfill, then old column dropped).
alter table public.people
  add column category_id uuid references public.person_categories (id) on delete restrict;

insert into public.person_categories (user_id, name, sort_order)
select u.id, d.name, d.sort_order
from auth.users u
cross join (
  values
    ('Friend', 1),
    ('Close friend', 2),
    ('Acquaintance', 3),
    ('Networking', 4),
    ('Mentor', 5),
    ('Coworker', 6),
    ('Family', 7),
    ('Partner', 8),
    ('Roommate', 9)
) as d (name, sort_order)
on conflict (user_id, name) do nothing;

update public.people p
set category_id = c.id
from public.person_categories c
where p.user_id = c.user_id
  and c.name = case p.category
    when 'friend' then 'Friend'
    when 'close_friend' then 'Close friend'
    when 'acquaintance' then 'Acquaintance'
    when 'networking' then 'Networking'
    when 'mentor' then 'Mentor'
    when 'family' then 'Family'
  end;

update public.people p
set category_id = c.id
from public.person_categories c
where p.category_id is null
  and p.user_id = c.user_id
  and c.name = 'Friend';

alter table public.people
  drop column category;

alter table public.people
  alter column category_id set not null;

drop index if exists public.people_user_id_category_idx;

create index people_user_id_category_id_idx
  on public.people (user_id, category_id);

create or replace function public.enforce_person_category_owner()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is null then
    raise exception 'category_id is required';
  end if;
  if not exists (
    select 1
    from public.person_categories c
    where c.id = new.category_id
      and c.user_id = new.user_id
  ) then
    raise exception 'category must belong to the same user as the person';
  end if;
  return new;
end;
$$;

create trigger enforce_person_category_owner_insert
before insert on public.people
for each row
execute function public.enforce_person_category_owner();

create trigger enforce_person_category_owner_update
before update on public.people
for each row
execute function public.enforce_person_category_owner();

create or replace function public.seed_default_person_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.person_categories (user_id, name, sort_order) values
    (new.id, 'Friend', 1),
    (new.id, 'Close friend', 2),
    (new.id, 'Acquaintance', 3),
    (new.id, 'Networking', 4),
    (new.id, 'Mentor', 5),
    (new.id, 'Coworker', 6),
    (new.id, 'Family', 7),
    (new.id, 'Partner', 8),
    (new.id, 'Roommate', 9)
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_seed_person_categories
after insert on auth.users
for each row
execute function public.seed_default_person_categories();
