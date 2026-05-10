'use server';

import { revalidatePath } from 'next/cache';
import { getAccountSupabaseContext } from '@/lib/account/context';
import { getLlmRateLimitClientIp } from '@/lib/ai/llm-rate-limit';
import { requireOpenAiPipeline } from '@/lib/actions/ai-memory/guard';
import { hasOpenAiApiKey } from '@/lib/env';
import { aiDisabledMessage, isUuid } from '@/lib/actions/ai-memory/constants';
import { tryCreateOpenAiClient } from '@/lib/ai/openai';
import { runChatTurnModel } from '@/lib/ai/pipelines/run-chat-turn';
import { syncFactEmbeddings } from '@/lib/retrieval/sync-embeddings';
import {
  insertPersonRecord,
  updatePersonRecord,
  parseOptionalMetAtFromString,
  type PersonUpsertFields,
} from '@/lib/people/person-mutation-core';
import {
  insertGlobalInteractionCore,
  updateInteractionCore,
} from '@/lib/actions/interactions';
import { resolvePreferredIanaTimeZone } from '@/lib/timezones';
import {
  normalizeChatProposalItem,
  chatProposalItemSchema,
} from '@/lib/ai/schemas/chat-turn';
import type { ChatProposalWithClientId } from '@/lib/ai/schemas/chat-turn';

export type { ChatProposal, ChatProposalWithClientId } from '@/lib/ai/schemas/chat-turn';

export type ChatClientMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatAssistantPayload = {
  content: string;
  proposals: ChatProposalWithClientId[];
};

function toOptionalString(value: string | null | undefined): string | null {
  const t = (value ?? '').trim();
  return t.length > 0 ? t : null;
}

export async function submitChatTurn(
  messages: ChatClientMessage[],
): Promise<{ error: string } | { assistant: ChatAssistantPayload }> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }
  if (!hasOpenAiApiKey()) {
    return { error: aiDisabledMessage() };
  }
  const openaiGate = requireOpenAiPipeline();
  if (!('openai' in openaiGate)) {
    return { error: openaiGate.error };
  }
  const { openai } = openaiGate;
  if (!openai) {
    return { error: aiDisabledMessage() };
  }


  const clientIp = await getLlmRateLimitClientIp();
  const rateLimitIdentity = { userId: ctx.userId, clientIp };

  try {
    const { reply, proposals } = await runChatTurnModel({
      openai,
      ctx,
      rateLimitIdentity,
      messages,
    });
    return { assistant: { content: reply, proposals } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Something went wrong.';
    return { error: msg };
  }
}

function buildInteractionFormData(args: {
  primary_person_id: string | null | undefined;
  attendee_person_ids: string[];
  occurred_at_local: string;
  interaction_type_id: string;
  title: string | null | undefined;
  raw_note: string | null | undefined;
  wall_time_zone: string;
}): FormData {
  const fd = new FormData();
  const primary = args.primary_person_id?.trim() || '';
  const attendees = args.attendee_person_ids.filter(Boolean);
  fd.set('primary_person_id', primary);
  fd.set('attendee_ids', attendees.join(','));
  fd.set('occurred_at', args.occurred_at_local.trim());
  fd.set('interaction_type_id', args.interaction_type_id.trim());
  fd.set('title', args.title?.trim() ?? '');
  fd.set('raw_note', args.raw_note?.trim() ?? '');
  fd.set('wall_time_zone', args.wall_time_zone);
  return fd;
}

function stripClientIdField(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const o = payload as Record<string, unknown>;
  if (!('clientId' in o)) {
    return payload;
  }
  const { clientId: _cid, ...rest } = o;
  void _cid;
  return rest;
}

export async function applyChatProposal(
  payload: unknown,
): Promise<{ ok: true; message: string } | { error: string }> {
  const stripped = stripClientIdField(payload);
  const parsed = chatProposalItemSchema.safeParse(stripped);
  if (!parsed.success) {
    return { error: 'This change could not be read. Try confirming again.' };
  }
  const p = normalizeChatProposalItem(parsed.data);
  if (!p) {
    return {
      error:
        'This proposal is incomplete or inconsistent. Fix required fields, then try Confirm again.',
    };
  }

  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const wallZone = resolvePreferredIanaTimeZone(ctx.accountTimeZone, new FormData());

  if (p.kind === 'create_person') {
    const met = parseOptionalMetAtFromString(p.met_at ?? null);
    if (met === 'invalid') {
      return { error: 'Date met must be a valid month and year (YYYY-MM).' };
    }
    const fields: PersonUpsertFields = {
      full_name: p.full_name,
      display_name: toOptionalString(p.display_name),
      category_id: p.category_id,
      status: p.status,
      pronouns: toOptionalString(p.pronouns),
      location: toOptionalString(p.location),
      occupation: toOptionalString(p.occupation),
      company: toOptionalString(p.company),
      how_you_met: toOptionalString(p.how_you_met),
      relationship_context: toOptionalString(p.relationship_context),
      birthday: toOptionalString(p.birthday),
      met_at: met,
    };
    const res = await insertPersonRecord(ctx, fields);
    if ('error' in res) {
      return { error: res.error };
    }
    revalidatePath('/people');
    revalidatePath(`/people/${res.id}`);
    return {
      ok: true,
      message: 'Saved a new person — open People to see them.',
    };
  }

  if (p.kind === 'update_person') {
    const met = parseOptionalMetAtFromString(p.met_at ?? null);
    if (met === 'invalid') {
      return { error: 'Date met must be a valid month and year (YYYY-MM).' };
    }
    const fields: PersonUpsertFields = {
      full_name: p.full_name,
      display_name: toOptionalString(p.display_name),
      category_id: p.category_id,
      status: p.status,
      pronouns: toOptionalString(p.pronouns),
      location: toOptionalString(p.location),
      occupation: toOptionalString(p.occupation),
      company: toOptionalString(p.company),
      how_you_met: toOptionalString(p.how_you_met),
      relationship_context: toOptionalString(p.relationship_context),
      birthday: toOptionalString(p.birthday),
      met_at: met,
    };
    const res = await updatePersonRecord(ctx, p.person_id, fields);
    if ('error' in res) {
      return { error: res.error };
    }
    revalidatePath('/people');
    revalidatePath(`/people/${p.person_id}`);
    revalidatePath(`/people/${p.person_id}/edit`);
    revalidatePath('/timeline');
    return {
      ok: true,
      message: 'Updated their profile.',
    };
  }

  if (p.kind === 'create_interaction') {
    const fd = buildInteractionFormData({
      primary_person_id: p.primary_person_id,
      attendee_person_ids: p.attendee_person_ids,
      occurred_at_local: p.occurred_at_local,
      interaction_type_id: p.interaction_type_id,
      title: p.title,
      raw_note: p.raw_note,
      wall_time_zone: wallZone,
    });
    const res = await insertGlobalInteractionCore(fd);
    if ('error' in res) {
      return { error: res.error };
    }
    revalidatePath('/timeline');
    revalidatePath('/people', 'layout');
    res.personIds.forEach((id) => revalidatePath(`/people/${id}`));
    return {
      ok: true,
      message: 'Logged a moment — check Timeline.',
    };
  }

  if (p.kind === 'update_interaction') {
    const fd = buildInteractionFormData({
      primary_person_id: p.primary_person_id,
      attendee_person_ids: p.attendee_person_ids,
      occurred_at_local: p.occurred_at_local,
      interaction_type_id: p.interaction_type_id,
      title: p.title,
      raw_note: p.raw_note,
      wall_time_zone: wallZone,
    });
    const res = await updateInteractionCore(p.interaction_id, fd);
    if ('error' in res) {
      return { error: res.error };
    }
    revalidatePath('/timeline');
    revalidatePath('/people', 'layout');
    res.touchIds.forEach((id) => revalidatePath(`/people/${id}`));
    return {
      ok: true,
      message: 'Updated that moment on your timeline.',
    };
  }

  if (p.kind === 'create_fact') {
    if (!isUuid(p.person_id)) {
      return { error: 'Pick someone from your directory for this fact.' };
    }
    const { data: person, error: pErr } = await ctx.client
      .from('people')
      .select('id')
      .eq('id', p.person_id)
      .eq('user_id', ctx.userId)
      .maybeSingle();
    if (pErr || !person) {
      return { error: 'Person not found.' };
    }
    const { data: inserted, error: insErr } = await ctx.client
      .from('facts')
      .insert({
        user_id: ctx.userId,
        person_id: p.person_id,
        interaction_id: null,
        body: p.fact_body,
        review_status: 'accepted',
        extractor_metadata: { source: 'chat_turn' },
      })
      .select('id')
      .single();
    if (insErr || !inserted) {
      return { error: insErr?.message ?? 'Could not save this fact.' };
    }
    const openai = tryCreateOpenAiClient();
    if (openai) {
      try {
        await syncFactEmbeddings({
          client: ctx.client,
          openai,
          userId: ctx.userId,
          factId: inserted.id,
        });
      } catch (e) {
        console.error('[applyChatProposal create_fact] embeddings', e);
      }
    }
    revalidatePath(`/people/${p.person_id}`);
    return { ok: true, message: 'Saved a fact on their profile.' };
  }

  if (p.kind === 'create_reminder') {
    if (!isUuid(p.person_id)) {
      return { error: 'Pick someone from your directory for this reminder.' };
    }
    const { data: person, error: pErr } = await ctx.client
      .from('people')
      .select('id')
      .eq('id', p.person_id)
      .eq('user_id', ctx.userId)
      .maybeSingle();
    if (pErr || !person) {
      return { error: 'Person not found.' };
    }
    const { error: insErr } = await ctx.client.from('tasks').insert({
      user_id: ctx.userId,
      person_id: p.person_id,
      interaction_id: null,
      title: p.reminder_title,
      description: p.reminder_description,
      status: 'active',
      suggester_metadata: { source: 'chat_turn' },
    });
    if (insErr) {
      return { error: insErr.message };
    }
    revalidatePath(`/people/${p.person_id}`);
    revalidatePath('/reminders');
    return { ok: true, message: 'Saved a reminder for them.' };
  }

  return { error: 'Unsupported proposal type.' };
}
