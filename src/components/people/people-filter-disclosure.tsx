'use client';

import { type ReactNode, useState } from 'react';

type Props = {
  initialOpen: boolean;
  labelId: string;
  label: string;
  children: ReactNode;
};

export function PeopleFilterDisclosure(props: Props) {
  const { initialOpen, labelId, label, children } = props;
  const [open, setOpen] = useState(initialOpen);

  return (
    <details
      className="group m-0 min-w-0 space-y-2 p-0"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 marker:hidden p-0 outline-none ring-accent/30 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
        <span
          id={labelId}
          className="text-xs font-semibold uppercase tracking-wide text-muted leading-none"
        >
          {label}
        </span>
        <span
          className="inline-flex shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div role="group" aria-labelledby={labelId}>
        {children}
      </div>
    </details>
  );
}
