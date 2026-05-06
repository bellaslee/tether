alter table public.people
  add column if not exists relationship_hearts_baseline_halves smallint null;

alter table public.people
  drop constraint if exists people_relationship_hearts_baseline_halves_range;

alter table public.people
  add constraint people_relationship_hearts_baseline_halves_range
  check (
    relationship_hearts_baseline_halves is null
    or (
      relationship_hearts_baseline_halves >= 0
      and relationship_hearts_baseline_halves <= 20
    )
  );
