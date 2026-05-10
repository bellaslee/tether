/**
 * Shared Tailwind for native form controls (input, select, textarea).
 * Use {@link FormInput}, {@link FormTextarea}, or `className={formControlClassName(...)}`
 * on `<select>`; prefer `Picklist` for styled selects with a consistent chevron.
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
  'min-w-0 max-w-full border border-border-soft text-base text-foreground outline-none ring-accent/30 transition placeholder:text-muted focus:ring-2 sm:text-sm';

const BASE_TEMPORAL =
  'max-w-full border border-border-soft text-base text-foreground outline-none ring-accent/30 transition placeholder:text-muted focus:ring-2 sm:text-sm';

const SIZE_MAP: Record<FormControlSize, string> = {
  default: 'w-full rounded-2xl bg-surface px-4 py-3',
  compact: 'w-full rounded-xl bg-surface-strong px-3 py-2',
  dense: 'min-w-0 max-w-full flex-1 rounded-2xl bg-surface px-4 py-2.5',
};

/** Horizontal padding leaves room for the custom chevron in `Picklist`. */
const PICKLIST_SIZE_MAP: Record<FormControlSize, string> = {
  default: 'w-full rounded-2xl bg-surface py-3 pl-4',
  compact: 'w-full rounded-xl bg-surface-strong py-2 pl-3',
  dense:
    'min-w-0 max-w-full flex-1 rounded-2xl bg-surface py-2.5 pl-4',
};

const SIZE_MAP_TEMPORAL_DENSE =
  'w-full max-w-full flex-1 rounded-2xl bg-surface px-4 py-2.5';

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

export function picklistControlClassName(options?: {
  size?: FormControlSize;
  className?: string;
}): string {
  const { size = 'default', className = '' } = options ?? {};
  const sizeCls = PICKLIST_SIZE_MAP[size];
  return [sizeCls, BASE, className].filter(Boolean).join(' ');
}
