"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteInteraction } from "@/lib/actions/interactions";
import { Button } from "@/components/ui/button";

type InteractionDeleteButtonProps = {
  interactionId: string;
  label?: string;
};

export function InteractionDeleteButton({ interactionId, label = "Remove" }: InteractionDeleteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="dangerLink"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await deleteInteraction(interactionId);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Removing…" : label}
      </Button>
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
