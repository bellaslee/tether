'use client';

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/actions/interactions';
import { updateInteraction } from '@/lib/actions/interactions';
import {
  AttendeePicker,
  type PersonOption,
} from '@/components/people/attendee-picker';
import { INTERACTION_DIRECTIONS } from '@/lib/domain/constants';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { personShownName } from '@/lib/people/list-name';
import { PeopleFilterDisclosure } from '@/components/people/people-filter-disclosure';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { formControlClassName } from '@/components/ui/form-control-classes';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';

const initial: ActionResult = {};

export type InteractionEditDisclosureProps = {
  interactionId: string;
  defaultOccurredAt: string;
  defaultInteractionTypeId: string;
  defaultDirection: string;
  defaultTitle: string;
  defaultRawNote: string;
  primaryPersonId: string;
  attendeeIds: string[];
  people: PersonOption[];
  interactionTypes: InteractionTypeOption[];
};

export function InteractionEditDisclosure({
  interactionId,
  defaultOccurredAt,
  defaultInteractionTypeId,
  defaultDirection,
  defaultTitle,
  defaultRawNote,
  primaryPersonId,
  attendeeIds,
  people,
  interactionTypes,
}: InteractionEditDisclosureProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Edit
      </Button>
    );
  }

  return (
    <div className="w-full max-w-xl space-y-3 rounded-2xl border border-border-soft bg-white/80 p-4 sm:p-5">
      <InteractionEditForm
        interactionId={interactionId}
        defaultOccurredAt={defaultOccurredAt}
        defaultInteractionTypeId={defaultInteractionTypeId}
        defaultDirection={defaultDirection}
        defaultTitle={defaultTitle}
        defaultRawNote={defaultRawNote}
        primaryPersonId={primaryPersonId}
        attendeeIds={attendeeIds}
        people={people}
        interactionTypes={interactionTypes}
        onCancel={() => setOpen(false)}
        onSaved={() => setOpen(false)}
      />
    </div>
  );
}

type InteractionEditFormProps = InteractionEditDisclosureProps & {
  onCancel: () => void;
  onSaved: () => void;
};

function InteractionEditForm({
  interactionId,
  defaultOccurredAt,
  defaultInteractionTypeId,
  defaultDirection,
  defaultTitle,
  defaultRawNote,
  primaryPersonId,
  attendeeIds,
  people,
  interactionTypes,
  onCancel,
  onSaved,
}: InteractionEditFormProps) {
  const router = useRouter();
  const resolvedPrimary =
    primaryPersonId && people.some((p) => p.id === primaryPersonId)
      ? primaryPersonId
      : '';
  const [primaryId, setPrimaryId] = useState(resolvedPrimary);
  const [boostIds, setBoostIds] = useState<string[]>([]);
  const [pickerEpoch, setPickerEpoch] = useState(0);

  const mergedAttendeeInitial = useMemo(
    () => [...new Set([...attendeeIds, ...boostIds])],
    [attendeeIds, boostIds],
  );

  function handlePrimaryChange(next: string) {
    if (!next && primaryId) {
      setBoostIds((prev) => [...new Set([...prev, primaryId])]);
    } else {
      setBoostIds([]);
    }
    setPickerEpoch((e) => e + 1);
    setPrimaryId(next);
  }

  const [state, formAction, pending] = useActionState(
    updateInteraction.bind(null, interactionId),
    initial,
  );

  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (!state.ok) {
      return;
    }
    onSavedRef.current();
    router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="space-y-2">
        <label htmlFor={`primary-${interactionId}`} className="text-sm font-semibold">
          Main person{' '}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <p className="text-xs text-muted">
          Leave empty if no one was the focus — everyone can be under Also
          there.
        </p>
        <select
          id={`primary-${interactionId}`}
          name="primary_person_id"
          value={primaryId}
          onChange={(event) => handlePrimaryChange(event.target.value)}
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
        key={`also-there-${interactionId}-${attendeeIds.slice().sort().join('|')}`}
        initialOpen={attendeeIds.length > 0}
        labelId={`interaction-edit-also-there-${interactionId}`}
        label="Also there"
      >
        <AttendeePicker
          key={`${interactionId}-${pickerEpoch}`}
          people={people}
          excludeId={primaryId}
          initialSelectedIds={mergedAttendeeInitial}
        />
      </PeopleFilterDisclosure>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`occurred-${interactionId}`}
            className="text-sm font-semibold"
          >
            When
          </label>
          <FormInput
            id={`occurred-${interactionId}`}
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={defaultOccurredAt}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`type-${interactionId}`} className="text-sm font-semibold">
            Type
          </label>
          <select
            id={`type-${interactionId}`}
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
            htmlFor={`direction-${interactionId}`}
            className="text-sm font-semibold"
          >
            Direction
          </label>
          <select
            id={`direction-${interactionId}`}
            name="direction"
            defaultValue={defaultDirection}
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
          <label htmlFor={`title-${interactionId}`} className="text-sm font-semibold">
            Title
          </label>
          <FormInput
            id={`title-${interactionId}`}
            name="title"
            defaultValue={defaultTitle}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor={`note-${interactionId}`} className="text-sm font-semibold">
            Note
          </label>
          <FormTextarea
            id={`note-${interactionId}`}
            name="raw_note"
            rows={4}
            defaultValue={defaultRawNote}
            resize="y"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={pending || people.length === 0}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
