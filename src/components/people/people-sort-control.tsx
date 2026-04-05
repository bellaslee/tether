'use client';

import { Fragment, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'name' as const, label: 'Name' },
  { value: 'last_interaction' as const, label: 'Last interaction' },
  { value: 'created' as const, label: 'Date added' },
  { value: 'met' as const, label: 'Date met' },
];

export type PeopleSortOption = (typeof SORT_OPTIONS)[number]['value'];

type Props = {
  value: PeopleSortOption;
  className?: string;
};

export function PeopleSortControl({ value, className = '' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setSort = useCallback(
    (next: PeopleSortOption) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'name') {
        params.delete('sort');
      } else {
        params.set('sort', next);
      }
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <p
        id="people-sort-label"
        className="text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Sort by
      </p>
      <div
        role="group"
        aria-labelledby="people-sort-label"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      >
        {SORT_OPTIONS.map((opt, index) => {
          const selected = value === opt.value;
          return (
            <Fragment key={opt.value}>
              {index > 0 ? (
                <span className="select-none text-muted/80" aria-hidden>
                  ·
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setSort(opt.value)}
                aria-current={selected ? 'true' : undefined}
                className={`cursor-pointer border-0 bg-transparent p-0 text-left shadow-none focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  selected
                    ? 'font-bold text-foreground'
                    : 'font-normal text-muted underline-offset-4 transition hover:text-foreground hover:underline'
                }`}
              >
                {opt.label}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
