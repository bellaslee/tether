'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createManualFact,
  createManualReminder,
  type AiMemoryActionResult,
} from '@/lib/actions/ai-memory';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { FormTextarea } from '@/components/ui/form-textarea';
import { TextField } from '@/components/ui/text-field';
import { TextareaField } from '@/components/ui/textarea-field';
import { listRowCardClassName } from '@/components/ui/list-row-card';

const initial: AiMemoryActionResult = {};

export function ManualFactForm({
  personId,
  onCancel,
  onSaved,
}: {
  personId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createManualFact,
    initial,
  );

  useEffect(() => {
    if (state.ok) {
      onSaved();
      router.refresh();
    }
  }, [state.ok, onSaved, router]);

  return (
    <form
      action={formAction}
      className={listRowCardClassName('space-y-3')}
    >
      <input type="hidden" name="person_id" value={personId} />
      <TextareaField
        id={`manual-fact-body-${personId}`}
        label="What to remember"
        name="body"
        rows={3}
        required
        fieldSize="compact"
        hint="Saved directly to this profile—no AI."
        autoFocus
      />
      {state.error ? (
        <FieldError size="compact">{state.error}</FieldError>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Save fact'}
        </Button>
        <Button
          type="button"
          variant="ghostSubtle"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ManualReminderForm({
  personId,
  onCancel,
  onSaved,
}: {
  personId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createManualReminder,
    initial,
  );

  useEffect(() => {
    if (state.ok) {
      onSaved();
      router.refresh();
    }
  }, [state.ok, onSaved, router]);

  return (
    <form
      action={formAction}
      className={listRowCardClassName('space-y-3')}
    >
      <input type="hidden" name="person_id" value={personId} />
      <TextField
        id={`manual-reminder-title-${personId}`}
        label="Reminder"
        name="title"
        required
        fieldSize="compact"
        hint="Shows as an active open loop you can complete or snooze."
        autoFocus
      />
      <div className="space-y-2">
        <label
          htmlFor={`manual-reminder-desc-${personId}`}
          className="text-sm font-semibold"
        >
          Details{' '}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <FormTextarea
          id={`manual-reminder-desc-${personId}`}
          name="description"
          rows={2}
          fieldSize="compact"
          aria-label="Reminder details (optional)"
        />
      </div>
      {state.error ? (
        <FieldError size="compact">{state.error}</FieldError>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Save reminder'}
        </Button>
        <Button
          type="button"
          variant="ghostSubtle"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
