-- Migration V3: gallery performance indexes
-- Run in Supabase SQL Editor.
-- Supabase SQL Editor wraps scripts in a transaction, so do not use CONCURRENTLY here.

CREATE INDEX IF NOT EXISTS idx_models_status_sort
  ON models(status, is_pinned, sort);

CREATE INDEX IF NOT EXISTS idx_tags_sort
  ON tags(sort);

CREATE INDEX IF NOT EXISTS idx_prompt_status_copies
  ON prompt_items(status, copies);

CREATE INDEX IF NOT EXISTS idx_prompt_model_status_created
  ON prompt_items(model_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_prompt_model_status_copies
  ON prompt_items(model_id, status, copies);

CREATE INDEX IF NOT EXISTS idx_prompt_item_tags_tag_prompt
  ON prompt_item_tags(tag_id, prompt_item_id);
