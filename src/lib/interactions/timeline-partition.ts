import { isUpcomingInteraction } from '@/lib/interactions/upcoming';

export function partitionTimelineByOccurrence<T extends { occurred_at: string }>(
  rows: T[],
  now: Date = new Date(),
): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const row of rows) {
    if (isUpcomingInteraction(row.occurred_at, now)) {
      upcoming.push(row);
    } else {
      past.push(row);
    }
  }
  upcoming.sort(
    (a, b) =>
      new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );
  past.sort(
    (a, b) =>
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
  return { upcoming, past };
}

export function partitionPersonTimelineRows<
  T extends { interaction: { occurred_at: string } },
>(rows: T[], now: Date = new Date()): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const row of rows) {
    if (isUpcomingInteraction(row.interaction.occurred_at, now)) {
      upcoming.push(row);
    } else {
      past.push(row);
    }
  }
  upcoming.sort(
    (a, b) =>
      new Date(a.interaction.occurred_at).getTime() -
      new Date(b.interaction.occurred_at).getTime(),
  );
  past.sort(
    (a, b) =>
      new Date(b.interaction.occurred_at).getTime() -
      new Date(a.interaction.occurred_at).getTime(),
  );
  return { upcoming, past };
}
