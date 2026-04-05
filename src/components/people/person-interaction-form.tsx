'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/actions/interactions';
import { createInteractionFromPerson } from '@/lib/actions/interactions';
import { INTERACTION_DIRECTIONS } from '@/lib/domain/constants';
import { WallClockTimeZoneField } from '@/components/interactions/wall-clock-time-zone-field';
import { toNewInteractionDatetimeLocalInputValueInZone } from '@/lib/datetime';
import { isValidIanaTimeZone } from '@/lib/timezones';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import {
  InteractionParticipantPicker,
  type PersonOption,
} from '@/components/people/attendee-picker';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { formControlClassName } from '@/components/ui/form-control-classes';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';

const initial: ActionResult = {};

type PersonInteractionFormProps = {
  personId: string;
  allPeople: PersonOption[];
  defaultOccurredAt: string;
  /** Profile time zone; when null, defaults use the browser zone. */
  sessionTimeZone: string | null;
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
  onSuccess?: () => void;
};

export function PersonInteractionForm({
  personId,
  allPeople,
  defaultOccurredAt,
  sessionTimeZone,
  interactionTypes,
  defaultInteractionTypeId,
  onSuccess,
}: PersonInteractionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createInteractionFromPerson.bind(null, personId),
    initial,
  );

  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const wallClockZone =
    sessionTimeZone && isValidIanaTimeZone(sessionTimeZone)
      ? sessionTimeZone
      : browserTimeZone;

  useEffect(() => {
    if (defaultOccurredAt !== '') {
      return;
    }
    const occurred = document.getElementById(
      `occurred-${personId}`,
    ) as HTMLInputElement | null;
    if (occurred && !occurred.value) {
      occurred.value =
        toNewInteractionDatetimeLocalInputValueInZone(browserTimeZone);
    }
  }, [defaultOccurredAt, personId, browserTimeZone]);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      const occurred = formRef.current?.elements.namedItem(
        'occurred_at',
      ) as HTMLInputElement | null;
      if (occurred) {
        occurred.value =
          toNewInteractionDatetimeLocalInputValueInZone(wallClockZone);
      }
      router.refresh();
      onSuccess?.();
    }
  }, [state.ok, router, onSuccess, wallClockZone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <WallClockTimeZoneField />
      {state.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`occurred-${personId}`}
            className="text-sm font-semibold"
          >
            When
          </label>
          <FormInput
            id={`occurred-${personId}`}
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={defaultOccurredAt}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`type-${personId}`} className="text-sm font-semibold">
            Type
          </label>
          <select
            id={`type-${personId}`}
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
          <label
            htmlFor={`direction-${personId}`}
            className="text-sm font-semibold"
          >
            Direction
          </label>
          <select
            id={`direction-${personId}`}
            name="direction"
            className={formControlClassName()}
          >
            <option value="">(optional)</option>
            {INTERACTION_DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor={`title-${personId}`}
            className="text-sm font-semibold"
          >
            Title
          </label>
          <FormInput id={`title-${personId}`} name="title" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <p
            id={`person-interaction-people-${personId}`}
            className="text-sm font-semibold"
          >
            People
          </p>
          <p className="text-xs text-muted">
            They are the main person for this entry. Add anyone else who shared
            the moment.
          </p>
          <div
            role="group"
            aria-labelledby={`person-interaction-people-${personId}`}
          >
            <InteractionParticipantPicker
              key={personId}
              people={allPeople}
              fixedPrimaryId={personId}
              initialPrimaryId={personId}
              initialAttendeeIds={[]}
              autoRevealList
            />
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor={`note-${personId}`} className="text-sm font-semibold">
            Note
          </label>
          <FormTextarea
            id={`note-${personId}`}
            name="raw_note"
            rows={4}
            resize="y"
          />
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? 'Saving…' : 'Save to timeline'}
      </Button>
    </form>
  );
}
