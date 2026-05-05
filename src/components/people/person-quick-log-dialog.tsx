'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { quickLogInteractionsForPersonOnCalendarDates } from '@/lib/actions/interactions';
import { QUICK_LOG_TITLE } from '@/lib/interactions/quick-log-shared';
import {
  createQuickLogPreset,
  deleteQuickLogPreset,
  updateQuickLogPreset,
} from '@/lib/actions/quick-log-presets';
import { PersonQuickLogDayButton } from '@/components/people/person-quick-log-day-button';
import type { QuickLogSnapshot } from '@/components/people/person-quick-log-types';
import { InteractionParticipantPicker } from '@/components/people/interaction-participant-picker';
import type { PersonOption } from '@/components/people/interaction-participant-picker';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { FormInput } from '@/components/ui/form-input';
import { Picklist } from '@/components/ui/picklist';
import { TextField } from '@/components/ui/text-field';
import { formControlClassName } from '@/components/ui/form-control-classes';

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
  snapshot: QuickLogSnapshot | null;
  allPeople: PersonOption[];
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
  sessionTimeZone: string | null;
  /** When true (global timeline), main person is optional if at least one person is included. */
  allowMissingPrimaryPerson: boolean;
};

export function PersonQuickLogDialog({
  open,
  onClose,
  snapshot,
  allPeople,
  interactionTypes,
  defaultInteractionTypeId,
  sessionTimeZone,
  allowMissingPrimaryPerson,
}: PersonQuickLogDialogProps) {
  if (!open || !snapshot) {
    return null;
  }

  return (
    <PersonQuickLogDialogInner
      key={snapshot.nonce}
      snapshot={snapshot}
      onClose={onClose}
      allPeople={allPeople}
      interactionTypes={interactionTypes}
      defaultInteractionTypeId={defaultInteractionTypeId}
      sessionTimeZone={sessionTimeZone}
      allowMissingPrimaryPerson={allowMissingPrimaryPerson}
    />
  );
}

function PersonQuickLogDialogInner({
  snapshot,
  onClose,
  allPeople,
  interactionTypes,
  defaultInteractionTypeId,
  sessionTimeZone,
  allowMissingPrimaryPerson,
}: Omit<PersonQuickLogDialogProps, 'open' | 'snapshot'> & {
  snapshot: QuickLogSnapshot;
}) {
  const router = useRouter();
  const titleId = useId();
  const typeFieldId = useId();
  const titleFieldId = useId();
  const presetLabelFieldId = useId();
  const newPresetLabelFieldId = useId();
  const timeFieldId = useId();

  const [timeLocal, setTimeLocal] = useState('12:00');

  const [primaryPersonId, setPrimaryPersonId] = useState(
    snapshot.primaryPersonId,
  );
  const [attendeeIds, setAttendeeIds] = useState<string[]>(() => [
    ...snapshot.attendeeIds,
  ]);

  const resolvedDefaultType = useMemo(() => {
    const fromSnap = snapshot.interactionTypeId;
    if (interactionTypes.some((t) => t.id === fromSnap)) {
      return fromSnap;
    }
    return defaultInteractionTypeId;
  }, [
    snapshot.interactionTypeId,
    interactionTypes,
    defaultInteractionTypeId,
  ]);

  const [interactionTypeId, setInteractionTypeId] = useState(resolvedDefaultType);
  const [interactionTitle, setInteractionTitle] = useState(
    snapshot.interactionTitle || QUICK_LOG_TITLE,
  );
  const [presetLabel, setPresetLabel] = useState(snapshot.presetLabel);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [selected, setSelected] = useState<Date[] | undefined>(() => [
    startOfLocalToday(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setError(null);
  }, [snapshot.nonce]);

  useEffect(() => {
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
  }, [onClose, pending]);

  const onPeopleChange = useCallback(
    (v: { primaryPersonId: string; attendeeIds: string[] }) => {
      setPrimaryPersonId(v.primaryPersonId);
      setAttendeeIds(v.attendeeIds);
    },
    [],
  );

  const wallTimeZoneHint =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;

  const onSaveLog = useCallback(() => {
    const primaryTrim = primaryPersonId.trim();
    if (!allowMissingPrimaryPerson && !primaryTrim) {
      setError('Choose who this moment is mainly about.');
      return;
    }
    if (
      allowMissingPrimaryPerson &&
      !primaryTrim &&
      attendeeIds.length === 0
    ) {
      setError('Include at least one person.');
      return;
    }
    const dates = selected ?? [];
    if (dates.length === 0) {
      setError('Select at least one date.');
      return;
    }
    setError(null);
    const calendarDates = dates.map(dateToCalendarString);
    startTransition(async () => {
      const r = await quickLogInteractionsForPersonOnCalendarDates(
        primaryTrim,
        calendarDates,
        {
          interactionTypeId,
          attendeeIds,
          title: interactionTitle,
          wallTimeZoneHint,
          timeLocal,
        },
      );
      if (r.error) {
        setError(r.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }, [
    primaryPersonId,
    allowMissingPrimaryPerson,
    attendeeIds,
    selected,
    interactionTypeId,
    interactionTitle,
    wallTimeZoneHint,
    timeLocal,
    onClose,
    router,
  ]);

  const onSavePresetUpdate = useCallback(() => {
    if (!snapshot.editingPresetId) {
      return;
    }
    if (!primaryPersonId.trim()) {
      setError(
        'Presets need a main person. Mark someone as main, or create this preset from a person’s profile.',
      );
      return;
    }
    const label = presetLabel.trim();
    if (!label) {
      setError('Enter a name for this preset.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await updateQuickLogPreset(snapshot.editingPresetId!, {
        label,
        primaryPersonId,
        interactionTypeId,
        interactionTitle,
        attendeeIds,
      });
      if (r.error) {
        setError(r.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }, [
    snapshot.editingPresetId,
    presetLabel,
    primaryPersonId,
    interactionTypeId,
    interactionTitle,
    attendeeIds,
    onClose,
    router,
  ]);

  const onSaveNewPreset = useCallback(() => {
    if (!primaryPersonId.trim()) {
      setError(
        'Presets need a main person. Mark someone as main, or create this preset from a person’s profile.',
      );
      return;
    }
    const label = newPresetLabel.trim();
    if (!label) {
      setError('Enter a name for the new preset.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await createQuickLogPreset({
        label,
        primaryPersonId,
        interactionTypeId,
        interactionTitle,
        attendeeIds,
      });
      if (r.error) {
        setError(r.error);
      } else {
        setNewPresetLabel('');
        router.refresh();
      }
    });
  }, [
    primaryPersonId,
    newPresetLabel,
    interactionTypeId,
    interactionTitle,
    attendeeIds,
    router,
  ]);

  const onDeletePreset = useCallback(() => {
    if (!snapshot.editingPresetId) {
      return;
    }
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Delete this quick log preset?')
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await deleteQuickLogPreset(snapshot.editingPresetId!);
      if (r.error) {
        setError(r.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }, [snapshot.editingPresetId, onClose, router]);

  const zoneLabel =
    sessionTimeZone?.trim() ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : null);

  if (typeof document === 'undefined') {
    return null;
  }

  const isEditPreset = snapshot.mode === 'editPreset';

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
        className="card-surface max-h-[min(92dvh,44rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-display text-xl tracking-tight sm:text-2xl"
          >
            {isEditPreset ? 'Edit quick log preset' : 'Quick Log'}
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

        {!isEditPreset ? (
          <p className="mt-2 text-sm leading-7 text-muted">
            Each selected day uses the time below in{' '}
            {zoneLabel ? (
              <span className="font-medium text-foreground/90">{zoneLabel}</span>
            ) : (
              'your local zone'
            )}
            . Tap days to add or remove them.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-7 text-muted">
            Update who is included, the type, and the title. This does not create
            timeline entries.
          </p>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-semibold">People</p>
            <p className="mt-1 text-xs text-muted">
              {allowMissingPrimaryPerson
                ? 'Mark who was there. Main is optional from this page; include at least one person. Use “Mark as main” when you want a primary contact on each entry.'
                : 'Mark who was there. Use “Mark as main” for the primary person on each entry.'}
            </p>
            <div className="mt-2">
              <InteractionParticipantPicker
                people={allPeople}
                initialPrimaryId={primaryPersonId}
                initialAttendeeIds={attendeeIds}
                autoRevealList
                formIntegration={false}
                onSelectionChange={onPeopleChange}
              />
            </div>
          </div>

          {isEditPreset ? (
            <TextField
              id={presetLabelFieldId}
              label="Preset name"
              value={presetLabel}
              onChange={(e) => setPresetLabel(e.target.value)}
              disabled={pending}
              autoComplete="off"
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor={typeFieldId}
                className="text-sm font-semibold"
              >
                Type
              </label>
              <Picklist
                id={typeFieldId}
                value={interactionTypeId}
                onChange={(e) => setInteractionTypeId(e.target.value)}
                disabled={pending}
                required
              >
                {interactionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Picklist>
            </div>
            <TextField
              id={titleFieldId}
              label="Title"
              hint="Shown on each timeline entry."
              value={interactionTitle}
              onChange={(e) => setInteractionTitle(e.target.value)}
              placeholder={QUICK_LOG_TITLE}
              disabled={pending}
              autoComplete="off"
            />
          </div>

          {!isEditPreset ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <label
                    htmlFor={timeFieldId}
                    className="text-sm font-semibold"
                  >
                    Time
                  </label>
                  <FormInput
                    id={timeFieldId}
                    type="time"
                    value={timeLocal}
                    onChange={(e) => setTimeLocal(e.target.value)}
                    disabled={pending}
                    className={formControlClassName({ size: 'default' })}
                  />
                  <p className="text-xs text-muted">
                    Defaults to noon (12:00). Applies to every selected day.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <DayPicker
                  mode="multiple"
                  className="prm-quick-log-calendar"
                  selected={selected}
                  onSelect={setSelected}
                  disabled={pending}
                  components={{ DayButton: PersonQuickLogDayButton }}
                />
              </div>

              <div className="rounded-2xl border border-border-soft bg-white/50 p-4 space-y-3">
                <p className="text-sm font-semibold">Save as preset</p>
                <p className="text-xs text-muted">
                  Save this combination of people, type, and title for one-tap
                  reuse from your timelines.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={newPresetLabelFieldId}
                      className="sr-only"
                    >
                      New preset name
                    </label>
                    <FormInput
                      id={newPresetLabelFieldId}
                      type="text"
                      value={newPresetLabel}
                      onChange={(e) => setNewPresetLabel(e.target.value)}
                      placeholder="e.g. Weekly walk with Sam"
                      disabled={pending}
                      className={formControlClassName({ size: 'default' })}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={onSaveNewPreset}
                  >
                    Save preset
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {error ? (
          <FieldError size="compact" className="mt-4">
            {error}
          </FieldError>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {isEditPreset ? (
            <Button
              type="button"
              variant="ghostSubtle"
              onClick={onDeletePreset}
              disabled={pending}
            >
              Delete preset
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          {isEditPreset ? (
            <Button
              type="button"
              variant="primary"
              onClick={onSavePresetUpdate}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Saving…' : 'Update preset'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={onSaveLog}
              disabled={pending || (selected?.length ?? 0) === 0}
              aria-busy={pending}
            >
              {pending ? 'Saving…' : 'Save to timeline'}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
