'use client';

import { Fragment, useEffect, useId, useMemo, useState } from 'react';
import { comparePeopleByRelationshipWarmth } from '@/lib/people/compare-by-relationship-warmth';
import { personShownName } from '@/lib/people/list-name';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { listRowCardClassName } from '@/components/ui/list-row-card';

export type PersonOption = {
  id: string;
  full_name: string;
  display_name: string | null;
  last_interaction_at: string | null;
  met_at: string | null;
  created_at: string;
  interaction_count: number;
  relationship_hearts_baseline_halves?: number | null;
  person_categories?: { name: string } | null;
};

type ParticipantSortMode = 'warmth' | 'name';

function comparePeopleByName(a: PersonOption, b: PersonOption): number {
  return personShownName(a).localeCompare(personShownName(b), undefined, {
    sensitivity: 'base',
  });
}

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

function initialSelectedSet(
  initialPrimaryId: string,
  initialAttendeeIds: string[],
  fixedPrimaryId: string | undefined,
): Set<string> {
  const next = new Set<string>();
  for (const id of initialAttendeeIds) {
    if (id) {
      next.add(id);
    }
  }
  const primary = fixedPrimaryId ?? initialPrimaryId;
  if (primary) {
    next.add(primary);
  }
  return next;
}

export type InteractionParticipantPickerProps = {
  people: PersonOption[];
  /** When set, this person is always main and selected; cannot be deselected. */
  fixedPrimaryId?: string;
  initialPrimaryId?: string;
  /** Attendee ids only (exclude primary). */
  initialAttendeeIds?: string[];
  /** When true, show the list immediately (edit / person log flows). */
  autoRevealList?: boolean;
  namePrimary?: string;
  nameAttendees?: string;
  /**
   * When false, omit hidden form inputs and report selection via
   * {@link onSelectionChange} (for dialogs that are not a form).
   */
  formIntegration?: boolean;
  onSelectionChange?: (value: {
    primaryPersonId: string;
    attendeeIds: string[];
  }) => void;
};

export function InteractionParticipantPicker({
  people,
  fixedPrimaryId,
  initialPrimaryId = '',
  initialAttendeeIds = [],
  autoRevealList = false,
  namePrimary = 'primary_person_id',
  nameAttendees = 'attendee_ids',
  formIntegration = true,
  onSelectionChange,
}: InteractionParticipantPickerProps) {
  const resolvedInitialPrimary = fixedPrimaryId ?? initialPrimaryId;
  const [primaryId, setPrimaryId] = useState(
    () => resolvedInitialPrimary || '',
  );
  const [selectedIds, setSelectedIds] = useState(
    () => initialSelectedSet(initialPrimaryId, initialAttendeeIds, fixedPrimaryId),
  );
  const [query, setQuery] = useState('');
  const [listRevealed, setListRevealed] = useState(() => autoRevealList);
  const [sortMode, setSortMode] = useState<ParticipantSortMode>('warmth');
  const searchFieldId = useId();
  const sortLabelId = useId();

  const attendeeValue = useMemo(() => {
    const ids = [...selectedIds].filter((id) => id !== primaryId);
    ids.sort();
    return ids.join(',');
  }, [selectedIds, primaryId]);

  const attendeeIdsSorted = useMemo(() => {
    const ids = [...selectedIds].filter((id) => id !== primaryId);
    ids.sort();
    return ids;
  }, [selectedIds, primaryId]);

  useEffect(() => {
    if (!formIntegration && onSelectionChange) {
      onSelectionChange({
        primaryPersonId: primaryId,
        attendeeIds: attendeeIdsSorted,
      });
    }
  }, [formIntegration, onSelectionChange, primaryId, attendeeIdsSorted]);

  const orderedPeople = useMemo(() => {
    const copy = [...people];
    if (sortMode === 'name') {
      copy.sort(comparePeopleByName);
    } else {
      copy.sort(comparePeopleByRelationshipWarmth);
    }
    return copy;
  }, [people, sortMode]);

  const visiblePeople = useMemo(() => {
    if (!listRevealed) {
      return [];
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return orderedPeople;
    }
    return orderedPeople.filter(
      (person) =>
        selectedIds.has(person.id) || personMatchesSearch(person, q),
    );
  }, [orderedPeople, query, listRevealed, selectedIds]);

  function revealList() {
    setListRevealed(true);
  }

  function toggleSelected(personId: string) {
    if (fixedPrimaryId && personId === fixedPrimaryId) {
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
    setPrimaryId((p) => (p === personId ? '' : p));
  }

  function markMain(personId: string) {
    if (fixedPrimaryId && personId !== fixedPrimaryId) {
      return;
    }
    setPrimaryId(personId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(personId);
      return next;
    });
  }

  if (people.length === 0) {
    return (
      <p className="text-sm text-muted">
        Add people to your PRM before logging interactions.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {formIntegration ? (
        <>
          {!fixedPrimaryId ? (
            <input type="hidden" name={namePrimary} value={primaryId} readOnly />
          ) : null}
          <input type="hidden" name={nameAttendees} value={attendeeValue} readOnly />
        </>
      ) : null}

      <div className="min-w-0">
        <label htmlFor={searchFieldId} className="sr-only">
          Search people by name
        </label>
        <FormInput
          id={searchFieldId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={revealList}
          onClick={revealList}
          placeholder="Search by name"
          autoComplete="off"
        />
      </div>

      {listRevealed ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <p
            id={sortLabelId}
            className="shrink-0 font-semibold uppercase tracking-wide text-muted"
          >
            Sort by
          </p>
          <div
            role="group"
            aria-labelledby={sortLabelId}
            className="flex flex-wrap items-center gap-x-1.5"
          >
            {(
              [
                { mode: 'warmth' as const, label: 'Warmth' },
                { mode: 'name' as const, label: 'Name' },
              ] as const
            ).map((opt, index) => (
              <Fragment key={opt.mode}>
                {index > 0 ? (
                  <span className="select-none text-muted/50" aria-hidden>
                    ·
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSortMode(opt.mode)}
                  aria-current={sortMode === opt.mode ? 'true' : undefined}
                  className={`cursor-pointer border-0 bg-transparent p-0 text-left shadow-none focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    sortMode === opt.mode
                      ? 'font-normal text-accent'
                      : 'font-normal text-muted underline-offset-4 transition hover:text-foreground hover:underline'
                  }`}
                >
                  {opt.label}
                </button>
              </Fragment>
            ))}
          </div>
        </div>
      ) : null}

      {listRevealed && visiblePeople.length === 0 ? (
        <p className="text-sm text-muted">No one matches your search.</p>
      ) : null}

      {listRevealed && visiblePeople.length > 0 ? (
        <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
          {visiblePeople.map((person) => {
            const selected = selectedIds.has(person.id);
            const isMain = primaryId === person.id;
            const rowSelected = selected;
            const markMainDisabled =
              Boolean(fixedPrimaryId && person.id !== fixedPrimaryId) || isMain;

            const checkboxLocked =
              Boolean(fixedPrimaryId) && person.id === fixedPrimaryId;

            return (
              <li key={person.id} className="flex min-w-0 items-stretch gap-2">
                <div
                  className={listRowCardClassName(
                    [
                      'flex min-w-0 flex-1 items-center gap-3 transition',
                      rowSelected
                        ? 'border-accent bg-accent-soft text-foreground'
                        : 'hover:bg-surface-strong',
                    ].join(' '),
                  )}
                >
                  <button
                    type="button"
                    disabled={checkboxLocked}
                    aria-pressed={selected}
                    aria-label={
                      selected
                        ? `Remove ${personShownName(person)} from this interaction`
                        : `Include ${personShownName(person)} in this interaction`
                    }
                    onClick={() => toggleSelected(person.id)}
                    className={[
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition outline-none',
                      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                      'disabled:cursor-default disabled:opacity-100',
                      selected
                        ? 'border-accent bg-accent text-white disabled:border-accent disabled:bg-accent disabled:text-white'
                        : 'border-border-soft bg-surface-strong text-transparent',
                    ].join(' ')}
                  >
                    {selected ? (
                      <svg
                        className="size-3"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="m2.5 6 2.5 2.5L9.5 3.5" />
                      </svg>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-current={isMain ? 'true' : undefined}
                    onClick={() => toggleSelected(person.id)}
                    className="min-w-0 flex-1 py-0.5 text-left text-sm font-medium"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      {personShownName(person)}
                      {isMain ? (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                          Main
                        </span>
                      ) : null}
                    </span>
                  </button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={markMainDisabled}
                  className="self-center shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    markMain(person.id);
                  }}
                >
                  {isMain ? 'Main' : 'Mark as main'}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
