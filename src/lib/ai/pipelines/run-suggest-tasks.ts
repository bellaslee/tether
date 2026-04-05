import "server-only";

import type OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { defaultResponsesModel } from '@/lib/ai/model';
import { logAiRequestDebug } from '@/lib/ai/log-debug';
import {
  buildSuggestTasksInstructions,
  buildSuggestTasksUserPayload,
} from '@/lib/ai/prompts/suggest-tasks';
import {
  suggestTasksResultSchema,
  type SuggestTasksResult,
} from '@/lib/ai/schemas/structured';

export async function runSuggestTasksModel(args: {
  openai: OpenAI;
  interactionId: string;
  allowedPersonIds: string[];
  redactedNote: string;
  userDeclinedReminders?: Array<{ title: string; description: string | null }>;
}): Promise<SuggestTasksResult> {
  const instructions = buildSuggestTasksInstructions();
  const userContent = buildSuggestTasksUserPayload({
    interactionId: args.interactionId,
    allowedPersonIds: args.allowedPersonIds,
    redactedNote: args.redactedNote,
    userDeclinedReminders: args.userDeclinedReminders ?? [],
  });

  logAiRequestDebug('suggest_tasks', {
    interactionId: args.interactionId,
    allowedPersonCount: args.allowedPersonIds.length,
    redactedNoteLength: args.redactedNote.length,
  });

  const response = await args.openai.responses.parse({
    model: defaultResponsesModel(),
    instructions,
    input: [{ role: 'user', content: userContent }],
    text: {
      format: zodTextFormat(suggestTasksResultSchema, 'suggest_tasks'),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error('The model returned no structured tasks.');
  }
  return parsed;
}
