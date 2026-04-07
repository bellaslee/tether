'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  createPersonConnection,
  deletePersonConnection,
} from '@/lib/actions/person-connections';
import { Button } from '@/components/ui/button';
import { ConfirmLightbox } from '@/components/ui/confirm-lightbox';
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
  const [relatedId, setRelatedId] = useState('');
  const [typeId, setTypeId] = useState(defaultConnectionTypeId);
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!relatedId) {
      setError('Choose someone to connect.');
      return;
    }
    setPending(true);
    try {
      const result = await createPersonConnection(
        personId,
        relatedId,
        typeId,
        notes,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRelatedId('');
      setNotes('');
      setTypeId(defaultConnectionTypeId);
      router.refresh();
      onDone();
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
        <label htmlFor="connection-related" className="text-sm font-semibold">
          Other person
        </label>
        <Picklist
          id="connection-related"
          value={relatedId}
          onChange={(e) => setRelatedId(e.target.value)}
          required
          autoFocus
        >
          <option value="">Select…</option>
          {otherPeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Picklist>
      </div>
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
          <h2 className="font-display text-2xl">Connected people</h2>
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
