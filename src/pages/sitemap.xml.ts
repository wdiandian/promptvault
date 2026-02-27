import type { APIRoute } from 'astro';
import { db } from '@/lib/db/index';
import { promptItems } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  const siteUrl = 'https://getpt.net';

  const prompts = await db
    .select({ slug: promptItems.slug, updatedAt: promptItems.updatedAt })
    .from(promptItems)
    .where(eq(promptItems.status, 'published'))
    .orderBy(desc(promptItems.updatedAt));

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/gallery', priority: '0.9', changefreq: 'daily' },
    { url: '/privacy', priority: '0.1', changefreq: 'yearly' },
    { url: '/terms', priority: '0.1', changefreq: 'yearly' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((p) => `  <url>
    <loc>${siteUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${prompts.map((p) => `  <url>
    <loc>${siteUrl}/prompt/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
