'use client';

import { useActionState } from 'react';
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

export function FactReviewForms({ fact, action }: Props) {
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});

  const statusLabel =
    fact.review_status === 'candidate'
      ? 'Candidate'
      : fact.review_status === 'accepted'
        ? 'Accepted'
        : 'Dismissed';

  return (
    <div className={listRowCardClassName('space-y-3')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {statusLabel}
        </span>
      </div>
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="fact_id" value={fact.id} />
        <FormTextarea
          name="body"
          rows={3}
          defaultValue={fact.body}
          fieldSize="compact"
          aria-label="Fact text"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="intent" value="save" size="sm" variant="secondary" disabled={pending}>
            Save edit
          </Button>
          <Button type="submit" name="intent" value="accept" size="sm" variant="primary" disabled={pending}>
            Accept
          </Button>
          <Button type="submit" name="intent" value="dismiss" size="sm" variant="secondaryMuted" disabled={pending}>
            Dismiss
          </Button>
          <Button type="submit" name="intent" value="delete" size="sm" variant="ghostSubtle" disabled={pending}>
            Delete
          </Button>
        </div>
        {state.error ? <FieldError size="inline">{state.error}</FieldError> : null}
      </form>
    </div>
  );
}
