-- Migration V4: popular sort indexes
-- These indexes match ORDER BY copies DESC, id DESC used by popular prompt pages.
-- Run each statement outside a transaction if using CONCURRENTLY.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_status_copies_id_desc
  ON prompt_items(status, copies DESC, id DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_model_status_copies_id_desc
  ON prompt_items(model_id, status, copies DESC, id DESC);
