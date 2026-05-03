import { localWallTimeToUtcIso } from '@/lib/datetime';
import { isUuid } from '@/lib/people/person-mutation-core';

export function parseInteractionFieldsFromValues(
  wallClockZone: string,
  occurredLocal: string,
  interaction_type_id: string,
  title: string | null,
  raw_note: string | null,
):
  | {
      occurred_at: string;
      interaction_type_id: string;
      title: string | null;
      raw_note: string | null;
    }
  | { error: string } {
  const occurred = occurredLocal.trim();
  const typeIdRaw = interaction_type_id.trim();
  if (!occurred) {
    return { error: 'When did this happen?' };
  }
  if (!isUuid(typeIdRaw)) {
    return { error: 'Choose a valid interaction type.' };
  }

  const occurred_at = localWallTimeToUtcIso(occurred, wallClockZone);
  if (!occurred_at) {
    return { error: 'Use a valid date and time.' };
  }

  return {
    occurred_at,
    interaction_type_id: typeIdRaw,
    title,
    raw_note,
  };
}
