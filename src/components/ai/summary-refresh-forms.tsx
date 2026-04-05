'use client';

import { useActionState } from 'react';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

type Props = {
  personId: string;
  aiEnabled: boolean;
  action: (
    prev: AiMemoryActionResult,
    formData: FormData,
  ) => Promise<AiMemoryActionResult>;
};

export function SummaryRefreshForms({ personId, aiEnabled, action }: Props) {
  const [pState, pAction, pPending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});
  const [nState, nAction, nPending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});

  if (!aiEnabled) {
    return (
      <p className="text-xs text-muted">
        Add OPENAI_API_KEY to refresh AI briefs.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <form action={pAction} className="flex flex-col gap-1">
        <input type="hidden" name="person_id" value={personId} />
        <input type="hidden" name="kind" value="profile_brief" />
        <Button type="submit" size="sm" variant="ghost" disabled={pPending || nPending}>
          {pPending ? 'Refreshing…' : 'Refresh profile brief'}
        </Button>
        {pState.error ? <FieldError size="inline">{pState.error}</FieldError> : null}
      </form>
      <form action={nAction} className="flex flex-col gap-1">
        <input type="hidden" name="person_id" value={personId} />
        <input type="hidden" name="kind" value="next_meeting" />
        <Button type="submit" size="sm" variant="ghost" disabled={pPending || nPending}>
          {nPending ? 'Refreshing…' : 'Refresh next-meeting brief'}
        </Button>
        {nState.error ? <FieldError size="inline">{nState.error}</FieldError> : null}
      </form>
    </div>
  );
}
