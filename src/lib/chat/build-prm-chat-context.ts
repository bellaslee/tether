import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';
import type { Database } from '@/lib/db/database.types';
import type { PrmSupabaseContext } from '@/lib/prm/context';
import { fetchInteractionPeopleLinksForUserInteractions } from '@/lib/interactions/interaction-people-queries';
import { personShownName } from '@/lib/people/list-name';
import { embedTextsWithOpenAi } from '@/lib/retrieval/embed-batch';
import {
  matchDocumentEmbeddings,
  type SemanticSearchRow,
} from '@/lib/retrieval/semantic-search';

export type PrmChatContextPack = {
  peopleJson: string;
  categoriesJson: string;
  interactionTypesJson: string;
  recentMomentsText: string;
  recentFactsText: string;
  retrievalText: string;
};

/** Newest-first cap; very active accounts still need semantic extras below. */
const RECENT_INTERACTIONS_LIMIT = 72;
const RECENT_FACTS_LIMIT = 36;
const SEMANTIC_MATCH_COUNT = 22;
/** Full moment rows to add when vector search hits older interaction chunks. */
const MAX_SEMANTIC_EXTRA_INTERACTIONS = 20;
const NOTE_SNIPPET_CHARS = 360;
const FACT_BODY_CHARS = 280;

function clipText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
}

function formatMomentBlockLine(
  row: {
    id: string;
    occurred_at: string;
    title: string | null;
    raw_note: string | null;
    interaction_types: { name: string } | null;
  },
  index1Based: number,
  peopleByIx: Map<string, string[]>,
): string {
  const typeName = row.interaction_types?.name?.trim() || 'Moment';
  const who = (peopleByIx.get(row.id) ?? []).join(', ') || '(no people linked)';
  const title = row.title?.trim() ? row.title.trim() : '—';
  const note = row.raw_note?.trim()
    ? clipText(row.raw_note, NOTE_SNIPPET_CHARS)
    : '—';
  return `${index1Based}. ${row.occurred_at} · ${typeName} · id=${row.id}\n   With: ${who}\n   Title: ${title}\n   Note: ${note}`;
}

export async function buildPrmChatContextPack(args: {
  ctx: PrmSupabaseContext;
  openai: OpenAI;
  latestUserMessage: string;
}): Promise<PrmChatContextPack> {
  const { ctx, openai, latestUserMessage } = args;
  const client = ctx.client as SupabaseClient<Database>;

  const [
    { data: peopleRows },
    { data: catRows },
    { data: typeRows },
    { data: interactionRows },
    { data: factRows },
  ] = await Promise.all([
    client
      .from('people')
      .select('id, full_name, display_name')
      .eq('user_id', ctx.userId)
      .order('full_name', { ascending: true })
      .limit(120),
    client
      .from('person_categories')
      .select('id, name')
      .eq('user_id', ctx.userId)
      .order('sort_order', { ascending: true }),
    client
      .from('interaction_types')
      .select('id, name')
      .eq('user_id', ctx.userId)
      .order('sort_order', { ascending: true }),
    client
      .from('interactions')
      .select('id, occurred_at, title, raw_note, interaction_types ( name )')
      .eq('user_id', ctx.userId)
      .order('occurred_at', { ascending: false })
      .limit(RECENT_INTERACTIONS_LIMIT),
    client
      .from('facts')
      .select('id, body, review_status, person_id, updated_at')
      .eq('user_id', ctx.userId)
      .neq('review_status', 'dismissed')
      .order('updated_at', { ascending: false })
      .limit(RECENT_FACTS_LIMIT),
  ]);

  const peopleList = peopleRows ?? [];
  const peopleJson = JSON.stringify(peopleList);
  const categoriesJson = JSON.stringify(catRows ?? []);
  const interactionTypesJson = JSON.stringify(typeRows ?? []);

  const nameByPersonId = new Map(
    peopleList.map((p) => [p.id, personShownName(p)] as const),
  );

  type InteractionForChatCtx = {
    id: string;
    occurred_at: string;
    title: string | null;
    raw_note: string | null;
    interaction_types: { name: string } | null;
  };

  const ixList = (interactionRows ?? []) as InteractionForChatCtx[];

  let retrievalText = '(No semantic matches yet — add notes or facts, then try again.)';
  let semanticRows: SemanticSearchRow[] = [];
  const q = latestUserMessage.trim();
  if (q.length > 0) {
    try {
      const [qEmb] = await embedTextsWithOpenAi(openai, [q]);
      const { rows, error } = await matchDocumentEmbeddings(
        client,
        qEmb,
        SEMANTIC_MATCH_COUNT,
      );
      semanticRows = rows;
      if (error) {
        retrievalText = `(Semantic search unavailable: ${error})`;
      } else if (rows.length > 0) {
        retrievalText = rows
          .map(
            (r, i) =>
              `${i + 1}. [${r.source_type} ${r.source_id}] dist=${r.distance.toFixed(4)}\n${r.content}`,
          )
          .join('\n\n');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      retrievalText = `(Semantic search failed: ${msg})`;
    }
  }

  let recentMomentsText: string;
  if (ixList.length === 0) {
    recentMomentsText =
      '(No moments logged yet — the user has no interaction history in Tether.)';
  } else {
    const recentIdSet = new Set(ixList.map((r) => r.id));
    const semanticIxIdsOrdered: string[] = [];
    const seenIx = new Set<string>();
    for (const r of semanticRows) {
      if (r.source_type !== 'interaction_note') {
        continue;
      }
      if (recentIdSet.has(r.source_id)) {
        continue;
      }
      if (seenIx.has(r.source_id)) {
        continue;
      }
      seenIx.add(r.source_id);
      semanticIxIdsOrdered.push(r.source_id);
      if (semanticIxIdsOrdered.length >= MAX_SEMANTIC_EXTRA_INTERACTIONS) {
        break;
      }
    }

    let extraRows: InteractionForChatCtx[] = [];
    if (semanticIxIdsOrdered.length > 0) {
      const { data: extraData } = await client
        .from('interactions')
        .select('id, occurred_at, title, raw_note, interaction_types ( name )')
        .eq('user_id', ctx.userId)
        .in('id', semanticIxIdsOrdered);
      const raw = (extraData ?? []) as InteractionForChatCtx[];
      const rank = new Map(semanticIxIdsOrdered.map((id, i) => [id, i] as const));
      extraRows = raw.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    }

    const allIxIds = [...ixList.map((r) => r.id), ...extraRows.map((r) => r.id)];
    const linkRes = await fetchInteractionPeopleLinksForUserInteractions(
      client,
      ctx.userId,
      allIxIds,
    );
    const links = 'error' in linkRes ? [] : linkRes.ok;
    const peopleByIx = new Map<string, string[]>();
    for (const link of links) {
      const label = nameByPersonId.get(link.person_id) ?? link.person_id;
      const arr = peopleByIx.get(link.interaction_id) ?? [];
      arr.push(link.role === 'primary' ? `${label} (primary)` : label);
      peopleByIx.set(link.interaction_id, arr);
    }

    const newestBlock = ixList
      .map((row, i) => formatMomentBlockLine(row, i + 1, peopleByIx))
      .join('\n\n');

    if (extraRows.length === 0) {
      recentMomentsText = ['### Newest moments (newest first)', newestBlock].join('\n\n');
    } else {
      const extraBlock = extraRows
        .map((row, i) => formatMomentBlockLine(row, i + 1, peopleByIx))
        .join('\n\n');
      recentMomentsText = [
        '### Newest moments (newest first)',
        newestBlock,
        '',
        '### Older moments that matched this question (from search over your notes; may include activities or people not in the newest block)',
        extraBlock,
      ].join('\n\n');
    }
  }

  const facts = factRows ?? [];
  let recentFactsText: string;
  if (facts.length === 0) {
    recentFactsText =
      '(No saved facts yet — accept extracted facts or rely on semantic search over notes.)';
  } else {
    recentFactsText = facts
      .map((f, i) => {
        const who = nameByPersonId.get(f.person_id) ?? f.person_id;
        const body = clipText(f.body, FACT_BODY_CHARS);
        return `${i + 1}. ${who} · ${f.review_status} · fact id=${f.id}\n   ${body}`;
      })
      .join('\n\n');
  }

  return {
    peopleJson,
    categoriesJson,
    interactionTypesJson,
    recentMomentsText,
    recentFactsText,
    retrievalText,
  };
}
