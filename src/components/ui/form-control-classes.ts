/**
 * Shared Tailwind for native form controls (input, select, textarea).
 * Use {@link FormInput}, {@link FormTextarea}, or `className={formControlClassName(...)}`
 * on `<select>` instead of copying these strings.
 */
export type FormControlSize = 'default' | 'compact' | 'dense';

const TEMPORAL_INPUT_TYPES = new Set([
  'date',
  'month',
  'datetime-local',
  'time',
  'week',
]);

/** Safari: temporal inputs use inline-flex internals; `min-w-0` lets them shrink and hides pickers. */
export function isTemporalFormInputType(type: string | undefined): boolean {
  return type != null && TEMPORAL_INPUT_TYPES.has(type);
}

const BASE =
  'min-w-0 max-w-full border border-border-soft text-sm outline-none ring-accent/30 transition focus:ring-2';

const BASE_TEMPORAL =
  'max-w-full border border-border-soft text-sm outline-none ring-accent/30 transition focus:ring-2';

const SIZE_MAP: Record<FormControlSize, string> = {
  default: 'w-full rounded-2xl bg-white/80 px-4 py-3',
  compact: 'w-full rounded-xl bg-white/90 px-3 py-2',
  dense: 'min-w-0 max-w-full flex-1 rounded-2xl bg-white/80 px-4 py-2.5',
};

const SIZE_MAP_TEMPORAL_DENSE =
  'w-full max-w-full flex-1 rounded-2xl bg-white/80 px-4 py-2.5';

export function formControlClassName(options?: {
  size?: FormControlSize;
  resize?: 'y' | 'none';
  className?: string;
  /** Use for `date` / `month` / `datetime-local` / `time` / `week` so Safari keeps native pickers visible. */
  temporal?: boolean;
}): string {
  const { size = 'default', resize, className = '', temporal = false } =
    options ?? {};
  const resizeCls = resize === 'y' ? 'resize-y' : '';
  const sizeCls =
    temporal && size === 'dense' ? SIZE_MAP_TEMPORAL_DENSE : SIZE_MAP[size];
  const base = temporal ? BASE_TEMPORAL : BASE;
  return [sizeCls, base, resizeCls, className].filter(Boolean).join(' ');
}
