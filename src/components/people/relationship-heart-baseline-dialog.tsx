'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updatePersonRelationshipBaseline } from '@/lib/actions/people';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { RelationshipHeartBar } from '@/components/people/relationship-heart-bar';
import {
  formatHeartsForAria,
  HeartSlot,
  heartLevelAtIndex,
} from '@/components/people/relationship-heart-icons';
import {
  computeBondBaselineFilledHearts,
  computeRelationshipHearts,
  normalizeRelationshipHeartsBaselineHalves,
  RELATIONSHIP_MAX_HEARTS,
} from '@/lib/people/relationship-warmth';

const COPY = {
  dialogTitle: 'Connection baseline',
  body:
    'This sets the bond baseline for how close this connection feels to you. Moments you log and how recently you last connected still move the hearts around that baseline.',
  useAutomatic: 'Use automatic baseline',
  cancel: 'Close',
  editLabel: 'Edit connection baseline',
  saving: 'Saving…',
} as const;

type WarmthContext = {
  lastInteractionAt: string | null;
  metAt: string | null;
  createdAt: string;
  interactionCount: number;
  personCategoryName: string | null;
};

function baselinePreviewFilledHalves(params: {
  hoverHalves: number | null;
  storedHalves: number | null;
  bondBaselineHearts: number;
}): number {
  const { hoverHalves, storedHalves, bondBaselineHearts } = params;
  if (hoverHalves !== null) {
    return hoverHalves;
  }
  if (storedHalves !== null) {
    return storedHalves;
  }
  return Math.min(
    RELATIONSHIP_MAX_HEARTS * 2,
    Math.round(bondBaselineHearts * 2),
  );
}

function halfStepAriaLabel(halves: number): string {
  if (halves === 0) {
    return 'Set baseline to 0 hearts';
  }
  const filled = halves / 2;
  const whole = Math.floor(filled);
  const frac = filled - whole;
  if (frac >= 0.4 && frac <= 0.6) {
    return `Set baseline to ${whole} and a half hearts`;
  }
  if (Number.isInteger(filled)) {
    return `Set baseline to ${filled} hearts`;
  }
  return `Set baseline to ${filled} hearts`;
}

export function RelationshipHeartBaselineButton({
  personId,
  warmthContext,
  relationshipHeartsBaselineHalves,
}: {
  personId: string;
  warmthContext: WarmthContext;
  relationshipHeartsBaselineHalves: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverHalves, setHoverHalves] = useState<number | null>(null);

  const titleId = useId();
  const descId = useId();

  const storedNorm = useMemo(
    () =>
      normalizeRelationshipHeartsBaselineHalves(
        relationshipHeartsBaselineHalves,
      ),
    [relationshipHeartsBaselineHalves],
  );

  const bondBaselineHearts = useMemo(
    () =>
      computeBondBaselineFilledHearts({
        personCategoryName: warmthContext.personCategoryName,
        metAt: warmthContext.metAt,
        createdAt: warmthContext.createdAt,
      }),
    [
      warmthContext.createdAt,
      warmthContext.metAt,
      warmthContext.personCategoryName,
    ],
  );

  const previewHalves = useMemo(
    () =>
      baselinePreviewFilledHalves({
        hoverHalves,
        storedHalves: storedNorm,
        bondBaselineHearts,
      }),
    [bondBaselineHearts, hoverHalves, storedNorm],
  );

  const previewFilled = previewHalves / 2;

  const { filled: currentBarFilled } = useMemo(
    () =>
      computeRelationshipHearts({
        lastInteractionAt: warmthContext.lastInteractionAt,
        metAt: warmthContext.metAt,
        createdAt: warmthContext.createdAt,
        interactionCount: warmthContext.interactionCount,
        personCategoryName: warmthContext.personCategoryName,
        relationshipHeartsBaselineHalves: storedNorm,
      }),
    [
      warmthContext.createdAt,
      warmthContext.interactionCount,
      warmthContext.lastInteractionAt,
      warmthContext.metAt,
      warmthContext.personCategoryName,
      storedNorm,
    ],
  );

  const barSummary = formatHeartsForAria(
    currentBarFilled,
    RELATIONSHIP_MAX_HEARTS,
  );

  const previewCaption =
    hoverHalves !== null
      ? 'Preview'
      : storedNorm !== null
        ? 'Preview (saved baseline)'
        : 'Preview (automatic from category and time known)';

  const pickerLegendId = useId();
  const pickerInstructionId = useId();
  const pickerGroupRef = useRef<HTMLDivElement>(null);

  const clearHoverIfLeavingPicker = useCallback(
    (e: FocusEvent<HTMLButtonElement>) => {
      const next = e.relatedTarget;
      if (next instanceof Node && pickerGroupRef.current?.contains(next)) {
        return;
      }
      setHoverHalves(null);
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, pending]);

  useEffect(() => {
    if (!open) {
      setHoverHalves(null);
      setError(null);
    }
  }, [open]);

  const commitHalves = useCallback(
    async (halves: number | null) => {
      setPending(true);
      setError(null);
      try {
        const res = await updatePersonRelationshipBaseline(personId, halves);
        if (res.error) {
          setError(res.error);
          return;
        }
        router.refresh();
        setOpen(false);
      } finally {
        setPending(false);
      }
    },
    [personId, router],
  );

  const iconSize = 22;
  const gap = 'gap-1';

  return (
    <>
      <button
        type="button"
        aria-label={`${COPY.editLabel}. Currently ${barSummary}.`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="-m-1 inline-flex rounded-xl p-1 text-accent outline-offset-2 transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent/40"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden title={COPY.editLabel}>
          <RelationshipHeartBar
            presentational
            lastInteractionAt={warmthContext.lastInteractionAt}
            metAt={warmthContext.metAt}
            createdAt={warmthContext.createdAt}
            interactionCount={warmthContext.interactionCount}
            personCategoryName={warmthContext.personCategoryName}
            relationshipHeartsBaselineHalves={storedNorm}
          />
        </span>
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/35 p-4 backdrop-blur-[2px] sm:p-6"
              role="presentation"
              onClick={() => {
                if (!pending) {
                  setOpen(false);
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={`${descId} ${pickerInstructionId}`}
                className="card-surface w-full max-w-lg rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  id={titleId}
                  className="font-display text-xl tracking-tight sm:text-2xl"
                >
                  {COPY.dialogTitle}
                </h2>
                <p id={descId} className="mt-3 text-sm leading-7 text-muted">
                  {COPY.body}
                </p>

                <div className="mt-6 space-y-3">
                  <p id={pickerLegendId} className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {previewCaption}
                  </p>
                  <p id={pickerInstructionId} className="sr-only">
                    Choose baseline by moving across the hearts. Each heart has a
                    left and right half for half-heart steps. The slim control before
                    the row sets zero.
                  </p>
                  <div
                    ref={pickerGroupRef}
                    role="radiogroup"
                    aria-labelledby={pickerLegendId}
                    className={`flex items-end justify-center text-accent ${gap}`}
                    onMouseLeave={() => setHoverHalves(null)}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={storedNorm === 0}
                      aria-label={halfStepAriaLabel(0)}
                      disabled={pending}
                      className={
                        hoverHalves === 0
                          ? 'mb-0.5 flex h-[calc(1.375rem+2px)] w-2 shrink-0 rounded-md bg-accent/20 ring-2 ring-accent/40 ring-offset-1 ring-offset-background'
                          : 'mb-0.5 flex h-[calc(1.375rem+2px)] w-2 shrink-0 rounded-md hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/50'
                      }
                      onMouseEnter={() => setHoverHalves(0)}
                      onFocus={() => setHoverHalves(0)}
                      onBlur={clearHoverIfLeavingPicker}
                      onClick={() => void commitHalves(0)}
                    />
                    {Array.from({ length: RELATIONSHIP_MAX_HEARTS }, (_, k) => {
                      const leftHalves = k * 2 + 1;
                      const rightHalves = k * 2 + 2;
                      return (
                        <div
                          key={k}
                          className="relative shrink-0"
                          style={{
                            width: iconSize,
                            height: iconSize,
                          }}
                        >
                          <div className="pointer-events-none flex text-accent">
                            <HeartSlot
                              level={heartLevelAtIndex(k, previewFilled)}
                              iconSize={iconSize}
                            />
                          </div>
                          <div className="absolute inset-0 flex">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={storedNorm === leftHalves}
                              aria-label={halfStepAriaLabel(leftHalves)}
                              disabled={pending}
                              className={
                                hoverHalves === leftHalves
                                  ? 'h-full w-1/2 rounded-l-md bg-accent/20 ring-2 ring-inset ring-accent/45'
                                  : 'h-full w-1/2 rounded-l-md hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent/50'
                              }
                              onMouseEnter={() => setHoverHalves(leftHalves)}
                              onFocus={() => setHoverHalves(leftHalves)}
                              onBlur={clearHoverIfLeavingPicker}
                              onClick={() => void commitHalves(leftHalves)}
                            />
                            <button
                              type="button"
                              role="radio"
                              aria-checked={storedNorm === rightHalves}
                              aria-label={halfStepAriaLabel(rightHalves)}
                              disabled={pending}
                              className={
                                hoverHalves === rightHalves
                                  ? 'h-full w-1/2 rounded-r-md bg-accent/20 ring-2 ring-inset ring-accent/45'
                                  : 'h-full w-1/2 rounded-r-md hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent/50'
                              }
                              onMouseEnter={() => setHoverHalves(rightHalves)}
                              onFocus={() => setHoverHalves(rightHalves)}
                              onBlur={clearHoverIfLeavingPicker}
                              onClick={() => void commitHalves(rightHalves)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs leading-6 text-muted">
                    Move over the hearts to preview, then click a half-heart to save.
                    The slim mark before the row is zero.
                  </p>
                </div>

                {error ? (
                  <div className="mt-4">
                    <FieldError size="inline">{error}</FieldError>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled={pending}
                    className="text-left text-sm font-semibold text-muted underline underline-offset-4 hover:text-foreground disabled:opacity-60"
                    onClick={() => void commitHalves(null)}
                  >
                    {pending ? COPY.saving : COPY.useAutomatic}
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={pending}
                    onClick={() => setOpen(false)}
                  >
                    {COPY.cancel}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
