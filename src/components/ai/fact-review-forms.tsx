'use client';

import { useActionState, useState } from 'react';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory';
import type { Tables } from '@/lib/db/database.types';
import { Button } from '@/components/ui/button';
import { FormTextarea } from '@/components/ui/form-textarea';
import { FieldError } from '@/components/ui/field-error';
import { listRowCardClassName } from '@/components/ui/list-row-card';

type FactRow = Tables<'facts'>;

type Props = {
  fact: FactRow;
  action: (
    prev: AiMemoryActionResult,
    formData: FormData,
  ) => Promise<AiMemoryActionResult>;
};

function formatFactCreatedLine(iso: string) {
  const d = new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Added ${d}`;
}

export function FactReviewForms({ fact, action }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});

  const isAccepted = fact.review_status === 'accepted';
  const isCandidate = fact.review_status === 'candidate';

  const headerPrimary = isAccepted
    ? formatFactCreatedLine(fact.created_at)
    : isCandidate
      ? 'Candidate'
      : 'Dismissed';

  const headerClassName = isAccepted
    ? 'text-xs text-muted'
    : 'text-xs font-semibold uppercase tracking-wide text-muted';

  const textareaKey = `${fact.id}-${fact.updated_at}`;

  if (isAccepted && !isEditing) {
    return (
      <div className={listRowCardClassName('space-y-3')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={headerClassName}>{headerPrimary}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
          {fact.body}
        </p>
      </div>
    );
  }

  return (
    <div className={listRowCardClassName('space-y-3')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={headerClassName}>{headerPrimary}</span>
      </div>
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="fact_id" value={fact.id} />
        <FormTextarea
          key={textareaKey}
          name="body"
          rows={3}
          defaultValue={fact.body}
          fieldSize="compact"
          aria-label="Fact text"
        />
        <div className="flex flex-wrap gap-2">
          {isCandidate ? (
            <>
              <Button
                type="submit"
                name="intent"
                value="accept"
                size="sm"
                variant="primary"
                disabled={pending}
              >
                Accept
              </Button>
              <Button
                type="submit"
                name="intent"
                value="delete"
                size="sm"
                variant="ghostSubtle"
                disabled={pending}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                name="intent"
                value="save"
                size="sm"
                variant="secondary"
                disabled={pending}
              >
                Save
              </Button>
              <Button
                type="submit"
                name="intent"
                value="delete"
                size="sm"
                variant="ghostSubtle"
                disabled={pending}
              >
                Delete
              </Button>
            </>
          )}
        </div>
        {state.error ? (
          <FieldError size="inline">{state.error}</FieldError>
        ) : null}
      </form>
    </div>
  );
}
