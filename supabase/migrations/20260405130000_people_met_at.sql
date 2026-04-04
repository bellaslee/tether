alter table public.people
  add column if not exists met_at date;

alter table public.people
  add constraint people_met_at_first_of_month check (
    met_at is null
    or extract(day from met_at) = 1
  );
