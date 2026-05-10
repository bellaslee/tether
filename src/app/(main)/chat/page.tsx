import type { Metadata } from 'next';
import { ChatPanel } from './_components/chat-panel';
import { requireAccountAccess } from '@/lib/account/guard';
import type { PersonOption } from '@/components/people/attendee-picker';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { isValidIanaTimeZone } from '@/lib/timezones';

export const metadata: Metadata = {
  title: 'Chat',
  description:
    'Ask Tether, recall notes, and review suggested updates before anything is saved.',
};

const PAGE_COPY = {
  eyebrow: 'Ask Tether',
  title: 'Chat',
  description:
    'Ask natural-language questions, pull fuzzy memories from your notes and facts, and review any suggested profile or timeline changes before you confirm them.',
} as const;

export default async function ChatPage() {
  const ctx = await requireAccountAccess();

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
  const chatInteractionTypes: InteractionTypeOption[] = (typeRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
  }));
  const chatCategories = (catRows ?? []).map((r) => ({ id: r.id, name: r.name }));

  const rawTz = typeof ctx.accountTimeZone === 'string' ? ctx.accountTimeZone.trim() : '';
  const momentWallZone =
    rawTz && isValidIanaTimeZone(rawTz) ? rawTz : 'UTC';

  return (
    <main className="page-frame">
      <header className="max-w-3xl">
        <p className="section-eyebrow">{PAGE_COPY.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{PAGE_COPY.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted max-sm:leading-8">
          {PAGE_COPY.description}
        </p>
      </header>
      <div className="mt-8 max-w-3xl">
        <ChatPanel
          chatPeople={chatPeople}
          chatCategories={chatCategories}
          chatInteractionTypes={chatInteractionTypes}
          momentWallZone={momentWallZone}
        />
      </div>
    </main>
  );
}
