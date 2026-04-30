import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import { assets, models, promptItems, promptItemTags, tags } from '../src/lib/db/schema';

const SITE = 'https://www.meigen.ai';
const SITEMAP_URL = `${SITE}/sitemap.xml`;
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const IMAGE_DIR = path.join(PUBLIC_DIR, 'imports', 'meigen');
const PUBLIC_IMAGE_PREFIX = '/imports/meigen';

type ImportedPrompt = {
  id: string;
  url: string;
  promptText: string;
  title: string;
  modelName: string;
  imageUrls: string[];
  keywords: string[];
  createdAt?: Date;
};

const args = new Map<string, string | boolean>();
for (const arg of process.argv.slice(2)) {
  const [key, value] = arg.split('=');
  args.set(key.replace(/^--/, ''), value ?? true);
}

const limit = Number(args.get('limit') ?? 20);
const offset = Number(args.get('offset') ?? 0);
const dryRun = args.has('dry-run');
const includeAll = args.has('all');
const delayMs = Number(args.get('delay') ?? 500);

const modelAliases: Record<string, string[]> = {
  gptimage: ['gpt image 2', 'gpt image', 'gptimage'],
  'gpt image': ['gpt image 2', 'gpt image', 'gptimage'],
  'gpt image 1': ['gpt image 2', 'gpt image', 'gptimage'],
  'gpt image 2': ['gpt image 2', 'gpt image', 'gptimage'],
  nanobanana: ['nano banana pro', 'nano banana', 'nanobanana'],
  'nanobanana pro': ['nano banana pro', 'nano banana', 'nanobanana'],
  nanobanana2: ['nano banana pro', 'nano banana', 'nanobanana'],
  'nano banana': ['nano banana pro', 'nano banana', 'nanobanana'],
  'nano banana 2': ['nano banana pro', 'nano banana', 'nanobanana'],
  midjourney: ['midjourney'],
  seedream: ['seedream'],
  'seedream 4.0': ['seedream'],
  grok: ['grok'],
  'z-image': ['z-image'],
  zimage: ['z-image'],
  seedance: ['seedance 2.0', 'seedance'],
  'seedance 2.0': ['seedance 2.0', 'seedance'],
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function textTitle(promptText: string) {
  const lines = promptText
    .split(/\n+/)
    .map((line) => line
      .replace(/\[[^\]]+\]/g, '')
      .replace(/[{}[\]",]/g, ' ')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[.:|;\s]+/, '')
      .trim())
    .filter((line) => {
      const compact = line.replace(/[^\p{L}\p{N}]/gu, '');
      if (!/[a-z0-9\u4e00-\u9fff]/i.test(line) || compact.length < 8) return false;
      if (/^(style|type|image prompt|prompt|description|scene|subject|lighting|composition)\s*:?$/i.test(line)) return false;
      if (/^(act as|you are)\s/i.test(line) && line.length < 90) return false;
      return true;
    });
  const first = lines[0] ?? promptText.replace(/\s+/g, ' ').trim();
  const second = lines[1] ?? '';
  const genericFirstLine = /^(create|generate|make)\s+(one\s+)?(final\s+)?image\.?$/i.test(first);
  const cleaned = (genericFirstLine && second ? second : first)
    .replace(/^(create|generate|make)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const title = cleaned.length > 82 ? `${cleaned.slice(0, 79).trim()}...` : cleaned;
  return title || 'Imported Prompt';
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractId(url: string) {
  const match = url.match(/\/prompt\/(\d+)/);
  if (!match) throw new Error(`Missing prompt id: ${url}`);
  return match[1];
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'PromptVault content importer (+https://getpt.net)',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

async function getSitemapPromptUrls() {
  const xml = await fetchText(SITEMAP_URL);
  return [...xml.matchAll(/<loc>(https:\/\/www\.meigen\.ai\/prompt\/\d+)<\/loc>/g)].map((m) => m[1]);
}

function parseJsonLd(html: string, sourceUrl: string): ImportedPrompt {
  const id = extractId(sourceUrl);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => decodeHtml(m[1]));

  for (const script of scripts) {
    let data: any;
    try {
      data = JSON.parse(script);
    } catch {
      continue;
    }

    const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : [];
    const creativeWork = graph.find((item: any) => item?.['@type'] === 'CreativeWork' && typeof item.text === 'string');
    const image = graph.find((item: any) => item?.['@type'] === 'ImageObject');
    if (!creativeWork) continue;

    const promptText = creativeWork.text.trim();
    const keywords = String(creativeWork.keywords ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag && !/^ai (art|prompt)$/i.test(tag));
    const modelName = String(creativeWork.about?.name ?? '').trim();
    const imageUrl = String(image?.contentUrl ?? image?.url ?? '').trim();

    if (!promptText || !imageUrl) {
      throw new Error(`Missing prompt text or image URL for ${sourceUrl}`);
    }

    return {
      id,
      url: sourceUrl,
      promptText,
      title: textTitle(promptText),
      modelName,
      imageUrls: [imageUrl],
      keywords,
      createdAt: creativeWork.datePublished ? new Date(creativeWork.datePublished) : undefined,
    };
  }

  throw new Error(`No prompt JSON-LD found for ${sourceUrl}`);
}

function extFromContentType(contentType: string, fallbackUrl: string) {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  const match = new URL(fallbackUrl).pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? `.${match[1].toLowerCase().replace('jpeg', 'jpg')}` : '.jpg';
}

function readImageSize(buffer: Buffer) {
  if (buffer.length > 24 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }

  return { width: null, height: null };
}

async function downloadImage(url: string, id: string, index: number) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'PromptVault content importer (+https://getpt.net)',
      accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`Image ${res.status} ${res.statusText}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = extFromContentType(res.headers.get('content-type') ?? '', url);
  const filename = `${id}-${index}${ext}`;
  const localPath = path.join(IMAGE_DIR, filename);
  await mkdir(IMAGE_DIR, { recursive: true });
  await writeFile(localPath, buffer);

  const size = readImageSize(buffer);
  return {
    url: `${PUBLIC_IMAGE_PREFIX}/${filename}`,
    width: size.width,
    height: size.height,
    size: buffer.length,
    format: ext.slice(1),
  };
}

function pickModel(importedModel: string, allModels: Array<typeof models.$inferSelect>) {
  const normalizedImported = normalize(importedModel);
  const candidates = modelAliases[normalizedImported] ?? [normalizedImported];
  return allModels.find((model) => {
    const names = [model.name, model.slug ?? '', model.id].map(normalize);
    return candidates.some((candidate) => names.includes(normalize(candidate)));
  });
}

async function ensureTags(db: ReturnType<typeof drizzle>, names: string[]) {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, 8);
  if (uniqueNames.length === 0) return [];

  const existing = await db.select().from(tags).where(inArray(tags.name, uniqueNames));
  const existingNames = new Set(existing.map((tag) => tag.name));
  const created = [];

  for (const name of uniqueNames) {
    if (existingNames.has(name)) continue;
    const [tag] = await db.insert(tags).values({ name, group: 'Imported' }).returning();
    created.push(tag);
  }

  return [...existing, ...created];
}

async function main() {
  if (!process.env.DATABASE_URL && !dryRun) {
    throw new Error('DATABASE_URL is required unless --dry-run is used');
  }

  const urls = await getSitemapPromptUrls();
  const selected = (includeAll ? urls.slice(offset) : urls.slice(offset, offset + limit));
  console.log(`Found ${urls.length} prompt URLs. Processing ${selected.length}. dryRun=${dryRun}`);

  const client = dryRun ? null : postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = client ? drizzle(client) : null;
  const allModels = db ? await db.select().from(models) : [];

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const [idx, url] of selected.entries()) {
      await sleep(idx === 0 ? 0 : delayMs);

      try {
        const html = await fetchText(url);
        const item = parseJsonLd(html, url);
        const slug = `meigen-${item.id}`;
        const model = db ? pickModel(item.modelName, allModels) : null;

        if (dryRun) {
          console.log(JSON.stringify({
            slug,
            title: item.title,
            modelName: item.modelName,
            image: item.imageUrls[0],
            tags: item.keywords,
          }, null, 2));
          imported++;
          continue;
        }

        if (!db || !model) {
          skipped++;
          console.warn(`Skip ${slug}: no mapped model for "${item.modelName}"`);
          continue;
        }

        const existing = await db.select({ id: promptItems.id }).from(promptItems).where(eq(promptItems.slug, slug)).limit(1);
        if (existing.length > 0) {
          skipped++;
          console.log(`Skip ${slug}: already exists`);
          continue;
        }

        const downloaded = [];
        for (let i = 0; i < item.imageUrls.length; i++) {
          downloaded.push(await downloadImage(item.imageUrls[i], item.id, i));
        }

        const [created] = await db.insert(promptItems).values({
          title: item.title,
          slug,
          modelId: model.id,
          promptText: item.promptText,
          status: 'published',
          notes: `Imported from ${item.url}`,
          coverUrl: downloaded[0]?.url ?? null,
          coverThumbUrl: downloaded[0]?.url ?? null,
          coverWidth: downloaded[0]?.width ?? null,
          coverHeight: downloaded[0]?.height ?? null,
          createdAt: item.createdAt ?? new Date(),
          updatedAt: new Date(),
        }).returning();

        for (let i = 0; i < downloaded.length; i++) {
          const media = downloaded[i];
          await db.insert(assets).values({
            type: 'image',
            url: media.url,
            thumbUrl: media.url,
            width: media.width,
            height: media.height,
            size: media.size,
            format: media.format,
            alt: item.title,
            promptItemId: created.id,
            sort: i,
          });
        }

        const tagRows = await ensureTags(db, item.keywords);
        for (const tag of tagRows) {
          await db.insert(promptItemTags).values({
            promptItemId: created.id,
            tagId: tag.id,
          }).onConflictDoNothing();
        }

        imported++;
        console.log(`Imported ${slug}: ${item.title}`);
      } catch (error) {
        failed++;
        console.error(`Failed ${url}:`, error instanceof Error ? error.message : error);
      }
    }
  } finally {
    await client?.end();
  }

  console.log(`Done. imported=${imported} skipped=${skipped} failed=${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
