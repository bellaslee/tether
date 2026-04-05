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
import { FieldError } from '@/components/ui/field-error';
import { formControlClassName } from '@/components/ui/form-control-classes';
import { TextField } from '@/components/ui/text-field';
import { TextareaField } from '@/components/ui/textarea-field';

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
      {state.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          containerClassName="sm:col-span-2"
          id="full_name"
          name="full_name"
          label="Full name"
          required
          defaultValue={person?.full_name ?? ''}
        />
        <TextField
          containerClassName="sm:col-span-2"
          id="display_name"
          name="display_name"
          label="Display name"
          hint="Optional — used in lists, timeline, and pickers. Profile still shows full name."
          defaultValue={person?.display_name ?? ''}
        />
        <TextField
          id="preferred_name"
          name="preferred_name"
          label="Preferred name"
          defaultValue={person?.preferred_name ?? ''}
        />
        <TextField
          id="pronouns"
          name="pronouns"
          label="Pronouns"
          defaultValue={person?.pronouns ?? ''}
        />
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
            className={formControlClassName()}
          >
            {PERSON_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </div>
        <TextField
          id="birthday"
          name="birthday"
          type="date"
          label="Birthday"
          defaultValue={person?.birthday ? person.birthday.slice(0, 10) : ''}
        />
        <TextField
          id="met_at"
          name="met_at"
          type="month"
          label="Date met"
          defaultValue={person?.met_at ? person.met_at.slice(0, 7) : ''}
        />
        <TextField
          id="location"
          name="location"
          label="Location"
          defaultValue={person?.location ?? ''}
        />
        <TextField
          id="occupation"
          name="occupation"
          label="Occupation"
          defaultValue={person?.occupation ?? ''}
        />
        <TextField
          id="company"
          name="company"
          label="Company"
          defaultValue={person?.company ?? ''}
        />
        <TextareaField
          containerClassName="sm:col-span-2"
          id="how_you_met"
          name="how_you_met"
          label="How you met"
          rows={3}
          defaultValue={person?.how_you_met ?? ''}
        />
        <TextareaField
          containerClassName="sm:col-span-2"
          id="relationship_context"
          name="relationship_context"
          label="Relationship context"
          rows={4}
          defaultValue={person?.relationship_context ?? ''}
        />
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
