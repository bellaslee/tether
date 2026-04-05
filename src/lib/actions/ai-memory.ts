'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CrmTaskStatus,
  Database,
  FactReviewStatus,
  RelationshipSummaryKind,
} from '@/lib/db/database.types';
import {
  filterDedupedFacts,
  filterDedupedSuggestedTasks,
  type TaskSig,
} from '@/lib/ai/memory-similarity';
import {
  loadPlaceholderizedInteractionNote,
  loadPlaceholderizedRecentNotesForPerson,
} from '@/lib/ai/loaders/interaction-for-ai';
import { tryCreateOpenAiClient } from '@/lib/ai/openai';
import {
  buildAliasMapForPeople,
  buildPersonIdToDisplayLabelMap,
  placeholderizeNote,
  replacePersonUuidReferencesInText,
} from '@/lib/ai/pii';
import { runExtractFactsModel } from '@/lib/ai/pipelines/run-extract-facts';
import { runRelationshipSummaryModel } from '@/lib/ai/pipelines/run-relationship-summary';
import { runSuggestTasksModel } from '@/lib/ai/pipelines/run-suggest-tasks';
import { EXTRACT_FACTS_PROMPT_VERSION } from '@/lib/ai/prompts/extract-facts';
import { RELATIONSHIP_SUMMARY_PROMPT_VERSION } from '@/lib/ai/prompts/relationship-summary';
import { SUGGEST_TASKS_PROMPT_VERSION } from '@/lib/ai/prompts/suggest-tasks';
import { defaultResponsesModel } from '@/lib/ai/model';
import { getCrmSupabaseContext } from '@/lib/crm/context';
import { hasOpenAiApiKey } from '@/lib/env';

export type AiMemoryActionResult = { error?: string; ok?: true };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function aiDisabledMessage() {
  return 'Add OPENAI_API_KEY to your environment to use AI features.';
}

type DbClient = SupabaseClient<Database>;

const TASK_DEDUP_STATUSES = ['suggested', 'active', 'snoozed'] as const;

async function loadExistingFactBodiesByPerson(
  client: DbClient,
  userId: string,
  personIds: string[],
): Promise<{ ok: Map<string, string[]> } | { error: string }> {
  if (personIds.length === 0) {
    return { ok: new Map() };
  }

  const { data, error } = await client
    .from('facts')
    .select('person_id, body')
    .eq('user_id', userId)
    .in('person_id', personIds)
    .in('review_status', ['candidate', 'accepted']);

  if (error) {
    return { error: error.message };
  }

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.person_id) ?? [];
    list.push(row.body);
    map.set(row.person_id, list);
  }
  return { ok: map };
}

async function loadExistingTaskSigsForDedup(
  client: DbClient,
  userId: string,
  linkedPersonIds: string[],
  includeNullPerson: boolean,
): Promise<{ ok: TaskSig[] } | { error: string }> {
  const out: TaskSig[] = [];

  if (linkedPersonIds.length > 0) {
    const { data, error } = await client
      .from('tasks')
      .select('person_id, title, description')
      .eq('user_id', userId)
      .in('status', [...TASK_DEDUP_STATUSES])
      .in('person_id', linkedPersonIds);

    if (error) {
      return { error: error.message };
    }
    for (const row of data ?? []) {
      out.push({
        person_id: row.person_id,
        title: row.title,
        description: row.description,
      });
    }
  }

  if (includeNullPerson) {
    const { data, error } = await client
      .from('tasks')
      .select('person_id, title, description')
      .eq('user_id', userId)
      .in('status', [...TASK_DEDUP_STATUSES])
      .is('person_id', null);

    if (error) {
      return { error: error.message };
    }
    for (const row of data ?? []) {
      out.push({
        person_id: row.person_id,
        title: row.title,
        description: row.description,
      });
    }
  }

  return { ok: out };
}

export async function extractFactsForInteraction(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const interactionId = String(formData.get('interaction_id') ?? '').trim();
  if (!isUuid(interactionId)) {
    return { error: 'Invalid interaction.' };
  }

  if (!hasOpenAiApiKey()) {
    return { error: aiDisabledMessage() };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const loaded = await loadPlaceholderizedInteractionNote(
    ctx.client,
    ctx.userId,
    interactionId,
  );
  if ('error' in loaded) {
    return { error: loaded.error };
  }

  const openai = tryCreateOpenAiClient();
  if (!openai) {
    return { error: aiDisabledMessage() };
  }

  const allowed = new Set(loaded.linkedPersonIds);

  const { error: delErr } = await ctx.client
    .from('facts')
    .delete()
    .eq('interaction_id', interactionId)
    .eq('user_id', ctx.userId)
    .eq('review_status', 'candidate');

  if (delErr) {
    return { error: delErr.message };
  }

  let parsed;
  try {
    parsed = await runExtractFactsModel({
      openai,
      interactionId,
      allowedPersonIds: loaded.linkedPersonIds,
      redactedNote: loaded.redactedNote,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Extraction failed.';
    return { error: msg };
  }

  const model = defaultResponsesModel();
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
    loaded.linkedPersonIds,
  );
  if ('error' in existingFacts) {
    return { error: existingFacts.error };
  }
  const rowsToInsert = filterDedupedFacts(rows, existingFacts.ok);

  if (rowsToInsert.length === 0) {
    revalidatePath('/timeline');
    for (const pid of loaded.linkedPersonIds) {
      revalidatePath(`/people/${pid}`);
    }
    return { ok: true };
  }

  const { error: insErr } = await ctx.client.from('facts').insert(rowsToInsert);
  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath('/timeline');
  for (const pid of loaded.linkedPersonIds) {
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

  if (!hasOpenAiApiKey()) {
    return { error: aiDisabledMessage() };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const loaded = await loadPlaceholderizedInteractionNote(
    ctx.client,
    ctx.userId,
    interactionId,
  );
  if ('error' in loaded) {
    return { error: loaded.error };
  }

  const openai = tryCreateOpenAiClient();
  if (!openai) {
    return { error: aiDisabledMessage() };
  }

  const allowed = new Set(loaded.linkedPersonIds);

  const { error: delErr } = await ctx.client
    .from('tasks')
    .delete()
    .eq('interaction_id', interactionId)
    .eq('user_id', ctx.userId)
    .eq('status', 'suggested');

  if (delErr) {
    return { error: delErr.message };
  }

  let parsed;
  try {
    parsed = await runSuggestTasksModel({
      openai,
      interactionId,
      allowedPersonIds: loaded.linkedPersonIds,
      redactedNote: loaded.redactedNote,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Task suggestions failed.';
    return { error: msg };
  }

  const model = defaultResponsesModel();
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
    loaded.linkedPersonIds,
    includeNullPerson,
  );
  if ('error' in existingTasks) {
    return { error: existingTasks.error };
  }
  const rowsToInsert = filterDedupedSuggestedTasks(rows, existingTasks.ok);

  if (rowsToInsert.length === 0) {
    revalidatePath('/timeline');
    const touch = new Set<string>(loaded.linkedPersonIds);
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
  const touch = new Set<string>(loaded.linkedPersonIds);
  for (const r of rowsToInsert) {
    if (r.person_id) touch.add(r.person_id);
  }
  for (const pid of touch) {
    revalidatePath(`/people/${pid}`);
  }
  return { ok: true };
}

/** Fire-and-forget friendly: skips when no API key; ignores model/loader errors. */
export async function runAutoMemorySuggestForInteraction(
  interactionId: string,
): Promise<void> {
  if (!isUuid(interactionId) || !hasOpenAiApiKey()) {
    return;
  }
  const formData = new FormData();
  formData.set('interaction_id', interactionId);
  await extractFactsForInteraction({}, formData);
  await suggestTasksForInteraction({}, formData);
}

export async function extractFactsFromPersonRecentNotes(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const personId = String(formData.get('person_id') ?? '').trim();
  if (!isUuid(personId)) {
    return { error: 'Invalid person.' };
  }

  if (!hasOpenAiApiKey()) {
    return { error: aiDisabledMessage() };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const loaded = await loadPlaceholderizedRecentNotesForPerson(
    ctx.client,
    ctx.userId,
    personId,
  );
  if ('error' in loaded) {
    return { error: loaded.error };
  }

  const openai = tryCreateOpenAiClient();
  if (!openai) {
    return { error: aiDisabledMessage() };
  }

  const allowed = new Set(loaded.linkedPersonIds);

  const { error: delErr } = await ctx.client
    .from('facts')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('person_id', personId)
    .in('interaction_id', loaded.bundledInteractionIds)
    .eq('review_status', 'candidate');

  if (delErr) {
    return { error: delErr.message };
  }

  let parsed;
  try {
    parsed = await runExtractFactsModel({
      openai,
      interactionId: loaded.primaryInteractionId,
      allowedPersonIds: loaded.linkedPersonIds,
      redactedNote: loaded.redactedNote,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Extraction failed.';
    return { error: msg };
  }

  const model = defaultResponsesModel();
  const labelMap = loaded.personIdToDisplayLabel;
  const rows = parsed.facts
    .filter((f) => allowed.has(f.person_id))
    .map((f) => ({
      user_id: ctx.userId,
      person_id: f.person_id,
      interaction_id: loaded.primaryInteractionId,
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
    [...loaded.linkedPersonIds],
  );
  if ('error' in existingFacts) {
    return { error: existingFacts.error };
  }
  const rowsToInsert = filterDedupedFacts(rows, existingFacts.ok);

  if (rowsToInsert.length === 0) {
    revalidatePath('/timeline');
    for (const pid of loaded.linkedPersonIds) {
      revalidatePath(`/people/${pid}`);
    }
    return { ok: true };
  }

  const { error: insErr } = await ctx.client.from('facts').insert(rowsToInsert);
  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath('/timeline');
  for (const pid of loaded.linkedPersonIds) {
    revalidatePath(`/people/${pid}`);
  }
  return { ok: true };
}

export async function suggestTasksFromPersonRecentNotes(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const personId = String(formData.get('person_id') ?? '').trim();
  if (!isUuid(personId)) {
    return { error: 'Invalid person.' };
  }

  if (!hasOpenAiApiKey()) {
    return { error: aiDisabledMessage() };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const loaded = await loadPlaceholderizedRecentNotesForPerson(
    ctx.client,
    ctx.userId,
    personId,
  );
  if ('error' in loaded) {
    return { error: loaded.error };
  }

  const openai = tryCreateOpenAiClient();
  if (!openai) {
    return { error: aiDisabledMessage() };
  }

  const allowed = new Set(loaded.linkedPersonIds);

  const { error: delErr } = await ctx.client
    .from('tasks')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('person_id', personId)
    .in('interaction_id', loaded.bundledInteractionIds)
    .eq('status', 'suggested');

  if (delErr) {
    return { error: delErr.message };
  }

  let parsed;
  try {
    parsed = await runSuggestTasksModel({
      openai,
      interactionId: loaded.primaryInteractionId,
      allowedPersonIds: loaded.linkedPersonIds,
      redactedNote: loaded.redactedNote,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Task suggestions failed.';
    return { error: msg };
  }

  const model = defaultResponsesModel();
  const labelMap = loaded.personIdToDisplayLabel;
  const rows = parsed.tasks.map((t) => {
    const pid = t.person_id && allowed.has(t.person_id) ? t.person_id : null;
    const desc = t.description?.trim() || null;
    return {
      user_id: ctx.userId,
      person_id: pid,
      interaction_id: loaded.primaryInteractionId,
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
    loaded.linkedPersonIds,
    includeNullPerson,
  );
  if ('error' in existingTasks) {
    return { error: existingTasks.error };
  }
  const rowsToInsert = filterDedupedSuggestedTasks(rows, existingTasks.ok);

  if (rowsToInsert.length === 0) {
    revalidatePath('/timeline');
    const touch = new Set<string>(loaded.linkedPersonIds);
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
  const touch = new Set<string>(loaded.linkedPersonIds);
  for (const r of rowsToInsert) {
    if (r.person_id) touch.add(r.person_id);
  }
  for (const pid of touch) {
    revalidatePath(`/people/${pid}`);
  }
  return { ok: true };
}

export async function updateFactReview(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const factId = String(formData.get('fact_id') ?? '').trim();
  const intent = String(formData.get('intent') ?? '').trim();
  if (!isUuid(factId)) {
    return { error: 'Invalid fact.' };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

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

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: person, error: pErr } = await ctx.client
    .from('people')
    .select('id')
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (pErr || !person) {
    return { error: 'Person not found.' };
  }

  const { error: insErr } = await ctx.client.from('facts').insert({
    user_id: ctx.userId,
    person_id: personId,
    interaction_id: null,
    body,
    review_status: 'accepted',
    extractor_metadata: { source: 'manual' },
  });

  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath(`/people/${personId}`);
  return { ok: true };
}

export async function createManualReminder(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const personId = String(formData.get('person_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const descriptionRaw = String(formData.get('description') ?? '').trim();
  const description = descriptionRaw || null;

  if (!isUuid(personId)) {
    return { error: 'Invalid person.' };
  }
  if (!title) {
    return { error: 'Give this reminder a short title.' };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: person, error: pErr } = await ctx.client
    .from('people')
    .select('id')
    .eq('id', personId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (pErr || !person) {
    return { error: 'Person not found.' };
  }

  const { error: insErr } = await ctx.client.from('tasks').insert({
    user_id: ctx.userId,
    person_id: personId,
    interaction_id: null,
    title,
    description,
    status: 'active',
    suggester_metadata: { source: 'manual' },
  });

  if (insErr) {
    return { error: insErr.message };
  }

  revalidatePath(`/people/${personId}`);
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

  if (!hasOpenAiApiKey()) {
    return { error: aiDisabledMessage() };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const openai = tryCreateOpenAiClient();
  if (!openai) {
    return { error: aiDisabledMessage() };
  }

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

  const { data: linkRows, error: lErr } = await ctx.client
    .from('interaction_people')
    .select('interaction_id')
    .eq('person_id', personId);

  if (lErr) {
    return { error: lErr.message };
  }

  const interactionIds = [...new Set((linkRows ?? []).map((r) => r.interaction_id))];
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
    const { data: allLinks, error: alErr } = await ctx.client
      .from('interaction_people')
      .select('interaction_id, person_id')
      .in('interaction_id', recentIds);

    if (alErr) {
      return { error: alErr.message };
    }

    for (const x of allLinks ?? []) {
      idsForLabels.add(x.person_id);
    }
  }

  const { data: nameRows, error: nErr } = await ctx.client
    .from('people')
    .select('id, full_name, display_name, preferred_name')
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

  let parsed;
  try {
    parsed = await runRelationshipSummaryModel({
      openai,
      kind,
      subjectPersonId: person.id,
      categoryId: person.category_id,
      status: person.status,
      acceptedFactLines,
      recentNotes,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Summary generation failed.';
    return { error: msg };
  }

  const model = defaultResponsesModel();
  const summaryContent = replacePersonUuidReferencesInText(
    parsed.content.trim(),
    personIdToDisplayLabel,
  );
  const { error: insErr } = await ctx.client.from('relationship_summaries').insert({
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

export async function updateCrmTask(
  _prev: AiMemoryActionResult,
  formData: FormData,
): Promise<AiMemoryActionResult> {
  const taskId = String(formData.get('task_id') ?? '').trim();
  const intent = String(formData.get('intent') ?? '').trim();
  if (!isUuid(taskId)) {
    return { error: 'Invalid task.' };
  }

  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: 'You need to sign in again.' };
  }

  const { data: existing, error: exErr } = await ctx.client
    .from('tasks')
    .select('id, person_id')
    .eq('id', taskId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (exErr || !existing) {
    return { error: 'Task not found.' };
  }

  const revalidate = () => {
    if (existing.person_id) {
      revalidatePath(`/people/${existing.person_id}`);
    }
    revalidatePath('/timeline');
  };

  if (intent === 'delete') {
    const { error } = await ctx.client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', ctx.userId);
    if (error) {
      return { error: error.message };
    }
    revalidate();
    return { ok: true };
  }

  let status: CrmTaskStatus | null = null;
  let snoozed_until: string | null = null;
  if (intent === 'activate') status = 'active';
  if (intent === 'dismiss') status = 'dismissed';
  if (intent === 'done') status = 'done';
  if (intent === 'snooze') {
    status = 'snoozed';
    snoozed_until = new Date(Date.now() + 7 * 86400000).toISOString();
  }

  if (!status) {
    return { error: 'Unknown action.' };
  }

  const { error } = await ctx.client
    .from('tasks')
    .update({ status, snoozed_until })
    .eq('id', taskId)
    .eq('user_id', ctx.userId);

  if (error) {
    return { error: error.message };
  }
  revalidate();
  return { ok: true };
}
