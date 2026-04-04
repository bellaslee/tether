'use client';

import { Button, ButtonLink } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  createPersonCategory,
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
  onUpdated: () => void;
}) {
  const { category, onUpdated } = props;
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
    <li className="space-y-2 rounded-2xl border border-border-soft bg-white/60 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-white/80 px-4 py-2.5 text-sm outline-none ring-accent/30 focus:ring-2"
          aria-label={`Rename ${category.name}`}
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

export function ManageCategoriesPanel(props: ManageCategoriesPanelProps) {
  const { categories } = props;
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
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
          Rename anytime — people stay linked to the same category.
        </p>
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
            {categories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} onUpdated={refresh} />
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
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Neighbor"
            maxLength={120}
            className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
            aria-label="New category name"
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
