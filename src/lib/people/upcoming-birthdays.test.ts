import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import {
  normalizeBirthdayToYmd,
  upcomingBirthdaysThisAndNextMonth,
} from './upcoming-birthdays';

describe('normalizeBirthdayToYmd', () => {
  it('reads civil date from ISO timestamps', () => {
    expect(normalizeBirthdayToYmd('1999-03-04T12:00:00.000Z')).toBe(
      '1999-03-04',
    );
  });
});

describe('upcomingBirthdaysThisAndNextMonth', () => {
  it('puts May birthday in this month and June birthday in next month', () => {
    const fixed = DateTime.fromObject(
      { year: 2026, month: 5, day: 10 },
      { zone: 'America/Los_Angeles' },
    ).startOf('day');
    const rows = [
      {
        id: 'may',
        full_name: 'May person',
        display_name: null,
        birthday: '1988-05-25',
      },
      {
        id: 'june',
        full_name: 'June person',
        display_name: null,
        birthday: '1990-06-12',
      },
      {
        id: 'dec',
        full_name: 'December',
        display_name: null,
        birthday: '1990-12-01',
      },
    ];
    const { thisMonth, nextMonth } = upcomingBirthdaysThisAndNextMonth(rows, {
      timeZone: 'America/Los_Angeles',
      now: fixed,
    });
    expect(thisMonth.map((x) => x.id)).toEqual(['may']);
    expect(nextMonth.map((x) => x.id)).toEqual(['june']);
    expect(thisMonth[0].bucket).toBe('this_month');
    expect(nextMonth[0].bucket).toBe('next_month');
    expect(thisMonth.find((x) => x.id === 'dec')).toBeUndefined();
  });

  it('excludes birthdays in this month that already passed this year', () => {
    const fixed = DateTime.fromObject(
      { year: 2026, month: 5, day: 20 },
      { zone: 'UTC' },
    ).startOf('day');
    const { thisMonth, nextMonth } = upcomingBirthdaysThisAndNextMonth(
      [
        {
          id: 'early',
          full_name: 'Early May',
          display_name: null,
          birthday: '1990-05-05',
        },
      ],
      { timeZone: 'UTC', now: fixed },
    );
    expect(thisMonth).toHaveLength(0);
    expect(nextMonth).toHaveLength(0);
  });

  it('treats Feb 29 as Feb 28 in a non-leap year', () => {
    const fixed = DateTime.fromObject(
      { year: 2025, month: 2, day: 27 },
      { zone: 'UTC' },
    ).startOf('day');
    const { thisMonth } = upcomingBirthdaysThisAndNextMonth(
      [
        {
          id: 'leap',
          full_name: 'Leap',
          display_name: null,
          birthday: '2000-02-29',
        },
      ],
      { timeZone: 'UTC', now: fixed },
    );
    expect(thisMonth).toHaveLength(1);
    expect(thisMonth[0].daysUntil).toBe(1);
  });
});
