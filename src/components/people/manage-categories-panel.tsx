'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createPersonCategory,
  reorderPersonCategories,
  updatePersonCategory,
} from '@/lib/actions/person-categories';

export type ManageCategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type ManageCategoriesPanelProps = {
  categories: ManageCategoryRow[];
};

function CategoryRow(props: {
  category: ManageCategoryRow;
  index: number;
  total: number;
  reorderDisabled: boolean;
  onMove: (index: number, delta: -1 | 1) => void;
  onUpdated: () => void;
}) {
  const { category, index, total, reorderDisabled, onMove, onUpdated } = props;
  const [name, setName] = useState(category.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(category.name);
  }, [category.id, category.name]);

  const trimmed = name.trim();
  const dirty = trimmed !== category.name;
  const canSave = dirty && trimmed.length > 0;

  async function save() {
    setError(null);
    if (!canSave) return;
    setPending(true);
    try {
      const result = await updatePersonCategory(category.id, trimmed);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex shrink-0 gap-2 sm:flex-col sm:gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-w-[4.5rem]"
            aria-label={`Move ${category.name} up in list`}
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
            aria-label={`Move ${category.name} down in list`}
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
            aria-label={`Rename ${category.name}`}
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

export function ManageCategoriesPanel(props: ManageCategoriesPanelProps) {
  const { categories } = props;
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function moveCategory(index: number, delta: -1 | 1) {
    const j = index + delta;
    if (j < 0 || j >= categories.length) {
      return;
    }
    const next = [...categories];
    [next[index], next[j]] = [next[j], next[index]];
    setReordering(true);
    setReorderError(null);
    try {
      const result = await reorderPersonCategories(next.map((c) => c.id));
      if (!result.ok) {
        setReorderError(result.error);
        return;
      }
      refresh();
    } finally {
      setReordering(false);
    }
  }

  async function addCategory() {
    setAddError(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError('Enter a name for the new category.');
      return;
    }
    setAdding(true);
    try {
      const result = await createPersonCategory(trimmed);
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
        <h2 className="font-display text-xl tracking-tight">Your labels</h2>
        <p className="text-sm leading-7 text-muted">
          Rename anytime — people stay linked to the same category. Order here
          matches section order on the People list (use Up / Down to change it).
        </p>
        {reorderError ? (
          <p className="text-sm text-red-800" role="alert">
            {reorderError}
          </p>
        ) : null}
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            No categories yet. Add one below, or{' '}
            <ButtonLink href="/people" variant="link" size="sm">
              go back to People
            </ButtonLink>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((cat, index) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                index={index}
                total={categories.length}
                reorderDisabled={reordering}
                onMove={(i, d) => void moveCategory(i, d)}
                onUpdated={refresh}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <h2 className="font-display text-xl tracking-tight">Add a category</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          New categories appear in person forms and filters immediately.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <FormInput
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Neighbor"
            maxLength={120}
            className="min-w-0 flex-1"
            aria-label="New category name"
            autoFocus
          />
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => void addCategory()}
            disabled={adding}
          >
            {adding ? 'Adding…' : 'Add category'}
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
