import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/db/database.types';
import { isPrmUsageTrackingEnabled } from '@/lib/env';

export type LlmUsagePipeline =
  | 'extract_facts'
  | 'suggest_tasks'
  | 'relationship_summary'
  | 'transcribe';

export function recordLlmUsage(
  client: SupabaseClient<Database>,
  pipeline: LlmUsagePipeline,
  args: { model: string; ok: boolean; error_code?: string },
): void {
  if (!isPrmUsageTrackingEnabled()) return;

  const properties: Json = {
    model: args.model,
    ok: args.ok,
    ...(args.error_code ? { error_code: args.error_code } : {}),
  };

  void (async () => {
    try {
      const { error } = await client.from('usage_events').insert({
        category: 'llm',
        name: pipeline,
        properties,
      });
      if (error) return;
    } catch {
      /* ignore */
    }
  })();
}
