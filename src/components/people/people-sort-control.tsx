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
  /** Inline label + options on one row (for toolbar-style bars). */
  variant?: 'stacked' | 'inline';
};

export function PeopleSortControl({
  value,
  className = '',
  variant = 'stacked',
}: Props) {
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

  const rootClass =
    variant === 'inline'
      ? `flex shrink-0 flex-row flex-nowrap items-center gap-x-2 ${className}`.trim()
      : `flex flex-col gap-2 ${className}`.trim();

  const labelClass =
    variant === 'inline'
      ? 'shrink-0 text-[11px] font-semibold uppercase leading-none tracking-wide text-muted'
      : 'shrink-0 text-xs font-semibold uppercase tracking-wide text-muted';

  const groupClass =
    variant === 'inline'
      ? 'flex min-w-0 flex-nowrap items-center gap-x-1.5 text-xs'
      : 'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm';

  return (
    <div className={rootClass}>
      <p id="people-sort-label" className={labelClass}>
        Sort by
      </p>
      <div
        role="group"
        aria-labelledby="people-sort-label"
        className={groupClass}
      >
        {SORT_OPTIONS.map((opt, index) => {
          const selected = value === opt.value;
          return (
            <Fragment key={opt.value}>
              {index > 0 ? (
                <span
                  className={
                    variant === 'inline'
                      ? 'select-none text-muted/50'
                      : 'select-none text-muted/80'
                  }
                  aria-hidden
                >
                  ·
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setSort(opt.value)}
                aria-current={selected ? 'true' : undefined}
                className={`cursor-pointer border-0 bg-transparent p-0 text-left shadow-none focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  selected
                    ? 'font-normal text-accent'
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
