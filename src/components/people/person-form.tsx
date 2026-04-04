'use client';

import { useActionState } from 'react';
import type { Tables } from '@/lib/db/database.types';
import type { ActionResult } from '@/lib/actions/people';
import { createPerson, updatePersonFormAction } from '@/lib/actions/people';
import { PERSON_STATUSES } from '@/lib/domain/constants';
import { formatStatus } from '@/lib/domain/labels';
import {
  PersonCategoryField,
  type PersonCategoryOption,
} from '@/components/people/person-category-field';
import { Button } from '@/components/ui/button';

const initial: ActionResult = {};

type PersonFormProps =
  | { mode: 'create'; categories: PersonCategoryOption[] }
  | { mode: 'edit'; person: Tables<'people'>; categories: PersonCategoryOption[] };

export function PersonForm(props: PersonFormProps) {
  const [state, formAction, pending] = useActionState(
    props.mode === 'create'
      ? createPerson
      : updatePersonFormAction.bind(null, props.person.id),
    initial,
  );

  const person = props.mode === 'edit' ? props.person : null;
  const categories = props.categories;

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="full_name" className="text-sm font-semibold">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={person?.full_name ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="display_name" className="text-sm font-semibold">
            Display name
          </label>
          <p className="text-xs text-muted">
            Optional — used in lists, timeline, and pickers. Profile still shows
            full name.
          </p>
          <input
            id="display_name"
            name="display_name"
            defaultValue={person?.display_name ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="preferred_name" className="text-sm font-semibold">
            Preferred name
          </label>
          <input
            id="preferred_name"
            name="preferred_name"
            defaultValue={person?.preferred_name ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pronouns" className="text-sm font-semibold">
            Pronouns
          </label>
          <input
            id="pronouns"
            name="pronouns"
            defaultValue={person?.pronouns ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <PersonCategoryField
            initialCategories={categories}
            defaultCategoryId={person?.category_id}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-semibold">
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={person?.status ?? 'active'}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          >
            {PERSON_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="birthday" className="text-sm font-semibold">
            Birthday
          </label>
          <input
            id="birthday"
            name="birthday"
            type="date"
            defaultValue={person?.birthday ? person.birthday.slice(0, 10) : ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="met_at" className="text-sm font-semibold">
            Date met
          </label>
          <input
            id="met_at"
            name="met_at"
            type="month"
            defaultValue={
              person?.met_at ? person.met_at.slice(0, 7) : ''
            }
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-semibold">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={person?.location ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="occupation" className="text-sm font-semibold">
            Occupation
          </label>
          <input
            id="occupation"
            name="occupation"
            defaultValue={person?.occupation ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-semibold">
            Company
          </label>
          <input
            id="company"
            name="company"
            defaultValue={person?.company ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="how_you_met" className="text-sm font-semibold">
            How you met
          </label>
          <textarea
            id="how_you_met"
            name="how_you_met"
            rows={3}
            defaultValue={person?.how_you_met ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="relationship_context"
            className="text-sm font-semibold"
          >
            Relationship context
          </label>
          <textarea
            id="relationship_context"
            name="relationship_context"
            rows={4}
            defaultValue={person?.relationship_context ?? ''}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending
            ? props.mode === 'create'
              ? 'Adding…'
              : 'Saving…'
            : props.mode === 'create'
              ? 'Add person'
              : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
