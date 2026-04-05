'use client';

import { useActionState } from 'react';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

type SummaryKind = 'profile_brief' | 'next_meeting';

type Props = {
  personId: string;
  aiEnabled: boolean;
  action: (
    prev: AiMemoryActionResult,
    formData: FormData,
  ) => Promise<AiMemoryActionResult>;
  kind: SummaryKind;
};

const labels: Record<SummaryKind, { idle: string; pending: string }> = {
  profile_brief: {
    idle: 'Refresh profile brief',
    pending: 'Refreshing…',
  },
  next_meeting: {
    idle: 'Refresh next-meeting brief',
    pending: 'Refreshing…',
  },
};

export function SummaryRefreshForm({ personId, aiEnabled, action, kind }: Props) {
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});

  if (!aiEnabled) {
    return (
      <p className="text-xs text-muted">
        Add OPENAI_API_KEY to refresh this brief.
      </p>
    );
  }

  const copy = labels[kind];

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="person_id" value={personId} />
      <input type="hidden" name="kind" value={kind} />
      <Button type="submit" size="sm" variant="ghost" disabled={pending}>
        {pending ? copy.pending : copy.idle}
      </Button>
      {state.error ? <FieldError size="inline">{state.error}</FieldError> : null}
    </form>
  );
}
