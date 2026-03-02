-- Migration V2: Model slugs + Blog posts table
-- Run in Supabase SQL Editor

-- 1. Add slug column to models
ALTER TABLE models ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Auto-populate slugs from existing model names
UPDATE models SET slug = lower(replace(replace(replace(name, ' ', '-'), '.', ''), '/', '')) WHERE slug IS NULL;

-- 3. Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status, created_at);
