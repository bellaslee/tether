-- Rename default interaction types: Small talk → Chat, Text → Message.
-- Rows skip the update if the user already has another type with the target name.

update public.interaction_types it
set name = 'Message'
where it.name = 'Text'
  and not exists (
    select 1
    from public.interaction_types other
    where other.user_id = it.user_id
      and other.name = 'Message'
      and other.id <> it.id
  );

update public.interaction_types it
set name = 'Chat'
where it.name = 'Small talk'
  and not exists (
    select 1
    from public.interaction_types other
    where other.user_id = it.user_id
      and other.name = 'Chat'
      and other.id <> it.id
  );

create or replace function public.seed_default_interaction_types()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.interaction_types (user_id, name, sort_order, slug) values
    (new.id, 'Hangout', 1, null),
    (new.id, 'Chat', 2, null),
    (new.id, 'Message', 3, null),
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
