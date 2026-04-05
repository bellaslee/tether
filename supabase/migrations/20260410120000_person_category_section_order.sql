-- Default People page section order: Partner → Family → Close friend → Friend →
-- Roommate → Mentor → Coworker → Acquaintance → Networking, then custom categories.

with categorized as (
  select
    id,
    user_id,
    name,
    sort_order,
    case name
      when 'Partner' then 1
      when 'Family' then 2
      when 'Close friend' then 3
      when 'Friend' then 4
      when 'Roommate' then 5
      when 'Mentor' then 6
      when 'Coworker' then 7
      when 'Acquaintance' then 8
      when 'Networking' then 9
    end as preset_rank
  from public.person_categories
),
custom_numbered as (
  select
    id,
    9 + row_number() over (
      partition by user_id
      order by sort_order asc, name asc
    ) as new_sort
  from categorized
  where preset_rank is null
)
update public.person_categories pc
set sort_order = coalesce(c.preset_rank, cn.new_sort)
from categorized c
left join custom_numbered cn on cn.id = c.id
where pc.id = c.id;

create or replace function public.seed_default_person_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.person_categories (user_id, name, sort_order) values
    (new.id, 'Partner', 1),
    (new.id, 'Family', 2),
    (new.id, 'Close friend', 3),
    (new.id, 'Friend', 4),
    (new.id, 'Roommate', 5),
    (new.id, 'Mentor', 6),
    (new.id, 'Coworker', 7),
    (new.id, 'Acquaintance', 8),
    (new.id, 'Networking', 9)
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;
