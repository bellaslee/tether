'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import {
  createConnectionType,
  updateConnectionType,
} from '@/lib/actions/connection-types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export type ManageConnectionTypeRow = {
  id: string;
  name: string;
  sort_order: number;
};

type ManageConnectionTypesPanelProps = {
  types: ManageConnectionTypeRow[];
};

function TypeRow(props: {
  row: ManageConnectionTypeRow;
  onUpdated: () => void;
}) {
  const { row, onUpdated } = props;
  const [name, setName] = useState(row.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(row.name);
  }, [row.id, row.name]);

  const trimmed = name.trim();
  const dirty = trimmed !== row.name;
  const canSave = dirty && trimmed.length > 0;

  async function save() {
    setError(null);
    if (!canSave) return;
    setPending(true);
    try {
      const result = await updateConnectionType(row.id, trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUpdated();
    } finally {
      setPending(false);
    }
  }

  return (
    <li className={listRowCardClassName('space-y-2')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <FormInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          fieldSize="dense"
          aria-label={`Rename ${row.name}`}
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => void save()}
          disabled={!canSave || pending}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function ManageConnectionTypesPanel(
  props: ManageConnectionTypesPanelProps,
) {
  const { types } = props;
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function addType() {
    setAddError(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError('Enter a name for the new type.');
      return;
    }
    setAdding(true);
    try {
      const result = await createConnectionType(trimmed);
      if (!result.ok) {
        setAddError(result.error);
        return;
      }
      setNewName('');
      refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-tight">Your types</h2>
        <p className="text-sm leading-7 text-muted">
          Rename anytime — links stay tied to the same type id. Parent and Child
          are paired in the database for mirrored entries when you connect two
          people.
        </p>
        {types.length === 0 ? (
          <p className="text-sm text-muted">
            No types yet. Add one below, or{' '}
            <ButtonLink href="/people" variant="link" size="sm">
              go back to People
            </ButtonLink>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {types.map((t) => (
              <TypeRow key={t.id} row={t} onUpdated={refresh} />
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <h2 className="font-display text-xl tracking-tight">Add a type</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          New types show up when you link people on their profiles.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <FormInput
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Cousin"
            maxLength={120}
            className="min-w-0 flex-1"
            aria-label="New connection type name"
          />
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => void addType()}
            disabled={adding}
          >
            {adding ? 'Adding…' : 'Add type'}
          </Button>
        </div>
        {addError ? (
          <p className="mt-3 text-sm text-red-800" role="alert">
            {addError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
