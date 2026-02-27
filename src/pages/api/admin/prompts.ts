import type { APIRoute } from 'astro';
import { db } from '@/lib/db/index';
import { promptItems, promptItemTags, tags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, slug, modelId, promptText, negativePrompt, params, notes, status, tags: tagNames, coverUrl } = body;

    const finalSlug = slug || slugify(title);

    const [created] = await db.insert(promptItems).values({
      title,
      slug: finalSlug,
      modelId,
      promptText,
      negativePrompt: negativePrompt || null,
      params: params || null,
      notes: notes || null,
      status: status || 'draft',
      coverUrl: coverUrl || null,
    }).returning();

    if (tagNames?.length > 0) {
      for (const tagName of tagNames) {
        const existing = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);
        let tagId: string;

        if (existing.length > 0) {
          tagId = existing[0].id;
        } else {
          const [newTag] = await db.insert(tags).values({ name: tagName }).returning();
          tagId = newTag.id;
        }

        await db.insert(promptItemTags).values({
          promptItemId: created.id,
          tagId,
        });
      }
    }

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
    const { id, title, slug, modelId, promptText, negativePrompt, params, notes, status, coverUrl } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    const [updated] = await db.update(promptItems)
      .set({
        title,
        slug,
        modelId,
        promptText,
        negativePrompt: negativePrompt || null,
        params: params || null,
        notes: notes || null,
        status,
        coverUrl: coverUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(promptItems.id, id))
      .returning();

    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
