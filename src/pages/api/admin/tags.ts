import type { APIRoute } from 'astro';
import { db } from '@/lib/db/index';
import { tags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const [created] = await db.insert(tags).values({
      name: body.name,
      group: body.group,
      color: body.color,
      sort: body.sort ?? 0,
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

    const [updated] = await db.update(tags)
      .set({
        name: body.name,
        group: body.group,
        color: body.color,
        sort: body.sort,
      })
      .where(eq(tags.id, body.id))
      .returning();

    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
