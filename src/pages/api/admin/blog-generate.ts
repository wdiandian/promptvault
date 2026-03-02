import type { APIRoute } from 'astro';

export const config = { maxDuration: 60 };

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url, context } = await request.json();

    if (!url?.trim()) {
      return new Response(JSON.stringify({ error: 'No URL provided' }), { status: 400 });
    }

    const apiKey = import.meta.env.XAI_API_KEY ?? process.env.XAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'xAI API key not configured' }), { status: 500 });
    }
    const blogModel = import.meta.env.XAI_BLOG_MODEL ?? process.env.XAI_BLOG_MODEL ?? 'grok-4-1-fast-reasoning';

    // Step 1: Fetch the page content
    // For X/Twitter, YouTube, and other hard-to-scrape sites, skip fetching and let AI use its knowledge
    const skipFetchDomains = ['x.com', 'twitter.com', 'youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 'weixin.qq.com', 'mp.weixin.qq.com'];
    const urlDomain = new URL(url).hostname.replace('www.', '');
    const shouldSkipFetch = skipFetchDomains.some((d) => urlDomain === d || urlDomain.endsWith('.' + d));

    let pageContent = '';

    const userContext = context ? `\n\nUser-provided description of this content:\n${context}` : '';

    if (shouldSkipFetch) {
      pageContent = `URL: ${url}${userContext}\n\nThis is a social media / video platform link. Write the article based on the user's description above. If no description is provided, use your knowledge about this URL.`;
    } else try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
      });

      if (!pageRes.ok) {
        return new Response(JSON.stringify({ error: `Failed to fetch URL: ${pageRes.status}` }), { status: 400 });
      }

      const html = await pageRes.text();

      // Try to extract <article> or <main> content first
      let extracted = '';
      const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
      const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
      const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);

      const rawHtml = articleMatch?.[0] ?? mainMatch?.[0] ?? bodyMatch?.[0] ?? html;

      extracted = rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<aside[\s\S]*?<\/aside>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      pageContent = extracted.slice(0, 8000) + userContext;
    } catch (fetchErr: any) {
      return new Response(JSON.stringify({ error: `Fetch error: ${fetchErr.message}` }), { status: 400 });
    }

    if (pageContent.length < 30) {
      // If direct fetch failed, ask AI to generate based on URL alone
      pageContent = `The URL is: ${url}. Please write a blog article based on what you know about this topic. The URL suggests the content is about: ${url.replace(/https?:\/\//, '').replace(/[\/\-_]/g, ' ')}`;
    }

    // Step 2: Single API call - summarize then write (avoids Vercel 10s timeout)
    const blogPrompt = import.meta.env.XAI_BLOG_PROMPT ?? process.env.XAI_BLOG_PROMPT ??
      `You are a professional blog writer for GetPT (getpt.net), an AI prompt gallery website.

Your task has TWO steps. Do them internally before responding:

STEP 1 - UNDERSTAND: First, carefully analyze the provided content. Identify the main topic, key facts, features, and insights. Be factual and accurate. If the user provided a description, trust that over scraped content.

STEP 2 - WRITE: Based on your analysis, write an engaging blog article in English.

Article requirements:
- Markdown format with ## section headings
- Compelling introduction that hooks the reader
- Practical tips, insights, or prompt examples where relevant
- SEO-friendly, informative, professional but approachable tone
- 600-1200 words
- End with a conclusion linking to getpt.net gallery

Return ONLY this JSON (no other text):
{"title": "Article Title", "excerpt": "1-2 sentence summary", "content": "Full markdown article"}`;

    const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: blogModel,
        messages: [
          { role: 'system', content: blogPrompt },
          { role: 'user', content: `Source URL: ${url}\n\nContent to analyze:\n${pageContent}` },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!grokRes.ok) {
      const errText = await grokRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: `API error: ${grokRes.status} ${errText.slice(0, 200)}` }), { status: 502 });
    }

    const glmData = await grokRes.json();
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
