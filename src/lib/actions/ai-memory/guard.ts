import 'server-only';

import { tryCreateOpenAiClient } from '@/lib/ai/openai';
import { getCrmSupabaseContext } from '@/lib/crm/context';
import { hasOpenAiApiKey } from '@/lib/env';
import { aiDisabledMessage } from './constants';

export async function requireCrmForAiAction() {
  const ctx = await getCrmSupabaseContext();
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
