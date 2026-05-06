export type RelationshipWarmth = 'hot' | 'warm' | 'cold';

/** Display hearts (Stardew-style bar); tunable in one place. */
export const RELATIONSHIP_MAX_HEARTS = 10;

const MS_PER_DAY = 86_400_000;

/** Days from `met_at` or `created_at` until `now` reaches full “old relationship” weight. */
const TENURE_BLEND_MAX_DAYS = 1095;

/** sqrt(interactionCount) / sqrt(INTERACTION_REF) saturates frequency contribution. */
const INTERACTION_REF_FOR_FULL_FREQ = 40;

/** Linear stretch: first N logged moments ramp frequency visibly (with sqrt blend). */
const LINEAR_FULL_INTERACTIONS = 12;

/** Blend sqrt vs linear frequency (more weight on linear so each early log counts). */
const FREQ_BLEND_SQRT = 0.42;
const FREQ_BLEND_LINEAR = 0.58;

/**
 * Max hearts reserved for category + tenure on the bar. The remainder (up to 10)
 * is filled from logged activity so interactions always have visible headroom.
 */
const DISPLAY_BASELINE_CAP_HEARTS = 7;

/** Activity lift: tenure matters less here than interaction frequency. */
const ACTIVITY_WEIGHT_TENURE = 0.22;
const ACTIVITY_WEIGHT_FREQUENCY = 0.78;

/** Recency: exponential half-ish decay; newer ties go quiet faster than long ones. */
const RECENCY_TAU_DAYS_NEW = 18;
const RECENCY_TAU_DAYS_OLD = 48;

/** Map filled hearts (0–max) to warmth buckets for filters and sort. */
const WARMTH_HOT_MIN_HEARTS = 7;
const WARMTH_WARM_MIN_HEARTS = 4;

/** Extra “floor” hearts from calendar time knowing them (0–3). */
const TENURE_BASELINE_MAX_HEARTS = 3;

/**
 * Bond-type floor: partner and family keep a higher minimum even when touch is
 * infrequent. Names are matched case-insensitively; users can rename categories.
 */
function categoryBondFloorHearts(
  categoryName: string | null | undefined,
): number {
  const n = categoryName?.trim().toLowerCase() ?? '';
  if (!n) {
    return 2;
  }
  if (n === 'partner' || n === 'family') {
    return 7;
  }
  if (n === 'close friend' || n === 'close_friend') {
    return 4;
  }
  if (n === 'friend' || n === 'roommate' || n === 'mentor') {
    return 3;
  }
  if (n === 'coworker' || n === 'acquaintance' || n === 'networking') {
    return 1;
  }
  return 2;
}

function tenureBonusHearts(ageDays: number): number {
  return Math.round(
    TENURE_BASELINE_MAX_HEARTS * clamp01(ageDays / TENURE_BLEND_MAX_DAYS),
  );
}

/** Minimum filled hearts from relationship type + time known (before touch decay). */
export function computeBondBaselineFilledHearts(input: {
  personCategoryName?: string | null;
  metAt: string | null;
  createdAt: string;
  now?: Date;
}): number {
  const startIso = input.metAt ?? input.createdAt;
  const start = parseStartOfDayUtc(startIso);
  const today = utcCalendarNow();
  const ageDays = Math.max(0, wholeDaysBetween(start, today));
  const fromCategory = categoryBondFloorHearts(input.personCategoryName);
  const fromTenure = tenureBonusHearts(ageDays);
  return Math.min(RELATIONSHIP_MAX_HEARTS, fromCategory + fromTenure);
}

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

/** Combined sqrt + linear frequency so early interactions move integer hearts faster. */
function interactionFrequencyStrength(interactionCount: number): number {
  const n = Math.max(0, interactionCount);
  const sqrtPart = clamp01(
    Math.sqrt(n) / Math.sqrt(INTERACTION_REF_FOR_FULL_FREQ),
  );
  const linearPart = clamp01(n / LINEAR_FULL_INTERACTIONS);
  return clamp01(FREQ_BLEND_SQRT * sqrtPart + FREQ_BLEND_LINEAR * linearPart);
}

function displayBondSoftFloor(baselineFilled: number): number {
  return Math.min(baselineFilled, DISPLAY_BASELINE_CAP_HEARTS);
}

export type ComputeRelationshipWarmthInput = {
  lastInteractionAt: string | null;
  metAt: string | null;
  createdAt: string;
  /** Rows in `interaction_people` for this person (denormalized on `people`). */
  interactionCount?: number;
  /** `person_categories.name` — drives baseline floor with tenure. */
  personCategoryName?: string | null;
  /**
   * When set (`0–20` halves), substitutes bond baseline from category + tenure
   * before soft-floor and activity formulas.
   */
  relationshipHeartsBaselineHalves?: number | null;
  now?: Date;
};

/** Valid DB/app values: integer half-hearts 0..2*RELATIONSHIP_MAX_HEARTS. */
export function normalizeRelationshipHeartsBaselineHalves(
  value: number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  const rounded = Math.round(value);
  if (rounded < 0 || rounded > RELATIONSHIP_MAX_HEARTS * 2) {
    return null;
  }
  return rounded;
}

/** `filled` is in half-heart steps (0, 0.5, 1, …, max). */
export type RelationshipHeartsResult = {
  filled: number;
  max: number;
};

/** Snap to nearest half-heart on the 0..max range (display granularity). */
function snapHalfHearts(value: number, max: number): number {
  const stepped = Math.round(value * 2) / 2;
  return Math.min(max, Math.max(0, stepped));
}

/**
 * Hearts = capped bond soft floor (category + tenure, max DISPLAY_BASELINE_CAP_HEARTS)
 * plus an activity band (frequency with linear early-game sensitivity × recency).
 * This avoids max(baseline, dynamic) freezing the bar when baseline already nears 10.
 */
export function computeRelationshipHearts(
  input: ComputeRelationshipWarmthInput,
): RelationshipHeartsResult {
  const max = RELATIONSHIP_MAX_HEARTS;
  const now = input.now ?? new Date();
  const interactionCount = Math.max(0, input.interactionCount ?? 0);

  const startIso = input.metAt ?? input.createdAt;
  const start = parseStartOfDayUtc(startIso);
  const today = utcCalendarNow();
  const ageDays = Math.max(0, wholeDaysBetween(start, today));
  const tenureT = clamp01(ageDays / TENURE_BLEND_MAX_DAYS);

  const manualHalves = normalizeRelationshipHeartsBaselineHalves(
    input.relationshipHeartsBaselineHalves,
  );
  const baselineFilled =
    manualHalves !== null
      ? manualHalves / 2
      : computeBondBaselineFilledHearts({
          personCategoryName: input.personCategoryName,
          metAt: input.metAt,
          createdAt: input.createdAt,
          now,
        });

  const softFloor = displayBondSoftFloor(baselineFilled);

  if (!input.lastInteractionAt) {
    return { filled: snapHalfHearts(softFloor, max), max };
  }

  const lastTouch = new Date(input.lastInteractionAt);
  if (Number.isNaN(lastTouch.getTime())) {
    return { filled: snapHalfHearts(softFloor, max), max };
  }

  const freqStrength = interactionFrequencyStrength(interactionCount);

  const bondPotentialActivity = clamp01(
    ACTIVITY_WEIGHT_TENURE * tenureT + ACTIVITY_WEIGHT_FREQUENCY * freqStrength,
  );

  const daysSince = Math.floor(
    (now.getTime() - lastTouch.getTime()) / MS_PER_DAY,
  );
  const tauDays = lerp(RECENCY_TAU_DAYS_NEW, RECENCY_TAU_DAYS_OLD, tenureT);
  const recency = Math.exp(-Math.max(0, daysSince) / tauDays);

  const activitySlots = Math.max(0, max - softFloor);
  const activityScore01 = clamp01(bondPotentialActivity * recency);
  const rawActivityPortion =
    activitySlots > 0 ? activityScore01 * activitySlots : 0;
  const rawFilled = softFloor + rawActivityPortion;

  const filled = snapHalfHearts(rawFilled, max);
  return { filled, max };
}

export function computeRelationshipWarmth(
  input: ComputeRelationshipWarmthInput,
): RelationshipWarmth {
  const { filled } = computeRelationshipHearts(input);
  if (filled >= WARMTH_HOT_MIN_HEARTS) {
    return 'hot';
  }
  if (filled >= WARMTH_WARM_MIN_HEARTS) {
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

/** Hover copy for the heart bar — one clear sentence. */
export function relationshipHeartBarTooltip(
  input: ComputeRelationshipWarmthInput,
): string {
  if (normalizeRelationshipHeartsBaselineHalves(input.relationshipHeartsBaselineHalves) !== null) {
    return 'You set the connection baseline here. Logged moments and how recently you last connected still move the hearts around that baseline.';
  }
  const cat = input.personCategoryName?.trim();
  const lead = cat ? `their category (${cat})` : 'how you categorize them';
  return `Hearts combine ${lead}, how long you have known each other, moments you have logged together, and how recently you last connected.`;
}
