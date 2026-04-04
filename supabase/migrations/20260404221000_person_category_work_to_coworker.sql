-- Rename default category "Work" → "Coworker" (skip if user already has "Coworker").
update public.person_categories pc
set name = 'Coworker'
where pc.name = 'Work'
  and not exists (
    select 1
    from public.person_categories other
    where other.user_id = pc.user_id
      and other.name = 'Coworker'
      and other.id <> pc.id
  );

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
