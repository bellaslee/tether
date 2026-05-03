'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { quickLogInteractionsForPersonOnCalendarDates } from '@/lib/actions/interactions';
import { PersonQuickLogDayButton } from '@/components/people/person-quick-log-day-button';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

function dateToCalendarString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfLocalToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type PersonQuickLogDialogProps = {
  open: boolean;
  onClose: () => void;
  personId: string;
  sessionTimeZone: string | null;
};

export function PersonQuickLogDialog({
  open,
  onClose,
  personId,
  sessionTimeZone,
}: PersonQuickLogDialogProps) {
  const router = useRouter();
  const titleId = useId();
  const [selected, setSelected] = useState<Date[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    setSelected([startOfLocalToday()]);
  }, [open]);

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

  const onSave = useCallback(() => {
    const dates = selected ?? [];
    if (dates.length === 0) {
      setError('Select at least one date.');
      return;
    }
    setError(null);
    const calendarDates = dates.map(dateToCalendarString);
    const wallTimeZoneHint =
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : undefined;
    startTransition(async () => {
      const r = await quickLogInteractionsForPersonOnCalendarDates(
        personId,
        calendarDates,
        wallTimeZoneHint,
      );
      if (r.error) {
        setError(r.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }, [personId, router, selected, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const zoneLabel =
    sessionTimeZone?.trim() ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : null);

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
        className="card-surface max-h-[min(90dvh,36rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-display text-xl tracking-tight sm:text-2xl"
          >
            Quick Log
          </h2>
          <Button
            type="button"
            variant="ghostSubtle"
            size="sm"
            onClick={onClose}
            disabled={pending}
            className="shrink-0"
          >
            Close
          </Button>
        </div>
        <p className="mt-2 text-sm leading-7 text-muted">
          Each selected day is saved as a quick log at{' '}
          <span className="font-medium text-foreground">12:00</span>
          {zoneLabel ? (
            <>
              {' '}
              <span className="text-foreground/90">({zoneLabel})</span>
            </>
          ) : null}
          . Tap days to add or remove them.
        </p>
        <div className="mt-4 flex justify-center">
          <DayPicker
            mode="multiple"
            className="prm-quick-log-calendar"
            selected={selected}
            onSelect={setSelected}
            disabled={pending}
            components={{ DayButton: PersonQuickLogDayButton }}
          />
        </div>
        {error ? (
          <FieldError size="compact" className="mt-4">
            {error}
          </FieldError>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onSave}
            disabled={pending || (selected?.length ?? 0) === 0}
            aria-busy={pending}
          >
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
