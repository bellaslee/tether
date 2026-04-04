'use client';

import Link from 'next/link';
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
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSave || pending}
          className="shrink-0 rounded-full border border-border-soft bg-white/80 px-4 py-2.5 text-sm font-semibold transition enabled:hover:bg-white disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
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
          Rename anytime — people stay linked because each category keeps the same
          id behind the scenes.
        </p>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            No categories yet. Add one below, or{' '}
            <Link
              href="/people"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              go back to People
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
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
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Neighbor"
            maxLength={120}
            className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
            aria-label="New category name"
          />
          <button
            type="button"
            onClick={() => void addCategory()}
            disabled={adding}
            className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition enabled:hover:-translate-y-0.5 disabled:opacity-60"
          >
            {adding ? 'Adding…' : 'Add category'}
          </button>
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
