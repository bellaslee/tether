import 'server-only';

import { createHash } from 'crypto';

/** Digest of trimmed note text; stored on interactions after a successful suggest run. */
export function computeMemoryAiNoteDigest(noteTrimmed: string): string {
  return createHash('sha256').update(noteTrimmed, 'utf8').digest('hex');
}
