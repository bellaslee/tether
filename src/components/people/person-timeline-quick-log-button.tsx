'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { quickLogInteractionForPerson } from '@/lib/actions/interactions';
import { Button } from '@/components/ui/button';

export function PersonTimelineQuickLogButton({ personId }: { personId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const r = await quickLogInteractionForPerson(personId);
      if (r.error) {
        setError(r.error);
      } else {
        router.refresh();
      }
    });
  }, [personId, router]);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghostSubtle"
        size="chip"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? 'Saving…' : 'Quick log'}
      </Button>
      {error ? (
        <p className="max-w-[14rem] text-right text-xs text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
