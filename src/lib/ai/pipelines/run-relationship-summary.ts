import "server-only";

import type OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { RelationshipSummaryKind } from '@/lib/db/database.types';
import { defaultResponsesModel } from '@/lib/ai/model';
import { enforceLlmRateLimits, type LlmRateLimitIdentity } from '@/lib/ai/llm-rate-limit';
import { logAiRequestDebug } from '@/lib/ai/log-debug';
import {
  buildRelationshipSummaryInstructions,
  buildRelationshipSummaryUserPayload,
  type PreMeetingTemporalPayload,
  type RelationshipSummaryRecentNote,
} from '@/lib/ai/prompts/relationship-summary';
import {
  summaryContentResultSchema,
  type SummaryContentResult,
} from '@/lib/ai/schemas/structured';

export async function runRelationshipSummaryModel(args: {
  openai: OpenAI;
  rateLimitIdentity: LlmRateLimitIdentity;
  kind: RelationshipSummaryKind;
  subjectPersonId: string;
  subjectFirstName: string | null;
  categoryId: string;
  status: string;
  subjectPronouns: string | null;
  subjectOccupation: string | null;
  acceptedFactLines: string[];
  recentNotes: RelationshipSummaryRecentNote[];
  preMeetingTemporal?: PreMeetingTemporalPayload;
}): Promise<SummaryContentResult> {
  const rl = await enforceLlmRateLimits(args.rateLimitIdentity);
  if (!rl.ok) {
    throw new Error(rl.message);
  }

  const instructions = buildRelationshipSummaryInstructions(args.kind);
  const userContent = buildRelationshipSummaryUserPayload({
    subjectPersonId: args.subjectPersonId,
    subjectFirstName: args.subjectFirstName,
    categoryId: args.categoryId,
    status: args.status,
    kind: args.kind,
    subjectPronouns: args.subjectPronouns,
    subjectOccupation: args.subjectOccupation,
    acceptedFactLines: args.acceptedFactLines,
    recentNotes: args.recentNotes,
    preMeetingTemporal: args.preMeetingTemporal,
  });

  logAiRequestDebug('relationship_summary', {
    kind: args.kind,
    subjectPersonId: args.subjectPersonId,
    factCount: args.acceptedFactLines.length,
    recentInteractionCount: args.recentNotes.length,
    preMeetingTemporal: Boolean(args.preMeetingTemporal),
  });

  const response = await args.openai.responses.parse({
    model: defaultResponsesModel(),
    instructions,
    input: [{ role: 'user', content: userContent }],
    text: {
      format: zodTextFormat(summaryContentResultSchema, 'relationship_summary'),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error('The model returned no summary content.');
  }
  return parsed;
}
