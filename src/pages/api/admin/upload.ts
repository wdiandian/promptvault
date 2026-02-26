import type { APIRoute } from 'astro';
import { uploadToR2 } from '@/lib/r2';
import { db } from '@/lib/db/index';
import { assets } from '@/lib/db/schema';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const promptItemId = formData.get('promptItemId') as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large (max 50MB)' }), { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'bin';
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, key, file.type);

    const isVideo = file.type.startsWith('video/');

    const [asset] = await db.insert(assets).values({
      type: isVideo ? 'video' : 'image',
      url,
      format: ext,
      size: file.size,
      alt: file.name,
      promptItemId: promptItemId || null,
    }).returning();

    return new Response(JSON.stringify(asset), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
