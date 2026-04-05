'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  runMemorySuggestForInteraction,
  type AiMemoryActionResult,
} from '@/lib/actions/ai-memory';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

const initial: AiMemoryActionResult = {};

export type InteractionMemorySuggestButtonProps = {
  interactionId: string;
};

export function InteractionMemorySuggestButton({
  interactionId,
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
      {state.error ? (
        <FieldError size="compact">{state.error}</FieldError>
      ) : null}
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? 'Suggesting…' : 'Suggest facts & follow-ups'}
      </Button>
    </form>
  );
}
