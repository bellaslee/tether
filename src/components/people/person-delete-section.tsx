'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { deletePerson } from '@/lib/actions/people';
import { Button } from '@/components/ui/button';
import { ConfirmLightbox } from '@/components/ui/confirm-lightbox';

type PersonDeleteSectionProps = {
  personId: string;
  personLabel: string;
};

export function PersonDeleteSection({
  personId,
  personLabel,
}: PersonDeleteSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = useCallback(async () => {
    setError(null);
    const result = await deletePerson(personId);
    if (result.error) {
      setError(result.error);
      return false;
    }
    router.push('/people');
    router.refresh();
  }, [personId, router]);

  return (
    <section
      className="rounded-2xl border border-border-soft bg-surface/70 p-5 sm:p-6"
      aria-labelledby="person-delete-heading"
    >
      <h2
        id="person-delete-heading"
        className="font-display text-lg tracking-tight text-foreground"
      >
        Remove from your circle
      </h2>
      <p className="mt-2 text-sm leading-7 text-muted">
        If you no longer want {personLabel} in Tether, you can remove them here.
        This deletes their profile details, contact methods, saved facts and
        briefs, reminders, and how they link to other people for you. Shared
        interactions stay on your timeline; they will just no longer include this
        person.
      </p>
      <div className="mt-4">
        <Button
          type="button"
          variant="ghostSubtle"
          size="sm"
          className="!px-0 text-red-900 hover:text-red-950"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          Remove {personLabel}
        </Button>
      </div>
      <ConfirmLightbox
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        title={`Remove ${personLabel}?`}
        description="This cannot be undone. Anything stored only for them in Tether will be deleted."
        confirmLabel="Remove person"
        cancelLabel="Keep them"
        error={error}
        onConfirm={onConfirm}
      />
    </section>
  );
}
