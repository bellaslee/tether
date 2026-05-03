'use server';

import { revalidatePath } from 'next/cache';
import type { FactReviewStatus } from '@/lib/db/database.types';
import { tryCreateOpenAiClient } from '@/lib/ai/openai';
import {
  deleteEmbeddingsForSource,
  syncFactEmbeddings,
} from '@/lib/retrieval/sync-embeddings';
import { isUuid } from './constants';
import { requireCrmForAiAction } from './guard';
import type { AiMemoryActionResult } from './types';

export async function updateFactReview(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const factId = String(formData.get('fact_id') ?? '').trim();
  const intent = String(formData.get('intent') ?? '').trim();
  if (!isUuid(factId)) {
    return { error: 'Invalid fact.' };
  }

  const session = await requireCrmForAiAction();
  if (!session.ctx) {
    return { error: session.error };
  }
  const { ctx } = session;

  const bodyRaw = String(formData.get('body') ?? '').trim();

  if (intent === 'save') {
    if (!bodyRaw) {
      return { error: 'Fact text cannot be empty.' };
    }
    const { data: updated, error } = await ctx.client
      .from('facts')
      .update({ body: bodyRaw })
      .eq('id', factId)
      .eq('user_id', ctx.userId)
      .in('review_status', ['candidate', 'accepted'])
      .select('person_id')
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!updated) {
      return { error: 'Fact not found or cannot be edited.' };
    }
    const openai = tryCreateOpenAiClient();
    if (openai) {
      try {
        await syncFactEmbeddings({
          client: ctx.client,
          openai,
          userId: ctx.userId,
          factId,
        });
      } catch (e) {
        console.error('[updateFactReview] embeddings', e);
      }
    }
    revalidatePath(`/people/${updated.person_id}`);
    return { ok: true };
  }

  if (intent === 'delete') {
    const { data: row, error: fetchErr } = await ctx.client
      .from('facts')
      .select('person_id')
      .eq('id', factId)
      .eq('user_id', ctx.userId)
      .maybeSingle();
    if (fetchErr || !row) {
      return { error: 'Fact not found.' };
    }
    await deleteEmbeddingsForSource(ctx.client, ctx.userId, 'fact', factId);
    const { error } = await ctx.client
      .from('facts')
      .delete()
      .eq('id', factId)
      .eq('user_id', ctx.userId);
    if (error) {
      return { error: error.message };
    }
    revalidatePath(`/people/${row.person_id}`);
    return { ok: true };
  }

  let reviewStatus: FactReviewStatus | null = null;
  if (intent === 'accept') reviewStatus = 'accepted';
  if (intent === 'dismiss') reviewStatus = 'dismissed';
  if (!reviewStatus) {
    return { error: 'Unknown action.' };
  }
  const patch: { review_status: FactReviewStatus; body?: string } = {
    review_status: reviewStatus,
  };
  if (intent === 'accept') {
    if (!bodyRaw) {
      return { error: 'Fact text cannot be empty.' };
    }
    patch.body = bodyRaw;
  }

  const { data: updated, error } = await ctx.client
    .from('facts')
    .update(patch)
    .eq('id', factId)
    .eq('user_id', ctx.userId)
    .select('person_id')
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!updated) {
    return { error: 'Fact not found.' };
  }

  if (reviewStatus === 'dismissed') {
    await deleteEmbeddingsForSource(ctx.client, ctx.userId, 'fact', factId);
  } else {
    const openai = tryCreateOpenAiClient();
    if (openai) {
      try {
        await syncFactEmbeddings({
          client: ctx.client,
          openai,
          userId: ctx.userId,
          factId,
        });
      } catch (e) {
        console.error('[updateFactReview] embeddings', e);
      }
    }
  }

  revalidatePath(`/people/${updated.person_id}`);
  return { ok: true };
}

export async function createManualFact(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const personId = String(formData.get('person_id') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!isUuid(personId)) {
    return { error: 'Invalid person.' };
  }
  if (!body) {
    return { error: 'Write something for this fact.' };
  }

  const session = await requireCrmForAiAction();
  if (!session.ctx) {
    return { error: session.error };
  }
  const { ctx } = session;

  const { data: person, error: pErr } = await ctx.client
    .from('people')
    .select('id')
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (pErr || !person) {
    return { error: 'Person not found.' };
  }

  const { data: inserted, error: insErr } = await ctx.client
    .from('facts')
    .insert({
      user_id: ctx.userId,
      person_id: personId,
      interaction_id: null,
      body,
      review_status: 'accepted',
      extractor_metadata: { source: 'manual' },
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    return { error: insErr?.message ?? 'Could not save fact.' };
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
      console.error('[createManualFact] embeddings', e);
    }
  }

  revalidatePath(`/people/${personId}`);
  return { ok: true };
}
