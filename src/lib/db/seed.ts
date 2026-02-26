import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { models, tags, promptItems, promptItemTags } from './schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const MODELS_DATA = [
  { name: 'Midjourney v6', type: 'image', version: 'v6.1', isPinned: true, sort: 1, color: '#E8D44D', website: 'https://midjourney.com' },
  { name: 'FLUX.1 Pro', type: 'image', version: '1.0', isPinned: true, sort: 2, color: '#34D399', website: 'https://blackforestlabs.ai' },
  { name: 'Stable Diffusion XL', type: 'image', version: '1.0', isPinned: true, sort: 3, color: '#A78BFA', website: 'https://stability.ai' },
  { name: 'DALL-E 3', type: 'image', version: '3', isPinned: true, sort: 4, color: '#38BDF8', website: 'https://openai.com/dall-e-3' },
  { name: 'Sora', type: 'video', version: '1.0', isPinned: false, sort: 5, color: '#F87171', website: 'https://openai.com/sora' },
  { name: 'Runway Gen-3', type: 'video', version: 'Alpha', isPinned: false, sort: 6, color: '#2DD4BF', website: 'https://runwayml.com' },
  { name: 'Kling 2.0', type: 'video', version: '2.0', isPinned: false, sort: 7, color: '#818CF8', website: 'https://klingai.com' },
  { name: 'Seedance 2.0', type: 'video', version: '2.0', isPinned: false, sort: 8, color: '#FB923C', website: 'https://seedance.ai' },
  { name: 'Imagen 3', type: 'image', version: '3', isPinned: false, sort: 9, color: '#fde047', website: 'https://deepmind.google' },
];

const TAGS_DATA = [
  { name: 'Landscape', group: 'Subject', sort: 1 },
  { name: 'Portrait', group: 'Subject', sort: 2 },
  { name: 'Anime', group: 'Style', sort: 3 },
  { name: 'Cyberpunk', group: 'Style', sort: 4 },
  { name: 'Fantasy', group: 'Style', sort: 5 },
  { name: 'Product', group: 'Subject', sort: 6 },
  { name: 'Architecture', group: 'Subject', sort: 7 },
  { name: 'Cinematic', group: 'Style', sort: 8 },
  { name: 'Watercolor', group: 'Style', sort: 9 },
  { name: '3D', group: 'Style', sort: 10 },
  { name: 'Minimal', group: 'Style', sort: 11 },
  { name: 'Sci-Fi', group: 'Style', sort: 12 },
  { name: 'Neon', group: 'Style', sort: 13 },
  { name: 'Photo', group: 'Style', sort: 14 },
  { name: 'Macro', group: 'Camera', sort: 15 },
  { name: 'Aerial', group: 'Camera', sort: 16 },
];

const PROMPTS_DATA = [
  {
    title: 'Cyberpunk City at Sunset',
    slug: 'cyberpunk-city-at-sunset',
    modelIdx: 0,
    promptText: 'A breathtaking cyberpunk cityscape at golden hour, massive holographic advertisements floating between towering skyscrapers, neon lights reflecting off wet streets, flying vehicles leaving light trails, a lone figure standing on a rooftop overlooking the city, volumetric fog, ray tracing, ultra detailed, cinematic composition, dramatic lighting, 8k resolution --ar 4:5 --stylize 750 --v 6.1',
    negativePrompt: 'blurry, low quality, deformed, watermark, text, signature, jpeg artifacts',
    params: { '--ar': '4:5', '--stylize': '750', '--v': '6.1', '--chaos': '15', '--style': 'raw' },
    notes: 'Use Midjourney v6.1 with --style raw for best results.',
    tags: ['Cyberpunk', 'Neon', 'Cinematic'],
    coverUrl: 'https://picsum.photos/seed/cyber1/800/1000',
    views: 2419, copies: 891,
  },
  {
    title: 'Watercolor Floral Still Life',
    slug: 'watercolor-floral-still-life',
    modelIdx: 2,
    promptText: 'Delicate watercolor painting of a bouquet of wildflowers in a glass vase, soft natural light streaming through a window, visible brushstrokes, paper texture, pastel color palette, traditional art style, high detail botanical illustration',
    params: { seed: '42819', steps: '30', cfg: '7.5', sampler: 'DPM++ 2M Karras' },
    tags: ['Watercolor', 'Product'],
    coverUrl: 'https://picsum.photos/seed/flora1/800/680',
    views: 1832, copies: 445,
  },
  {
    title: 'Fantasy Forest Elf',
    slug: 'fantasy-forest-elf',
    modelIdx: 3,
    promptText: 'An ethereal elf standing in a mystical forest clearing, bioluminescent plants and mushrooms casting blue and green light, ancient trees with twisted roots, fireflies dancing around, morning mist, intricate elven armor with nature motifs, painterly style',
    params: { quality: 'hd', size: '1024x1792', style: 'vivid' },
    tags: ['Fantasy', 'Portrait'],
    coverUrl: 'https://picsum.photos/seed/elf1/800/1000',
    views: 3201, copies: 1203,
  },
  {
    title: 'Futuristic Architecture Concept',
    slug: 'futuristic-architecture-concept',
    modelIdx: 1,
    promptText: 'Futuristic sustainable architecture, a sweeping organic building covered in vertical gardens, curved glass facades reflecting clouds, floating walkways, a mix of nature and technology, dramatic sky at dusk, architectural visualization, ultra-wide angle, photorealistic rendering',
    params: { guidance: '3.5', steps: '28', seed: '7712', aspect_ratio: '16:9' },
    tags: ['Architecture', 'Cinematic'],
    coverUrl: 'https://picsum.photos/seed/arch1/800/500',
    views: 987, copies: 312,
  },
  {
    title: 'Japanese Film Portrait',
    slug: 'japanese-film-portrait',
    modelIdx: 0,
    promptText: 'Young woman sitting at a cafe window in Tokyo, shot on Fujifilm Superia 400, soft natural light, slight grain, warm tones with green shadows, shallow depth of field, candid moment, street photography aesthetic, vintage film look --ar 3:4 --stylize 200 --v 6.1',
    params: { '--ar': '3:4', '--stylize': '200', '--v': '6.1' },
    tags: ['Portrait', 'Photo', 'Cinematic'],
    coverUrl: 'https://picsum.photos/seed/port1/800/1060',
    views: 2877, copies: 1102,
  },
  {
    title: 'Sci-Fi Space Station Interior',
    slug: 'sci-fi-space-station-interior',
    modelIdx: 0,
    promptText: 'Interior of a vast space station observation deck, floor-to-ceiling windows showing Earth below, sleek minimalist design with warm ambient lighting, a few plants in modern planters, a single astronaut gazing outward, hard science fiction aesthetic --ar 16:9 --stylize 600 --v 6.1',
    params: { '--ar': '16:9', '--stylize': '600', '--v': '6.1', '--style': 'raw' },
    tags: ['Sci-Fi', 'Cinematic'],
    coverUrl: 'https://picsum.photos/seed/space1/800/450',
    views: 1654, copies: 623,
  },
  {
    title: 'Low-Poly Mountain Range',
    slug: 'low-poly-mountain-range',
    modelIdx: 3,
    promptText: 'Low-poly geometric mountain landscape at sunrise, faceted triangular surfaces with soft gradient colors, a calm lake in the foreground reflecting the mountains, minimalist composition, digital art, clean vector style',
    params: { quality: 'hd', size: '1792x1024', style: 'natural' },
    tags: ['3D', 'Minimal', 'Landscape'],
    coverUrl: 'https://picsum.photos/seed/poly1/800/460',
    views: 756, copies: 289,
  },
  {
    title: 'Iceland Aurora Landscape',
    slug: 'iceland-aurora-landscape',
    modelIdx: 1,
    promptText: 'Dramatic aurora borealis over Iceland black sand beach, towering green and purple lights reflecting in still water, dark volcanic rocks in foreground, long exposure photography style, ultra sharp, vibrant colors against dark sky',
    params: { guidance: '4.0', steps: '30', seed: '9901', aspect_ratio: '16:9' },
    tags: ['Landscape', 'Photo'],
    coverUrl: 'https://picsum.photos/seed/aurora1/800/500',
    views: 2190, copies: 876,
  },
];

async function seed() {
  console.log('Seeding database...');

  console.log('  Inserting models...');
  const insertedModels = await db.insert(models).values(MODELS_DATA).returning();
  console.log(`  ✓ ${insertedModels.length} models`);

  console.log('  Inserting tags...');
  const insertedTags = await db.insert(tags).values(TAGS_DATA).returning();
  const tagMap = Object.fromEntries(insertedTags.map((t) => [t.name, t.id]));
  console.log(`  ✓ ${insertedTags.length} tags`);

  console.log('  Inserting prompts...');
  for (const p of PROMPTS_DATA) {
    const model = insertedModels[p.modelIdx];
    const [item] = await db.insert(promptItems).values({
      title: p.title,
      slug: p.slug,
      modelId: model.id,
      promptText: p.promptText,
      negativePrompt: p.negativePrompt ?? null,
      params: p.params,
      notes: p.notes ?? null,
      status: 'published',
      views: p.views,
      copies: p.copies,
      coverUrl: p.coverUrl,
      coverWidth: 800,
      coverHeight: parseInt(p.coverUrl.split('/').pop()!) || 600,
    }).returning();

    for (const tagName of p.tags) {
      if (tagMap[tagName]) {
        await db.insert(promptItemTags).values({
          promptItemId: item.id,
          tagId: tagMap[tagName],
        });
      }
    }
  }
  console.log(`  ✓ ${PROMPTS_DATA.length} prompts`);

  console.log('Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
