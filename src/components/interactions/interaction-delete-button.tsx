"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteInteraction } from "@/lib/actions/interactions";

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
      <button
        type="button"
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
        className="text-xs font-semibold text-muted underline-offset-4 transition hover:text-red-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Removing…" : label}
      </button>
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
