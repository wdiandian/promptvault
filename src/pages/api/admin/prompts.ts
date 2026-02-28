import type { APIRoute } from 'astro';
import { db } from '@/lib/db/index';
import { promptItems, promptItemTags, tags, assets } from '@/lib/db/schema';
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

    if (body.mediaList?.length > 0) {
      for (let i = 0; i < body.mediaList.length; i++) {
        const m = body.mediaList[i];
        await db.insert(assets).values({
          type: m.type ?? 'image',
          url: m.url,
          alt: title,
          promptItemId: created.id,
          sort: i,
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
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.modelId !== undefined) updateData.modelId = body.modelId;
    if (body.promptText !== undefined) updateData.promptText = body.promptText;
    if (body.negativePrompt !== undefined) updateData.negativePrompt = body.negativePrompt || null;
    if (body.params !== undefined) updateData.params = body.params || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.coverUrl !== undefined) updateData.coverUrl = body.coverUrl || null;

    const [updated] = await db.update(promptItems)
      .set(updateData)
      .where(eq(promptItems.id, id))
      .returning();

    // Update tags if provided
    if (body.tags && Array.isArray(body.tags)) {
      await db.delete(promptItemTags).where(eq(promptItemTags.promptItemId, id));

      for (const tagName of body.tags) {
        if (!tagName) continue;
        const existing = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);
        let tagId: string;
        if (existing.length > 0) {
          tagId = existing[0].id;
        } else {
          const [newTag] = await db.insert(tags).values({ name: tagName }).returning();
          tagId = newTag.id;
        }
        await db.insert(promptItemTags).values({ promptItemId: id, tagId }).onConflictDoNothing();
      }
    }

    if (body.mediaList && Array.isArray(body.mediaList)) {
      await db.delete(assets).where(eq(assets.promptItemId, id));
      for (let i = 0; i < body.mediaList.length; i++) {
        const m = body.mediaList[i];
        await db.insert(assets).values({
          type: m.type ?? 'image',
          url: m.url,
          alt: body.title ?? '',
          promptItemId: id,
          sort: i,
        });
      }
    }

    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
