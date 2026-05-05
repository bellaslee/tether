'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createInteractionType,
  reorderInteractionTypes,
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
  index: number;
  total: number;
  reorderDisabled: boolean;
  onMove: (index: number, delta: -1 | 1) => void;
  onUpdated: () => void;
}) {
  const { row, index, total, reorderDisabled, onMove, onUpdated } = props;
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
    <li className={listRowCardClassName('space-y-2')}>
      {row.slug === 'category_change' ? (
        <p className="text-xs leading-5 text-muted">
          Used automatically when someone&apos;s category changes (one timeline
          note per calendar day).
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex shrink-0 gap-2 sm:flex-col sm:gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-w-[4.5rem]"
            aria-label={`Move ${row.name} up in list`}
            disabled={reorderDisabled || index === 0}
            onClick={() => onMove(index, -1)}
          >
            Up
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-w-[4.5rem]"
            aria-label={`Move ${row.name} down in list`}
            disabled={reorderDisabled || index >= total - 1}
            onClick={() => onMove(index, 1)}
          >
            Down
          </Button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <FormInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            fieldSize="dense"
            className="min-w-0 flex-1"
            aria-label={`Rename ${row.name}`}
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => void save()}
            disabled={!canSave || pending || reorderDisabled}
          >
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
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
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function moveType(index: number, delta: -1 | 1) {
    const j = index + delta;
    if (j < 0 || j >= types.length) {
      return;
    }
    const next = [...types];
    [next[index], next[j]] = [next[j], next[index]];
    setReordering(true);
    setReorderError(null);
    try {
      const result = await reorderInteractionTypes(next.map((t) => t.id));
      if (!result.ok) {
        setReorderError(result.error);
        return;
      }
      refresh();
    } finally {
      setReordering(false);
    }
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
          the same id behind the scenes. Order here matches dropdowns when you
          log a moment (use Up / Down to change it).
        </p>
        {reorderError ? (
          <p className="text-sm text-red-800" role="alert">
            {reorderError}
          </p>
        ) : null}
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
            {types.map((t, index) => (
              <TypeRow
                key={t.id}
                row={t}
                index={index}
                total={types.length}
                reorderDisabled={reordering}
                onMove={(i, d) => void moveType(i, d)}
                onUpdated={refresh}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <h2 className="font-display text-xl tracking-tight">Add a type</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <FormInput
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Video call"
            maxLength={120}
            className="min-w-0 flex-1"
            aria-label="New interaction type name"
            autoFocus
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
