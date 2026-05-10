import type { ReactNode } from 'react';
import { SettingsSubnav } from '@/components/app/settings-subnav';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-[100] w-full border-b border-border-soft bg-surface-strong/95 backdrop-blur-md">
        <div className="prm-shell-gutter-x mx-auto w-full max-w-2xl pt-8">
          <SettingsSubnav />
        </div>
      </div>
      {children}
    </>
  );
}
