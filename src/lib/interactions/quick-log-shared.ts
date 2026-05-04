export const QUICK_LOG_TITLE = 'Quick log';

const MAX_QUICK_LOG_TITLE_LEN = 500;

export type QuickLogCalendarOptions = {
  interactionTypeId: string;
  /** Additional people on each logged interaction (excluding primary). */
  attendeeIds?: string[];
  /** Trimmed; empty uses {@link QUICK_LOG_TITLE}. */
  title?: string | null;
  wallTimeZoneHint?: string;
};

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
