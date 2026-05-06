'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { usePersonLogInteraction } from '@/components/people/person-log-interaction-context';

type PersonDetailHeaderProps = {
  children: React.ReactNode;
  /** Rendered directly under the title row (e.g. profile tabs). */
  afterTitle?: React.ReactNode;
  editHref: string;
};

export function PersonDetailHeader({
  children,
  afterTitle,
  editHref,
}: PersonDetailHeaderProps) {
  const { logInteractionModalOpen, openLogInteraction } =
    usePersonLogInteraction();

  return (
    <div className="prm-person-sticky-header sticky top-0 z-40 -mx-6 w-[calc(100%+3rem)] max-w-none px-6 pt-2 sm:-mx-10 sm:w-[calc(100%+5rem)] sm:px-10 lg:-mx-12 lg:w-[calc(100%+6rem)] lg:px-12">
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
              aria-expanded={logInteractionModalOpen}
            >
              Log interaction
            </Button>
          </div>
        </div>
        {afterTitle}
      </div>
    </div>
  );
}
