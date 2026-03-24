export const prerender = false;
import type { APIRoute } from 'astro';
import { uploadToR2 } from '@/lib/r2';

export const config = { maxDuration: 30 };

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();

    if (!url?.trim()) {
      return new Response(JSON.stringify({ error: 'No URL provided' }), { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/*,video/*,*/*',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Fetch failed: ${res.status}` }), { status: 400 });
    }

    const contentType = res.headers.get('content-type') ?? '';
    const isImage = contentType.startsWith('image/');
    const isVideo = contentType.startsWith('video/');

    if (!isImage && !isVideo) {
      return new Response(JSON.stringify({ error: `Not an image or video (${contentType})` }), { status: 400 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 50MB)' }), { status: 400 });
    }

    // Determine extension from content-type or URL
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
    };
    const ext = extMap[contentType] ?? url.split('.').pop()?.split('?')[0]?.slice(0, 5) ?? 'bin';
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const publicUrl = await uploadToR2(buffer, key, contentType);

    return new Response(JSON.stringify({
      url: publicUrl,
      type: isVideo ? 'video' : 'image',
      size: buffer.length,
      format: ext,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

