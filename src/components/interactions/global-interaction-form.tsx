'use client';

import { useActionState, useState } from 'react';
import type { ActionResult } from '@/lib/actions/interactions';
import { createGlobalInteraction } from '@/lib/actions/interactions';
import { INTERACTION_DIRECTIONS } from '@/lib/domain/constants';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import {
  AttendeePicker,
  type PersonOption,
} from '@/components/people/attendee-picker';
import { PeopleFilterDisclosure } from '@/components/people/people-filter-disclosure';
import { personShownName } from '@/lib/people/list-name';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { formControlClassName } from '@/components/ui/form-control-classes';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';

const initial: ActionResult = {};

type GlobalInteractionFormProps = {
  people: PersonOption[];
  defaultOccurredAt: string;
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
};

export function GlobalInteractionForm({
  people,
  defaultOccurredAt,
  interactionTypes,
  defaultInteractionTypeId,
}: GlobalInteractionFormProps) {
  const [state, formAction, pending] = useActionState(
    createGlobalInteraction,
    initial,
  );
  const [primaryId, setPrimaryId] = useState('');

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="space-y-2">
        <label htmlFor="primary_person_id" className="text-sm font-semibold">
          Main person{' '}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <p className="text-xs text-muted">
          If it was mainly about one person, choose them here. Otherwise leave
          this empty and select everyone under Also there.
        </p>
        <select
          id="primary_person_id"
          name="primary_person_id"
          value={primaryId}
          onChange={(event) => setPrimaryId(event.target.value)}
          className={formControlClassName()}
        >
          <option value="">No main person</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {personShownName(person)}
            </option>
          ))}
        </select>
      </div>

      <PeopleFilterDisclosure
        initialOpen={false}
        labelId="global-interaction-also-there"
        label="Also there"
      >
        <AttendeePicker people={people} excludeId={primaryId} />
      </PeopleFilterDisclosure>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="occurred_at" className="text-sm font-semibold">
            When
          </label>
          <FormInput
            id="occurred_at"
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={defaultOccurredAt}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-semibold">
            Type
          </label>
          <select
            id="type"
            name="interaction_type_id"
            required
            defaultValue={defaultInteractionTypeId}
            className={formControlClassName()}
          >
            {interactionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="direction" className="text-sm font-semibold">
            Direction
          </label>
          <select
            id="direction"
            name="direction"
            className={formControlClassName()}
          >
            <option value="">Optional</option>
            {INTERACTION_DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-semibold">
            Title
          </label>
          <FormInput id="title" name="title" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="raw_note" className="text-sm font-semibold">
            Note
          </label>
          <FormTextarea id="raw_note" name="raw_note" rows={5} resize="y" />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={pending || people.length === 0}
      >
        {pending ? 'Saving…' : 'Save interaction'}
      </Button>
    </form>
  );
}
