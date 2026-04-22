import type { APIRoute } from 'astro';
import { generateImage } from '../../../lib/haiyi/cliService';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { prompt, params, imageUrls, apiIds, payloadTemplate } = body;

    console.log('[route/image] params:', JSON.stringify(params));
    
    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: 'prompt 不能为空' }), { status: 400 });
    }
    if (!apiIds || !payloadTemplate) {
      return new Response(JSON.stringify({ error: '缺少 apiIds 或 payloadTemplate' }), { status: 400 });
    }

    const urls = await generateImage({
      prompt: prompt.trim(),
      params: params ?? {},
      imageUrls: imageUrls ?? [],
      apiIds,
      payloadTemplate,
    });

    return new Response(JSON.stringify({ urls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[haiyi/image]', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
