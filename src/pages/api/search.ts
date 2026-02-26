import type { APIRoute } from 'astro';
import { searchPrompts } from '@/lib/db/queries';

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  if (!q.trim()) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = await searchPrompts(q.trim());

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};
