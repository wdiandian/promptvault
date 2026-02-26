-- PromptVault: 建表 + 种子数据
-- 在 Supabase Dashboard → SQL Editor 里粘贴执行

-- ========== 1. 建表 ==========

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'image',
  provider TEXT,
  version TEXT,
  description TEXT,
  website TEXT,
  icon TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  sort INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  param_schema JSONB,
  prompt_template TEXT,
  color TEXT DEFAULT '#e8634a',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  "group" TEXT,
  color TEXT,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prompt_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  model_id TEXT NOT NULL REFERENCES models(id),
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  params JSONB,
  notes TEXT,
  author TEXT,
  license TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  views INTEGER NOT NULL DEFAULT 0,
  copies INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  cover_thumb_url TEXT,
  cover_width INTEGER,
  cover_height INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_model ON prompt_items(model_id);
CREATE INDEX IF NOT EXISTS idx_prompt_status_created ON prompt_items(status, created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_slug ON prompt_items(slug);

CREATE TABLE IF NOT EXISTS prompt_item_tags (
  prompt_item_id TEXT NOT NULL REFERENCES prompt_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  thumb_url TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  size INTEGER,
  format TEXT,
  alt TEXT,
  prompt_item_id TEXT REFERENCES prompt_items(id) ON DELETE CASCADE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_prompt ON assets(prompt_item_id);

-- ========== 2. 种子数据: 模型 ==========

INSERT INTO models (id, name, type, version, is_pinned, sort, color, website) VALUES
  ('m1', 'Midjourney v6', 'image', 'v6.1', true, 1, '#E8D44D', 'https://midjourney.com'),
  ('m2', 'FLUX.1 Pro', 'image', '1.0', true, 2, '#34D399', 'https://blackforestlabs.ai'),
  ('m3', 'Stable Diffusion XL', 'image', '1.0', true, 3, '#A78BFA', 'https://stability.ai'),
  ('m4', 'DALL-E 3', 'image', '3', true, 4, '#38BDF8', 'https://openai.com/dall-e-3'),
  ('m5', 'Sora', 'video', '1.0', false, 5, '#F87171', 'https://openai.com/sora'),
  ('m6', 'Runway Gen-3', 'video', 'Alpha', false, 6, '#2DD4BF', 'https://runwayml.com'),
  ('m7', 'Kling 2.0', 'video', '2.0', false, 7, '#818CF8', 'https://klingai.com'),
  ('m8', 'Imagen 3', 'image', '3', false, 8, '#fde047', 'https://deepmind.google')
ON CONFLICT (name) DO NOTHING;

-- ========== 3. 种子数据: 标签 ==========

INSERT INTO tags (id, name, "group", sort) VALUES
  ('t1', 'Landscape', 'Subject', 1),
  ('t2', 'Portrait', 'Subject', 2),
  ('t3', 'Anime', 'Style', 3),
  ('t4', 'Cyberpunk', 'Style', 4),
  ('t5', 'Fantasy', 'Style', 5),
  ('t6', 'Product', 'Subject', 6),
  ('t7', 'Architecture', 'Subject', 7),
  ('t8', 'Cinematic', 'Style', 8),
  ('t9', 'Watercolor', 'Style', 9),
  ('t10', '3D', 'Style', 10),
  ('t11', 'Minimal', 'Style', 11),
  ('t12', 'Sci-Fi', 'Style', 12),
  ('t13', 'Neon', 'Style', 13),
  ('t14', 'Photo', 'Style', 14),
  ('t15', 'Macro', 'Camera', 15),
  ('t16', 'Aerial', 'Camera', 16)
ON CONFLICT (name) DO NOTHING;

-- ========== 4. 种子数据: 提示词 ==========

INSERT INTO prompt_items (id, title, slug, model_id, prompt_text, negative_prompt, params, notes, status, views, copies, cover_url, cover_width, cover_height) VALUES
(
  'p1',
  'Cyberpunk City at Sunset',
  'cyberpunk-city-at-sunset',
  'm1',
  'A breathtaking cyberpunk cityscape at golden hour, massive holographic advertisements floating between towering skyscrapers, neon lights reflecting off wet streets, flying vehicles leaving light trails, a lone figure standing on a rooftop overlooking the city, volumetric fog, ray tracing, ultra detailed, cinematic composition, dramatic lighting, 8k resolution --ar 4:5 --stylize 750 --v 6.1',
  'blurry, low quality, deformed, watermark, text, signature, jpeg artifacts',
  '{"--ar": "4:5", "--stylize": "750", "--v": "6.1", "--chaos": "15", "--style": "raw"}',
  'Use Midjourney v6.1 with --style raw for best results.',
  'published', 2419, 891,
  'https://picsum.photos/seed/cyber1/800/1000', 800, 1000
),
(
  'p2',
  'Watercolor Floral Still Life',
  'watercolor-floral-still-life',
  'm3',
  'Delicate watercolor painting of a bouquet of wildflowers in a glass vase, soft natural light streaming through a window, visible brushstrokes, paper texture, pastel color palette, traditional art style, high detail botanical illustration',
  NULL,
  '{"seed": "42819", "steps": "30", "cfg": "7.5", "sampler": "DPM++ 2M Karras"}',
  NULL,
  'published', 1832, 445,
  'https://picsum.photos/seed/flora1/800/680', 800, 680
),
(
  'p3',
  'Fantasy Forest Elf',
  'fantasy-forest-elf',
  'm4',
  'An ethereal elf standing in a mystical forest clearing, bioluminescent plants and mushrooms casting blue and green light, ancient trees with twisted roots, fireflies dancing around, morning mist, intricate elven armor with nature motifs, painterly style',
  NULL,
  '{"quality": "hd", "size": "1024x1792", "style": "vivid"}',
  NULL,
  'published', 3201, 1203,
  'https://picsum.photos/seed/elf1/800/1000', 800, 1000
),
(
  'p4',
  'Futuristic Architecture Concept',
  'futuristic-architecture-concept',
  'm2',
  'Futuristic sustainable architecture, a sweeping organic building covered in vertical gardens, curved glass facades reflecting clouds, floating walkways, a mix of nature and technology, dramatic sky at dusk, architectural visualization, ultra-wide angle, photorealistic rendering',
  NULL,
  '{"guidance": "3.5", "steps": "28", "seed": "7712", "aspect_ratio": "16:9"}',
  NULL,
  'published', 987, 312,
  'https://picsum.photos/seed/arch1/800/500', 800, 500
),
(
  'p5',
  'Japanese Film Portrait',
  'japanese-film-portrait',
  'm1',
  'Young woman sitting at a cafe window in Tokyo, shot on Fujifilm Superia 400, soft natural light, slight grain, warm tones with green shadows, shallow depth of field, candid moment, street photography aesthetic, vintage film look --ar 3:4 --stylize 200 --v 6.1',
  NULL,
  '{"--ar": "3:4", "--stylize": "200", "--v": "6.1"}',
  NULL,
  'published', 2877, 1102,
  'https://picsum.photos/seed/port1/800/1060', 800, 1060
),
(
  'p6',
  'Sci-Fi Space Station Interior',
  'sci-fi-space-station-interior',
  'm1',
  'Interior of a vast space station observation deck, floor-to-ceiling windows showing Earth below, sleek minimalist design with warm ambient lighting, a few plants in modern planters, a single astronaut gazing outward, hard science fiction aesthetic --ar 16:9 --stylize 600 --v 6.1',
  NULL,
  '{"--ar": "16:9", "--stylize": "600", "--v": "6.1", "--style": "raw"}',
  NULL,
  'published', 1654, 623,
  'https://picsum.photos/seed/space1/800/450', 800, 450
),
(
  'p7',
  'Low-Poly Mountain Range',
  'low-poly-mountain-range',
  'm4',
  'Low-poly geometric mountain landscape at sunrise, faceted triangular surfaces with soft gradient colors, a calm lake in the foreground reflecting the mountains, minimalist composition, digital art, clean vector style',
  NULL,
  '{"quality": "hd", "size": "1792x1024", "style": "natural"}',
  NULL,
  'published', 756, 289,
  'https://picsum.photos/seed/poly1/800/460', 800, 460
),
(
  'p8',
  'Iceland Aurora Landscape',
  'iceland-aurora-landscape',
  'm2',
  'Dramatic aurora borealis over Iceland black sand beach, towering green and purple lights reflecting in still water, dark volcanic rocks in foreground, long exposure photography style, ultra sharp, vibrant colors against dark sky',
  NULL,
  '{"guidance": "4.0", "steps": "30", "seed": "9901", "aspect_ratio": "16:9"}',
  NULL,
  'published', 2190, 876,
  'https://picsum.photos/seed/aurora1/800/500', 800, 500
)
ON CONFLICT (slug) DO NOTHING;

-- ========== 5. 种子数据: 提示词-标签关联 ==========

INSERT INTO prompt_item_tags (prompt_item_id, tag_id) VALUES
  ('p1', 't4'), ('p1', 't13'), ('p1', 't8'),
  ('p2', 't9'), ('p2', 't6'),
  ('p3', 't5'), ('p3', 't2'),
  ('p4', 't7'), ('p4', 't8'),
  ('p5', 't2'), ('p5', 't14'), ('p5', 't8'),
  ('p6', 't12'), ('p6', 't8'),
  ('p7', 't10'), ('p7', 't11'), ('p7', 't1'),
  ('p8', 't1'), ('p8', 't14')
ON CONFLICT DO NOTHING;
