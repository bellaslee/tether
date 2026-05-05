'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/actions/interactions';
import { updateInteraction } from '@/lib/actions/interactions';
import {
  InteractionParticipantPicker,
  type PersonOption,
} from '@/components/people/attendee-picker';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Picklist } from '@/components/ui/picklist';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';
import { WallClockTimeZoneField } from '@/components/interactions/wall-clock-time-zone-field';
import { toDatetimeLocalInputValueInZone } from '@/lib/datetime';
import { isValidIanaTimeZone } from '@/lib/timezones';
import { randomPanelTopAccentClass } from '@/lib/ui/panel-top-accent';

const initial: ActionResult = {};

export type InteractionEditDisclosureProps = {
  interactionId: string;
  occurredAtIso: string;
  /** Saved profile zone; when null, the browser zone is used for the edit field. */
  sessionTimeZone: string | null;
  defaultInteractionTypeId: string;
  defaultTitle: string;
  defaultRawNote: string;
  primaryPersonId: string;
  attendeeIds: string[];
  people: PersonOption[];
  interactionTypes: InteractionTypeOption[];
};

export function InteractionEditDisclosure({
  interactionId,
  occurredAtIso,
  sessionTimeZone,
  defaultInteractionTypeId,
  defaultTitle,
  defaultRawNote,
  primaryPersonId,
  attendeeIds,
  people,
  interactionTypes,
}: InteractionEditDisclosureProps) {
  const [open, setOpen] = useState(false);
  const [editTopAccent, setEditTopAccent] = useState('');

  if (!open) {
    return (
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => {
          setEditTopAccent(randomPanelTopAccentClass());
          setOpen(true);
        }}
      >
        Edit
      </Button>
    );
  }

  return (
    <div
      className={`w-full max-w-xl space-y-3 rounded-2xl border border-border-soft bg-white/80 p-4 sm:p-5 ${editTopAccent}`}
    >
      <InteractionEditForm
        interactionId={interactionId}
        occurredAtIso={occurredAtIso}
        sessionTimeZone={sessionTimeZone}
        defaultInteractionTypeId={defaultInteractionTypeId}
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
  occurredAtIso,
  sessionTimeZone,
  defaultInteractionTypeId,
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
  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const wallZone =
    sessionTimeZone && isValidIanaTimeZone(sessionTimeZone)
      ? sessionTimeZone
      : browserTimeZone;
  const defaultOccurredAt = useMemo(
    () => toDatetimeLocalInputValueInZone(new Date(occurredAtIso), wallZone),
    [occurredAtIso, wallZone],
  );
  const resolvedPrimary =
    primaryPersonId && people.some((p) => p.id === primaryPersonId)
      ? primaryPersonId
      : '';

  const pickerKey = useMemo(
    () =>
      `${interactionId}|${resolvedPrimary}|${[...attendeeIds].sort().join(',')}`,
    [interactionId, resolvedPrimary, attendeeIds],
  );

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
      <WallClockTimeZoneField />
      {state.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="space-y-2">
        <p
          id={`interaction-edit-people-${interactionId}`}
          className="text-sm font-semibold"
        >
          People
        </p>
        <div
          role="group"
          aria-labelledby={`interaction-edit-people-${interactionId}`}
        >
          <InteractionParticipantPicker
            key={pickerKey}
            people={people}
            initialPrimaryId={resolvedPrimary}
            initialAttendeeIds={attendeeIds}
            autoRevealList={false}
          />
        </div>
      </div>

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
          <Picklist
            id={`type-${interactionId}`}
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
