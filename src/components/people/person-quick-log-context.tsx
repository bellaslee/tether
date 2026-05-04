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
import { PersonQuickLogDialog } from '@/components/people/person-quick-log-dialog';
import type { QuickLogSnapshot } from '@/components/people/person-quick-log-types';
import type { PersonOption } from '@/components/people/interaction-participant-picker';

export type PersonQuickLogContextValue = {
  openQuickLog: () => void;
  openQuickLogWithPreset: (preset: QuickLogPresetCardModel) => void;
  openEditPreset: (preset: QuickLogPresetCardModel) => void;
};

const PersonQuickLogContext =
  createContext<PersonQuickLogContextValue | null>(null);

export function PersonQuickLogProvider({
  defaultPrimaryPersonId,
  sessionTimeZone,
  allPeople,
  interactionTypes,
  defaultInteractionTypeId,
  children,
}: {
  defaultPrimaryPersonId: string | null;
  sessionTimeZone: string | null;
  allPeople: PersonOption[];
  interactionTypes: InteractionTypeOption[];
  defaultInteractionTypeId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<QuickLogSnapshot | null>(null);
  const nonceRef = useRef(0);

  const closeQuickLog = useCallback(() => {
    setOpen(false);
    setSnapshot(null);
  }, []);

  const openQuickLog = useCallback(() => {
    nonceRef.current += 1;
    setSnapshot({
      nonce: nonceRef.current,
      mode: 'log',
      editingPresetId: null,
      primaryPersonId: defaultPrimaryPersonId ?? '',
      attendeeIds: [],
      interactionTypeId: defaultInteractionTypeId,
      interactionTitle: QUICK_LOG_TITLE,
      presetLabel: '',
    });
    setOpen(true);
  }, [defaultPrimaryPersonId, defaultInteractionTypeId]);

  const openQuickLogWithPreset = useCallback(
    (preset: QuickLogPresetCardModel) => {
      nonceRef.current += 1;
      setSnapshot({
        nonce: nonceRef.current,
        mode: 'log',
        editingPresetId: null,
        primaryPersonId: preset.primary_person_id,
        attendeeIds: [...preset.attendee_person_ids],
        interactionTypeId: preset.interaction_type_id,
        interactionTitle: preset.interaction_title || QUICK_LOG_TITLE,
        presetLabel: '',
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
      primaryPersonId: preset.primary_person_id,
      attendeeIds: [...preset.attendee_person_ids],
      interactionTypeId: preset.interaction_type_id,
      interactionTitle: preset.interaction_title || QUICK_LOG_TITLE,
      presetLabel: preset.label,
    });
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      openQuickLog,
      openQuickLogWithPreset,
      openEditPreset,
    }),
    [openQuickLog, openQuickLogWithPreset, openEditPreset],
  );

  return (
    <PersonQuickLogContext.Provider value={value}>
      {children}
      <PersonQuickLogDialog
        open={open}
        onClose={closeQuickLog}
        snapshot={open ? snapshot : null}
        allPeople={allPeople}
        interactionTypes={interactionTypes}
        defaultInteractionTypeId={defaultInteractionTypeId}
        sessionTimeZone={sessionTimeZone}
      />
    </PersonQuickLogContext.Provider>
  );
}

export function usePersonQuickLog(): PersonQuickLogContextValue {
  const ctx = useContext(PersonQuickLogContext);
  if (!ctx) {
    throw new Error(
      'usePersonQuickLog must be used within PersonQuickLogProvider',
    );
  }
  return ctx;
}
