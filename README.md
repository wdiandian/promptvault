# PromptVault

Curated AI prompt gallery with pixel-perfect reproduction.

## Tech Stack

- **Framework**: Astro 5 (SSR)
- **UI Islands**: React 19
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Media Storage**: Cloudflare R2
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Supabase project
- Cloudflare R2 bucket

### Setup

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Push database schema
pnpm db:push

# Seed initial data
pnpm db:seed

# Start dev server
pnpm dev
```

### Environment Variables

See `.env.example` for all required variables.

## Project Structure

```
src/
├── components/     # Astro + React components
├── layouts/        # BaseLayout, AdminLayout
├── lib/            # DB, R2, utilities
├── pages/          # Routes (SSR)
│   ├── api/        # API endpoints
│   ├── admin/      # Admin pages
│   └── prompt/     # Detail pages [slug]
└── styles/         # Global CSS
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:studio` | Open Drizzle Studio |
