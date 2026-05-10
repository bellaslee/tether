'use client';

import { usePrivacyPolicy } from '@/components/app/privacy-policy-context';

export function SiteFooter() {
  const { openPrivacyPolicy } = usePrivacyPolicy();

  return (
    <footer className="site-footer-shell mt-auto border-t border-accent-sun/30 bg-surface-strong/40">
      <div className="shell-gutter-x mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
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
