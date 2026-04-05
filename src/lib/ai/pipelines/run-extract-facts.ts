import "server-only";

import type OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { defaultResponsesModel } from '@/lib/ai/model';
import { enforceLlmRateLimits, type LlmRateLimitIdentity } from '@/lib/ai/llm-rate-limit';
import { logAiRequestDebug } from '@/lib/ai/log-debug';
import {
  buildExtractFactsInstructions,
  buildExtractFactsUserPayload,
} from '@/lib/ai/prompts/extract-facts';
import {
  extractFactsResultSchema,
  type ExtractFactsResult,
} from '@/lib/ai/schemas/structured';

export async function runExtractFactsModel(args: {
  openai: OpenAI;
  rateLimitIdentity: LlmRateLimitIdentity;
  interactionId: string;
  allowedPersonIds: string[];
  redactedNote: string;
  userDeclinedFacts?: string[];
  acceptedFacts?: string[];
}): Promise<ExtractFactsResult> {
  const rl = await enforceLlmRateLimits(args.rateLimitIdentity);
  if (!rl.ok) {
    throw new Error(rl.message);
  }

  const acceptedFacts = args.acceptedFacts ?? [];
  const instructions = buildExtractFactsInstructions();
  const userContent = buildExtractFactsUserPayload({
    interactionId: args.interactionId,
    allowedPersonIds: args.allowedPersonIds,
    redactedNote: args.redactedNote,
    userDeclinedFacts: args.userDeclinedFacts ?? [],
    acceptedFacts,
  });

  logAiRequestDebug('extract_facts', {
    interactionId: args.interactionId,
    allowedPersonCount: args.allowedPersonIds.length,
    redactedNoteLength: args.redactedNote.length,
    acceptedFactsCount: acceptedFacts.length,
    instructionChars: instructions.length,
  });

  const response = await args.openai.responses.parse({
    model: defaultResponsesModel(),
    instructions,
    input: [{ role: 'user', content: userContent }],
    text: {
      format: zodTextFormat(extractFactsResultSchema, 'extract_facts'),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error('The model returned no structured facts.');
  }
  return parsed;
}
