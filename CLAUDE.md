# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Essential Commands:**
- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build (required before deployment)
- `npm run lint` - ESLint checking
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run data:extract` - Extract data from Excel sheets (requires local data files)
- `npm run data:import` - Import CSV data to Supabase (requires local data files)

**Testing Commands:**
- `npx playwright test` - Run E2E tests headless
- `npx playwright test --ui` - Run E2E tests with Playwright UI
- `npx playwright test --headed` - Run E2E tests in headed mode

**Database Setup:**
SQL migrations must be run in order through Supabase SQL editor:
1. `sql-migrations/001_create_am_companies_schema.sql`
2. `sql-migrations/002_update_schema_for_csv_data.sql` 
3. `sql-migrations/003_restructure_for_equipment_data.sql`
4. `sql-migrations/004_add_market_intel_tables.sql`
5. `sql-migrations/005_create_market_views.sql`
6. `sql-migrations/20250812_auth_profiles_preferences.sql`
7. `sql-migrations/006_seed_market_demo_data.sql` (optional demo data)

## Architecture Overview

**Framework Stack:**
- Next.js 15 with App Router (React 18 + TypeScript)
- Supabase for database, auth, and real-time features
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS 4 for styling
- Leaflet for interactive mapping
- Recharts for data visualization

**Core Application Structure:**
The app follows Next.js App Router patterns with route groups:
- `(auth)/` - Authentication flows (login, register, reset password)
- `(dashboard-template)/` - Protected dashboard pages with shared layout
- `api/` - Server-side API routes for data fetching

**Data Flow Architecture:**
1. **Client-side queries** via `src/lib/supabase/client-queries.ts` for real-time UI updates
2. **Server-side queries** via `src/lib/supabase/queries.ts` for API routes and server components
3. **API routes** provide cached, filtered data endpoints with query parameter support
4. **In-memory caching** implemented in API routes (60-second TTL for search results)

**Key Data Entities:**
- `companies` - Core AM company data with location, type, and metadata
- `technologies`, `materials`, `equipment` - Manufacturing capabilities data
- `investments`, `mergers_acquisitions` - Financial data
- `service_pricing` - Pricing/quote data for benchmarking
- `profiles`, `user_preferences`, `saved_searches` - User auth and personalization

**Component Architecture:**
- **Page-level content components** (e.g., `data-table-content.tsx`, `map-explorer-content.tsx`) handle complex state and data fetching
- **UI components** from shadcn/ui provide consistent design system
- **Custom hooks** in `src/hooks/` for reusable logic (mobile detection, etc.)

## Authentication System

**Current State:** Authentication is DISABLED for development. To re-enable:
1. Uncomment middleware.ts auth logic
2. Remove auto-redirect from src/app/page.tsx  
3. Remove "Bypass Auth (Dev Mode)" button from login
4. Restore auth checks in src/lib/user/client.ts

**Auth Features When Enabled:**
- Email/password auth with Supabase
- Social login (Google configured, GitHub planned)
- Role-based access control (basic/premium/admin roles)
- User profiles with preferences and saved searches
- Protected routes via middleware

## Deployment Configuration

**Vercel Settings:**
- Build command: `npm run build`
- Install command: `npm install --legacy-peer-deps` (required for peer dependency resolution)
- Framework: Next.js
- Output directory: `.next`

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_DEBUG_BENCHMARK=true` (optional, shows debug UI for missing data)

**Branch Strategy:**
- Production deployments from `main` branch only
- Preview deployments from feature branches (e.g., `feature/market-insights`)

## Data Import and Management

**Import Scripts:**
- `scripts/extract-excel-sheets.js` - Converts Excel files to JSON/CSV
- `scripts/import-csv-data.js` - Imports company data to Supabase
- `scripts/import-equipment-csv-data.js` - Imports equipment/technology data

**Data Sources:**
The application expects AM company data including:
- Company information (name, location, website, employee count, revenue)
- Technology capabilities (3D printing processes, materials)
- Geographic coordinates for map visualization
- Market intelligence and pricing data

## Key Integration Points

**Supabase Integration:**
- Real-time subscriptions for live data updates
- Row Level Security (RLS) policies for data access control
- Server-side client for API routes, client-side for interactive features
- Database views for complex market intelligence queries

**Map Integration:**
- Leaflet with React-Leaflet for interactive mapping
- Company clustering and marker customization
- Coordinate-based geographic filtering

**Export System:**
- Multi-format exports (CSV, JSON, Excel) using html2canvas for chart exports
- Client-side data processing and download generation

## Development Notes

**Testing Strategy:**
- E2E tests with Playwright cover critical user flows
- Tests auto-start dev server via playwright.config.ts
- Test files in `e2e/` directory with descriptive naming

**Performance Optimizations:**
- API route caching with TTL-based invalidation
- Lazy loading for map markers and large datasets
- Optimized database queries with proper indexing

**Code Organization:**
- Route groups for logical page organization
- Shared components in `src/components/ui/` following shadcn patterns
- Utility functions centralized in `src/lib/utils.ts`
- Supabase integration isolated in `src/lib/supabase/` directory