'use client';

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

export type ConfirmLightboxProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, the confirm control uses destructive styling. */
  destructive?: boolean;
  /** Shown under the description (e.g. after a failed request). */
  error?: ReactNode;
  /**
   * Return `false` to keep the dialog open (e.g. after a failed request).
   * Void and other returns close the dialog after the handler finishes.
   */
  onConfirm: () => void | Promise<void | false>;
};

export function ConfirmLightbox({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Remove',
  cancelLabel = 'Cancel',
  destructive = true,
  error,
  onConfirm,
}: ConfirmLightboxProps) {
  const titleId = useId();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, pending]);

  const handleConfirm = useCallback(async () => {
    setPending(true);
    try {
      const out = await onConfirm();
      if (out !== false) {
        onClose();
      }
    } finally {
      setPending(false);
    }
  }, [onConfirm, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/35 p-4 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onClick={() => {
        if (!pending) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-surface w-full max-w-md rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="font-display text-xl tracking-tight sm:text-2xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending}
            onClick={() => void handleConfirm()}
            className={
              destructive
                ? 'border-red-300/60 text-red-900 hover:bg-red-50/90'
                : undefined
            }
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
