import 'server-only';

import { tryCreateOpenAiClient } from '@/lib/ai/openai';
import { getPrmSupabaseContext } from '@/lib/prm/context';
import { hasOpenAiApiKey } from '@/lib/env';
import { aiDisabledMessage } from './constants';

export async function requireCrmForAiAction() {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' as const, ctx: null };
  }
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
