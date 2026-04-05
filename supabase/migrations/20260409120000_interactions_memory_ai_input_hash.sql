-- Fingerprint of note + participants (+ prompt versions in app) used to skip redundant OpenAI runs.
alter table public.interactions
  add column if not exists memory_ai_input_hash text null;

comment on column public.interactions.memory_ai_input_hash is
  'SHA-256 hex of interaction AI input fingerprint; when unchanged, auto fact/task suggestion is skipped.';
