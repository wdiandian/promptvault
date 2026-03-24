export const prerender = false;
import type { APIRoute } from 'astro';
import { db } from '@/lib/db/index';
import { blogPosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const [created] = await db.insert(blogPosts).values({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || null,
      content: body.content,
      coverUrl: body.coverUrl || null,
      status: body.status || 'draft',
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

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt || null;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.coverUrl !== undefined) updateData.coverUrl = body.coverUrl || null;
    if (body.status !== undefined) updateData.status = body.status;

    const [updated] = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, body.id))
      .returning();

    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

