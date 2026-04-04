'use client';

import { useActionState, useState } from 'react';
import type { ActionResult } from '@/lib/actions/interactions';
import { createGlobalInteraction } from '@/lib/actions/interactions';
import {
  INTERACTION_DIRECTIONS,
  INTERACTION_TYPES,
} from '@/lib/domain/constants';
import { formatInteractionType } from '@/lib/domain/labels';
import {
  AttendeePicker,
  type PersonOption,
} from '@/components/people/attendee-picker';
import { personShownName } from '@/lib/people/list-name';

const initial: ActionResult = {};

type GlobalInteractionFormProps = {
  people: PersonOption[];
  defaultOccurredAt: string;
};

export function GlobalInteractionForm({
  people,
  defaultOccurredAt,
}: GlobalInteractionFormProps) {
  const [state, formAction, pending] = useActionState(
    createGlobalInteraction,
    initial,
  );
  const [primaryId, setPrimaryId] = useState('');

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="primary_person_id" className="text-sm font-semibold">
          Main person
        </label>
        <p className="text-xs text-muted">
          Who was this moment mainly about? Others can be linked as attendees.
        </p>
        <select
          id="primary_person_id"
          name="primary_person_id"
          required
          value={primaryId}
          onChange={(event) => setPrimaryId(event.target.value)}
          className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
        >
          <option value="">Choose someone</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {personShownName(person)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Also there</p>
        <AttendeePicker people={people} excludeId={primaryId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="occurred_at" className="text-sm font-semibold">
            When
          </label>
          <input
            id="occurred_at"
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={defaultOccurredAt}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-semibold">
            Type
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue="hangout"
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {formatInteractionType(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="direction" className="text-sm font-semibold">
            Direction
          </label>
          <select
            id="direction"
            name="direction"
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          >
            <option value="">Optional</option>
            {INTERACTION_DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-semibold">
            Title
          </label>
          <input
            id="title"
            name="title"
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="raw_note" className="text-sm font-semibold">
            Note
          </label>
          <textarea
            id="raw_note"
            name="raw_note"
            rows={5}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || people.length === 0}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save interaction'}
      </button>
    </form>
  );
}
