import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();

    if (!url?.trim()) {
      return new Response(JSON.stringify({ error: 'No URL provided' }), { status: 400 });
    }

    const apiKey = import.meta.env.GLM_API_KEY ?? process.env.GLM_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GLM API key not configured' }), { status: 500 });
    }

    // Step 1: Fetch the page content
    let pageContent = '';
    try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GetPT Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!pageRes.ok) {
        return new Response(JSON.stringify({ error: `Failed to fetch URL: ${pageRes.status}` }), { status: 400 });
      }

      const html = await pageRes.text();

      // Extract text content from HTML (simple strip tags)
      pageContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000);
    } catch (fetchErr: any) {
      return new Response(JSON.stringify({ error: `Fetch error: ${fetchErr.message}` }), { status: 400 });
    }

    if (pageContent.length < 50) {
      return new Response(JSON.stringify({ error: 'Page content too short or empty' }), { status: 400 });
    }

    // Step 2: Generate blog article with GLM-4
    const blogPrompt = import.meta.env.GLM_BLOG_PROMPT ?? process.env.GLM_BLOG_PROMPT ??
      `You are a professional blog writer for an AI prompt gallery website called GetPT (getpt.net). 
Given the content from a web page, write an engaging blog article in English.

Requirements:
- Write in Markdown format
- Start with a compelling introduction
- Use ## for section headings
- Include practical tips and insights
- Keep it informative and SEO-friendly
- Length: 600-1200 words
- Tone: professional but approachable
- If the content is about an AI model or tool, include practical prompt examples
- End with a conclusion or call-to-action linking to the gallery

Return your response in this exact JSON format:
{"title": "Article Title Here", "excerpt": "A 1-2 sentence summary", "content": "Full markdown article content here"}`;

    const glmRes = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: blogPrompt },
          { role: 'user', content: `Source URL: ${url}\n\nPage content:\n${pageContent}` },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!glmRes.ok) {
      return new Response(JSON.stringify({ error: `GLM API error: ${glmRes.status}` }), { status: 502 });
    }

    const glmData = await glmRes.json();
    const rawOutput = glmData.choices?.[0]?.message?.content?.trim() ?? '';

    // Parse JSON response from GLM
    let result: { title: string; excerpt: string; content: string };
    try {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      result = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback: use raw output as content
      result = {
        title: 'Generated Article',
        excerpt: '',
        content: rawOutput,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
