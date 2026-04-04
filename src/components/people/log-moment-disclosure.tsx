'use client';

import { useState } from 'react';
import type { PersonOption } from '@/components/people/attendee-picker';
import { PersonInteractionForm } from '@/components/people/person-interaction-form';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';

type LogMomentDisclosureProps = {
  personId: string;
  otherPeople: PersonOption[];
  defaultOccurredAt: string;
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
};

export function LogMomentDisclosure({
  personId,
  otherPeople,
  defaultOccurredAt,
  interactionTypes,
  defaultInteractionTypeId,
}: LogMomentDisclosureProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition enabled:hover:-translate-y-0.5"
      >
        Log a moment
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <PersonInteractionForm
          personId={personId}
          otherPeople={otherPeople}
          defaultOccurredAt={defaultOccurredAt}
          interactionTypes={interactionTypes}
          defaultInteractionTypeId={defaultInteractionTypeId}
        />
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
