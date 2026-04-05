'use client';

import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

type PrivacyPolicyLightboxProps = {
  open: boolean;
  onClose: () => void;
};

export function PrivacyPolicyLightbox({ open, onClose }: PrivacyPolicyLightboxProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/35 p-4 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-surface max-h-[min(90dvh,48rem)] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-border-soft p-6 shadow-[var(--shadow)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Tether</p>
            <h2 id={titleId} className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
              Privacy Policy
            </h2>
            <p className="mt-2 text-sm text-muted">Last updated: April 5, 2026</p>
          </div>
          <Button
            type="button"
            variant="ghostSubtle"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          >
            Close
          </Button>
        </div>

        <div className="mt-8 space-y-8">
          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">Overview</h3>
            <p className="text-sm leading-7 text-muted">
              Tether is a personal relationship memory tool. This policy describes what information
              the service processes, why we process it, and the choices you have. If anything here
              conflicts with a separate agreement you accepted (for example with your host or
              employer), that agreement may govern instead where the law allows.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">What we collect</h3>
            <ul className="list-inside list-disc space-y-2 text-sm leading-7 text-muted">
              <li>
                <span className="text-foreground/90">Account information.</span> Email address and
                authentication data needed to sign you in and secure your account.
              </li>
              <li>
                <span className="text-foreground/90">Content you add.</span> Names, notes,
                interactions, reminders, and other relationship information you choose to store in
                the product.
              </li>
              <li>
                <span className="text-foreground/90">Technical data.</span> Basic logs and metadata
                needed to run the app, fix errors, and protect against abuse (for example request
                timestamps, IP addresses in rate limiting, and diagnostic events tied to your
                account where applicable).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">How we use information</h3>
            <p className="text-sm leading-7 text-muted">
              We use the data above to provide Tether: authenticate you, store and display your
              notes, sync across devices, and improve reliability and security. We do not sell your
              personal information. We do not use your private notes to train public models for third
              parties.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">AI features</h3>
            <p className="text-sm leading-7 text-muted">
              Personally identifiable information is never passed to AI providers. Text-based
              features—such as fact extraction, summaries, and similar memory workflows—only send
              interaction note contents, the facts you have saved in the product, and reminders.
              Structured profile or directory data (for example names, emails, or phone numbers from
              your people records) is not included in those requests.
            </p>
            <p className="text-sm leading-7 text-muted">
              If you use optional voice transcription, only the audio you record for that action is
              sent to the provider so it can be turned into text; it is not bundled with your CRM
              profile or people directory. Those requests are made to deliver the feature you
              triggered, not for unrelated advertising. You should avoid entering information you
              are not comfortable sharing with the AI provider under their terms.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">Where data is stored</h3>
            <p className="text-sm leading-7 text-muted">
              Tether is built on Supabase (hosted PostgreSQL, authentication, and related
              infrastructure). Your primary data lives in databases and systems operated under
              Supabase and your deployment configuration. AI providers process inputs only when you
              use features that call them.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">Retention and deletion</h3>
            <p className="text-sm leading-7 text-muted">
              We keep your information while your account is active and as needed to provide the
              service, comply with law, and resolve disputes. You can delete content you control
              inside the product where those controls exist; account deletion may be offered through
              your administrator or support depending on deployment.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">Your choices</h3>
            <p className="text-sm leading-7 text-muted">
              You can review and update much of your information in the app. You may opt out of
              optional AI-powered workflows by not using those features. For privacy requests
              specific to your deployment, contact whoever operates your instance of Tether.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">Changes</h3>
            <p className="text-sm leading-7 text-muted">
              We may update this policy from time to time. When we do, we will revise the date
              shown here. Continued use of the service after changes means you accept the updated
              policy, except where the law requires additional steps.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-xl text-foreground">Contact</h3>
            <p className="text-sm leading-7 text-muted">
              Questions about this policy should go to the person or team operating this Tether
              deployment. If you are using a self-hosted or organization-managed instance, they are
              the data controller for your use of the product.
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
