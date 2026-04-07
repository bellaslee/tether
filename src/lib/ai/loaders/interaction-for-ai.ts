import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import type { LinkedPersonProfileForPrompt } from '@/lib/ai/prompts/extract-facts';
import {
  buildAliasMapForPeople,
  buildPersonIdToDisplayLabelMap,
  placeholderizeNote,
} from '@/lib/ai/pii';
import {
  fetchInteractionIdsForUserPerson,
  fetchInteractionPeopleForUserInteraction,
  fetchInteractionPeopleLinksForUserInteractions,
} from '@/lib/interactions/interaction-people-queries';

function buildLinkedPeopleProfileForPrompt(
  rows: Array<{
    id: string;
    pronouns: string | null;
    occupation: string | null;
  }>,
): LinkedPersonProfileForPrompt[] {
  return rows.map((p) => ({
    person_id: p.id,
    pronouns: p.pronouns?.trim() ? p.pronouns.trim() : null,
    occupation: p.occupation?.trim() ? p.occupation.trim() : null,
  }));
}

export async function loadPlaceholderizedInteractionNote(
  client: SupabaseClient<Database>,
  userId: string,
  interactionId: string,
): Promise<
  | {
      rawNote: string;
      redactedNote: string;
      /** Everyone on this interaction (for placeholders in the note). */
      linkedPersonIds: string[];
      /**
       * Subjects for AI-extracted facts and suggested reminders: the interaction’s
       * primary person, or the first linked person when no primary is set.
       */
      memorySuggestionPersonIds: string[];
      personIdToDisplayLabel: Map<string, string>;
      linkedPeopleProfile: LinkedPersonProfileForPrompt[];
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

  const linksRes = await fetchInteractionPeopleForUserInteraction(
    client,
    userId,
    interactionId,
  );
  if ('error' in linksRes) {
    return { error: linksRes.error };
  }

  const links = linksRes.ok;
  const linkedPersonIds = [...new Set(links.map((l) => l.person_id))];
  if (linkedPersonIds.length === 0) {
    return { error: 'Link at least one person to this interaction first.' };
  }

  const orderedLinks = links;
  const primaryLink = orderedLinks.find((l) => l.role === 'primary');
  const memorySuggestionPersonIds = primaryLink
    ? [primaryLink.person_id]
    : [orderedLinks[0].person_id];

  const { data: peopleRows, error: peopleErr } = await client
    .from('people')
    .select('id, full_name, display_name, pronouns, occupation')
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
  const linkedPeopleProfile = buildLinkedPeopleProfileForPrompt(peopleRows);

  return {
    rawNote,
    redactedNote,
    linkedPersonIds,
    memorySuggestionPersonIds,
    personIdToDisplayLabel,
    linkedPeopleProfile,
  };
}

export type DeclinedMemoryForInteraction = {
  declinedFactBodies: string[];
  declinedReminders: Array<{ title: string; description: string | null }>;
};

/** Facts and reminders the user declined for this interaction; pass to extract/suggest prompts. */
export async function loadDeclinedMemoryForInteraction(
  client: SupabaseClient<Database>,
  userId: string,
  interactionId: string,
): Promise<{ ok: DeclinedMemoryForInteraction } | { error: string }> {
  const { data: factRows, error: fErr } = await client
    .from('facts')
    .select('body')
    .eq('user_id', userId)
    .eq('interaction_id', interactionId)
    .eq('review_status', 'dismissed');

  if (fErr) {
    return { error: fErr.message };
  }

  const { data: taskRows, error: tErr } = await client
    .from('tasks')
    .select('title, description')
    .eq('user_id', userId)
    .eq('interaction_id', interactionId)
    .eq('status', 'dismissed');

  if (tErr) {
    return { error: tErr.message };
  }

  const declinedFactBodies = (factRows ?? [])
    .map((r) => r.body.trim())
    .filter((b) => b.length > 0);

  const declinedReminders = (taskRows ?? [])
    .map((r) => ({
      title: r.title.trim(),
      description: r.description?.trim() ?? null,
    }))
    .filter((r) => r.title.length > 0);

  return {
    ok: {
      declinedFactBodies,
      declinedReminders,
    },
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
      linkedPeopleProfile: LinkedPersonProfileForPrompt[];
    }
  | { error: string }
> {
  const personLinksRes = await fetchInteractionIdsForUserPerson(
    client,
    userId,
    personId,
  );
  if ('error' in personLinksRes) {
    return { error: personLinksRes.error };
  }

  const interactionIds = personLinksRes.ok;
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

  const bundleLinksRes = await fetchInteractionPeopleLinksForUserInteractions(
    client,
    userId,
    bundledInteractionIds,
  );
  if ('error' in bundleLinksRes) {
    return { error: bundleLinksRes.error };
  }

  const linkedPersonIds = [
    ...new Set(bundleLinksRes.ok.map((l) => l.person_id)),
  ];
  if (linkedPersonIds.length === 0) {
    return { error: 'Could not load linked people for these interactions.' };
  }

  const { data: peopleRows, error: peopleErr } = await client
    .from('people')
    .select('id, full_name, display_name, pronouns, occupation')
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
  const linkedPeopleProfile = buildLinkedPeopleProfileForPrompt(peopleRows);
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
    linkedPeopleProfile,
  };
}
