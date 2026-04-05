import type { ReactNode } from 'react';
import { SettingsSubnav } from '@/components/app/settings-subnav';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-border-soft bg-surface-strong/50">
        <div className="mx-auto w-full max-w-2xl px-6 pt-8 sm:px-10 lg:px-12">
          <SettingsSubnav />
        </div>
      </div>
      {children}
    </>
  );
}
