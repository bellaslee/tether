-- Denormalized count of interaction_people rows per person (same scope as owner's interactions).

alter table public.people
  add column if not exists interaction_count integer not null default 0;

alter table public.people
  drop constraint if exists people_interaction_count_non_negative;

alter table public.people
  add constraint people_interaction_count_non_negative check (interaction_count >= 0);

update public.people p
set interaction_count = coalesce(
  (
    select count(*)::integer
    from public.interaction_people ip
    inner join public.interactions i on i.id = ip.interaction_id
    where ip.person_id = p.id
      and i.user_id = p.user_id
  ),
  0
);

create or replace function public.adjust_person_interaction_count_from_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.people p
    set interaction_count = interaction_count + 1
    from public.interactions i
    where p.id = new.person_id
      and i.id = new.interaction_id
      and i.user_id = p.user_id;
    return new;
  elsif tg_op = 'DELETE' then
    -- Do not join interactions: on CASCADE delete the parent row may already be gone.
    update public.people
    set interaction_count = greatest(0, interaction_count - 1)
    where id = old.person_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists interaction_people_adjust_interaction_count_insert
  on public.interaction_people;

drop trigger if exists interaction_people_adjust_interaction_count_delete
  on public.interaction_people;

create trigger interaction_people_adjust_interaction_count_insert
after insert on public.interaction_people
for each row
execute function public.adjust_person_interaction_count_from_link();

create trigger interaction_people_adjust_interaction_count_delete
after delete on public.interaction_people
for each row
execute function public.adjust_person_interaction_count_from_link();
