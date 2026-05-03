'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PersonQuickLogDialog } from '@/components/people/person-quick-log-dialog';

type PersonQuickLogContextValue = {
  openQuickLog: () => void;
};

const PersonQuickLogContext =
  createContext<PersonQuickLogContextValue | null>(null);

export function PersonQuickLogProvider({
  personId,
  sessionTimeZone,
  children,
}: {
  personId: string;
  sessionTimeZone: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openQuickLog = useCallback(() => setOpen(true), []);
  const closeQuickLog = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      openQuickLog,
    }),
    [openQuickLog],
  );

  return (
    <PersonQuickLogContext.Provider value={value}>
      {children}
      <PersonQuickLogDialog
        open={open}
        onClose={closeQuickLog}
        personId={personId}
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
