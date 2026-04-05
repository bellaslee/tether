/**
 * Shared Tailwind for native form controls (input, select, textarea).
 * Use {@link FormInput}, {@link FormTextarea}, or `className={formControlClassName(...)}`
 * on `<select>` instead of copying these strings.
 */
export type FormControlSize = 'default' | 'compact' | 'dense';

const BASE =
  'border border-border-soft text-sm outline-none ring-accent/30 transition focus:ring-2';

const SIZE_MAP: Record<FormControlSize, string> = {
  default: 'w-full rounded-2xl bg-white/80 px-4 py-3',
  compact: 'w-full rounded-xl bg-white/90 px-3 py-2',
  dense: 'min-w-0 flex-1 rounded-2xl bg-white/80 px-4 py-2.5',
};

export function formControlClassName(options?: {
  size?: FormControlSize;
  resize?: 'y' | 'none';
  className?: string;
}): string {
  const { size = 'default', resize, className = '' } = options ?? {};
  const resizeCls = resize === 'y' ? 'resize-y' : '';
  return [SIZE_MAP[size], BASE, resizeCls, className].filter(Boolean).join(' ');
}
