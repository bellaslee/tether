'use client';

import { useActionState } from 'react';
import {
  extractFactsFromPersonRecentNotes,
  suggestTasksFromPersonRecentNotes,
  type AiMemoryActionResult,
} from '@/lib/actions/ai-memory';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

type BaseProps = {
  personId: string;
  aiEnabled: boolean;
  hasRecentNotes: boolean;
};

const notesHint = (
  <p className="max-w-[14rem] text-xs leading-relaxed text-muted">
    Uses up to five most recent timeline notes that include this person (newest
    first).
  </p>
);

export function SuggestFactsControl({
  personId,
  aiEnabled,
  hasRecentNotes,
}: BaseProps) {
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(extractFactsFromPersonRecentNotes, {});

  if (!aiEnabled) {
    return (
      <div className="flex flex-col items-end gap-2 text-right">
        <p className="max-w-[14rem] text-xs leading-relaxed text-muted">
          Add{' '}
          <span className="font-medium text-foreground/80">OPENAI_API_KEY</span>{' '}
          to suggest facts from notes.
        </p>
      </div>
    );
  }

  if (!hasRecentNotes) {
    return (
      <div className="flex flex-col items-end gap-2 text-right">
        <p className="max-w-[14rem] text-xs leading-relaxed text-muted">
          Log a timeline interaction with a note to suggest facts from recent
          notes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <form action={formAction} className="flex flex-col items-end gap-1">
        <input type="hidden" name="person_id" value={personId} />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? 'Suggesting…' : 'Suggest facts'}
        </Button>
        {state.error ? (
          <FieldError size="inline">{state.error}</FieldError>
        ) : null}
      </form>
      {notesHint}
    </div>
  );
}

export function SuggestFollowUpsControl({
  personId,
  aiEnabled,
  hasRecentNotes,
}: BaseProps) {
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(suggestTasksFromPersonRecentNotes, {});

  if (!aiEnabled) {
    return (
      <div className="flex flex-col items-end gap-2 text-right">
        <p className="max-w-[14rem] text-xs leading-relaxed text-muted">
          Add{' '}
          <span className="font-medium text-foreground/80">OPENAI_API_KEY</span>{' '}
          to suggest follow-ups from notes.
        </p>
      </div>
    );
  }

  if (!hasRecentNotes) {
    return (
      <div className="flex flex-col items-end gap-2 text-right">
        <p className="max-w-[14rem] text-xs leading-relaxed text-muted">
          Log a timeline interaction with a note to suggest follow-ups from
          recent notes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <form action={formAction} className="flex flex-col items-end gap-1">
        <input type="hidden" name="person_id" value={personId} />
        <Button
          type="submit"
          size="sm"
          variant="secondaryMuted"
          disabled={pending}
        >
          {pending ? 'Suggesting…' : 'Suggest follow-ups'}
        </Button>
        {state.error ? (
          <FieldError size="inline">{state.error}</FieldError>
        ) : null}
      </form>
    </div>
  );
}
