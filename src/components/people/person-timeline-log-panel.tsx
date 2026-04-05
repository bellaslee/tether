'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import type { PersonOption } from '@/components/people/attendee-picker';
import { PersonInteractionForm } from '@/components/people/person-interaction-form';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { Button } from '@/components/ui/button';

type PersonTimelineLogPanelProps = {
  personId: string;
  otherPeople: PersonOption[];
  defaultOccurredAt: string;
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
};

export function PersonTimelineLogPanel({
  personId,
  otherPeople,
  defaultOccurredAt,
  interactionTypes,
  defaultInteractionTypeId,
}: PersonTimelineLogPanelProps) {
  const [open, setOpen] = useState(false);
  const handleSuccess = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Plans you are looking forward to and moments you have already shared.
            People listed together were part of the same entry — it lives once in
            the database.
          </p>
          <Link
            href="/timeline"
            className="mt-3 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            View global timeline
          </Link>
        </div>
        {open ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => setOpen(true)}
          >
            Log interaction
          </Button>
        )}
      </header>
      {open ? (
        <div className="mt-6 max-w-3xl">
          <PersonInteractionForm
            personId={personId}
            otherPeople={otherPeople}
            defaultOccurredAt={defaultOccurredAt}
            interactionTypes={interactionTypes}
            defaultInteractionTypeId={defaultInteractionTypeId}
            onSuccess={handleSuccess}
          />
        </div>
      ) : null}
    </div>
  );
}
