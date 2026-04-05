import 'server-only';

import { createHash } from 'crypto';
import { EXTRACT_FACTS_PROMPT_VERSION } from '@/lib/ai/prompts/extract-facts';
import { SUGGEST_TASKS_PROMPT_VERSION } from '@/lib/ai/prompts/suggest-tasks';

export function computeMemoryAiInputHash(input: {
  rawNote: string;
  sortedPersonIds: string[];
}): string {
  const payload = [
    input.rawNote,
    input.sortedPersonIds.join(','),
    `extract_v${EXTRACT_FACTS_PROMPT_VERSION}`,
    `tasks_v${SUGGEST_TASKS_PROMPT_VERSION}`,
  ].join('\0');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
