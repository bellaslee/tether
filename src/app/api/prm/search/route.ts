import { NextResponse } from 'next/server';
import { getPrmSupabaseContext } from '@/lib/prm/context';
import {
  PRM_SEARCH_MAX_QUERY_LENGTH,
  runPrmQuickSearch,
} from '@/lib/search/prm-quick-search';

export async function GET(request: Request) {
  const prm = await getPrmSupabaseContext();
  if (!prm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '')
    .trim()
    .slice(0, PRM_SEARCH_MAX_QUERY_LENGTH);

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await runPrmQuickSearch({
      client: prm.client,
      userId: prm.userId,
      query: q,
    });
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
