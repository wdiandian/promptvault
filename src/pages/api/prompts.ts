import type { APIRoute } from 'astro';
import { getPrompts } from '@/lib/db/queries';

export const GET: APIRoute = async ({ url }) => {
  const modelId = url.searchParams.get('modelId') ?? undefined;
  const sort = (url.searchParams.get('sort') as 'latest' | 'popular' | 'random') ?? 'latest';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);
  const tagIds = url.searchParams.getAll('tagIds').filter(Boolean);

  const result = await getPrompts({
    modelId,
    tagIds: tagIds.length > 0 ? tagIds : undefined,
    sort,
    limit,
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};
