import { DateTime } from "luxon";

function intlPartsToRecord(
  parts: Intl.DateTimeFormatPart[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      map[p.type] = p.value;
    }
  }
  return map;
}

/**
 * Format an instant for a `datetime-local` value in a specific IANA time zone
 * (not the host/server default).
 */
export function toDatetimeLocalInputValueInZone(
  date: Date,
  timeZone: string,
): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map = intlPartsToRecord(dtf.formatToParts(date));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

/**
 * `baseInstant` (default: now) as a `datetime-local` string in `timeZone`
 * (date and local wall-clock time). Used for new interaction defaults.
 */
export function toNewInteractionDatetimeLocalInputValueInZone(
  timeZone: string,
  baseInstant: Date = new Date(),
): string {
  return toDatetimeLocalInputValueInZone(baseInstant, timeZone);
}

/** `datetime-local` string (no offset) → UTC ISO, interpreted in `timeZone`. */
export function localWallTimeToUtcIso(
  naiveLocal: string,
  timeZone: string,
): string | null {
  const dt = DateTime.fromISO(naiveLocal, { zone: timeZone });
  if (!dt.isValid) {
    return null;
  }
  return dt.toUTC().toISO();
}

export function formatDateTimeInTimeZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString(undefined, {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateInTimeZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Calendar `YYYY-MM-DD` only (e.g. birthday): same civil date in every zone.
 */
export function formatCalendarDateOnly(isoDate: string): string {
  const day = isoDate.slice(0, 10);
  return new Date(`${day}T12:00:00.000Z`).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** @deprecated Host-local only; prefer {@link toDatetimeLocalInputValueInZone} on servers. */
export function toDatetimeLocalInputValue(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * @deprecated Host-local calendar day; prefer {@link toNewInteractionDatetimeLocalInputValueInZone}.
 */
export function toNewInteractionDatetimeLocalInputValue(
  baseDate: Date = new Date(),
) {
  const atNoon = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    12,
    0,
    0,
    0,
  );
  return toDatetimeLocalInputValue(atNoon);
}

/** First-of-month `YYYY-MM-DD` or ISO date string → e.g. "March 2024". */
export function formatMonthYear(isoDate: string): string {
  const day = isoDate.slice(0, 10);
  const [y, m] = day.split("-").map(Number);
  if (!y || !m) {
    return isoDate;
  }
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
