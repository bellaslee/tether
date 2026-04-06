'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  createPersonCategory,
  type CreateCategoryResult,
} from '@/lib/actions/person-categories';
import { Button } from '@/components/ui/button';
import { formControlClassName } from '@/components/ui/form-control-classes';
import { RequiredMark } from '@/components/ui/required-mark';
import { FormInput } from '@/components/ui/form-input';

export type PersonCategoryOption = { id: string; name: string };

type PersonCategoryFieldProps = {
  initialCategories: PersonCategoryOption[];
  defaultCategoryId?: string;
};

const ADD_SENTINEL = '__add_category__';

function pickDefaultCategoryId(categories: PersonCategoryOption[]) {
  const friend = categories.find((c) => c.name === 'Friend');
  return friend?.id ?? categories[0]?.id ?? '';
}

type PanelMode = null | 'add';

export function PersonCategoryField(props: PersonCategoryFieldProps) {
  const { initialCategories, defaultCategoryId } = props;

  const [categories, setCategories] = useState(initialCategories);
  const [categoryId, setCategoryId] = useState(
    () => defaultCategoryId ?? pickDefaultCategoryId(initialCategories),
  );
  const [selectNonce, setSelectNonce] = useState(0);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [newName, setNewName] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function closePanel() {
    setPanelMode(null);
    setMessage(null);
    setNewName('');
  }

  function handleSelectChange(value: string) {
    setMessage(null);
    if (value === ADD_SENTINEL) {
      setPanelMode('add');
      setNewName('');
      setSelectNonce((n) => n + 1);
      return;
    }
    setCategoryId(value);
    closePanel();
  }

  async function handleAddCategory() {
    setMessage(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setMessage('Enter a name for the new category.');
      return;
    }

    setPending(true);
    try {
      const result: CreateCategoryResult = await createPersonCategory(trimmed);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setCategories((prev) => [...prev, { id: result.id, name: result.name }]);
      setCategoryId(result.id);
      closePanel();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="category_select" className="text-sm font-semibold">
            Category
            <RequiredMark />
          </label>
          <Link
            href="/settings#categories"
            className="text-xs font-semibold text-accent underline-offset-4 hover:underline"
          >
            Manage categories
          </Link>
        </div>
        <select
          key={selectNonce}
          id="category_select"
          name="category_id"
          value={categoryId}
          onChange={(e) => handleSelectChange(e.target.value)}
          required
          className={formControlClassName()}
          aria-describedby={
            panelMode ? 'category-panel-description' : undefined
          }
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={ADD_SENTINEL} className="text-muted">
            + Add a category…
          </option>
        </select>
        <p id="category-panel-description" className="sr-only">
          {panelMode === 'add'
            ? 'Add a new category using the fields below.'
            : ''}
        </p>
      </div>

      {panelMode === 'add' ? (
        <div
          className="rounded-2xl border border-border-soft/80 bg-white/40 px-4 py-3"
          role="region"
          aria-label="Add category"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            New category
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <FormInput
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Neighbor"
              maxLength={120}
              fieldSize="dense"
              aria-label="New category name"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void handleAddCategory()}
                disabled={pending}
              >
                {pending ? 'Adding…' : 'Add'}
              </Button>
              <Button
                type="button"
                variant="ghostPill"
                size="md"
                onClick={closePanel}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </div>
          {message ? (
            <p className="mt-2 text-sm text-red-800" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
