'use client';

import { useActionState } from 'react';
import {
  extractFactsForInteraction,
  suggestTasksForInteraction,
  type AiMemoryActionResult,
} from '@/lib/actions/ai-memory';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

type Props = {
  interactionId: string;
  aiEnabled: boolean;
};

export function InteractionAiToolbar({ interactionId, aiEnabled }: Props) {
  const [exState, exFormAction, exPending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(extractFactsForInteraction, {});
  const [tkState, tkFormAction, tkPending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(suggestTasksForInteraction, {});

  if (!aiEnabled) {
    return (
      <p className="max-w-sm text-right text-xs leading-relaxed text-muted">
        Add{' '}
        <span className="font-medium text-foreground/80">OPENAI_API_KEY</span>{' '}
        to enable fact and task suggestions.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:items-end">
      <form action={exFormAction} className="flex flex-col items-stretch gap-1 sm:items-end">
        <input type="hidden" name="interaction_id" value={interactionId} />
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
      <form action={tkFormAction} className="flex flex-col items-stretch gap-1 sm:items-end">
        <input type="hidden" name="interaction_id" value={interactionId} />
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
    </div>
  );
}
