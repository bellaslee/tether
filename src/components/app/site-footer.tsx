'use client';

import { usePrivacyPolicy } from '@/components/app/privacy-policy-context';

export function SiteFooter() {
  const { openPrivacyPolicy } = usePrivacyPolicy();

  return (
    <footer className="mt-auto border-t border-border-soft bg-surface-strong/40 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 text-sm text-muted sm:px-10 lg:px-12">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={openPrivacyPolicy}
          className="cursor-pointer font-semibold text-foreground underline-offset-4 hover:underline"
        >
          Privacy Policy
        </button>
      </div>
    </footer>
  );
}
