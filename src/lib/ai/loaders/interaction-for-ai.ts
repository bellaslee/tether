import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import {
  buildAliasMapForPeople,
  buildPersonIdToDisplayLabelMap,
  placeholderizeNote,
} from '@/lib/ai/pii';

export async function loadPlaceholderizedInteractionNote(
  client: SupabaseClient<Database>,
  userId: string,
  interactionId: string,
): Promise<
  | {
      rawNote: string;
      redactedNote: string;
      linkedPersonIds: string[];
      personIdToDisplayLabel: Map<string, string>;
    }
  | { error: string }
> {
  const { data: interaction, error: intErr } = await client
    .from('interactions')
    .select('id, raw_note, user_id')
    .eq('id', interactionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (intErr) {
    return { error: intErr.message };
  }
  if (!interaction) {
    return { error: 'Interaction not found.' };
  }

  const rawNote = interaction.raw_note?.trim() ?? '';
  if (!rawNote) {
    return { error: 'Add a note to this interaction before running AI.' };
  }

  const { data: links, error: linkErr } = await client
    .from('interaction_people')
    .select('person_id')
    .eq('interaction_id', interactionId);

  if (linkErr) {
    return { error: linkErr.message };
  }

  const linkedPersonIds = [...new Set((links ?? []).map((l) => l.person_id))];
  if (linkedPersonIds.length === 0) {
    return { error: 'Link at least one person to this interaction first.' };
  }

  const { data: peopleRows, error: peopleErr } = await client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', userId)
    .in('id', linkedPersonIds);

  if (peopleErr) {
    return { error: peopleErr.message };
  }
  if (!peopleRows || peopleRows.length !== linkedPersonIds.length) {
    return { error: 'Could not load linked people for this interaction.' };
  }

  const aliasMap = buildAliasMapForPeople(peopleRows);
  const personIdToDisplayLabel = buildPersonIdToDisplayLabelMap(peopleRows);
  const redactedNote = placeholderizeNote(rawNote, aliasMap);

  return {
    rawNote,
    redactedNote,
    linkedPersonIds,
    personIdToDisplayLabel,
  };
}

const RECENT_NOTE_INTERACTION_LIMIT = 5;

export async function loadPlaceholderizedRecentNotesForPerson(
  client: SupabaseClient<Database>,
  userId: string,
  personId: string,
): Promise<
  | {
      redactedNote: string;
      linkedPersonIds: string[];
      primaryInteractionId: string;
      bundledInteractionIds: string[];
      personIdToDisplayLabel: Map<string, string>;
    }
  | { error: string }
> {
  const { data: personLinks, error: personLinkErr } = await client
    .from('interaction_people')
    .select('interaction_id')
    .eq('person_id', personId);

  if (personLinkErr) {
    return { error: personLinkErr.message };
  }

  const interactionIds = [
    ...new Set((personLinks ?? []).map((l) => l.interaction_id)),
  ];
  if (interactionIds.length === 0) {
    return {
      error: 'Link this person to a timeline interaction before running AI.',
    };
  }

  const { data: interactions, error: intErr } = await client
    .from('interactions')
    .select('id, raw_note, occurred_at')
    .eq('user_id', userId)
    .in('id', interactionIds)
    .order('occurred_at', { ascending: false });

  if (intErr) {
    return { error: intErr.message };
  }

  const withNotes = (interactions ?? []).filter(
    (row) => (row.raw_note?.trim() ?? '').length > 0,
  );
  const bundle = withNotes.slice(0, RECENT_NOTE_INTERACTION_LIMIT);
  if (bundle.length === 0) {
    return {
      error: 'Add a note to a timeline interaction before running AI.',
    };
  }

  const bundledInteractionIds = bundle.map((row) => row.id);
  const primaryInteractionId = bundle[0].id;

  const { data: bundleLinks, error: bundleLinkErr } = await client
    .from('interaction_people')
    .select('person_id')
    .in('interaction_id', bundledInteractionIds);

  if (bundleLinkErr) {
    return { error: bundleLinkErr.message };
  }

  const linkedPersonIds = [
    ...new Set((bundleLinks ?? []).map((l) => l.person_id)),
  ];
  if (linkedPersonIds.length === 0) {
    return { error: 'Could not load linked people for these interactions.' };
  }

  const { data: peopleRows, error: peopleErr } = await client
    .from('people')
    .select('id, full_name, display_name')
    .eq('user_id', userId)
    .in('id', linkedPersonIds);

  if (peopleErr) {
    return { error: peopleErr.message };
  }
  if (!peopleRows || peopleRows.length !== linkedPersonIds.length) {
    return { error: 'Could not load linked people for these interactions.' };
  }

  const aliasMap = buildAliasMapForPeople(peopleRows);
  const personIdToDisplayLabel = buildPersonIdToDisplayLabelMap(peopleRows);
  const segments = bundle.map((row) => {
    const raw = row.raw_note!.trim();
    const redacted = placeholderizeNote(raw, aliasMap);
    const when = new Date(row.occurred_at).toLocaleDateString(undefined, {
      dateStyle: 'medium',
    });
    return `--- Note (${when}) ---\n${redacted}`;
  });
  const redactedNote = segments.join('\n\n');

  return {
    redactedNote,
    linkedPersonIds,
    primaryInteractionId,
    bundledInteractionIds,
    personIdToDisplayLabel,
  };
}
