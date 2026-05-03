-- Phase 3 (partial): pgvector-backed chunks for Ask My PRM retrieval

create extension if not exists vector with schema extensions;

create table public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null
    check (source_type in ('interaction_note', 'fact')),
  source_id uuid not null,
  chunk_index int not null default 0,
  content text not null check (char_length(trim(content)) > 0),
  person_ids uuid[] not null default '{}'::uuid[],
  embedding vector(1536) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, source_type, source_id, chunk_index)
);

create index document_embeddings_user_id_idx on public.document_embeddings (user_id);
create index document_embeddings_source_idx
  on public.document_embeddings (user_id, source_type, source_id);

create index document_embeddings_embedding_hnsw
  on public.document_embeddings
  using hnsw (embedding vector_cosine_ops);

create trigger set_document_embeddings_updated_at
before update on public.document_embeddings
for each row
execute function public.set_updated_at();

alter table public.document_embeddings enable row level security;

create policy "document_embeddings_select_own"
on public.document_embeddings
for select
using (auth.uid() = user_id);

create policy "document_embeddings_insert_own"
on public.document_embeddings
for insert
with check (auth.uid() = user_id);

create policy "document_embeddings_update_own"
on public.document_embeddings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "document_embeddings_delete_own"
on public.document_embeddings
for delete
using (auth.uid() = user_id);

-- Cosine distance operator <=>; smaller distance = closer match
create or replace function public.match_document_embeddings(
  query_embedding vector(1536),
  match_count int default 12
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  chunk_index int,
  content text,
  person_ids uuid[],
  distance double precision
)
language sql
stable
as $$
  select
    de.id,
    de.source_type,
    de.source_id,
    de.chunk_index,
    de.content,
    de.person_ids,
    (de.embedding <=> query_embedding)::double precision as distance
  from public.document_embeddings de
  order by de.embedding <=> query_embedding
  limit least(coalesce(match_count, 12), 50);
$$;

grant execute on function public.match_document_embeddings(vector, int) to authenticated;
