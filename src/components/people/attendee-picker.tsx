'use client';

import { useId, useMemo, useState } from 'react';
import { personShownName } from '@/lib/people/list-name';

export type PersonOption = {
  id: string;
  full_name: string;
  display_name: string | null;
};

function personMatchesSearch(person: PersonOption, q: string) {
  if (!q) {
    return true;
  }
  const hay = [
    personShownName(person),
    person.full_name,
    person.display_name ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

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
  const [query, setQuery] = useState('');
  const searchFieldId = useId();

  const value = selected.join(',');

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter(
      (person) =>
        selected.includes(person.id) || personMatchesSearch(person, q),
    );
  }, [options, query, selected]);

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} readOnly />
      {options.length === 0 ? (
        <p className="text-sm text-muted">
          Add more people to your CRM to log group moments.
        </p>
      ) : (
        <>
          <div className="min-w-0">
            <label htmlFor={searchFieldId} className="sr-only">
              Search people by name
            </label>
            <input
              id={searchFieldId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              autoComplete="off"
              className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          {visibleOptions.length === 0 ? (
            <p className="text-sm text-muted">No one matches your search.</p>
          ) : (
            <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
              {visibleOptions.map((person) => {
                const checked = selected.includes(person.id);
                return (
                  <li key={person.id}>
                    <label className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white/60 px-4 py-3 text-sm transition hover:bg-white/90">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(person.id)}
                        className="h-4 w-4 shrink-0 rounded border-border-soft text-accent focus:ring-accent"
                      />
                      <span className="font-medium">
                        {personShownName(person)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
