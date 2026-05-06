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
import { createInteractionsForCalendarSelection } from '@/lib/actions/interactions';
import { QUICK_LOG_TITLE } from '@/lib/interactions/quick-log-shared';
import {
  createQuickLogPreset,
  deleteQuickLogPreset,
  updateQuickLogPreset,
} from '@/lib/actions/quick-log-presets';
import { PersonQuickLogDayButton } from '@/components/people/person-quick-log-day-button';
import {
  InteractionParticipantPicker,
  type PersonOption,
} from '@/components/people/interaction-participant-picker';
import {
  resolveInteractionTypeIdForSave,
  type InteractionTypeOption,
} from '@/lib/interactions/type-options';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';
import { Picklist } from '@/components/ui/picklist';
import { TextField } from '@/components/ui/text-field';
import { formControlClassName } from '@/components/ui/form-control-classes';

export type LogInteractionModalSnapshot = {
  nonce: number;
  mode: 'log' | 'editPreset';
  editingPresetId: string | null;
  primaryPersonId: string;
  attendeeIds: string[];
  interactionTypeId: string;
  interactionTitle: string;
  timeLocal: string;
};

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

function formatNowHm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export type PersonLogInteractionDialogProps = {
  open: boolean;
  onClose: () => void;
  snapshot: LogInteractionModalSnapshot | null;
  allPeople: PersonOption[];
  interactionTypes: InteractionTypeOption[];
  sessionTimeZone: string | null;
  allowMissingPrimaryPerson: boolean;
  fixedPrimaryPersonId?: string;
};

export function PersonLogInteractionDialog({
  open,
  onClose,
  snapshot,
  allPeople,
  interactionTypes,
  sessionTimeZone,
  allowMissingPrimaryPerson,
  fixedPrimaryPersonId,
}: PersonLogInteractionDialogProps) {
  if (!open || !snapshot) {
    return null;
  }

  return (
    <PersonLogInteractionDialogInner
      key={snapshot.nonce}
      snapshot={snapshot}
      onClose={onClose}
      allPeople={allPeople}
      interactionTypes={interactionTypes}
      sessionTimeZone={sessionTimeZone}
      allowMissingPrimaryPerson={allowMissingPrimaryPerson}
      fixedPrimaryPersonId={fixedPrimaryPersonId}
    />
  );
}

function PersonLogInteractionDialogInner({
  snapshot,
  onClose,
  allPeople,
  interactionTypes,
  sessionTimeZone,
  allowMissingPrimaryPerson,
  fixedPrimaryPersonId,
}: Omit<PersonLogInteractionDialogProps, 'open' | 'snapshot'> & {
  snapshot: LogInteractionModalSnapshot;
}) {
  const router = useRouter();
  const titleId = useId();
  const typeFieldId = useId();
  const titleFieldId = useId();
  const timeFieldId = useId();
  const noteId = useId();

  const [timeLocal, setTimeLocal] = useState(snapshot.timeLocal);
  const [primaryPersonId, setPrimaryPersonId] = useState(
    snapshot.primaryPersonId,
  );
  const [attendeeIds, setAttendeeIds] = useState<string[]>(() => [
    ...snapshot.attendeeIds,
  ]);

  const resolvedSnapTypeId = useMemo(() => {
    const fromSnap = snapshot.interactionTypeId;
    if (fromSnap && interactionTypes.some((t) => t.id === fromSnap)) {
      return fromSnap;
    }
    return '';
  }, [snapshot.interactionTypeId, interactionTypes]);

  const [interactionTypeId, setInteractionTypeId] = useState(resolvedSnapTypeId);
  const [interactionTitle, setInteractionTitle] = useState(
    snapshot.interactionTitle,
  );
  const [selected, setSelected] = useState<Date[] | undefined>(() =>
    snapshot.mode === 'log' ? [startOfLocalToday()] : undefined,
  );
  const [rawNote, setRawNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);
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

  const resolvedTypeForSave = useCallback(() => {
    return resolveInteractionTypeIdForSave(interactionTypeId, interactionTypes);
  }, [interactionTypeId, interactionTypes]);

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
    const typeIdResolved = resolvedTypeForSave();
    if (!typeIdResolved) {
      setError('Add at least one interaction type in settings.');
      return;
    }

    setError(null);
    const calendarDates = dates.map(dateToCalendarString);
    const noteTrimmed = rawNote.trim();
    startTransition(async () => {
      const r = await createInteractionsForCalendarSelection(
        primaryTrim,
        calendarDates,
        {
          interactionTypeId: typeIdResolved,
          attendeeIds,
          title: interactionTitle,
          rawNote: noteTrimmed.length > 0 ? noteTrimmed : null,
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
    interactionTitle,
    rawNote,
    wallTimeZoneHint,
    timeLocal,
    resolvedTypeForSave,
    onClose,
    router,
  ]);

  const onSavePresetUpdate = useCallback(() => {
    if (!snapshot.editingPresetId) {
      return;
    }
    const primaryTrim = primaryPersonId.trim();
    if (!primaryTrim && attendeeIds.length === 0) {
      setError('Include at least one person in this preset.');
      return;
    }
    const typeIdResolved = resolvedTypeForSave();
    if (!typeIdResolved) {
      setError('Add at least one interaction type in settings.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const r = await updateQuickLogPreset(snapshot.editingPresetId!, {
        primaryPersonId: primaryTrim,
        interactionTypeId: typeIdResolved,
        interactionTitle,
        attendeeIds,
        timeLocal,
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
    primaryPersonId,
    interactionTitle,
    attendeeIds,
    timeLocal,
    resolvedTypeForSave,
    onClose,
    router,
  ]);

  const onSaveNewPreset = useCallback(() => {
    const primaryTrim = primaryPersonId.trim();
    if (!primaryTrim && attendeeIds.length === 0) {
      setError('Include at least one person in this preset.');
      return;
    }
    const typeIdResolved = resolvedTypeForSave();
    if (!typeIdResolved) {
      setError('Add at least one interaction type in settings.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const r = await createQuickLogPreset({
        primaryPersonId: primaryTrim,
        interactionTypeId: typeIdResolved,
        interactionTitle,
        attendeeIds,
        timeLocal,
      });
      if (r.error) {
        setError(r.error);
      } else {
        router.refresh();
      }
    });
  }, [
    primaryPersonId,
    interactionTitle,
    attendeeIds,
    timeLocal,
    resolvedTypeForSave,
    router,
  ]);

  const onDeletePreset = useCallback(() => {
    if (!snapshot.editingPresetId) {
      return;
    }
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Delete this preset?')
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
        className="card-surface max-h-[min(90dvh,48rem)] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-display text-2xl tracking-tight"
          >
            {isEditPreset ? 'Edit preset' : 'Log an interaction'}
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
            Saved to their timeline and yours. Add anyone else under{' '}
            <span className="font-medium text-foreground">People</span> so one
            entry stays in sync for everyone.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-7 text-muted">
            Update who is included, the type, time, and title. This does not
            create timeline entries.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {!isEditPreset ? (
            <>
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
              <p className="text-xs leading-6 text-muted">
                Each selected day uses the time below in{' '}
                {zoneLabel ? (
                  <span className="font-medium text-foreground/90">
                    {zoneLabel}
                  </span>
                ) : (
                  'your local zone'
                )}
                . Tap days to add or remove them.
              </p>
            </>
          ) : null}

          <div className="space-y-2">
            <label htmlFor={timeFieldId} className="text-sm font-semibold">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={typeFieldId} className="text-sm font-semibold">
                Type
              </label>
              <Picklist
                id={typeFieldId}
                value={interactionTypeId}
                onChange={(e) => setInteractionTypeId(e.target.value)}
                disabled={pending}
              >
                <option value="">—</option>
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
              value={interactionTitle}
              onChange={(e) => setInteractionTitle(e.target.value)}
              placeholder={QUICK_LOG_TITLE}
              disabled={pending}
              autoComplete="off"
            />
          </div>

          <div>
            <p className="text-sm font-semibold">People</p>
            <div className="mt-2">
              <InteractionParticipantPicker
                key={`${snapshot.nonce}-${fixedPrimaryPersonId ?? 'free'}`}
                people={allPeople}
                fixedPrimaryId={fixedPrimaryPersonId}
                initialPrimaryId={snapshot.primaryPersonId}
                initialAttendeeIds={snapshot.attendeeIds}
                autoRevealList
                formIntegration={false}
                onSelectionChange={onPeopleChange}
              />
            </div>
          </div>

          {!isEditPreset ? (
            <div className="space-y-2">
              {!noteExpanded ? (
                <Button
                  type="button"
                  variant="ghostSubtle"
                  size="sm"
                  disabled={pending}
                  onClick={() => setNoteExpanded(true)}
                  className="px-0"
                >
                  Add note
                </Button>
              ) : (
                <>
                  <label htmlFor={noteId} className="text-sm font-semibold">
                    Note
                  </label>
                  <FormTextarea
                    id={noteId}
                    value={rawNote}
                    onChange={(e) => setRawNote(e.target.value)}
                    rows={4}
                    resize="y"
                    disabled={pending}
                  />
                </>
              )}
            </div>
          ) : null}
        </div>

        {error ? (
          <FieldError size="compact" className="mt-4">
            {error}
          </FieldError>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {isEditPreset ? (
            <Button
              type="button"
              variant="ghostSubtle"
              onClick={onDeletePreset}
              disabled={pending}
              className="mr-auto"
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
          {!isEditPreset ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={onSaveNewPreset}
            >
              Save preset
            </Button>
          ) : null}
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
              disabled={
                pending || ((selected?.length ?? 0) === 0 && !isEditPreset)
              }
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

export function buildOpenLogSnapshot(
  nonce: number,
  defaultPrimaryPersonId: string | null,
): LogInteractionModalSnapshot {
  return {
    nonce,
    mode: 'log',
    editingPresetId: null,
    primaryPersonId: defaultPrimaryPersonId ?? '',
    attendeeIds: [],
    interactionTypeId: '',
    interactionTitle: '',
    timeLocal: formatNowHm(),
  };
}
