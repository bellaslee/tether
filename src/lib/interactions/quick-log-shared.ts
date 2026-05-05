export const QUICK_LOG_TITLE = 'Quick log';

const MAX_QUICK_LOG_TITLE_LEN = 500;

export type QuickLogCalendarOptions = {
  interactionTypeId: string;
  /** Additional people on each logged interaction (excluding primary). */
  attendeeIds?: string[];
  /** Trimmed; empty uses {@link QUICK_LOG_TITLE}. */
  title?: string | null;
  wallTimeZoneHint?: string;
  /** Local wall time per selected calendar day, `HH:MM` (24h). Default 12:00. */
  timeLocal?: string;
};

const QUICK_LOG_TIME_DEFAULT = '12:00';

export function resolveQuickLogTimeLocal(raw: string | null | undefined): string {
  const t = String(raw ?? '').trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) {
    return QUICK_LOG_TIME_DEFAULT;
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return QUICK_LOG_TIME_DEFAULT;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function resolveQuickLogInteractionTitle(
  raw: string | null | undefined,
): string {
  const t = String(raw ?? '').trim();
  if (!t) {
    return QUICK_LOG_TITLE;
  }
  if (t.length > MAX_QUICK_LOG_TITLE_LEN) {
    return t.slice(0, MAX_QUICK_LOG_TITLE_LEN);
  }
  return t;
}
