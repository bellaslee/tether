import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';
import type { Database } from '@/lib/db/database.types';
import { embedTextsWithOpenAi } from '@/lib/retrieval/embed-batch';
import { chunkTextForEmbedding } from '@/lib/retrieval/chunk-text';
import { formatVectorLiteral } from '@/lib/retrieval/format-vector-literal';

export async function deleteEmbeddingsForSource(
  client: SupabaseClient<Database>,
  userId: string,
  sourceType: 'interaction_note' | 'fact',
  sourceId: string,
): Promise<void> {
  await client
    .from('document_embeddings')
    .delete()
    .eq('user_id', userId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);
}

export async function syncInteractionNoteEmbeddings(args: {
  client: SupabaseClient<Database>;
  openai: OpenAI;
  userId: string;
  interactionId: string;
}): Promise<void> {
  const { client, openai, userId, interactionId } = args;

  await deleteEmbeddingsForSource(client, userId, 'interaction_note', interactionId);

  const { data: row, error: rowErr } = await client
    .from('interactions')
    .select('id, title, raw_note')
    .eq('id', interactionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (rowErr || !row) {
    return;
  }

  const title = row.title?.trim() ?? '';
  const note = row.raw_note?.trim() ?? '';
  const combined = [title ? `Title: ${title}` : '', note].filter(Boolean).join('\n\n').trim();
  if (!combined) {
    return;
  }

  const chunks = chunkTextForEmbedding(combined);
  if (chunks.length === 0) {
    return;
  }

  const { data: links, error: linkErr } = await client
    .from('interaction_people')
    .select('person_id')
    .eq('interaction_id', interactionId);

  if (linkErr) {
    return;
  }

  const person_ids = [...new Set((links ?? []).map((l) => l.person_id))];

  const vectors = await embedTextsWithOpenAi(openai, chunks);
  const rows = chunks.map((content, chunk_index) => ({
    user_id: userId,
    source_type: 'interaction_note' as const,
    source_id: interactionId,
    chunk_index,
    content,
    person_ids,
    embedding: formatVectorLiteral(vectors[chunk_index]!),
  }));

  const { error: insErr } = await client.from('document_embeddings').insert(rows);
  if (insErr) {
    console.error('[syncInteractionNoteEmbeddings]', insErr.message);
  }
}

export async function syncFactEmbeddings(args: {
  client: SupabaseClient<Database>;
  openai: OpenAI;
  userId: string;
  factId: string;
}): Promise<void> {
  const { client, openai, userId, factId } = args;

  await deleteEmbeddingsForSource(client, userId, 'fact', factId);

  const { data: row, error: rowErr } = await client
    .from('facts')
    .select('id, body, review_status, person_id, archived_at')
    .eq('id', factId)
    .eq('user_id', userId)
    .maybeSingle();

  if (rowErr || !row) {
    return;
  }
  if (row.review_status === 'dismissed') {
    return;
  }
  if (row.archived_at) {
    return;
  }

  const chunks = chunkTextForEmbedding(row.body.trim());
  if (chunks.length === 0) {
    return;
  }

  const person_ids = [row.person_id];
  const vectors = await embedTextsWithOpenAi(openai, chunks);
  const rows = chunks.map((content, chunk_index) => ({
    user_id: userId,
    source_type: 'fact' as const,
    source_id: factId,
    chunk_index,
    content,
    person_ids,
    embedding: formatVectorLiteral(vectors[chunk_index]!),
  }));

  const { error: insErr } = await client.from('document_embeddings').insert(rows);
  if (insErr) {
    console.error('[syncFactEmbeddings]', insErr.message);
  }
}
