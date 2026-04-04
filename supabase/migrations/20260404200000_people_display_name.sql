alter table public.people
  add column if not exists display_name text;

do $d$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'people'
      and c.conname = 'people_display_name_nonempty'
  ) then
    alter table public.people
      add constraint people_display_name_nonempty check (
        display_name is null or char_length(trim(display_name)) > 0
      );
  end if;
end;
$d$;
