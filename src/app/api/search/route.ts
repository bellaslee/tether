import { NextResponse } from 'next/server';
import { getAccountSupabaseContext } from '@/lib/account/context';
import {
  QUICK_SEARCH_MAX_QUERY_LENGTH,
  runQuickSearch,
} from '@/lib/search/quick-search';

export async function GET(request: Request) {
  const account = await getAccountSupabaseContext();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '')
    .trim()
    .slice(0, QUICK_SEARCH_MAX_QUERY_LENGTH);

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await runQuickSearch({
      client: account.client,
      userId: account.userId,
      query: q,
    });
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
