'use client';

import { startTransition, useActionState, useState } from 'react';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory';
import type { Tables } from '@/lib/db/database.types';
import { Button } from '@/components/ui/button';
import { ConfirmLightbox } from '@/components/ui/confirm-lightbox';
import { FieldError } from '@/components/ui/field-error';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';
import { listRowCardClassName } from '@/components/ui/list-row-card';

type TaskRow = Tables<'tasks'>;

type Props = {
  task: TaskRow;
  action: (
    prev: AiMemoryActionResult,
    formData: FormData,
  ) => Promise<AiMemoryActionResult>;
};

export function TaskReviewForms({ task, action }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const submitDelete = () => {
    const fd = new FormData();
    fd.set('task_id', task.id);
    fd.set('intent', 'delete');
    startTransition(() => {
      void formAction(fd);
    });
  };

  const showSuggested = task.status === 'suggested';
  const showActive = task.status === 'active' || task.status === 'snoozed';
  const snoozeStillActive =
    task.status === 'snoozed' &&
    !!task.snoozed_until &&
    new Date(task.snoozed_until) > new Date();
  const markDoneVariant = snoozeStillActive ? 'secondary' : 'primary';

  const fieldsKey = `${task.id}-${task.updated_at}`;
  const titleFieldId = `task-edit-title-${task.id}`;
  const descFieldId = `task-edit-desc-${task.id}`;

  if (showSuggested) {
    return (
      <div className={listRowCardClassName('space-y-2')}>
        <p className="font-medium text-foreground">{task.title}</p>
        {task.description ? (
          <p className="text-sm leading-relaxed text-muted">{task.description}</p>
        ) : null}
        <p className="text-xs text-muted">Status: suggested</p>
        <form action={formAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="task_id" value={task.id} />
          <Button
            type="submit"
            name="intent"
            value="activate"
            size="sm"
            variant="primary"
            disabled={pending}
          >
            Keep
          </Button>
          <Button
            type="submit"
            name="intent"
            value="snooze"
            size="sm"
            variant="secondary"
            disabled={pending}
          >
            Snooze 7d
          </Button>
          <Button
            type="submit"
            name="intent"
            value="dismiss"
            size="sm"
            variant="ghostSubtle"
            disabled={pending}
          >
            Decline
          </Button>
        </form>
        {state.error ? (
          <FieldError size="inline">{state.error}</FieldError>
        ) : null}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={listRowCardClassName('space-y-3')}>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="task_id" value={task.id} />
          <div className="space-y-2">
            <label htmlFor={titleFieldId} className="text-sm font-semibold">
              Reminder
            </label>
            <FormInput
              key={`title-${fieldsKey}`}
              id={titleFieldId}
              name="title"
              defaultValue={task.title}
              fieldSize="compact"
              required
              aria-label="Reminder title"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={descFieldId} className="text-sm font-semibold">
              Details{' '}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <FormTextarea
              key={`desc-${fieldsKey}`}
              id={descFieldId}
              name="description"
              rows={2}
              defaultValue={task.description ?? ''}
              fieldSize="compact"
              aria-label="Reminder details (optional)"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              name="intent"
              value="save"
              size="sm"
              variant="primary"
              disabled={pending}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghostSubtle"
              disabled={pending}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghostSubtle"
              disabled={pending}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
          {state.error ? (
            <FieldError size="inline">{state.error}</FieldError>
          ) : null}
        </form>
        <ConfirmLightbox
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          title="Delete this reminder?"
          description="It will be removed from open loops. You can suggest new follow-ups from notes anytime."
          confirmLabel="Delete"
          onConfirm={submitDelete}
        />
      </div>
    );
  }

  return (
    <div className={listRowCardClassName('space-y-2')}>
      <p className="font-medium text-foreground">{task.title}</p>
      {task.description ? (
        <p className="text-sm leading-relaxed text-muted">{task.description}</p>
      ) : null}
      <p className="text-xs text-muted">
        Status: {task.status.replace('_', ' ')}
        {snoozeStillActive && task.snoozed_until ? (
          <>
            {' '}
            (until{' '}
            {new Date(task.snoozed_until).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            )
          </>
        ) : null}
      </p>
      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="task_id" value={task.id} />
        {showActive ? (
          <>
            <Button
              type="submit"
              name="intent"
              value="done"
              size="sm"
              variant={markDoneVariant}
              disabled={pending}
            >
              Mark done
            </Button>
            <Button
              type="submit"
              name="intent"
              value="snooze"
              size="sm"
              variant="secondary"
              disabled={pending}
            >
              Snooze 7d
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </form>
      {state.error ? (
        <FieldError size="inline">{state.error}</FieldError>
      ) : null}
    </div>
  );
}
