import type { APIRoute } from 'astro';
import { getPresignedUploadUrl, getPublicFileUrl } from '@/lib/r2';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
];

export const POST: APIRoute = async ({ request }) => {
  try {
    const { fileName, contentType, size } = await request.json();

    if (!fileName || !contentType) {
      return new Response(JSON.stringify({ error: 'Missing fileName or contentType' }), { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return new Response(JSON.stringify({ error: `Invalid file type: ${contentType}` }), { status: 400 });
    }

    if (size && size > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 50MB)' }), { status: 400 });
    }

    const ext = fileName.split('.').pop() ?? 'bin';
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const presignedUrl = await getPresignedUploadUrl(key, contentType);
    const publicUrl = getPublicFileUrl(key);

    return new Response(JSON.stringify({ presignedUrl, publicUrl, key }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
