'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  createPersonConnectionsBatch,
  deletePersonConnection,
} from '@/lib/actions/person-connections';
import { Button } from '@/components/ui/button';
import { ConfirmLightbox } from '@/components/ui/confirm-lightbox';
import { FormInput } from '@/components/ui/form-input';
import { Picklist } from '@/components/ui/picklist';
import { FormTextarea } from '@/components/ui/form-textarea';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import { panelTopAccentAt } from '@/lib/ui/panel-top-accent';

export type PersonConnectionListItem = {
  id: string;
  typeName: string;
  relatedId: string;
  relatedLabel: string;
  notes: string | null;
};

export type PersonConnectionPersonOption = {
  id: string;
  label: string;
};

export type PersonConnectionTypeOption = {
  id: string;
  name: string;
};

type PersonConnectionsPanelProps = {
  personId: string;
  subjectName: string;
  connections: PersonConnectionListItem[];
  otherPeople: PersonConnectionPersonOption[];
  connectionTypes: PersonConnectionTypeOption[];
  defaultConnectionTypeId: string;
  className?: string;
  /** Rotates sun / sky / coral top border with other person-detail panels. */
  topAccentIndex?: number;
};

function comparePersonOptionByLabel(
  a: PersonConnectionPersonOption,
  b: PersonConnectionPersonOption,
) {
  return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
}

function ConnectionRow(props: {
  row: PersonConnectionListItem;
  onRemoved: () => void;
}) {
  const { row, onRemoved } = props;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <li
      className={listRowCardClassName(
        'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          <Link
            href={`/people/${row.relatedId}`}
            className="text-accent underline-offset-4 hover:underline"
          >
            {row.relatedLabel}
          </Link>
          <span className="font-normal text-muted"> — </span>
          <span>{row.typeName}</span>
        </p>
        {row.notes ? (
          <p className="mt-1 text-sm leading-6 text-muted">{row.notes}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            setConfirmOpen(true);
          }}
          className="text-red-800 hover:bg-red-50"
        >
          Remove
        </Button>
      </div>
      <ConfirmLightbox
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        title="Remove this connection?"
        description="This link will be removed. You can connect these people again later."
        confirmLabel="Remove"
        error={error}
        onConfirm={async () => {
          const result = await deletePersonConnection(row.id);
          if (!result.ok) {
            setError(result.error);
            return false;
          }
          onRemoved();
        }}
      />
    </li>
  );
}

function AddConnectionForm(props: {
  personId: string;
  subjectName: string;
  otherPeople: PersonConnectionPersonOption[];
  connectionTypes: PersonConnectionTypeOption[];
  defaultConnectionTypeId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    personId,
    subjectName,
    otherPeople,
    connectionTypes,
    defaultConnectionTypeId,
    onDone,
    onCancel,
  } = props;
  const router = useRouter();
  const [typeId, setTypeId] = useState(defaultConnectionTypeId);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [query, setQuery] = useState('');
  const [listRevealed, setListRevealed] = useState(false);
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedPeople = useMemo(() => {
    const copy = [...otherPeople];
    copy.sort(comparePersonOptionByLabel);
    return copy;
  }, [otherPeople]);

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
        selectedRelatedIds.has(person.id) ||
        person.label.toLowerCase().includes(q),
    );
  }, [listRevealed, orderedPeople, query, selectedRelatedIds]);

  function revealList() {
    setListRevealed(true);
  }

  function toggleRelated(personId: string) {
    setSelectedRelatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!typeId) {
      setError('Choose a connection type.');
      return;
    }
    if (selectedRelatedIds.size === 0) {
      setError('Choose at least one person to connect.');
      return;
    }
    setPending(true);
    try {
      const relatedPersonIds = [...selectedRelatedIds];
      const result = await createPersonConnectionsBatch(
        personId,
        relatedPersonIds,
        typeId,
        notes,
      );
      if (result.ok) {
        setSelectedRelatedIds(new Set());
        setQuery('');
        setListRevealed(false);
        setNotes('');
        setTypeId(defaultConnectionTypeId);
        router.refresh();
        onDone();
        return;
      }
      if (result.createdCount > 0) {
        router.refresh();
      }
      if (result.skippedRelatedIds.length > 0) {
        setSelectedRelatedIds(new Set(result.skippedRelatedIds));
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void submit(e)}>
      <p className="text-sm leading-7 text-muted">
        You’re recording how someone relates to{' '}
        <span className="font-semibold text-foreground">{subjectName}</span>.
        For example, choose Parent if they are {subjectName}&apos;s parent.
      </p>
      <div className="space-y-2">
        <label htmlFor="connection-type" className="text-sm font-semibold">
          Connection type
        </label>
        <Picklist
          id="connection-type"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          required
        >
          {connectionTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Picklist>
      </div>
      <div className="space-y-2">
        <label htmlFor="connection-related" className="text-sm font-semibold">
          People to connect
        </label>
        <div className="min-w-0">
          <label htmlFor="connection-related-search" className="sr-only">
            Search people by name
          </label>
          <FormInput
            id="connection-related-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={revealList}
            onClick={revealList}
            placeholder="Search by name"
            autoComplete="off"
          />
        </div>
        {listRevealed && visiblePeople.length === 0 ? (
          <p className="text-sm text-muted">No one matches your search.</p>
        ) : null}
        {listRevealed && visiblePeople.length > 0 ? (
          <ul className="flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
            {visiblePeople.map((person) => {
              const selected = selectedRelatedIds.has(person.id);
              return (
                <li key={person.id}>
                  <div
                    className={listRowCardClassName(
                      [
                        'flex min-w-0 items-center gap-3 transition',
                        selected
                          ? 'border-accent bg-accent-soft text-foreground'
                          : 'hover:bg-white/90',
                      ].join(' '),
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={
                        selected
                          ? `Remove ${person.label} from this connection`
                          : `Add ${person.label} to this connection`
                      }
                      onClick={() => toggleRelated(person.id)}
                      className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition outline-none',
                        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                        selected
                          ? 'border-accent bg-accent text-white'
                          : 'border-border-soft bg-white/90 text-transparent',
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
                      onClick={() => toggleRelated(person.id)}
                      className="min-w-0 flex-1 py-0.5 text-left text-sm font-medium"
                    >
                      {person.label}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        <p className="text-xs text-muted">
          {selectedRelatedIds.size > 0
            ? `${selectedRelatedIds.size} selected`
            : 'Select one or more people.'}
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="connection-notes" className="text-sm font-semibold">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <FormTextarea
          id="connection-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={2000}
          resize="y"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? 'Saving…' : 'Add connection'}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function PersonConnectionsPanel(props: PersonConnectionsPanelProps) {
  const {
    personId,
    subjectName,
    connections,
    otherPeople,
    connectionTypes,
    defaultConnectionTypeId,
    className = '',
    topAccentIndex,
  } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const topAccent =
    topAccentIndex !== undefined ? ` ${panelTopAccentAt(topAccentIndex)}` : '';

  return (
    <div
      className={`card-surface flex min-h-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8${topAccent} ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
        <div>
          <h2 className="font-display text-xl sm:text-2xl">Connected people</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Who they know in your circle and how those people relate to them.
          </p>
        </div>
        <Link
          href="/settings#connection-types"
          className="shrink-0 text-sm font-semibold text-accent underline-offset-4 hover:underline"
        >
          Manage types
        </Link>
      </div>

      <ul className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto">
        {connections.length === 0 ? (
          <li className="text-sm text-muted">No connections yet.</li>
        ) : (
          connections.map((row) => (
            <ConnectionRow
              key={row.id}
              row={row}
              onRemoved={() => router.refresh()}
            />
          ))
        )}
      </ul>

      {connectionTypes.length === 0 ? (
        <p className="mt-6 shrink-0 text-sm text-muted">
          Add at least one connection type under{' '}
          <Link
            href="/settings#connection-types"
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            Connection types
          </Link>{' '}
          before linking people.
        </p>
      ) : otherPeople.length === 0 ? (
        <p className="mt-6 shrink-0 text-sm text-muted">
          Add more people to your list to create connections between them.
        </p>
      ) : !open ? (
        <div className="mt-6 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setOpen(true)}
          >
            Add connection
          </Button>
        </div>
      ) : (
        <div className="mt-6 shrink-0 rounded-2xl border border-border-soft bg-white/40 p-4 sm:p-5">
          <AddConnectionForm
            personId={personId}
            subjectName={subjectName}
            otherPeople={otherPeople}
            connectionTypes={connectionTypes}
            defaultConnectionTypeId={
              defaultConnectionTypeId || connectionTypes[0]?.id || ''
            }
            onDone={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
