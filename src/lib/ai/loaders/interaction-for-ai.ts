import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import { buildAliasMapForPeople, placeholderizeNote } from '@/lib/ai/pii';

export async function loadPlaceholderizedInteractionNote(
  client: SupabaseClient<Database>,
  userId: string,
  interactionId: string,
): Promise<
  | {
      rawNote: string;
      redactedNote: string;
      linkedPersonIds: string[];
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
    .select('id, full_name, display_name, preferred_name')
    .eq('user_id', userId)
    .in('id', linkedPersonIds);

  if (peopleErr) {
    return { error: peopleErr.message };
  }
  if (!peopleRows || peopleRows.length !== linkedPersonIds.length) {
    return { error: 'Could not load linked people for this interaction.' };
  }

  const aliasMap = buildAliasMapForPeople(peopleRows);
  const redactedNote = placeholderizeNote(rawNote, aliasMap);

  return { rawNote, redactedNote, linkedPersonIds };
}
