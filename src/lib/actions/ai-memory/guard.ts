import 'server-only';

import { tryCreateOpenAiClient } from '@/lib/ai/openai';
import {
  getPrmSupabaseContext,
  type PrmContextForLlmActions,
} from '@/lib/prm/context';
import { hasOpenAiApiKey } from '@/lib/env';
import { aiDisabledMessage } from './constants';

export async function requireCrmForAiAction(): Promise<
  | { error: 'You need to sign in again.'; ctx: null }
  | { ctx: PrmContextForLlmActions }
> {
  const full = await getPrmSupabaseContext();
  if (!full) {
    return { error: 'You need to sign in again.', ctx: null };
  }
  const ctx: PrmContextForLlmActions = {
    client: full.client,
    userId: full.userId,
  };
  return { ctx };
}

export function requireOpenAiPipeline() {
  if (!hasOpenAiApiKey()) {
    return { error: aiDisabledMessage() };
  }
  const openai = tryCreateOpenAiClient();
  if (!openai) {
    return { error: aiDisabledMessage() };
  }
  return { openai };
}
