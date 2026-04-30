export const prerender = false;
import type { APIRoute } from 'astro';
import { getPrompts } from '@/lib/db/queries';

export const GET: APIRoute = async ({ url }) => {
  const modelId = url.searchParams.get('modelId') ?? undefined;
  const sort = (url.searchParams.get('sort') as 'latest' | 'popular' | 'random') ?? 'latest';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const offset = parseInt(url.searchParams.get('offset') ?? '0') || 0;
  const tagIds = url.searchParams.getAll('tagIds').filter(Boolean);

  const result = await getPrompts({
    modelId,
    tagIds: tagIds.length > 0 ? tagIds : undefined,
    sort,
    limit,
    cursor,
    offset,
  });

  const cacheControl = sort === 'random'
    ? 'public, s-maxage=60, stale-while-revalidate=300'
    : 'public, s-maxage=300, stale-while-revalidate=1800';

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  });
};

