-- Fix function search_path (Supabase linter: function_search_path_mutable).
-- Stabilize auth.uid() in RLS (Supabase linter: auth_rls_initplan).
-- Cover unindexed foreign keys (Supabase linter: unindexed_foreign_keys).

-- ---------------------------------------------------------------------------
-- Functions: explicit search_path
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.enforce_person_category_owner()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.enforce_interaction_type_owner()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.enforce_connection_type_owner()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.enforce_person_connection_people_owner()
returns trigger
language plpgsql
set search_path = public
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

-- ---------------------------------------------------------------------------
-- RLS: (select auth.uid()) for initplan stability
-- ---------------------------------------------------------------------------

-- people
drop policy if exists "people_select_own" on public.people;
drop policy if exists "people_insert_own" on public.people;
drop policy if exists "people_update_own" on public.people;
drop policy if exists "people_delete_own" on public.people;

create policy "people_select_own"
on public.people
for select
using ((select auth.uid()) = user_id);

create policy "people_insert_own"
on public.people
for insert
with check ((select auth.uid()) = user_id);

create policy "people_update_own"
on public.people
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "people_delete_own"
on public.people
for delete
using ((select auth.uid()) = user_id);

-- contact_methods
drop policy if exists "contact_methods_select_own" on public.contact_methods;
drop policy if exists "contact_methods_insert_own" on public.contact_methods;
drop policy if exists "contact_methods_update_own" on public.contact_methods;
drop policy if exists "contact_methods_delete_own" on public.contact_methods;

create policy "contact_methods_select_own"
on public.contact_methods
for select
using (
  exists (
    select 1
    from public.people
    where people.id = contact_methods.person_id
      and people.user_id = (select auth.uid())
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
      and people.user_id = (select auth.uid())
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
      and people.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.people
    where people.id = contact_methods.person_id
      and people.user_id = (select auth.uid())
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
      and people.user_id = (select auth.uid())
  )
);

-- interactions
drop policy if exists "interactions_select_own" on public.interactions;
drop policy if exists "interactions_insert_own" on public.interactions;
drop policy if exists "interactions_update_own" on public.interactions;
drop policy if exists "interactions_delete_own" on public.interactions;

create policy "interactions_select_own"
on public.interactions
for select
using ((select auth.uid()) = user_id);

create policy "interactions_insert_own"
on public.interactions
for insert
with check ((select auth.uid()) = user_id);

create policy "interactions_update_own"
on public.interactions
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "interactions_delete_own"
on public.interactions
for delete
using ((select auth.uid()) = user_id);

-- interaction_people
drop policy if exists "interaction_people_select_own" on public.interaction_people;
drop policy if exists "interaction_people_insert_own" on public.interaction_people;
drop policy if exists "interaction_people_delete_own" on public.interaction_people;

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
      and people.user_id = (select auth.uid())
      and interactions.user_id = (select auth.uid())
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
      and people.user_id = (select auth.uid())
      and interactions.user_id = (select auth.uid())
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
      and people.user_id = (select auth.uid())
      and interactions.user_id = (select auth.uid())
  )
);

-- person_categories
drop policy if exists "person_categories_select_own" on public.person_categories;
drop policy if exists "person_categories_insert_own" on public.person_categories;
drop policy if exists "person_categories_update_own" on public.person_categories;
drop policy if exists "person_categories_delete_own" on public.person_categories;

create policy "person_categories_select_own"
on public.person_categories
for select
using ((select auth.uid()) = user_id);

create policy "person_categories_insert_own"
on public.person_categories
for insert
with check ((select auth.uid()) = user_id);

create policy "person_categories_update_own"
on public.person_categories
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "person_categories_delete_own"
on public.person_categories
for delete
using ((select auth.uid()) = user_id);

-- interaction_types
drop policy if exists "interaction_types_select_own" on public.interaction_types;
drop policy if exists "interaction_types_insert_own" on public.interaction_types;
drop policy if exists "interaction_types_update_own" on public.interaction_types;
drop policy if exists "interaction_types_delete_own" on public.interaction_types;

create policy "interaction_types_select_own"
on public.interaction_types
for select
using ((select auth.uid()) = user_id);

create policy "interaction_types_insert_own"
on public.interaction_types
for insert
with check ((select auth.uid()) = user_id);

create policy "interaction_types_update_own"
on public.interaction_types
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "interaction_types_delete_own"
on public.interaction_types
for delete
using ((select auth.uid()) = user_id);

-- connection_types
drop policy if exists "connection_types_select_own" on public.connection_types;
drop policy if exists "connection_types_insert_own" on public.connection_types;
drop policy if exists "connection_types_update_own" on public.connection_types;
drop policy if exists "connection_types_delete_own" on public.connection_types;

create policy "connection_types_select_own"
on public.connection_types
for select
using ((select auth.uid()) = user_id);

create policy "connection_types_insert_own"
on public.connection_types
for insert
with check ((select auth.uid()) = user_id);

create policy "connection_types_update_own"
on public.connection_types
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "connection_types_delete_own"
on public.connection_types
for delete
using ((select auth.uid()) = user_id);

-- person_connections
drop policy if exists "person_connections_select_own" on public.person_connections;
drop policy if exists "person_connections_insert_own" on public.person_connections;
drop policy if exists "person_connections_update_own" on public.person_connections;
drop policy if exists "person_connections_delete_own" on public.person_connections;

create policy "person_connections_select_own"
on public.person_connections
for select
using ((select auth.uid()) = user_id);

create policy "person_connections_insert_own"
on public.person_connections
for insert
with check ((select auth.uid()) = user_id);

create policy "person_connections_update_own"
on public.person_connections
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "person_connections_delete_own"
on public.person_connections
for delete
using ((select auth.uid()) = user_id);

-- facts
drop policy if exists "facts_select_own" on public.facts;
drop policy if exists "facts_insert_own" on public.facts;
drop policy if exists "facts_update_own" on public.facts;
drop policy if exists "facts_delete_own" on public.facts;

create policy "facts_select_own"
on public.facts
for select
using ((select auth.uid()) = user_id);

create policy "facts_insert_own"
on public.facts
for insert
with check ((select auth.uid()) = user_id);

create policy "facts_update_own"
on public.facts
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "facts_delete_own"
on public.facts
for delete
using ((select auth.uid()) = user_id);

-- relationship_summaries
drop policy if exists "relationship_summaries_select_own" on public.relationship_summaries;
drop policy if exists "relationship_summaries_insert_own" on public.relationship_summaries;
drop policy if exists "relationship_summaries_update_own" on public.relationship_summaries;
drop policy if exists "relationship_summaries_delete_own" on public.relationship_summaries;

create policy "relationship_summaries_select_own"
on public.relationship_summaries
for select
using ((select auth.uid()) = user_id);

create policy "relationship_summaries_insert_own"
on public.relationship_summaries
for insert
with check ((select auth.uid()) = user_id);

create policy "relationship_summaries_update_own"
on public.relationship_summaries
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "relationship_summaries_delete_own"
on public.relationship_summaries
for delete
using ((select auth.uid()) = user_id);

-- tasks
drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own"
on public.tasks
for select
using ((select auth.uid()) = user_id);

create policy "tasks_insert_own"
on public.tasks
for insert
with check ((select auth.uid()) = user_id);

create policy "tasks_update_own"
on public.tasks
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "tasks_delete_own"
on public.tasks
for delete
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Indexes for foreign-key columns
-- ---------------------------------------------------------------------------

create index if not exists connection_types_inverse_type_id_idx
  on public.connection_types (inverse_type_id);

create index if not exists interactions_interaction_type_id_idx
  on public.interactions (interaction_type_id);

create index if not exists people_category_id_fk_idx
  on public.people (category_id);

create index if not exists person_connections_connection_type_id_idx
  on public.person_connections (connection_type_id);

create index if not exists person_connections_person_id_fk_idx
  on public.person_connections (person_id);

create index if not exists person_connections_related_person_id_fk_idx
  on public.person_connections (related_person_id);
