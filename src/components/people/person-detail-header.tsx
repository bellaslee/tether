'use client';

import { useCallback, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { PersonInteractionForm } from '@/components/people/person-interaction-form';
import type { PersonOption } from '@/components/people/attendee-picker';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';

type PersonDetailHeaderProps = {
  children: React.ReactNode;
  /** Rendered directly under the title row (e.g. profile tabs). */
  afterTitle?: React.ReactNode;
  editHref: string;
  personId: string;
  otherPeople: PersonOption[];
  defaultOccurredAt: string;
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
};

export function PersonDetailHeader({
  children,
  afterTitle,
  editHref,
  personId,
  otherPeople,
  defaultOccurredAt,
  interactionTypes,
  defaultInteractionTypeId,
}: PersonDetailHeaderProps) {
  const [logOpen, setLogOpen] = useState(false);
  const handleSuccess = useCallback(() => {
    setLogOpen(false);
  }, []);

  // Fragment (no wrapper div): sticky must be a direct sibling of the long page
  // content under <main> so the sticky containing block spans the full scroll height.
  return (
    <>
      <div className="sticky top-0 z-40 -mx-8 w-[calc(100%+4rem)] max-w-none bg-background/95 px-8 pt-2 backdrop-blur-md sm:-mx-14 sm:w-[calc(100%+7rem)] sm:px-14 lg:-mx-16 lg:w-[calc(100%+8rem)] lg:px-16">
        <div className="w-full space-y-4 border-b border-border-soft pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">{children}</div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <ButtonLink href={editHref} variant="secondary" size="lg">
                Edit profile
              </ButtonLink>
              {logOpen ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setLogOpen(false)}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => setLogOpen(true)}
                >
                  Log interaction
                </Button>
              )}
            </div>
          </div>
          {afterTitle}
        </div>
      </div>
      {logOpen ? (
        <div className="card-surface max-w-3xl rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <h2 className="font-display text-2xl tracking-tight">
            Log an interaction
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Saved to their timeline and yours. Add co-attendees with the{' '}
            <span className="font-medium text-foreground">Also there</span> field
            so one entry stays in sync for everyone.
          </p>
          <div className="mt-6">
            <PersonInteractionForm
              personId={personId}
              otherPeople={otherPeople}
              defaultOccurredAt={defaultOccurredAt}
              interactionTypes={interactionTypes}
              defaultInteractionTypeId={defaultInteractionTypeId}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
