# Local Setup Instructions for Wohlers AM Explorer

This application is a Next.js-based interactive data visualization platform for exploring North American additive manufacturing companies.

## Prerequisites

- Node.js 18+
- npm 9+
- A Supabase account (free tier: https://app.supabase.com)

## Setup Steps

### 1) Install dependencies
```bash
npm install
```

### 2) Environment variables
Create `.env.local` (or copy the example):
```bash
cp .env.local.example .env.local
```
Then set your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3) Database setup
Run the migrations in order using the Supabase SQL editor:
- `sql-migrations/001_create_am_companies_schema.sql`
- `sql-migrations/002_update_schema_for_csv_data.sql`
- `sql-migrations/003_restructure_for_equipment_data.sql`
- `sql-migrations/004_add_market_intel_tables.sql`
- `sql-migrations/005_create_market_views.sql`
- `sql-migrations/20250812_auth_profiles_preferences.sql`

### 3b) Optional demo data (for local development)
To populate charts and tables for Market Insights and Quotes Benchmark locally, run:

```
sql-migrations/006_seed_market_demo_data.sql
```
This adds:
- A demo service company with several `service_pricing` rows.
- Example `market_data` rows for totals and country/segment breakdowns.


### 4) (Optional) Import data
If you have local CSV/JSON data, update paths in the scripts under `scripts/` and run:
```bash
node scripts/import-csv-data.js
node scripts/import-equipment-csv-data.js
```
Note: This repo does not include sample data; provide your own and adjust paths.

### 5) Run the app
```bash
npm run dev
```
Open http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server (Turbopack)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/          # Authentication routes
│   ├── (dashboard-template)/
│   │   ├── dashboard/   # Main dashboard
│   │   ├── map/         # Map explorer
│   │   ├── data-table/  # Company data table
│   │   └── analytics/   # Analytics page
│   └── api/             # API routes
├── components/          # React components (shadcn/ui)
├── lib/                 # Utilities + Supabase client/queries
└── hooks/               # Custom hooks
```

## Notes

- Authentication is disabled in development; see [AUTH.md](AUTH.md) to re-enable.
- Keep `.env.local` out of version control. Use `.env.local.example` as a template.
- Optional debug banners for Market Insights/Quotes Benchmark can be enabled with `NEXT_PUBLIC_DEBUG_BENCHMARK=true` (UI shows guidance when data/views are missing). Disable or omit for normal use.

## Troubleshooting

1. Verify Node.js ≥ 18 and npm ≥ 9
2. Confirm `.env.local` values
3. Re-run SQL migrations if schema queries fail
4. Check browser console and server logs for errors
5. Playwright config can auto-start the dev server for E2E (`npx playwright test`)
