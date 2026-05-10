'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import type { Tables } from '@/lib/db/database.types';
import { personShownName } from '@/lib/people/list-name';
import { RelationshipHeartBar } from '@/components/people/relationship-heart-bar';
import { formatDateInTimeZone } from '@/lib/datetime';
import { randomPanelTopAccentClass } from '@/lib/ui/panel-top-accent';

const PAGE_COPY = {
  list: {
    categoryPlaceholder: '—',
    lastTouch: 'Last touch',
    noInteractionsYet: 'No interactions yet',
  },
} as const;

type PersonListRow = Pick<
  Tables<'people'>,
  | 'id'
  | 'full_name'
  | 'display_name'
  | 'category_id'
  | 'status'
  | 'last_interaction_at'
  | 'met_at'
  | 'created_at'
  | 'interaction_count'
  | 'relationship_hearts_baseline_halves'
> & {
  person_categories: { name: string } | null;
};

export function PeopleListItem({
  person,
  displayTimeZone,
  variant = 'row',
}: {
  person: PersonListRow;
  displayTimeZone: string;
  /** `stacked`: chips below name (grid). `row`: name and chips side by side (list by category). */
  variant?: 'row' | 'stacked';
}) {
  const stacked = variant === 'stacked';
  const [hoverAccent, setHoverAccent] = useState<string | null>(null);

  const onEnter = useCallback(() => {
    setHoverAccent(randomPanelTopAccentClass());
  }, []);
  const onLeave = useCallback(() => {
    setHoverAccent(null);
  }, []);

  const borderTop =
    hoverAccent !== null
      ? hoverAccent
      : 'border-t-2 border-t-transparent';

  return (
    <li className="flex min-h-0 min-w-0">
      <Link
        href={`/people/${person.id}`}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        className={`card-surface flex w-full gap-3 rounded-[1.25rem] border border-border-soft ${borderTop} p-4 transition hover:-translate-y-0.5 ${
          stacked
            ? 'flex-col items-stretch'
            : 'flex-col items-stretch sm:flex-row sm:items-start sm:justify-between'
        }`}
      >
        <div className={stacked ? 'min-w-0' : 'min-w-0 sm:flex-1'}>
          <p className="font-display text-base leading-snug tracking-tight [overflow-wrap:anywhere] sm:text-lg">
            {personShownName(person)}
          </p>
        </div>
        <div
          className={`flex w-full flex-wrap gap-1.5 text-xs text-muted sm:w-auto ${
            stacked ? 'justify-start' : 'justify-start sm:shrink-0 sm:justify-end'
          }`}
        >
          <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">
            {person.person_categories?.name ?? PAGE_COPY.list.categoryPlaceholder}
          </span>
          <RelationshipHeartBar
            lastInteractionAt={person.last_interaction_at}
            metAt={person.met_at}
            createdAt={person.created_at}
            interactionCount={person.interaction_count}
            personCategoryName={person.person_categories?.name ?? null}
            relationshipHeartsBaselineHalves={
              person.relationship_hearts_baseline_halves
            }
            size="compact"
          />
          {person.last_interaction_at ? (
            <span className="rounded-full border border-border-soft px-2.5 py-0.5">
              {PAGE_COPY.list.lastTouch}{' '}
              {formatDateInTimeZone(
                person.last_interaction_at,
                displayTimeZone,
              )}
            </span>
          ) : (
            <span className="rounded-full border border-border-soft px-2.5 py-0.5">
              {PAGE_COPY.list.noInteractionsYet}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
