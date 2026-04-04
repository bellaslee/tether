'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
import { Button } from '@/components/ui/button';

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
        variant="ghostSubtle"
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
      : (people[0]?.id ?? '');
  const [primaryId, setPrimaryId] = useState(resolvedPrimary);
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
      {state.error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={`primary-${interactionId}`} className="text-sm font-semibold">
          Main person
        </label>
        <select
          id={`primary-${interactionId}`}
          name="primary_person_id"
          required
          value={primaryId}
          onChange={(event) => setPrimaryId(event.target.value)}
          className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {personShownName(person)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Also there</p>
        <AttendeePicker
          key={interactionId}
          people={people}
          excludeId={primaryId}
          initialSelectedIds={attendeeIds}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`occurred-${interactionId}`}
            className="text-sm font-semibold"
          >
            When
          </label>
          <input
            id={`occurred-${interactionId}`}
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={defaultOccurredAt}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
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
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
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
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
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
          <input
            id={`title-${interactionId}`}
            name="title"
            defaultValue={defaultTitle}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor={`note-${interactionId}`} className="text-sm font-semibold">
            Note
          </label>
          <textarea
            id={`note-${interactionId}`}
            name="raw_note"
            rows={4}
            defaultValue={defaultRawNote}
            className="w-full rounded-2xl border border-border-soft bg-white/80 px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2"
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
