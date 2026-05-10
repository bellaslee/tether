import Link from 'next/link';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentProps,
} from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'secondaryMuted'
  | 'ghost'
  | 'ghostSubtle'
  | 'ghostPill'
  | 'link'
  | 'dangerLink';

export type ButtonSize = 'chip' | 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center shrink-0 transition-[color,transform,box-shadow] duration-200 ease-out';

/** Lift + warm shadow on hover (pill controls) — kept subtle. */
const HOVER_LIFT_PILL =
  'hover:-translate-y-px hover:shadow-[var(--shadow-lift)] disabled:hover:translate-y-0 disabled:hover:shadow-none';

/** Barely-there lift for text-style controls. */
const HOVER_LIFT_TEXT =
  'hover:-translate-y-[0.5px] disabled:hover:translate-y-0';

const PILL_SIZES: Record<ButtonSize, string> = {
  chip: 'px-3 py-1 text-xs',
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

const TEXT_SIZES: Record<ButtonSize, string> = {
  chip: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
};

export function buttonClassName(options: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
  } = options;
  const pill = PILL_SIZES[size];
  const text = TEXT_SIZES[size];

  const variants: Record<ButtonVariant, string> = {
    primary: [
      'rounded-full bg-accent font-semibold !text-white hover:!text-white focus-visible:!text-white',
      HOVER_LIFT_PILL,
      'disabled:opacity-60',
      pill,
    ].join(' '),
    secondary: [
      'rounded-full border border-border-soft bg-surface font-semibold text-foreground',
      HOVER_LIFT_PILL,
      'enabled:hover:bg-surface-strong disabled:opacity-50',
      pill,
    ].join(' '),
    secondaryMuted: [
      'rounded-full border border-border-soft bg-surface/80 font-semibold text-foreground',
      HOVER_LIFT_PILL,
      'hover:bg-surface-strong disabled:opacity-50',
      pill,
    ].join(' '),
    ghost: [
      'font-semibold text-muted underline-offset-4',
      HOVER_LIFT_TEXT,
      'hover:underline disabled:opacity-50',
      text,
    ].join(' '),
    ghostSubtle: [
      'font-semibold text-muted underline-offset-4',
      HOVER_LIFT_TEXT,
      'hover:text-foreground hover:underline disabled:opacity-50',
      text,
    ].join(' '),
    ghostPill: [
      'rounded-full border border-transparent font-semibold text-muted',
      HOVER_LIFT_PILL,
      'enabled:hover:text-foreground disabled:opacity-60',
      pill,
    ].join(' '),
    link: [
      'font-semibold text-accent underline-offset-4',
      HOVER_LIFT_TEXT,
      'hover:underline disabled:opacity-50',
      text,
    ].join(' '),
    dangerLink: [
      'font-semibold text-muted underline-offset-4',
      HOVER_LIFT_TEXT,
      'hover:text-red-700 hover:underline disabled:opacity-50 dark:hover:text-red-300',
      text,
    ].join(' '),
  };

  return [BASE, variants[variant], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ');
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      className,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName({ variant, size, fullWidth, className })}
        {...props}
      />
    );
  },
);

export type ButtonLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
