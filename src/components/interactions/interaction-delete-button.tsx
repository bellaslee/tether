'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteInteraction } from '@/lib/actions/interactions';
import { Button } from '@/components/ui/button';
import { ConfirmLightbox } from '@/components/ui/confirm-lightbox';

type InteractionDeleteButtonProps = {
  interactionId: string;
  label?: string;
};

export function InteractionDeleteButton({
  interactionId,
  label = 'Remove',
}: InteractionDeleteButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="dangerLink"
        size="sm"
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        {label}
      </Button>
      <ConfirmLightbox
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        title="Remove this from the timeline?"
        description="This interaction will be deleted for everyone it was shared with. This can't be undone."
        confirmLabel="Remove"
        error={error}
        onConfirm={async () => {
          const result = await deleteInteraction(interactionId);
          if (result.error) {
            setError(result.error);
            return false;
          }
          router.refresh();
        }}
      />
    </div>
  );
}
