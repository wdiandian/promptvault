import { db } from './index';
import { models, tags, promptItems, promptItemTags, assets } from './schema';
import { eq, desc, asc, and, inArray, sql, ilike, or, lt } from 'drizzle-orm';

const CACHE_TTL_MS = 60_000;

const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>, ttlMs = CACHE_TTL_MS): Promise<T> {
  const now = Date.now();
  const hit = memoryCache.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;

  const value = await load();
  memoryCache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

type PromptSort = 'latest' | 'popular' | 'random';

interface PromptCursor {
  id: string;
  createdAt?: string;
  copies?: number;
}

function encodePromptCursor(item: { id: string; createdAt: Date; copies: number }, sort: PromptSort): string {
  const cursor: PromptCursor = { id: item.id };
  if (sort === 'popular') cursor.copies = item.copies;
  else cursor.createdAt = item.createdAt.toISOString();
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodePromptCursor(cursor: string | undefined): PromptCursor | null {
  if (!cursor) return null;

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as PromptCursor;
  } catch {
    return null;
  }
}

export async function getModels() {
  return cached('models:active', () => db.select().from(models)
      .where(eq(models.status, 'active'))
      .orderBy(desc(models.isPinned), asc(models.sort)));
}

export async function getTags() {
  return cached('tags:all', () => db.select().from(tags).orderBy(asc(tags.sort)));
}

export async function getPrompts(opts: {
  modelId?: string;
  tagIds?: string[];
  sort?: PromptSort;
  cursor?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const sort = opts.sort ?? 'latest';
  const cursor = decodePromptCursor(opts.cursor);
  const conditions = [eq(promptItems.status, 'published')];

  if (opts.modelId) {
    conditions.push(eq(promptItems.modelId, opts.modelId));
  }

  if (opts.tagIds && opts.tagIds.length > 0) {
    const matchingIds = db
      .select({ promptItemId: promptItemTags.promptItemId })
      .from(promptItemTags)
      .where(inArray(promptItemTags.tagId, opts.tagIds));

    conditions.push(inArray(promptItems.id, matchingIds));
  }

  if (sort === 'latest' && cursor?.createdAt) {
    const cursorDate = new Date(cursor.createdAt);
    if (!Number.isNaN(cursorDate.valueOf())) {
      conditions.push(or(
        lt(promptItems.createdAt, cursorDate),
        and(eq(promptItems.createdAt, cursorDate), lt(promptItems.id, cursor.id)),
      )!);
    }
  }

  if (sort === 'popular' && typeof cursor?.copies === 'number') {
    conditions.push(or(
      lt(promptItems.copies, cursor.copies),
      and(eq(promptItems.copies, cursor.copies), lt(promptItems.id, cursor.id)),
    )!);
  }

  let query = db
    .select({
      id: promptItems.id,
      title: promptItems.title,
      slug: promptItems.slug,
      modelId: promptItems.modelId,
      views: promptItems.views,
      copies: promptItems.copies,
      coverUrl: promptItems.coverUrl,
      coverThumbUrl: promptItems.coverThumbUrl,
      coverWidth: promptItems.coverWidth,
      coverHeight: promptItems.coverHeight,
      status: promptItems.status,
      createdAt: promptItems.createdAt,
      modelName: models.name,
      modelColor: sql<string>`coalesce(${models.color}, '#e8634a')`.as('model_color'),
      modelType: models.type,
    })
    .from(promptItems)
    .innerJoin(models, eq(promptItems.modelId, models.id))
    .where(and(...conditions))
    .$dynamic();

  if (sort === 'popular') {
    query = query.orderBy(desc(promptItems.copies), desc(promptItems.id));
  } else if (sort === 'random') {
    query = query.orderBy(sql`RANDOM()`);
  } else {
    query = query.orderBy(desc(promptItems.createdAt), desc(promptItems.id));
  }

  const results = sort === 'random'
    ? await query.offset(offset).limit(limit + 1)
    : await query.limit(limit + 1);
  const hasMore = results.length > limit;
  const items = results.slice(0, limit);
  const nextCursor = hasMore && items.length > 0 && sort !== 'random'
    ? encodePromptCursor(items[items.length - 1], sort)
    : null;

  return { items, hasMore, nextCursor };
}

export async function getPromptBySlug(slug: string) {
  const [item] = await db
    .select()
    .from(promptItems)
    .innerJoin(models, eq(promptItems.modelId, models.id))
    .where(eq(promptItems.slug, slug))
    .limit(1);

  if (!item) return null;

  const itemTags = await db
    .select({ name: tags.name, id: tags.id })
    .from(promptItemTags)
    .innerJoin(tags, eq(promptItemTags.tagId, tags.id))
    .where(eq(promptItemTags.promptItemId, item.prompt_items.id));

  const itemAssets = await db
    .select()
    .from(assets)
    .where(eq(assets.promptItemId, item.prompt_items.id))
    .orderBy(asc(assets.sort));

  return {
    ...item.prompt_items,
    model: item.models,
    tags: itemTags,
    assets: itemAssets,
  };
}

export async function getRelatedPrompts(modelId: string, excludeId: string, limit = 5) {
  return db
    .select({
      id: promptItems.id,
      title: promptItems.title,
      slug: promptItems.slug,
      coverUrl: promptItems.coverUrl,
      coverThumbUrl: promptItems.coverThumbUrl,
      coverHeight: promptItems.coverHeight,
      copies: promptItems.copies,
      modelName: models.name,
    })
    .from(promptItems)
    .innerJoin(models, eq(promptItems.modelId, models.id))
    .where(and(
      eq(promptItems.status, 'published'),
      eq(promptItems.modelId, modelId),
      sql`${promptItems.id} != ${excludeId}`,
    ))
    .orderBy(desc(promptItems.copies))
    .limit(limit);
}

export async function searchPrompts(query: string, limit = 20) {
  return db
    .select({
      id: promptItems.id,
      title: promptItems.title,
      slug: promptItems.slug,
      coverUrl: promptItems.coverUrl,
      coverThumbUrl: promptItems.coverThumbUrl,
      coverHeight: promptItems.coverHeight,
      copies: promptItems.copies,
      views: promptItems.views,
      modelName: models.name,
      modelColor: sql<string>`coalesce(${models.color}, '#e8634a')`.as('model_color'),
      modelType: models.type,
    })
    .from(promptItems)
    .innerJoin(models, eq(promptItems.modelId, models.id))
    .where(and(
      eq(promptItems.status, 'published'),
      or(
        ilike(promptItems.title, `%${query}%`),
        ilike(promptItems.promptText, `%${query}%`),
      ),
    ))
    .orderBy(desc(promptItems.copies))
    .limit(limit);
}

export async function incrementCopies(slug: string) {
  await db
    .update(promptItems)
    .set({ copies: sql`${promptItems.copies} + 1` })
    .where(eq(promptItems.slug, slug));
}

export async function incrementViews(slug: string) {
  await db
    .update(promptItems)
    .set({ views: sql`${promptItems.views} + 1` })
    .where(eq(promptItems.slug, slug));
}

export async function getModelCounts() {
  return cached('model-counts:published', () => db
    .select({
      modelId: promptItems.modelId,
      count: sql<number>`count(*)::int`,
    })
    .from(promptItems)
    .where(eq(promptItems.status, 'published'))
    .groupBy(promptItems.modelId));
}

export async function getStats() {
  const [promptCount] = await db.select({ count: sql<number>`count(*)::int` }).from(promptItems);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(promptItems).where(eq(promptItems.status, 'draft'));
  const [assetCount] = await db.select({ count: sql<number>`count(*)::int` }).from(assets);
  const [totalCopies] = await db.select({ total: sql<number>`coalesce(sum(${promptItems.copies}), 0)::int` }).from(promptItems);

  return {
    prompts: promptCount.count,
    pending: pendingCount.count,
    media: assetCount.count,
    copies: totalCopies.total,
  };
}
