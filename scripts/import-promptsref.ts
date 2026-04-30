import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import { assets, models, promptItems, promptItemTags, tags } from '../src/lib/db/schema';

const SOURCE_URL = 'https://promptsref.com/library/gpt-image';
const IMAGE_DIR = path.join(process.cwd(), 'public', 'imports', 'promptsref');
const PUBLIC_IMAGE_PREFIX = '/imports/promptsref';

type SourceItem = {
  id: number;
  output_image_url: string;
  prompt: string;
  model: string;
  created_at?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'PromptVault content importer (+https://getpt.net)',
      accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

function extractFlight(html: string) {
  let flight = '';
  for (const match of html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)<\/script>/g)) {
    flight += JSON.parse(`"${match[1]}"`);
  }
  return flight;
}

function extractTextRefs(flight: string) {
  const refs = new Map<string, string>();
  for (const match of flight.matchAll(/([0-9a-f]+):T([0-9a-f]+),/g)) {
    const start = (match.index ?? 0) + match[0].length;
    const length = parseInt(match[2], 16);
    refs.set(match[1], flight.slice(start, start + length));
  }
  return refs;
}

function parseItems(html: string) {
  const flight = extractFlight(html);
  const refs = extractTextRefs(flight);
  const items: SourceItem[] = [];

  for (const match of flight.matchAll(/\{\"id\":\d+,[\s\S]*?"has_prompt":true\}/g)) {
    const item = JSON.parse(match[0]) as SourceItem;
    const ref = item.prompt.match(/^\$([0-9a-f]+)$/)?.[1];
    if (ref) item.prompt = refs.get(ref) ?? '';
    if (item.prompt?.trim() && item.output_image_url && item.model?.startsWith('gpt-image/')) {
      items.push(item);
    }
  }

  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function textTitle(promptText: string) {
  const cleaned = promptText
    .replace(/<[^>]+>/g, ' ')
    .split(/\n+/)
    .map((line) => line.replace(/[{}[\]",]/g, ' ').replace(/\s+/g, ' ').trim())
    .find((line) => /[a-z0-9\u4e00-\u9fff]/i.test(line) && line.replace(/[^\p{L}\p{N}]/gu, '').length >= 8)
    ?? promptText.replace(/\s+/g, ' ').trim();
  return cleaned.length > 82 ? `${cleaned.slice(0, 79).trim()}...` : cleaned || 'Imported GPT Image Prompt';
}

function extFromContentType(contentType: string, fallbackUrl: string) {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  const match = new URL(fallbackUrl).pathname.match(/\.(jpg|jpeg|png|webp)$/i);
  return match ? `.${match[1].toLowerCase().replace('jpeg', 'jpg')}` : '.png';
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

async function downloadImage(url: string, id: number) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'PromptVault content importer (+https://getpt.net)',
      accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`Image ${res.status} ${res.statusText}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = extFromContentType(res.headers.get('content-type') ?? '', url);
  const filename = `${id}${ext}`;
  await mkdir(IMAGE_DIR, { recursive: true });
  await writeFile(path.join(IMAGE_DIR, filename), buffer);

  const size = readImageSize(buffer);
  return {
    url: `${PUBLIC_IMAGE_PREFIX}/${filename}`,
    width: size.width,
    height: size.height,
    size: buffer.length,
    format: ext.slice(1),
  };
}

async function ensureTags(db: ReturnType<typeof drizzle>, names: string[]) {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
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
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  const html = await fetchText(SOURCE_URL);
  const sourceItems = parseItems(html);
  console.log(`Found ${sourceItems.length} public first-screen GPT Image items`);

  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const [gptImageModel] = await db.select().from(models).where(eq(models.name, 'GPT image 2')).limit(1);
    if (!gptImageModel) throw new Error('Model "GPT image 2" not found');

    const tagRows = await ensureTags(db, ['GPT Image', 'PromptsRef']);

    for (const item of sourceItems) {
      const slug = `promptsref-${item.id}`;
      try {
        const existing = await db.select({ id: promptItems.id }).from(promptItems).where(eq(promptItems.slug, slug)).limit(1);
        if (existing.length > 0) {
          skipped++;
          console.log(`Skip ${slug}: already exists`);
          continue;
        }

        await sleep(imported + skipped === 0 ? 0 : 150);
        const image = await downloadImage(item.output_image_url, item.id);
        const title = textTitle(item.prompt);

        const [created] = await db.insert(promptItems).values({
          title,
          slug,
          modelId: gptImageModel.id,
          promptText: item.prompt.trim(),
          status: 'published',
          notes: `Imported from ${SOURCE_URL}`,
          coverUrl: image.url,
          coverThumbUrl: image.url,
          coverWidth: image.width,
          coverHeight: image.height,
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          updatedAt: new Date(),
        }).returning();

        await db.insert(assets).values({
          type: 'image',
          url: image.url,
          thumbUrl: image.url,
          width: image.width,
          height: image.height,
          size: image.size,
          format: image.format,
          alt: title,
          promptItemId: created.id,
          sort: 0,
        });

        for (const tag of tagRows) {
          await db.insert(promptItemTags).values({
            promptItemId: created.id,
            tagId: tag.id,
          }).onConflictDoNothing();
        }

        imported++;
        console.log(`Imported ${slug}: ${title}`);
      } catch (error) {
        failed++;
        console.error(`Failed ${slug}:`, error instanceof Error ? error.message : error);
      }
    }
  } finally {
    await client.end();
  }

  console.log(`Done. imported=${imported} skipped=${skipped} failed=${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
