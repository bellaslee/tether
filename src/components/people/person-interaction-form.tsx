'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/actions/interactions';
import { createInteractionFromPerson } from '@/lib/actions/interactions';
import { INTERACTION_DIRECTIONS } from '@/lib/domain/constants';
import { toDatetimeLocalInputValue } from '@/lib/datetime';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import {
  AttendeePicker,
  type PersonOption,
} from '@/components/people/attendee-picker';
import { PeopleFilterDisclosure } from '@/components/people/people-filter-disclosure';
import { Button } from '@/components/ui/button';

const initial: ActionResult = {};

type PersonInteractionFormProps = {
  personId: string;
  otherPeople: PersonOption[];
  defaultOccurredAt: string;
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
  onSuccess?: () => void;
};

export function PersonInteractionForm({
  personId,
  otherPeople,
  defaultOccurredAt,
  interactionTypes,
  defaultInteractionTypeId,
  onSuccess,
}: PersonInteractionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createInteractionFromPerson.bind(null, personId),
    initial,
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      const occurred = formRef.current?.elements.namedItem(
        'occurred_at',
      ) as HTMLInputElement | null;
      if (occurred) {
        occurred.value = toDatetimeLocalInputValue();
      }
      router.refresh();
      onSuccess?.();
    }
  }, [state.ok, router, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`occurred-${personId}`}
            className="text-sm font-semibold"
          >
            When
          </label>
          <input
            id={`occurred-${personId}`}
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={defaultOccurredAt}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`type-${personId}`} className="text-sm font-semibold">
            Type
          </label>
          <select
            id={`type-${personId}`}
            name="interaction_type_id"
            required
            defaultValue={defaultInteractionTypeId}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          >
            {interactionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor={`direction-${personId}`}
            className="text-sm font-semibold"
          >
            Direction
          </label>
          <select
            id={`direction-${personId}`}
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
          <label
            htmlFor={`title-${personId}`}
            className="text-sm font-semibold"
          >
            Title
          </label>
          <input
            id={`title-${personId}`}
            name="title"
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor={`note-${personId}`} className="text-sm font-semibold">
            Note
          </label>
          <textarea
            id={`note-${personId}`}
            name="raw_note"
            rows={4}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
      </div>

      <PeopleFilterDisclosure
        initialOpen={false}
        labelId={`person-interaction-also-there-${personId}`}
        label="Also there"
      >
        <p className="mb-2 text-xs text-muted">
          Optional — link this memory to other people in one shared entry.
        </p>
        <AttendeePicker people={otherPeople} excludeId={personId} />
      </PeopleFilterDisclosure>

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? 'Saving…' : 'Save to timeline'}
      </Button>
    </form>
  );
}
