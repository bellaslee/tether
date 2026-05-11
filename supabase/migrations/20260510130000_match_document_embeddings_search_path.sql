-- Supabase advisor: Function Search Path Mutable — pin resolution for RPC safety.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS proc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'match_document_embeddings'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = pg_catalog, public, extensions',
      r.proc::text
    );
  END LOOP;
END $$;
