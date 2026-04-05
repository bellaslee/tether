import type { ReactNode } from 'react';
import { SettingsSubnav } from '@/components/app/settings-subnav';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-[100] w-full border-b border-border-soft bg-surface-strong/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-2xl px-6 pt-8 sm:px-10 lg:px-12">
          <SettingsSubnav />
        </div>
      </div>
      {children}
    </>
  );
}
