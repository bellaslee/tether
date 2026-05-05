alter table public.quick_log_presets
  alter column primary_person_id drop not null;

alter table public.quick_log_presets
  add column if not exists time_local text not null default '12:00'
  check (time_local ~ '^\d{2}:\d{2}$');
