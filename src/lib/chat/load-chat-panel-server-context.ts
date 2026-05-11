import 'server-only';

import type { PersonOption } from '@/components/people/attendee-picker';
import type { AccountSupabaseContext } from '@/lib/account/context';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { isValidIanaTimeZone } from '@/lib/timezones';

export type ChatPanelServerContext = {
  chatPeople: PersonOption[];
  chatCategories: { id: string; name: string }[];
  chatInteractionTypes: InteractionTypeOption[];
  momentWallZone: string;
};

export async function loadChatPanelServerContext(
  ctx: AccountSupabaseContext,
): Promise<ChatPanelServerContext> {
  const [
    { data: peopleRows, error: peopleError },
    { data: typeRows, error: typesError },
    { data: catRows, error: catError },
  ] = await Promise.all([
    ctx.client
      .from('people')
      .select(
        'id, full_name, display_name, last_interaction_at, met_at, created_at, interaction_count, relationship_hearts_baseline_halves, person_categories ( name )',
      )
      .eq('user_id', ctx.userId)
      .order('full_name', { ascending: true }),
    ctx.client
      .from('interaction_types')
      .select('id, name')
      .eq('user_id', ctx.userId)
      .order('sort_order', { ascending: true }),
    ctx.client
      .from('person_categories')
      .select('id, name')
      .eq('user_id', ctx.userId)
      .order('sort_order', { ascending: true }),
  ]);

  if (peopleError) {
    throw new Error(peopleError.message);
  }
  if (typesError) {
    throw new Error(typesError.message);
  }
  if (catError) {
    throw new Error(catError.message);
  }

  const chatPeople = (peopleRows ?? []) as PersonOption[];
  const chatInteractionTypes: InteractionTypeOption[] = (typeRows ?? []).map(
    (r) => ({
      id: r.id,
      name: r.name,
    }),
  );
  const chatCategories = (catRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
  }));

  const rawTz =
    typeof ctx.accountTimeZone === 'string' ? ctx.accountTimeZone.trim() : '';
  const momentWallZone =
    rawTz && isValidIanaTimeZone(rawTz) ? rawTz : 'UTC';

  return {
    chatPeople,
    chatCategories,
    chatInteractionTypes,
    momentWallZone,
  };
}
