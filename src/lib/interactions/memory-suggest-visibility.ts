import 'server-only';

import { computeMemoryAiNoteDigest } from '@/lib/ai/memory-ai-input-hash';

/**
 * Whether to show the per-interaction "Suggest" CTA. Based on trimmed note text only
 * (editing people, date, etc. without changing the note does not resurface the button).
 */
export function interactionShowsMemorySuggestCta(
  rawNote: string | null | undefined,
  memoryAiInputHash: string | null | undefined,
): boolean {
  const noteTrimmed = rawNote?.trim() ?? '';
  if (!noteTrimmed) {
    return false;
  }
  const digest = computeMemoryAiNoteDigest(noteTrimmed);
  return memoryAiInputHash == null || memoryAiInputHash !== digest;
}
