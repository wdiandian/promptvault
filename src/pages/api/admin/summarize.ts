import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { promptText } = await request.json();

    if (!promptText?.trim()) {
      return new Response(JSON.stringify({ error: 'No prompt text provided' }), { status: 400 });
    }

    const apiKey = import.meta.env.XAI_API_KEY ?? process.env.XAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'xAI API key not configured' }), { status: 500 });
    }

    const model = import.meta.env.XAI_TITLE_MODEL ?? process.env.XAI_TITLE_MODEL ?? 'grok-4-1-fast-reasoning';
    const systemPrompt = import.meta.env.XAI_TITLE_PROMPT
      ?? process.env.XAI_TITLE_PROMPT
      ?? 'You are a title generator. Given an AI generation prompt, generate a short English title (5-10 words). Only return the title.';

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptText.slice(0, 2000) },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return new Response(JSON.stringify({ error: `API error: ${res.status}` }), { status: 502 });
    }

    const data = await res.json();
    const title = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') ?? '';

    if (!title) {
      return new Response(JSON.stringify({ error: 'Empty response from AI' }), { status: 502 });
    }

    return new Response(JSON.stringify({ title }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
