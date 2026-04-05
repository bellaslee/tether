import type { HTMLAttributes, ReactNode } from 'react';

export type FieldErrorSize = 'default' | 'compact' | 'inline' | 'textOnly';

const SIZE_CLASS: Record<
  Exclude<FieldErrorSize, 'textOnly'>,
  string
> = {
  default:
    'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900',
  compact:
    'rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900',
  inline:
    'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900',
};

export type FieldErrorProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Block callout (default) vs compact/inline for nested contexts. Use `textOnly` for simple red text. */
  size?: FieldErrorSize;
} & Omit<HTMLAttributes<HTMLParagraphElement>, 'children' | 'className'>;

export function FieldError({
  children,
  id,
  className = '',
  size = 'default',
  role = 'alert',
  ...rest
}: FieldErrorProps) {
  if (size === 'textOnly') {
    return (
      <p
        id={id}
        role={role}
        className={['text-sm text-red-800', className].filter(Boolean).join(' ')}
        {...rest}
      >
        {children}
      </p>
    );
  }

  const base = SIZE_CLASS[size];
  return (
    <p
      id={id}
      role={role}
      className={[base, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </p>
  );
}
