export type RelationshipWarmth = 'hot' | 'warm' | 'cold';

const MS_PER_DAY = 86_400_000;

/** Days from `met_at` or `created_at` until `now` reaches full “old relationship” weight. */
const TENURE_BLEND_MAX_DAYS = 1095;

const HOT_DAYS_NEW = 14;
const HOT_DAYS_OLD = 30;
const WARM_DAYS_NEW = 30;
const WARM_DAYS_OLD = 60;

function clamp01(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function parseStartOfDayUtc(iso: string): Date {
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcCalendarNow(): Date {
  const n = new Date();
  return new Date(
    Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()),
  );
}

function wholeDaysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export type ComputeRelationshipWarmthInput = {
  lastInteractionAt: string | null;
  metAt: string | null;
  createdAt: string;
  now?: Date;
};

export function computeRelationshipWarmth(
  input: ComputeRelationshipWarmthInput,
): RelationshipWarmth {
  const now = input.now ?? new Date();

  if (!input.lastInteractionAt) {
    return 'cold';
  }

  const lastTouch = new Date(input.lastInteractionAt);
  if (Number.isNaN(lastTouch.getTime())) {
    return 'cold';
  }

  const startIso = input.metAt ?? input.createdAt;
  const start = parseStartOfDayUtc(startIso);
  const today = utcCalendarNow();
  const ageDays = Math.max(0, wholeDaysBetween(start, today));
  const t = clamp01(ageDays / TENURE_BLEND_MAX_DAYS);
  const hotDays = lerp(HOT_DAYS_NEW, HOT_DAYS_OLD, t);
  const warmDays = lerp(WARM_DAYS_NEW, WARM_DAYS_OLD, t);

  const daysSince = Math.floor((now.getTime() - lastTouch.getTime()) / MS_PER_DAY);
  if (daysSince <= hotDays) {
    return 'hot';
  }
  if (daysSince <= warmDays) {
    return 'warm';
  }
  return 'cold';
}

export function relationshipWarmthLabel(warmth: RelationshipWarmth): string {
  if (warmth === 'hot') {
    return 'Hot';
  }
  if (warmth === 'warm') {
    return 'Warm';
  }
  return 'Cold';
}

export function relationshipWarmthChipClassName(
  warmth: RelationshipWarmth,
): string {
  if (warmth === 'hot') {
    return 'border border-rose-500/40 bg-rose-500/24 text-rose-950';
  }
  if (warmth === 'warm') {
    return 'border border-orange-300/50 bg-orange-300/20 text-orange-950';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200/90';
}
