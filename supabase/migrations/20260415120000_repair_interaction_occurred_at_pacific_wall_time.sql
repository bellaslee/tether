-- Repair interactions saved while `datetime-local` was parsed on a UTC host (e.g. Vercel):
-- the user's wall-clock digits were stored as a UTC instant. This converts each row by
-- taking the UTC calendar date/time of the stored instant and reinterpreting those
-- components as local time in America/Los_Angeles (Pacific, PST/PDT).
--
-- Do NOT run if the same database also has interactions that were already correct
-- (true UTC instants, or parsed on a Pacific dev machine)—those rows would be shifted
-- incorrectly. Scope with WHERE on user_id or created_at if you have mixed data.
--
-- Example to limit to one account:
--   AND user_id = '00000000-0000-0000-0000-000000000000'::uuid

begin;

update public.interactions
set
  occurred_at = (
    (occurred_at at time zone 'UTC') at time zone 'America/Los_Angeles'
  );

-- Recompute last touch from corrected timestamps (matches app logic).
update public.people p
set last_interaction_at = sub.last_at
from (
  select
    pe.id as person_id,
    (
      select max(i.occurred_at)
      from public.interaction_people ip
      inner join public.interactions i
        on i.id = ip.interaction_id
       and i.user_id = pe.user_id
      where ip.person_id = pe.id
        and i.counts_toward_last_touch = true
        and i.occurred_at <= timezone('utc', now())
    ) as last_at
  from public.people pe
) sub
where p.id = sub.person_id;

commit;
