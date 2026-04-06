'use server';

import { revalidatePath } from 'next/cache';
import type { RelationshipSummaryKind } from '@/lib/db/database.types';
import {
  buildAliasMapForPeople,
  buildPersonIdToDisplayLabelMap,
  placeholderizeNote,
  replacePersonUuidReferencesInText,
} from '@/lib/ai/pii';
import { defaultResponsesModel } from '@/lib/ai/model';
import { getLlmRateLimitClientIp } from '@/lib/ai/llm-rate-limit';
import { runRelationshipSummaryModel } from '@/lib/ai/pipelines/run-relationship-summary';
import { RELATIONSHIP_SUMMARY_PROMPT_VERSION } from '@/lib/ai/prompts/relationship-summary';
import {
  fetchInteractionIdsForUserPerson,
  fetchInteractionPeopleLinksForUserInteractions,
} from '@/lib/interactions/interaction-people-queries';
import { isUuid } from './constants';
import { recordLlmUsage } from '@/lib/usage/record-usage-event';
import { requireCrmForAiAction, requireOpenAiPipeline } from './guard';
import type { AiMemoryActionResult } from './types';

function mergeSummaryMetadata(
  existing: unknown,
): Record<string, unknown> {
  if (
    existing &&
    typeof existing === 'object' &&
    !Array.isArray(existing)
  ) {
    return { ...(existing as Record<string, unknown>) };
  }
  return {};
}

export async function updateRelationshipSummaryContent(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const summaryId = String(formData.get('summary_id') ?? '').trim();
  const contentRaw = String(formData.get('content') ?? '');
  const content = contentRaw.trim();
  if (!isUuid(summaryId)) {
    return { error: 'Invalid brief.' };
  }
  if (!content) {
    return { error: 'Brief text cannot be empty.' };
  }

  const session = await requireCrmForAiAction();
  if (!session.ctx) {
    return { error: session.error };
  }
  const { ctx } = session;

  const { data: row, error: fetchErr } = await ctx.client
    .from('relationship_summaries')
    .select('id, person_id, model_metadata')
    .eq('id', summaryId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (fetchErr) {
    return { error: fetchErr.message };
  }
  if (!row) {
    return { error: 'Brief not found.' };
  }

  const model_metadata = {
    ...mergeSummaryMetadata(row.model_metadata),
    user_edited: true,
    last_user_edit_at: new Date().toISOString(),
  };

  const { error: updErr } = await ctx.client
    .from('relationship_summaries')
    .update({ content, model_metadata })
    .eq('id', summaryId)
    .eq('user_id', ctx.userId);

  if (updErr) {
    return { error: updErr.message };
  }

  revalidatePath(`/people/${row.person_id}`);
  return { ok: true };
}

export async function generateRelationshipSummary(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const personId = String(formData.get('person_id') ?? '').trim();
  const kindRaw = String(formData.get('kind') ?? '').trim();
  if (!isUuid(personId)) {
    return { error: 'Invalid person.' };
  }
  const kind = kindRaw as RelationshipSummaryKind;
  if (kind !== 'profile_brief' && kind !== 'next_meeting') {
    return { error: 'Invalid summary type.' };
  }

  const openaiGate = requireOpenAiPipeline();
  if ('error' in openaiGate) {
    return { error: openaiGate.error };
  }
  const openai = openaiGate.openai;

  const session = await requireCrmForAiAction();
  if (!session.ctx) {
    return { error: session.error };
  }
  const { ctx } = session;

  const clientIp = await getLlmRateLimitClientIp();
  const rateLimitIdentity = { userId: ctx.userId, clientIp };

  const { data: person, error: pErr } = await ctx.client
    .from('people')
    .select('id, user_id, category_id, status')
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (pErr || !person) {
    return { error: 'Person not found.' };
  }

  const { data: factRows, error: fErr } = await ctx.client
    .from('facts')
    .select('id, body')
    .eq('user_id', ctx.userId)
    .eq('person_id', personId)
    .eq('review_status', 'accepted')
    .order('updated_at', { ascending: false })
    .limit(40);

  if (fErr) {
    return { error: fErr.message };
  }

  const acceptedFactLines = (factRows ?? []).map((r) => r.body.trim());
  const sourceFactIds = (factRows ?? []).map((r) => r.id);

  const linkRowsRes = await fetchInteractionIdsForUserPerson(
    ctx.client,
    ctx.userId,
    personId,
  );
  if ('error' in linkRowsRes) {
    return { error: linkRowsRes.error };
  }

  const interactionIds = linkRowsRes.ok;
  let recentInteractions: Array<{
    id: string;
    occurred_at: string;
    raw_note: string | null;
  }> = [];

  if (interactionIds.length > 0) {
    const { data: ints, error: iErr } = await ctx.client
      .from('interactions')
      .select('id, occurred_at, raw_note')
      .eq('user_id', ctx.userId)
      .in('id', interactionIds)
      .order('occurred_at', { ascending: false })
      .limit(10);

    if (iErr) {
      return { error: iErr.message };
    }
    recentInteractions = ints ?? [];
  }

  const recentIds = recentInteractions.map((i) => i.id);
  let recentNotes: Array<{
    interaction_id: string;
    occurred_at: string;
    redacted_note: string | null;
  }> = [];

  const idsForLabels = new Set<string>([personId]);
  if (recentIds.length > 0) {
    const allLinksRes = await fetchInteractionPeopleLinksForUserInteractions(
      ctx.client,
      ctx.userId,
      recentIds,
    );
    if ('error' in allLinksRes) {
      return { error: allLinksRes.error };
    }

    for (const x of allLinksRes.ok) {
      idsForLabels.add(x.person_id);
    }
  }

  const { data: nameRows, error: nErr } = await ctx.client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', ctx.userId)
    .in('id', [...idsForLabels]);

  if (nErr) {
    return { error: nErr.message };
  }

  const aliasMap = buildAliasMapForPeople(nameRows ?? []);
  const personIdToDisplayLabel = buildPersonIdToDisplayLabelMap(nameRows ?? []);

  if (recentIds.length > 0) {
    recentNotes = recentInteractions.map((int) => ({
      interaction_id: int.id,
      occurred_at: int.occurred_at,
      redacted_note: int.raw_note
        ? placeholderizeNote(int.raw_note, aliasMap)
        : null,
    }));
  }

  const model = defaultResponsesModel();
  let parsed;
  try {
    parsed = await runRelationshipSummaryModel({
      openai,
      rateLimitIdentity,
      kind,
      subjectPersonId: person.id,
      categoryId: person.category_id,
      status: person.status,
      acceptedFactLines,
      recentNotes,
    });
    recordLlmUsage(ctx.client, 'relationship_summary', { model, ok: true });
  } catch (e) {
    recordLlmUsage(ctx.client, 'relationship_summary', {
      model,
      ok: false,
      error_code: 'exception',
    });
    const msg = e instanceof Error ? e.message : 'Summary generation failed.';
    return { error: msg };
  }

  const summaryContent = replacePersonUuidReferencesInText(
    parsed.content.trim(),
    personIdToDisplayLabel,
  );
  const { error: insErr } = await ctx.client
    .from('relationship_summaries')
    .insert({
      user_id: ctx.userId,
      person_id: personId,
      kind,
      content: summaryContent,
      source_interaction_ids: recentNotes.map((n) => n.interaction_id),
      source_fact_ids: sourceFactIds,
      model_metadata: {
        model,
        prompt_version: RELATIONSHIP_SUMMARY_PROMPT_VERSION,
        pipeline: 'relationship_summary',
      },
    });

  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath(`/people/${personId}`);
  return { ok: true };
}
