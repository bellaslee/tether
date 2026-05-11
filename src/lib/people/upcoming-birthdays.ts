import { DateTime } from 'luxon';

export type BirthdayPersonRow = {
  id: string;
  full_name: string;
  display_name: string | null;
  /** Calendar `YYYY-MM-DD` (year may be birth year; only month/day are used). */
  birthday: string;
};

export type BirthdayBucket = 'this_month' | 'next_month';

export type UpcomingBirthday = BirthdayPersonRow & {
  /** Days from `today` start-of-day to next birthday start-of-day in `timeZone`. */
  daysUntil: number;
  bucket: BirthdayBucket;
};

export type UpcomingBirthdaysThisAndNextMonthResult = {
  thisMonth: UpcomingBirthday[];
  nextMonth: UpcomingBirthday[];
};

const CAL_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Postgres / Supabase may return `date` as `YYYY-MM-DD` or timestamps as full ISO.
 * Calendar birthdays only use the civil date prefix.
 */
export function normalizeBirthdayToYmd(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const m = s.match(CAL_RE);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function parseMonthDay(
  birthday: string,
): { month: number; day: number } | null {
  const ymd = normalizeBirthdayToYmd(birthday);
  if (!ymd) return null;
  const [y, mo, d] = ymd.split('-');
  const month = Number(mo);
  const day = Number(d);
  if (
    !y ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { month, day };
}

/**
 * Next calendar occurrence of month/day in `timeZone`. Feb 29 clamps to Feb 28
 * when the target year is not a leap year.
 */
function nextOccurrenceOfMonthDay(
  month: number,
  day: number,
  todayStart: DateTime,
): DateTime {
  const zone = todayStart.zone;
  const tryDate = (year: number) =>
    DateTime.fromObject({ year, month, day }, { zone }).startOf('day');

  let candidate = tryDate(todayStart.year);
  if (!candidate.isValid) {
    candidate = DateTime.fromObject(
      { year: todayStart.year, month: 2, day: 28 },
      { zone },
    ).startOf('day');
  }
  if (candidate < todayStart) {
    candidate = tryDate(todayStart.year + 1);
    if (!candidate.isValid) {
      candidate = DateTime.fromObject(
        { year: todayStart.year + 1, month: 2, day: 28 },
        { zone },
      ).startOf('day');
    }
  }
  return candidate;
}

export type UpcomingBirthdaysThisAndNextMonthOptions = {
  /** IANA time zone for "today" and birthday wall dates. */
  timeZone: string;
  /** Override "now" for tests. */
  now?: DateTime;
  /** Max entries per bucket (safety cap). */
  maxPerBucket?: number;
};

const DEFAULT_MAX_PER_BUCKET = 32;

function sortBySoonest(a: UpcomingBirthday, b: UpcomingBirthday): number {
  if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
  return a.id.localeCompare(b.id);
}

/**
 * Upcoming birthdays whose next occurrence falls in the **current** calendar
 * month (from today through end of month) or the **following** calendar month.
 */
export function upcomingBirthdaysThisAndNextMonth(
  rows: BirthdayPersonRow[],
  options: UpcomingBirthdaysThisAndNextMonthOptions,
): UpcomingBirthdaysThisAndNextMonthResult {
  const zone = options.timeZone;
  const todayStart = (options.now ?? DateTime.now().setZone(zone)).startOf(
    'day',
  );
  const maxPer = options.maxPerBucket ?? DEFAULT_MAX_PER_BUCKET;

  const endThisMonth = todayStart.endOf('month').startOf('day');
  const startNextMonth = todayStart.plus({ months: 1 }).startOf('month');
  const endNextMonth = todayStart.plus({ months: 1 }).endOf('month').startOf('day');

  const thisMonth: UpcomingBirthday[] = [];
  const nextMonth: UpcomingBirthday[] = [];

  for (const row of rows) {
    const md = parseMonthDay(row.birthday);
    if (!md) continue;
    const next = nextOccurrenceOfMonthDay(md.month, md.day, todayStart);
    const daysUntil = Math.round(next.diff(todayStart, 'days').days);
    if (daysUntil < 0) continue;

    if (next >= todayStart && next <= endThisMonth) {
      thisMonth.push({ ...row, daysUntil, bucket: 'this_month' });
    } else if (next >= startNextMonth && next <= endNextMonth) {
      nextMonth.push({ ...row, daysUntil, bucket: 'next_month' });
    }
  }

  thisMonth.sort(sortBySoonest);
  nextMonth.sort(sortBySoonest);

  return {
    thisMonth: thisMonth.slice(0, maxPer),
    nextMonth: nextMonth.slice(0, maxPer),
  };
}
