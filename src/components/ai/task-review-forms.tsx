'use client';

import { useActionState } from 'react';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory';
import type { Tables } from '@/lib/db/database.types';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
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
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});

  const snoozeExpired =
    task.status === 'snoozed' &&
    (!task.snoozed_until || new Date(task.snoozed_until) <= new Date());
  const showSuggested = task.status === 'suggested';
  const showActive = task.status === 'active' || snoozeExpired;

  return (
    <div className={listRowCardClassName('space-y-2')}>
      <p className="font-medium text-foreground">{task.title}</p>
      {task.description ? (
        <p className="text-sm leading-relaxed text-muted">{task.description}</p>
      ) : null}
      <p className="text-xs text-muted">
        Status: {task.status.replace('_', ' ')}
      </p>
      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="task_id" value={task.id} />
        {showSuggested ? (
          <>
            <Button type="submit" name="intent" value="activate" size="sm" variant="primary" disabled={pending}>
              Keep
            </Button>
            <Button type="submit" name="intent" value="snooze" size="sm" variant="secondary" disabled={pending}>
              Snooze 7d
            </Button>
            <Button type="submit" name="intent" value="dismiss" size="sm" variant="secondaryMuted" disabled={pending}>
              Dismiss
            </Button>
          </>
        ) : null}
        {showActive ? (
          <>
            <Button type="submit" name="intent" value="done" size="sm" variant="primary" disabled={pending}>
              Mark done
            </Button>
            <Button type="submit" name="intent" value="snooze" size="sm" variant="secondary" disabled={pending}>
              Snooze 7d
            </Button>
            <Button type="submit" name="intent" value="dismiss" size="sm" variant="secondaryMuted" disabled={pending}>
              Dismiss
            </Button>
          </>
        ) : null}
        <Button type="submit" name="intent" value="delete" size="sm" variant="ghostSubtle" disabled={pending}>
          Delete
        </Button>
      </form>
      {state.error ? <FieldError size="inline">{state.error}</FieldError> : null}
    </div>
  );
}
