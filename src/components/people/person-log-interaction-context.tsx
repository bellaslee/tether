'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';

type PersonLogInteractionContextValue = {
  logOpen: boolean;
  openLogInteraction: () => void;
  closeLogInteraction: () => void;
};

const PersonLogInteractionContext =
  createContext<PersonLogInteractionContextValue | null>(null);

export function PersonLogInteractionProvider({ children }: { children: ReactNode }) {
  const [logOpen, setLogOpen] = useState(false);
  const openLogInteraction = useCallback(() => {
    setLogOpen(true);
  }, []);
  const closeLogInteraction = useCallback(() => {
    setLogOpen(false);
  }, []);
  const value = useMemo(
    () => ({
      logOpen,
      openLogInteraction,
      closeLogInteraction,
    }),
    [logOpen, openLogInteraction, closeLogInteraction],
  );
  return (
    <PersonLogInteractionContext.Provider value={value}>
      {children}
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

/** Low-key control that opens the same log panel as the sticky header action. */
export function TimelineLogInteractionTrigger({
  className = '',
}: {
  className?: string;
}) {
  const { openLogInteraction } = usePersonLogInteraction();
  return (
    <Button
      type="button"
      variant="ghostSubtle"
      size="chip"
      onClick={openLogInteraction}
      className={className}
    >
      Log interaction
    </Button>
  );
}
