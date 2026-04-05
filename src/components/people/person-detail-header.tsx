'use client';

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, ButtonLink } from '@/components/ui/button';
import { PersonInteractionForm } from '@/components/people/person-interaction-form';
import type { PersonOption } from '@/components/people/attendee-picker';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { usePersonLogInteraction } from '@/components/people/person-log-interaction-context';

type PersonDetailHeaderProps = {
  children: React.ReactNode;
  /** Rendered directly under the title row (e.g. profile tabs). */
  afterTitle?: React.ReactNode;
  editHref: string;
  personId: string;
  allPeople: PersonOption[];
  defaultOccurredAt: string;
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
};

export function PersonDetailHeader({
  children,
  afterTitle,
  editHref,
  personId,
  allPeople,
  defaultOccurredAt,
  interactionTypes,
  defaultInteractionTypeId,
}: PersonDetailHeaderProps) {
  const { logOpen, openLogInteraction, closeLogInteraction } =
    usePersonLogInteraction();
  const handleSuccess = useCallback(() => {
    closeLogInteraction();
  }, [closeLogInteraction]);

  useEffect(() => {
    if (!logOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLogInteraction();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [logOpen, closeLogInteraction]);

  const logLightbox =
    logOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/35 p-4 backdrop-blur-[2px] sm:p-6"
            role="presentation"
            onClick={closeLogInteraction}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="log-interaction-dialog-title"
              className="card-surface max-h-[min(90dvh,48rem)] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-border-soft p-6 shadow-[var(--shadow)] sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2
                  id="log-interaction-dialog-title"
                  className="font-display text-2xl tracking-tight"
                >
                  Log an interaction
                </h2>
                <Button
                  type="button"
                  variant="ghostSubtle"
                  size="sm"
                  onClick={closeLogInteraction}
                  className="shrink-0"
                >
                  Close
                </Button>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">
                Saved to their timeline and yours. Add anyone else under{' '}
                <span className="font-medium text-foreground">People</span> so
                one entry stays in sync for everyone.
              </p>
              <div className="mt-6">
                <PersonInteractionForm
                  personId={personId}
                  allPeople={allPeople}
                  defaultOccurredAt={defaultOccurredAt}
                  interactionTypes={interactionTypes}
                  defaultInteractionTypeId={defaultInteractionTypeId}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

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
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={openLogInteraction}
                aria-haspopup="dialog"
                aria-expanded={logOpen}
              >
                Log interaction
              </Button>
            </div>
          </div>
          {afterTitle}
        </div>
      </div>
      {logLightbox}
    </>
  );
}
