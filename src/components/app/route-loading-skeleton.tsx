import type { ReactNode } from 'react';

/** Shared pulse block for route-level loading UIs. */
export function RouteLoadingPulse({
  className = '',
  ...rest
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-foreground/10 ${className}`}
      aria-hidden
      {...rest}
    />
  );
}

export function RouteLoadingMain({
  children,
  className = '',
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <main
      className={className}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {children}
    </main>
  );
}

/** Matches typical page hero: title line, optional primary action. */
export function RouteLoadingHero({
  withPrimaryAction,
}: {
  withPrimaryAction?: boolean;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <RouteLoadingPulse className="h-10 w-full max-w-sm" />
      </div>
      {withPrimaryAction ? (
        <RouteLoadingPulse className="h-11 w-36 shrink-0 rounded-xl" />
      ) : null}
    </header>
  );
}

export function RouteLoadingCard({
  className = '',
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
