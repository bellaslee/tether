import type { HTMLAttributes, LiHTMLAttributes } from 'react';

const BASE =
  'rounded-2xl border border-border-soft bg-white/60 px-4 py-3';

export function listRowCardClassName(className?: string): string {
  return [BASE, className].filter(Boolean).join(' ');
}

export function ListRowCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={listRowCardClassName(className)} {...props} />;
}

export function ListRowCardLi({
  className,
  ...props
}: LiHTMLAttributes<HTMLLIElement>) {
  return <li className={listRowCardClassName(className)} {...props} />;
}
