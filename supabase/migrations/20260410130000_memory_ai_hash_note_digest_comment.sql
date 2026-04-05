-- App now stores a note-text digest (trimmed raw_note) to drive the manual Suggest button UX.
comment on column public.interactions.memory_ai_input_hash is
  'SHA-256 hex digest of trimmed raw_note after the user last successfully ran memory suggestions; null if never. Compared to the current note to show or hide Suggest.';
