import 'server-only';

import { computeMemoryAiNoteDigest } from '@/lib/ai/memory-ai-input-hash';

/** Non-empty trimmed note; required to show the suggest control at all. */
export function interactionHasMemorySuggestNote(
  rawNote: string | null | undefined,
): boolean {
  return (rawNote?.trim() ?? '').length > 0;
}

/**
 * Facts & follow-ups were already suggested for this exact trimmed note
 * (`memory_ai_input_hash` matches the current note digest).
 */
export function interactionMemorySuggestionsAlreadyApplied(
  rawNote: string | null | undefined,
  memoryAiInputHash: string | null | undefined,
): boolean {
  const noteTrimmed = rawNote?.trim() ?? '';
  if (!noteTrimmed) {
    return false;
  }
  const digest = computeMemoryAiNoteDigest(noteTrimmed);
  return memoryAiInputHash != null && memoryAiInputHash === digest;
}
