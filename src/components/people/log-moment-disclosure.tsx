'use client';

import { useState } from 'react';
import type { PersonOption } from '@/components/people/attendee-picker';
import { PersonInteractionForm } from '@/components/people/person-interaction-form';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { Button } from '@/components/ui/button';

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
      <Button type="button" variant="primary" size="lg" onClick={() => setOpen(true)}>
        Log a moment
      </Button>
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
      <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
