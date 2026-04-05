'use server';

import { revalidatePath } from 'next/cache';
import { computeMemoryAiNoteDigest } from '@/lib/ai/memory-ai-input-hash';
import {
  loadDeclinedMemoryForInteraction,
  loadPlaceholderizedInteractionNote,
} from '@/lib/ai/loaders/interaction-for-ai';
import {
  filterDedupedFacts,
  filterDedupedSuggestedTasks,
} from '@/lib/ai/memory-similarity';
import { defaultResponsesModel } from '@/lib/ai/model';
import { replacePersonUuidReferencesInText } from '@/lib/ai/pii';
import { getLlmRateLimitClientIp } from '@/lib/ai/llm-rate-limit';
import { runExtractFactsModel } from '@/lib/ai/pipelines/run-extract-facts';
import { runSuggestTasksModel } from '@/lib/ai/pipelines/run-suggest-tasks';
import { EXTRACT_FACTS_PROMPT_VERSION } from '@/lib/ai/prompts/extract-facts';
import { SUGGEST_TASKS_PROMPT_VERSION } from '@/lib/ai/prompts/suggest-tasks';
import { fetchPersonIdsForUserInteraction } from '@/lib/interactions/interaction-people-queries';
import { isUuid } from './constants';
import { recordLlmUsage } from '@/lib/usage/record-usage-event';
import { requireCrmForAiAction, requireOpenAiPipeline } from './guard';
import {
  loadAcceptedFactBodiesForPersons,
  loadAcceptedTasksForSuggest,
  loadExistingFactBodiesByPerson,
  loadExistingTaskSigsForDedup,
} from './loaders';
import type { AiMemoryActionResult } from './types';

export async function extractFactsForInteraction(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const interactionId = String(formData.get('interaction_id') ?? '').trim();
  if (!isUuid(interactionId)) {
    return { error: 'Invalid interaction.' };
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

  const loaded = await loadPlaceholderizedInteractionNote(
    ctx.client,
    ctx.userId,
    interactionId,
  );
  if ('error' in loaded) {
    return { error: loaded.error };
  }

  const [declined, acceptedFactsRes] = await Promise.all([
    loadDeclinedMemoryForInteraction(ctx.client, ctx.userId, interactionId),
    loadAcceptedFactBodiesForPersons(
      ctx.client,
      ctx.userId,
      loaded.memorySuggestionPersonIds,
    ),
  ]);
  if ('error' in declined) {
    return { error: declined.error };
  }
  if ('error' in acceptedFactsRes) {
    return { error: acceptedFactsRes.error };
  }

  const allowed = new Set(loaded.memorySuggestionPersonIds);

  const { error: delErr } = await ctx.client
    .from('facts')
    .delete()
    .eq('interaction_id', interactionId)
    .eq('user_id', ctx.userId)
    .eq('review_status', 'candidate');

  if (delErr) {
    return { error: delErr.message };
  }

  const model = defaultResponsesModel();
  let parsed;
  try {
    parsed = await runExtractFactsModel({
      openai,
      rateLimitIdentity,
      interactionId,
      allowedPersonIds: loaded.memorySuggestionPersonIds,
      redactedNote: loaded.redactedNote,
      userDeclinedFacts: declined.ok.declinedFactBodies,
      acceptedFacts: acceptedFactsRes.ok,
    });
    recordLlmUsage(ctx.client, 'extract_facts', { model, ok: true });
  } catch (e) {
    recordLlmUsage(ctx.client, 'extract_facts', {
      model,
      ok: false,
      error_code: 'exception',
    });
    const msg = e instanceof Error ? e.message : 'Extraction failed.';
    return { error: msg };
  }

  const labelMap = loaded.personIdToDisplayLabel;
  const rows = parsed.facts
    .filter((f) => allowed.has(f.person_id))
    .map((f) => ({
      user_id: ctx.userId,
      person_id: f.person_id,
      interaction_id: interactionId,
      body: replacePersonUuidReferencesInText(f.body.trim(), labelMap),
      review_status: 'candidate' as const,
      extractor_metadata: {
        model,
        prompt_version: EXTRACT_FACTS_PROMPT_VERSION,
        pipeline: 'extract_facts',
      },
    }));

  const existingFacts = await loadExistingFactBodiesByPerson(
    ctx.client,
    ctx.userId,
    loaded.memorySuggestionPersonIds,
  );
  if ('error' in existingFacts) {
    return { error: existingFacts.error };
  }
  const rowsToInsert = filterDedupedFacts(rows, existingFacts.ok);

  if (rowsToInsert.length === 0) {
    revalidatePath('/timeline');
    for (const pid of loaded.memorySuggestionPersonIds) {
      revalidatePath(`/people/${pid}`);
    }
    return { ok: true };
  }

  const { error: insErr } = await ctx.client.from('facts').insert(rowsToInsert);
  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath('/timeline');
  for (const pid of loaded.memorySuggestionPersonIds) {
    revalidatePath(`/people/${pid}`);
  }
  return { ok: true };
}

export async function suggestTasksForInteraction(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const interactionId = String(formData.get('interaction_id') ?? '').trim();
  if (!isUuid(interactionId)) {
    return { error: 'Invalid interaction.' };
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

  const loaded = await loadPlaceholderizedInteractionNote(
    ctx.client,
    ctx.userId,
    interactionId,
  );
  if ('error' in loaded) {
    return { error: loaded.error };
  }

  const [declined, acceptedTasksRes] = await Promise.all([
    loadDeclinedMemoryForInteraction(ctx.client, ctx.userId, interactionId),
    loadAcceptedTasksForSuggest(
      ctx.client,
      ctx.userId,
      loaded.memorySuggestionPersonIds,
    ),
  ]);
  if ('error' in declined) {
    return { error: declined.error };
  }
  if ('error' in acceptedTasksRes) {
    return { error: acceptedTasksRes.error };
  }

  const allowed = new Set(loaded.memorySuggestionPersonIds);

  const { error: delErr } = await ctx.client
    .from('tasks')
    .delete()
    .eq('interaction_id', interactionId)
    .eq('user_id', ctx.userId)
    .eq('status', 'suggested');

  if (delErr) {
    return { error: delErr.message };
  }

  revalidatePath('/reminders');

  const model = defaultResponsesModel();
  let parsed;
  try {
    parsed = await runSuggestTasksModel({
      openai,
      rateLimitIdentity,
      interactionId,
      allowedPersonIds: loaded.memorySuggestionPersonIds,
      redactedNote: loaded.redactedNote,
      userDeclinedReminders: declined.ok.declinedReminders,
      acceptedTasks: acceptedTasksRes.ok,
    });
    recordLlmUsage(ctx.client, 'suggest_tasks', { model, ok: true });
  } catch (e) {
    recordLlmUsage(ctx.client, 'suggest_tasks', {
      model,
      ok: false,
      error_code: 'exception',
    });
    const msg = e instanceof Error ? e.message : 'Task suggestions failed.';
    return { error: msg };
  }

  const labelMap = loaded.personIdToDisplayLabel;
  const rows = parsed.tasks.map((t) => {
    const pid = t.person_id && allowed.has(t.person_id) ? t.person_id : null;
    const desc = t.description?.trim() || null;
    return {
      user_id: ctx.userId,
      person_id: pid,
      interaction_id: interactionId,
      title: replacePersonUuidReferencesInText(t.title.trim(), labelMap),
      description: desc
        ? replacePersonUuidReferencesInText(desc, labelMap)
        : null,
      status: 'suggested' as const,
      suggester_metadata: {
        model,
        prompt_version: SUGGEST_TASKS_PROMPT_VERSION,
        pipeline: 'suggest_tasks',
      },
    };
  });

  const includeNullPerson = rows.some((r) => r.person_id === null);
  const existingTasks = await loadExistingTaskSigsForDedup(
    ctx.client,
    ctx.userId,
    loaded.memorySuggestionPersonIds,
    includeNullPerson,
  );
  if ('error' in existingTasks) {
    return { error: existingTasks.error };
  }
  const rowsToInsert = filterDedupedSuggestedTasks(rows, existingTasks.ok);

  if (rowsToInsert.length === 0) {
    revalidatePath('/timeline');
    revalidatePath('/reminders');
    const touch = new Set<string>(loaded.memorySuggestionPersonIds);
    for (const pid of touch) {
      revalidatePath(`/people/${pid}`);
    }
    return { ok: true };
  }

  const { error: insErr } = await ctx.client.from('tasks').insert(rowsToInsert);
  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath('/timeline');
  revalidatePath('/reminders');
  const touch = new Set<string>(loaded.memorySuggestionPersonIds);
  for (const r of rowsToInsert) {
    if (r.person_id) touch.add(r.person_id);
  }
  for (const pid of touch) {
    revalidatePath(`/people/${pid}`);
  }
  return { ok: true };
}

export async function runMemorySuggestForInteraction(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const interactionId = String(formData.get('interaction_id') ?? '').trim();
  if (!isUuid(interactionId)) {
    return { error: 'Invalid interaction.' };
  }

  const openaiGate = requireOpenAiPipeline();
  if ('error' in openaiGate) {
    return { error: openaiGate.error };
  }

  const session = await requireCrmForAiAction();
  if (!session.ctx) {
    return { error: session.error };
  }
  const { ctx } = session;

  const { data: interaction, error: intErr } = await ctx.client
    .from('interactions')
    .select('raw_note, memory_ai_input_hash')
    .eq('id', interactionId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (intErr || !interaction) {
    return { error: 'Could not load this memory.' };
  }

  const noteTrimmed = interaction.raw_note?.trim() ?? '';
  if (!noteTrimmed) {
    return { error: 'Add a note before requesting suggestions.' };
  }

  const digest = computeMemoryAiNoteDigest(noteTrimmed);
  if (interaction.memory_ai_input_hash === digest) {
    return { ok: true };
  }

  const personIdsRes = await fetchPersonIdsForUserInteraction(
    ctx.client,
    ctx.userId,
    interactionId,
  );
  if ('error' in personIdsRes) {
    return { error: personIdsRes.error };
  }

  const personIds = personIdsRes.ok;
  if (personIds.length === 0) {
    return {
      error: 'Link at least one person to this memory before suggesting.',
    };
  }

  const inner = new FormData();
  inner.set('interaction_id', interactionId);
  const extractResult = await extractFactsForInteraction({}, inner);
  if (extractResult.error) {
    return extractResult;
  }
  const suggestResult = await suggestTasksForInteraction({}, inner);
  if (suggestResult.error) {
    return suggestResult;
  }

  const { error: updErr } = await ctx.client
    .from('interactions')
    .update({ memory_ai_input_hash: digest })
    .eq('id', interactionId)
    .eq('user_id', ctx.userId);

  if (updErr) {
    return { error: updErr.message };
  }

  return { ok: true };
}
