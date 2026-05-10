import 'server-only';

import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';
import type OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { defaultResponsesModel } from '@/lib/ai/model';
import { buildChatTurnInstructions } from '@/lib/ai/prompts/chat-turn';
import {
  normalizeChatProposalItem,
  chatResultSchema,
  type ChatProposalWithClientId,
} from '@/lib/ai/schemas/chat-turn';
import { logAiRequestDebug } from '@/lib/ai/log-debug';
import { enforceLlmRateLimits, type LlmRateLimitIdentity } from '@/lib/ai/llm-rate-limit';
import { buildChatContextPack } from '@/lib/chat/build-chat-context';
import { filterCreateInteractionByUserMessage } from '@/lib/chat/guard-chat-create-interaction';
import type { AccountSupabaseContext } from '@/lib/account/context';
import { resolvePreferredIanaTimeZone } from '@/lib/timezones';

export async function runChatTurnModel(args: {
  openai: OpenAI;
  ctx: AccountSupabaseContext;
  rateLimitIdentity: LlmRateLimitIdentity;
  messages: { role: 'user' | 'assistant'; content: string }[];
}): Promise<{ reply: string; proposals: ChatProposalWithClientId[] }> {
  const rl = await enforceLlmRateLimits(args.rateLimitIdentity);
  if (!rl.ok) {
    throw new Error(rl.message);
  }

  const trimmed = args.messages
    .filter((m) => m.content.trim().length > 0)
    .slice(-24);

  const latestUser = [...trimmed].reverse().find((m) => m.role === 'user');
  const latestUserText = latestUser?.content.trim() ?? '';

  const pack = await buildChatContextPack({
    ctx: args.ctx,
    openai: args.openai,
    latestUserMessage: latestUserText,
  });

  const transcript = trimmed
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.trim()}`)
    .join('\n\n');

  const wallZone = resolvePreferredIanaTimeZone(args.ctx.accountTimeZone, new FormData());
  const localNow = DateTime.now().setZone(wallZone);
  const referenceCalendar = [
    '## Reference calendar (for `occurred_at_local` on moments)',
    `Resolve phrases like **yesterday**, **last Sunday**, **this morning**, **two weeks ago**, or a named weekday using this wall zone: **${wallZone}**.`,
    `**Local now** for the user: **${localNow.toFormat('yyyy-MM-dd HH:mm')}** (${localNow.toFormat('cccc')} — weeks are Monday–Sunday).`,
    'Always output `occurred_at_local` as **YYYY-MM-DDTHH:mm** in that same zone (no offset suffix). Infer date and time from their wording; if they omit time, use a sensible default (e.g. noon, or the hour they stated). Never leave `occurred_at_local` empty for a new moment.',
  ].join('\n');

  const peopleForGuard = JSON.parse(pack.peopleJson) as {
    id: string;
    full_name: string;
    display_name: string | null;
  }[];

  const userPayload = [
    '## Context (JSON and snippets — use only these ids and names)',
    `People (max 120): ${pack.peopleJson}`,
    `Person categories: ${pack.categoriesJson}`,
    `Interaction types: ${pack.interactionTypesJson}`,
    referenceCalendar,
    '## Moments (newest block + optional older rows that matched the user’s question — use both for who was there, activities, and recency)',
    pack.recentMomentsText,
    '## Recent saved memories (accepted or candidate facts — use for preferences, traits, and stable details)',
    pack.recentFactsText,
    '## Semantic retrieval (note chunks and facts; use for fuzzy recall when sections above are not enough; cite loosely)',
    pack.retrievalText,
    '## Conversation',
    transcript,
  ].join('\n\n');

  logAiRequestDebug('chat_turn', {
    messageCount: trimmed.length,
    userChars: latestUserText.length,
    peopleJsonChars: pack.peopleJson.length,
  });

  const response = await args.openai.responses.parse({
    model: defaultResponsesModel(),
    instructions: buildChatTurnInstructions(),
    input: [{ role: 'user', content: userPayload }],
    text: {
      format: zodTextFormat(chatResultSchema, 'chat_turn'),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error('The assistant returned no structured output.');
  }

  const proposals: ChatProposalWithClientId[] = [];
  for (const raw of parsed.proposals) {
    const n = normalizeChatProposalItem(raw);
    if (!n) {
      continue;
    }
    if (n.kind === 'create_interaction') {
      const gated = filterCreateInteractionByUserMessage(
        n,
        latestUserText,
        peopleForGuard,
      );
      if (!gated) {
        continue;
      }
      proposals.push({ ...gated, clientId: randomUUID() });
      continue;
    }
    proposals.push({ ...n, clientId: randomUUID() });
  }

  return { reply: parsed.reply, proposals };
}
