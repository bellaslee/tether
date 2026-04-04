-- Person-to-person connection types (per user) and directed links between people.

create table public.connection_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  inverse_type_id uuid references public.connection_types (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint connection_types_user_id_name_key unique (user_id, name)
);

create index connection_types_user_id_sort_idx
  on public.connection_types (user_id, sort_order, name);

create trigger set_connection_types_updated_at
before update on public.connection_types
for each row
execute function public.set_updated_at();

alter table public.connection_types enable row level security;

create policy "connection_types_select_own"
on public.connection_types
for select
using (auth.uid() = user_id);

create policy "connection_types_insert_own"
on public.connection_types
for insert
with check (auth.uid() = user_id);

create policy "connection_types_update_own"
on public.connection_types
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "connection_types_delete_own"
on public.connection_types
for delete
using (auth.uid() = user_id);

create table public.person_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  related_person_id uuid not null references public.people (id) on delete cascade,
  connection_type_id uuid not null references public.connection_types (id) on delete restrict,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint person_connections_no_self check (person_id <> related_person_id),
  constraint person_connections_user_person_related_key
    unique (user_id, person_id, related_person_id, connection_type_id)
);

create index person_connections_user_person_idx
  on public.person_connections (user_id, person_id);

create index person_connections_user_related_idx
  on public.person_connections (user_id, related_person_id);

create trigger set_person_connections_updated_at
before update on public.person_connections
for each row
execute function public.set_updated_at();

create or replace function public.enforce_connection_type_owner()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.connection_types t
    where t.id = new.connection_type_id
      and t.user_id = new.user_id
  ) then
    raise exception 'connection type must belong to the same user as the link';
  end if;
  return new;
end;
$$;

create trigger enforce_connection_type_owner_insert
before insert on public.person_connections
for each row
execute function public.enforce_connection_type_owner();

create trigger enforce_connection_type_owner_update
before update on public.person_connections
for each row
execute function public.enforce_connection_type_owner();

create or replace function public.enforce_person_connection_people_owner()
returns trigger
language plpgsql
as $$
declare
  p_user uuid;
  r_user uuid;
begin
  select user_id into p_user from public.people where id = new.person_id;
  select user_id into r_user from public.people where id = new.related_person_id;
  if p_user is null or r_user is null then
    raise exception 'both endpoints must reference existing people';
  end if;
  if p_user <> new.user_id or r_user <> new.user_id then
    raise exception 'both people must belong to the same user as the link';
  end if;
  return new;
end;
$$;

create trigger enforce_person_connection_people_owner_insert
before insert on public.person_connections
for each row
execute function public.enforce_person_connection_people_owner();

create trigger enforce_person_connection_people_owner_update
before update on public.person_connections
for each row
execute function public.enforce_person_connection_people_owner();

alter table public.person_connections enable row level security;

create policy "person_connections_select_own"
on public.person_connections
for select
using (auth.uid() = user_id);

create policy "person_connections_insert_own"
on public.person_connections
for insert
with check (auth.uid() = user_id);

create policy "person_connections_update_own"
on public.person_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "person_connections_delete_own"
on public.person_connections
for delete
using (auth.uid() = user_id);

insert into public.connection_types (user_id, name, sort_order)
select u.id, d.name, d.sort_order
from auth.users u
cross join (
  values
    ('Partner', 1),
    ('Sibling', 2),
    ('Parent', 3),
    ('Child', 4),
    ('Coworker', 5),
    ('Friend', 6),
    ('Roommate', 7)
) as d (name, sort_order)
on conflict (user_id, name) do nothing;

update public.connection_types c
set inverse_type_id = ch.id
from public.connection_types ch
where c.user_id = ch.user_id
  and c.name = 'Parent'
  and ch.name = 'Child';

update public.connection_types c
set inverse_type_id = p.id
from public.connection_types p
where c.user_id = p.user_id
  and c.name = 'Child'
  and p.name = 'Parent';

create or replace function public.seed_default_connection_types()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.connection_types (user_id, name, sort_order) values
    (new.id, 'Partner', 1),
    (new.id, 'Sibling', 2),
    (new.id, 'Parent', 3),
    (new.id, 'Child', 4),
    (new.id, 'Coworker', 5),
    (new.id, 'Friend', 6),
    (new.id, 'Roommate', 7)
  on conflict (user_id, name) do nothing;

  update public.connection_types c
  set inverse_type_id = ch.id
  from public.connection_types ch
  where c.user_id = new.id
    and ch.user_id = new.id
    and c.name = 'Parent'
    and ch.name = 'Child';

  update public.connection_types c
  set inverse_type_id = p.id
  from public.connection_types p
  where c.user_id = new.id
    and p.user_id = new.id
    and c.name = 'Child'
    and p.name = 'Parent';

  return new;
end;
$$;

create trigger on_auth_user_created_seed_connection_types
after insert on auth.users
for each row
execute function public.seed_default_connection_types();
