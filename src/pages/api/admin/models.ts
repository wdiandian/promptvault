import type { APIRoute } from 'astro';
import { db } from '@/lib/db/index';
import { models } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const [created] = await db.insert(models).values({
      name: body.name,
      type: body.type ?? 'image',
      provider: body.provider,
      version: body.version,
      description: body.description,
      website: body.website,
      color: body.color ?? '#e8634a',
      isPinned: body.isPinned ?? false,
      sort: body.sort ?? 0,
      paramSchema: body.paramSchema,
      promptTemplate: body.promptTemplate,
    }).returning();

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    const [updated] = await db.update(models)
      .set({
        name: body.name,
        type: body.type,
        provider: body.provider,
        version: body.version,
        description: body.description,
        website: body.website,
        color: body.color,
        isPinned: body.isPinned,
        sort: body.sort,
        paramSchema: body.paramSchema,
        promptTemplate: body.promptTemplate,
      })
      .where(eq(models.id, body.id))
      .returning();

    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
