'use client';

import { useMemo, useState } from 'react';
import { personShownName } from '@/lib/people/list-name';

export type PersonOption = {
  id: string;
  full_name: string;
  display_name: string | null;
};

type AttendeePickerProps = {
  people: PersonOption[];
  excludeId: string;
  name?: string;
  /** For edit flows; pair with a stable `key` when switching rows. */
  initialSelectedIds?: string[];
};

export function AttendeePicker({
  people,
  excludeId,
  name = 'attendee_ids',
  initialSelectedIds,
}: AttendeePickerProps) {
  const options = useMemo(
    () => people.filter((person) => !excludeId || person.id !== excludeId),
    [people, excludeId],
  );
  const [selected, setSelected] = useState<string[]>(
    () => initialSelectedIds?.filter(Boolean) ?? [],
  );

  const value = selected.join(',');

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} readOnly />
      {options.length === 0 ? (
        <p className="text-sm text-muted">
          Add more people to your CRM to log group moments.
        </p>
      ) : (
        <ul className="space-y-2">
          {options.map((person) => {
            const checked = selected.includes(person.id);
            return (
              <li key={person.id}>
                <label className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white/60 px-4 py-3 text-sm transition hover:bg-white/90">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(person.id)}
                    className="h-4 w-4 rounded border-border-soft text-accent focus:ring-accent"
                  />
                  <span className="font-medium">{personShownName(person)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
