'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PrivacyPolicyLightbox } from '@/components/app/privacy-policy-lightbox';

type PrivacyPolicyContextValue = {
  openPrivacyPolicy: () => void;
};

const PrivacyPolicyContext = createContext<PrivacyPolicyContextValue | null>(null);

export function usePrivacyPolicy(): PrivacyPolicyContextValue {
  const ctx = useContext(PrivacyPolicyContext);
  if (!ctx) {
    throw new Error('usePrivacyPolicy must be used within PrivacyPolicyProvider');
  }
  return ctx;
}

export function PrivacyPolicyProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPrivacyPolicy = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openPrivacyPolicy }), [openPrivacyPolicy]);

  return (
    <PrivacyPolicyContext.Provider value={value}>
      {children}
      <PrivacyPolicyLightbox open={open} onClose={onClose} />
    </PrivacyPolicyContext.Provider>
  );
}
