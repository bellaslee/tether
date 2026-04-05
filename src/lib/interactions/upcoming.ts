/**
 * Timeline interactions use `occurred_at` for both past moments and planned ones.
 * Upcoming = strictly after `now` so "now" still counts toward last touch.
 */
export function isUpcomingInteraction(
  occurredAtIso: string,
  now: Date = new Date(),
): boolean {
  const t = new Date(occurredAtIso).getTime();
  if (Number.isNaN(t)) {
    return false;
  }
  return t > now.getTime();
}

export function countsTowardLastTouch(
  occurredAtIso: string,
  now: Date = new Date(),
): boolean {
  return !isUpcomingInteraction(occurredAtIso, now);
}

/**
 * Keeps category-audit rows (`counts_toward_last_touch` false, past `occurred_at`)
 * from flipping to true when edited. Still recomputes when the row was only false
 * because it was upcoming.
 */
export function resolveCountsTowardLastTouchOnUpdate(
  previousOccurredAt: string,
  previousCountsToward: boolean,
  newOccurredAt: string,
  now: Date = new Date(),
): boolean {
  const wasUpcoming = isUpcomingInteraction(previousOccurredAt, now);
  if (!previousCountsToward && !wasUpcoming) {
    return false;
  }
  return countsTowardLastTouch(newOccurredAt, now);
}
