'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createInteractionType,
  updateInteractionType,
} from '@/lib/actions/interaction-types';

export type ManageInteractionTypeRow = {
  id: string;
  name: string;
  sort_order: number;
  slug: string | null;
};

type ManageInteractionTypesPanelProps = {
  types: ManageInteractionTypeRow[];
};

function TypeRow(props: {
  row: ManageInteractionTypeRow;
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
      const result = await updateInteractionType(row.id, trimmed);
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
    <li className="space-y-2 rounded-2xl border border-border-soft bg-white/60 px-4 py-3">
      {row.slug === 'category_change' ? (
        <p className="text-xs leading-5 text-muted">
          Used automatically when someone&apos;s category changes (one timeline
          note per calendar day).
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-white/80 px-4 py-2.5 text-sm outline-none ring-accent/30 focus:ring-2"
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

export function ManageInteractionTypesPanel(
  props: ManageInteractionTypesPanelProps,
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
      const result = await createInteractionType(trimmed);
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
          Rename anytime — existing moments stay linked because each type keeps
          the same id behind the scenes.
        </p>
        {types.length === 0 ? (
          <p className="text-sm text-muted">
            No types yet. Add one below, or{' '}
            <ButtonLink href="/timeline" variant="link" size="sm">
              go back to Timeline
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
          New types show up in &quot;Log a moment&quot; forms right away.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Video call"
            maxLength={120}
            className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
            aria-label="New interaction type name"
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
