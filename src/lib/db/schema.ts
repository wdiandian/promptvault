import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const models = pgTable('models', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  type: text('type').notNull().default('image'),
  provider: text('provider'),
  version: text('version'),
  description: text('description'),
  website: text('website'),
  icon: text('icon'),
  isPinned: boolean('is_pinned').notNull().default(false),
  sort: integer('sort').notNull().default(0),
  status: text('status').notNull().default('active'),
  paramSchema: jsonb('param_schema'),
  promptTemplate: text('prompt_template'),
  color: text('color').default('#e8634a'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tags = pgTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  group: text('group'),
  color: text('color'),
  sort: integer('sort').notNull().default(0),
});

export const promptItems = pgTable('prompt_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  modelId: text('model_id').notNull().references(() => models.id),
  promptText: text('prompt_text').notNull(),
  negativePrompt: text('negative_prompt'),
  params: jsonb('params'),
  notes: text('notes'),
  author: text('author'),
  license: text('license'),
  status: text('status').notNull().default('draft'),
  views: integer('views').notNull().default(0),
  copies: integer('copies').notNull().default(0),
  coverUrl: text('cover_url'),
  coverThumbUrl: text('cover_thumb_url'),
  coverWidth: integer('cover_width'),
  coverHeight: integer('cover_height'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_prompt_model').on(table.modelId),
  index('idx_prompt_status_created').on(table.status, table.createdAt),
  index('idx_prompt_slug').on(table.slug),
]);

export const promptItemTags = pgTable('prompt_item_tags', {
  promptItemId: text('prompt_item_id').notNull().references(() => promptItems.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.promptItemId, table.tagId] }),
]);

export const assets = pgTable('assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text('type').notNull().default('image'),
  url: text('url').notNull(),
  thumbUrl: text('thumb_url'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  size: integer('size'),
  format: text('format'),
  alt: text('alt'),
  promptItemId: text('prompt_item_id').references(() => promptItems.id, { onDelete: 'cascade' }),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_asset_prompt').on(table.promptItemId),
]);
