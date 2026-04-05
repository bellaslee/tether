'use client';

import {
  PeopleSortControl,
  type PeopleSortOption,
} from '@/components/people/people-sort-control';
import {
  PeopleViewControl,
  type PeopleViewOption,
} from '@/components/people/people-view-control';

type Props = {
  viewKey: PeopleViewOption;
  sortKey: PeopleSortOption;
  className?: string;
};

export function PeopleViewSortBar({ viewKey, sortKey, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-border-soft bg-white/60 px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2 ${className}`.trim()}
    >
      <PeopleViewControl value={viewKey} variant="inline" />
      <div
        className="hidden h-4 w-px shrink-0 self-center bg-border-soft sm:block"
        aria-hidden
      />
      <PeopleSortControl value={sortKey} variant="inline" />
    </div>
  );
}
