-- User-defined timeline / interaction types with defaults per user.

create table public.interaction_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  slug text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint interaction_types_user_id_name_key unique (user_id, name)
);

create unique index interaction_types_user_id_slug_key
  on public.interaction_types (user_id, slug)
  where slug is not null;

create index interaction_types_user_id_sort_idx
  on public.interaction_types (user_id, sort_order, name);

create trigger set_interaction_types_updated_at
before update on public.interaction_types
for each row
execute function public.set_updated_at();

alter table public.interaction_types enable row level security;

create policy "interaction_types_select_own"
on public.interaction_types
for select
using (auth.uid() = user_id);

create policy "interaction_types_insert_own"
on public.interaction_types
for insert
with check (auth.uid() = user_id);

create policy "interaction_types_update_own"
on public.interaction_types
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "interaction_types_delete_own"
on public.interaction_types
for delete
using (auth.uid() = user_id);

insert into public.interaction_types (user_id, name, sort_order, slug)
select u.id, d.name, d.sort_order, d.slug
from auth.users u
cross join (
  values
    ('Hangout', 1, null::text),
    ('Small talk', 2, null::text),
    ('Text', 3, null::text),
    ('Call', 4, null::text),
    ('Dinner', 5, null::text),
    ('Party', 6, null::text),
    ('Meeting', 7, null::text),
    ('Category change', 8, 'category_change'::text),
    ('Other', 9, null::text)
) as d (name, sort_order, slug)
on conflict (user_id, name) do nothing;

update public.interaction_types
set slug = 'category_change'
where name = 'Category change'
  and slug is null;

alter table public.interactions
  add column interaction_type_id uuid references public.interaction_types (id) on delete restrict;

alter table public.interactions
  add column counts_toward_last_touch boolean not null default true;

update public.interactions i
set interaction_type_id = t.id
from public.interaction_types t
where i.user_id = t.user_id
  and t.name = case i.type
    when 'hangout' then 'Hangout'
    when 'text' then 'Text'
    when 'call' then 'Call'
    when 'dinner' then 'Dinner'
    when 'party' then 'Party'
    when 'coffee_chat' then 'Small talk'
    when 'meeting' then 'Meeting'
    when 'other' then 'Other'
  end;

update public.interactions i
set interaction_type_id = t.id
from public.interaction_types t
where i.interaction_type_id is null
  and i.user_id = t.user_id
  and t.name = 'Other';

alter table public.interactions
  alter column interaction_type_id set not null;

alter table public.interactions
  drop column type;

create or replace function public.enforce_interaction_type_owner()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.interaction_types t
    where t.id = new.interaction_type_id
      and t.user_id = new.user_id
  ) then
    raise exception 'interaction type must belong to the same user as the interaction';
  end if;
  return new;
end;
$$;

create trigger enforce_interaction_type_owner_insert
before insert on public.interactions
for each row
execute function public.enforce_interaction_type_owner();

create trigger enforce_interaction_type_owner_update
before update on public.interactions
for each row
execute function public.enforce_interaction_type_owner();

create or replace function public.seed_default_interaction_types()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.interaction_types (user_id, name, sort_order, slug) values
    (new.id, 'Hangout', 1, null),
    (new.id, 'Small talk', 2, null),
    (new.id, 'Text', 3, null),
    (new.id, 'Call', 4, null),
    (new.id, 'Dinner', 5, null),
    (new.id, 'Party', 6, null),
    (new.id, 'Meeting', 7, null),
    (new.id, 'Category change', 8, 'category_change'),
    (new.id, 'Other', 9, null)
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_seed_interaction_types
after insert on auth.users
for each row
execute function public.seed_default_interaction_types();
