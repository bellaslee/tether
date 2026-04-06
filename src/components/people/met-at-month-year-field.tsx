'use client';

import { useMemo, useState } from 'react';
import { formControlClassName } from '@/components/ui/form-control-classes';

type MetAtMonthYearFieldProps = {
  /** Stored as `YYYY-MM-01` or null from `people.met_at`. */
  defaultMetAt: string | null | undefined;
};

function splitMetAt(iso: string | null | undefined): {
  month: string;
  year: string;
} {
  if (!iso) {
    return { month: '', year: '' };
  }
  const ymd = iso.slice(0, 10);
  const [y, m] = ymd.split('-');
  if (!y || !m || m.length < 2) {
    return { month: '', year: '' };
  }
  return { month: m.slice(0, 2), year: y };
}

function yearRange(): number[] {
  const end = new Date().getFullYear() + 1;
  const start = end - 100;
  const years: number[] = [];
  for (let y = end; y >= start; y -= 1) {
    years.push(y);
  }
  return years;
}

/**
 * Month + year only (no day). Native `input type="month"` is unreliable in Safari;
 * two selects submit the same `met_at` `YYYY-MM` shape as the hidden field.
 */
export function MetAtMonthYearField({ defaultMetAt }: MetAtMonthYearFieldProps) {
  const [month, setMonth] = useState(
    () => splitMetAt(defaultMetAt).month,
  );
  const [year, setYear] = useState(() => splitMetAt(defaultMetAt).year);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const value = String(i + 1).padStart(2, '0');
        const label = new Date(2000, i, 1).toLocaleString(undefined, {
          month: 'long',
        });
        return { value, label };
      }),
    [],
  );

  const years = useMemo(() => yearRange(), []);

  const metAtValue = month && year ? `${year}-${month}` : '';

  const selectCls = formControlClassName({ size: 'default' });

  return (
    <div className="min-w-0 space-y-2">
      <p id="met-at-label" className="text-sm font-semibold">
        Date met
      </p>
      <input type="hidden" name="met_at" value={metAtValue} />
      <div
        className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
        role="group"
        aria-labelledby="met-at-label"
      >
        <select
          id="met_at_month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={['min-w-0 flex-1', selectCls].join(' ')}
          aria-label="Month"
        >
          <option value="">Month</option>
          {monthOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          id="met_at_year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={['min-w-0 flex-1', selectCls].join(' ')}
          aria-label="Year"
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
