'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { QUICK_LOG_TITLE } from '@/lib/interactions/quick-log-shared';
import type { QuickLogPresetCardModel } from '@/lib/quick-log/preset-card-model';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import {
  PersonLogInteractionDialog,
  buildOpenLogSnapshot,
  type LogInteractionModalSnapshot,
} from '@/components/people/person-log-interaction-dialog';
import type { PersonOption } from '@/components/people/interaction-participant-picker';
import { Button } from '@/components/ui/button';

type PersonLogInteractionContextValue = {
  /** True whenever the unified log modal is open (log or preset edit). */
  logInteractionModalOpen: boolean;
  openLogInteraction: () => void;
  closeLogInteraction: () => void;
  openLogWithPreset: (preset: QuickLogPresetCardModel) => void;
  openEditPreset: (preset: QuickLogPresetCardModel) => void;
};

const PersonLogInteractionContext =
  createContext<PersonLogInteractionContextValue | null>(null);

export function PersonLogInteractionProvider({
  children,
  defaultPrimaryPersonId,
  sessionTimeZone,
  allPeople,
  interactionTypes,
  fixedPrimaryPersonId,
}: {
  defaultPrimaryPersonId: string | null;
  sessionTimeZone: string | null;
  allPeople: PersonOption[];
  interactionTypes: InteractionTypeOption[];
  /** When set, the main person in the picker is locked (person detail route). */
  fixedPrimaryPersonId?: string;
  children: ReactNode;
}) {
  const allowMissingPrimaryPerson = fixedPrimaryPersonId == null;

  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] =
    useState<LogInteractionModalSnapshot | null>(null);
  const nonceRef = useRef(0);

  const closeLogInteraction = useCallback(() => {
    setOpen(false);
    setSnapshot(null);
  }, []);

  const openLogInteraction = useCallback(() => {
    nonceRef.current += 1;
    setSnapshot(buildOpenLogSnapshot(nonceRef.current, defaultPrimaryPersonId));
    setOpen(true);
  }, [defaultPrimaryPersonId]);

  const openLogWithPreset = useCallback(
    (preset: QuickLogPresetCardModel) => {
      nonceRef.current += 1;
      setSnapshot({
        nonce: nonceRef.current,
        mode: 'log',
        editingPresetId: null,
        primaryPersonId: preset.primary_person_id ?? '',
        attendeeIds: [...preset.attendee_person_ids],
        interactionTypeId: preset.interaction_type_id,
        interactionTitle: preset.interaction_title || '',
        timeLocal: preset.time_local,
      });
      setOpen(true);
    },
    [],
  );

  const openEditPreset = useCallback((preset: QuickLogPresetCardModel) => {
    nonceRef.current += 1;
    setSnapshot({
      nonce: nonceRef.current,
      mode: 'editPreset',
      editingPresetId: preset.id,
      primaryPersonId: preset.primary_person_id ?? '',
      attendeeIds: [...preset.attendee_person_ids],
      interactionTypeId: preset.interaction_type_id,
      interactionTitle: preset.interaction_title || QUICK_LOG_TITLE,
      timeLocal: preset.time_local,
    });
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      logInteractionModalOpen: open && snapshot != null,
      openLogInteraction,
      closeLogInteraction,
      openLogWithPreset,
      openEditPreset,
    }),
    [
      open,
      snapshot,
      openLogInteraction,
      closeLogInteraction,
      openLogWithPreset,
      openEditPreset,
    ],
  );

  return (
    <PersonLogInteractionContext.Provider value={value}>
      {children}
      <PersonLogInteractionDialog
        open={open}
        onClose={closeLogInteraction}
        snapshot={open ? snapshot : null}
        allPeople={allPeople}
        interactionTypes={interactionTypes}
        sessionTimeZone={sessionTimeZone}
        allowMissingPrimaryPerson={allowMissingPrimaryPerson}
        fixedPrimaryPersonId={fixedPrimaryPersonId}
      />
    </PersonLogInteractionContext.Provider>
  );
}

export function usePersonLogInteraction(): PersonLogInteractionContextValue {
  const ctx = useContext(PersonLogInteractionContext);
  if (!ctx) {
    throw new Error(
      'usePersonLogInteraction must be used within PersonLogInteractionProvider',
    );
  }
  return ctx;
}

/** Primary action beside the sticky header timeline shortcut. */
export function TimelineLogInteractionPrimaryButton({
  className = '',
}: {
  className?: string;
}) {
  const { openLogInteraction } = usePersonLogInteraction();
  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      onClick={openLogInteraction}
      className={className}
      aria-haspopup="dialog"
    >
      Log interaction
    </Button>
  );
}

/** Low-key control inside the timeline section on person detail. */
export function TimelineLogInteractionTrigger({
  className = '',
}: {
  className?: string;
}) {
  const { openLogInteraction } = usePersonLogInteraction();
  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      onClick={openLogInteraction}
      className={className}
      aria-haspopup="dialog"
    >
      Log interaction
    </Button>
  );
}
