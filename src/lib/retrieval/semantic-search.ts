import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';
import { formatVectorLiteral } from '@/lib/retrieval/format-vector-literal';

export type SemanticSearchRow = {
  id: string;
  source_type: string;
  source_id: string;
  chunk_index: number;
  content: string;
  person_ids: string[];
  distance: number;
};

export async function matchDocumentEmbeddings(
  client: SupabaseClient<Database>,
  queryEmbedding: number[],
  matchCount = 12,
): Promise<{ rows: SemanticSearchRow[]; error?: string }> {
  const literal = formatVectorLiteral(queryEmbedding);
  const { data, error } = await client.rpc('match_document_embeddings', {
    query_embedding: literal,
    match_count: matchCount,
  });
  if (error) {
    return { rows: [], error: error.message };
  }
  const rows = (data ?? []) as SemanticSearchRow[];
  return { rows };
}
