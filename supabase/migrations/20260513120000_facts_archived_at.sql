-- Optional archive: hide from active memory and embeddings while preserving the row.

alter table public.facts
  add column if not exists archived_at timestamptz null;

create index if not exists facts_person_archived_at_idx
  on public.facts (person_id, archived_at desc nulls last)
  where archived_at is not null;
