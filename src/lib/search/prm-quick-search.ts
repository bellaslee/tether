import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';
import { personShownName } from '@/lib/people/list-name';

export const PRM_SEARCH_MAX_QUERY_LENGTH = 120;
export const PRM_SEARCH_FETCH_LIMIT = 50;
export const PRM_SEARCH_RESULT_LIMIT = 20;

/**
 * Remove ILIKE wildcards and commas so matches stay literal and PostgREST `.or()`
 * clauses are not broken (comma separates OR conditions).
 */
export function sanitizeIlikeFragment(raw: string): string {
  return raw
    .replace(/%/g, ' ')
    .replace(/_/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\\/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type PrmSearchHitKind = 'person' | 'interaction';

export type PrmSearchHit = {
  kind: PrmSearchHitKind;
  id: string;
  label: string;
  subtitle: string | null;
};

type PersonRow = {
  id: string;
  full_name: string;
  display_name: string | null;
};

type InteractionRow = {
  id: string;
  title: string | null;
  raw_note: string | null;
  occurred_at: string;
  interaction_types: { name: string } | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

/** Higher is better. */
function scoreTextMatch(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n || !h) {
    return 0;
  }
  if (h === n) {
    return 1_000;
  }
  if (h.startsWith(n)) {
    return 800 - Math.min(100, h.length - n.length);
  }
  const wordBoundary = new RegExp(
    `(?:^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i',
  );
  if (wordBoundary.test(h)) {
    return 650;
  }
  const idx = h.indexOf(n);
  if (idx >= 0) {
    return 400 - Math.min(200, idx);
  }
  return 0;
}

function scorePerson(row: PersonRow, query: string): number {
  const q = query.trim();
  if (!q) {
    return 0;
  }
  const full = norm(row.full_name);
  const disp = norm(row.display_name);
  const shown = norm(personShownName(row));
  return Math.max(
    scoreTextMatch(full, q),
    scoreTextMatch(disp, q),
    scoreTextMatch(shown, q),
  );
}

function notePreview(raw: string | null, maxLen = 100): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const oneLine = raw.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxLen) {
    return oneLine;
  }
  return `${oneLine.slice(0, maxLen - 1)}…`;
}

function scoreInteraction(row: InteractionRow, query: string): number {
  const q = query.trim();
  if (!q) {
    return 0;
  }
  const title = row.title ?? '';
  const note = row.raw_note ?? '';
  const typeName = row.interaction_types?.name ?? '';

  const titleScore = scoreTextMatch(title, q) * 1.25;
  const noteScore = scoreTextMatch(note, q) * 0.65;
  const typeScore = scoreTextMatch(typeName, q) * 0.45;

  return Math.max(titleScore, noteScore, typeScore);
}

/** Tie-breaker: more recent interactions rank slightly higher (fraction in [0,1)). */
function recencyBoost(occurredAtIso: string): number {
  const t = Date.parse(occurredAtIso);
  if (Number.isNaN(t)) {
    return 0;
  }
  const now = Date.now();
  const ageMs = Math.max(0, now - t);
  const halfLifeDays = 365;
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;
  return Math.exp(-ageMs / halfLifeMs);
}

export async function runPrmQuickSearch(args: {
  client: SupabaseClient<Database>;
  userId: string;
  query: string;
}): Promise<PrmSearchHit[]> {
  const rawQ = args.query.trim();
  if (!rawQ) {
    return [];
  }

  const fragment = sanitizeIlikeFragment(rawQ);
  if (!fragment) {
    return [];
  }

  const pattern = `%${fragment}%`;

  const [peopleRes, interactionsRes] = await Promise.all([
    args.client
      .from('people')
      .select('id, full_name, display_name')
      .eq('user_id', args.userId)
      .or(`full_name.ilike.${pattern},display_name.ilike.${pattern}`)
      .order('full_name', { ascending: true })
      .limit(PRM_SEARCH_FETCH_LIMIT),
    args.client
      .from('interactions')
      .select('id, title, raw_note, occurred_at, interaction_types ( name )')
      .eq('user_id', args.userId)
      .or(`title.ilike.${pattern},raw_note.ilike.${pattern}`)
      .order('occurred_at', { ascending: false })
      .limit(PRM_SEARCH_FETCH_LIMIT),
  ]);

  if (peopleRes.error) {
    throw new Error(peopleRes.error.message);
  }
  if (interactionsRes.error) {
    throw new Error(interactionsRes.error.message);
  }

  const people = (peopleRes.data ?? []) as PersonRow[];
  const interactions = (interactionsRes.data ?? []) as InteractionRow[];

  type Scored = PrmSearchHit & { score: number };

  const scoredPeople: Scored[] = people.map((row) => {
    const label = personShownName(row);
    const subtitle =
      row.display_name?.trim() && row.full_name.trim() !== label
        ? row.full_name.trim()
        : null;
    return {
      kind: 'person' as const,
      id: row.id,
      label,
      subtitle,
      score: scorePerson(row, rawQ),
    };
  });

  const scoredInteractions: Scored[] = interactions.map((row) => {
    const typeLabel = row.interaction_types?.name ?? null;
    const title = row.title?.trim() ?? '';
    const primary =
      title.length > 0
        ? title
        : notePreview(row.raw_note) ?? 'Interaction';
    const subtitleParts: string[] = [];
    if (typeLabel) {
      subtitleParts.push(typeLabel);
    }
    const prev = notePreview(row.raw_note);
    if (prev && prev !== primary) {
      subtitleParts.push(prev);
    }
    const subtitle =
      subtitleParts.length > 0 ? subtitleParts.join(' · ') : null;

    const base = scoreInteraction(row, rawQ);
    const score = base + recencyBoost(row.occurred_at);

    return {
      kind: 'interaction' as const,
      id: row.id,
      label: primary,
      subtitle,
      score,
    };
  });

  const merged = [...scoredPeople, ...scoredInteractions].filter(
    (x) => x.score > 0,
  );
  merged.sort((a, b) => b.score - a.score);

  return merged.slice(0, PRM_SEARCH_RESULT_LIMIT).map((row) => ({
    kind: row.kind,
    id: row.id,
    label: row.label,
    subtitle: row.subtitle,
  }));
}
