'use client';

import { useActionState, useEffect, useMemo } from 'react';
import type { ActionResult } from '@/lib/actions/interactions';
import { createGlobalInteraction } from '@/lib/actions/interactions';
import { WallClockTimeZoneField } from '@/components/interactions/wall-clock-time-zone-field';
import { toNewInteractionDatetimeLocalInputValueInZone } from '@/lib/datetime';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import {
  InteractionParticipantPicker,
  type PersonOption,
} from '@/components/people/attendee-picker';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Picklist } from '@/components/ui/picklist';
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

  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  useEffect(() => {
    if (defaultOccurredAt !== '') {
      return;
    }
    const el = document.getElementById('occurred_at') as HTMLInputElement | null;
    if (el && !el.value) {
      el.value =
        toNewInteractionDatetimeLocalInputValueInZone(browserTimeZone);
    }
  }, [defaultOccurredAt, browserTimeZone]);

  return (
    <form action={formAction} className="space-y-6">
      <WallClockTimeZoneField />
      {state.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="space-y-2">
        <p id="global-interaction-people-label" className="text-sm font-semibold">
          People
        </p>
        <p className="text-xs text-muted">
          Select who was part of this moment. Use{' '}
          <span className="font-medium text-foreground">Mark as main</span> if it
          was mostly about one person (optional).
        </p>
        <div role="group" aria-labelledby="global-interaction-people-label">
          <InteractionParticipantPicker
            people={people}
            initialPrimaryId=""
            initialAttendeeIds={[]}
            autoRevealList={false}
          />
        </div>
      </div>

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
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-semibold">
            Type
          </label>
          <Picklist
            id="type"
            name="interaction_type_id"
            required
            defaultValue={defaultInteractionTypeId}
          >
            {interactionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Picklist>
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
