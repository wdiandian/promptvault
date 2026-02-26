import type { APIRoute } from 'astro';
import { getPromptBySlug } from '@/lib/db/queries';

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }

  const prompt = await getPromptBySlug(slug);
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(prompt), {
    headers: { 'Content-Type': 'application/json' },
  });
};
