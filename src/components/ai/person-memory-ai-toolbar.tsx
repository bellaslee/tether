'use client';

import { useActionState } from 'react';
import {
  extractFactsFromPersonRecentNotes,
  suggestTasksFromPersonRecentNotes,
  type AiMemoryActionResult,
} from '@/lib/actions/ai-memory';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

type Props = {
  personId: string;
  aiEnabled: boolean;
  hasRecentNotes: boolean;
};

export function PersonMemoryAiToolbar({
  personId,
  aiEnabled,
  hasRecentNotes,
}: Props) {
  const [exState, exFormAction, exPending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(extractFactsFromPersonRecentNotes, {});
  const [tkState, tkFormAction, tkPending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(suggestTasksFromPersonRecentNotes, {});

  if (!aiEnabled) {
    return (
      <p className="max-w-2xl text-sm leading-7 text-muted">
        Add{' '}
        <span className="font-medium text-foreground/80">OPENAI_API_KEY</span>{' '}
        to suggest facts and follow-ups from your notes.
      </p>
    );
  }

  if (!hasRecentNotes) {
    return (
      <p className="max-w-2xl text-sm leading-7 text-muted">
        Log a timeline interaction with a note to suggest facts and follow-ups
        from your most recent notes.
      </p>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
      <form
        action={exFormAction}
        className="flex flex-col gap-1 sm:min-w-[10rem]"
      >
        <input type="hidden" name="person_id" value={personId} />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={exPending || tkPending}
        >
          {exPending ? 'Suggesting…' : 'Suggest facts'}
        </Button>
        {exState.error ? (
          <FieldError size="inline">{exState.error}</FieldError>
        ) : null}
      </form>
      <form
        action={tkFormAction}
        className="flex flex-col gap-1 sm:min-w-[10rem]"
      >
        <input type="hidden" name="person_id" value={personId} />
        <Button
          type="submit"
          size="sm"
          variant="secondaryMuted"
          disabled={exPending || tkPending}
        >
          {tkPending ? 'Suggesting…' : 'Suggest follow-ups'}
        </Button>
        {tkState.error ? (
          <FieldError size="inline">{tkState.error}</FieldError>
        ) : null}
      </form>
      <p className="w-full text-xs leading-relaxed text-muted sm:pl-0">
        Uses up to five most recent timeline notes that include this person
        (newest first).
      </p>
    </div>
  );
}
