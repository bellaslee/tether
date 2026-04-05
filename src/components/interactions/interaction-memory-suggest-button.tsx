'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { runMemorySuggestForInteraction } from '@/lib/actions/ai-memory/extract-suggest';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory/types';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

const initial: AiMemoryActionResult = {};

export type InteractionMemorySuggestButtonProps = {
  interactionId: string;
  /** When true, the control is non-interactive and shows the “already suggested” label. */
  alreadySuggested?: boolean;
};

export function InteractionMemorySuggestButton({
  interactionId,
  alreadySuggested = false,
}: InteractionMemorySuggestButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    runMemorySuggestForInteraction,
    initial,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex w-full flex-col items-stretch gap-2 sm:items-end">
      <input type="hidden" name="interaction_id" value={interactionId} />
      {state.error && !alreadySuggested ? (
        <FieldError size="compact">{state.error}</FieldError>
      ) : null}
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        disabled={pending || alreadySuggested}
      >
        {pending
          ? 'Suggesting…'
          : alreadySuggested
            ? 'Facts & follow-ups already suggested'
            : 'Suggest facts & follow-ups'}
      </Button>
    </form>
  );
}
