# Market Reporting Implementation

This document describes how market reporting works in the app and how to keep the underlying data up to date using the provided vendor files under `docs/project-documents/04-data/market-data/`.

## Overview

- Per-dataset reporting (Market Data): driven by `vendor_*` tables configured in `src/lib/config/datasets.ts` and fetched via `GET /api/vendor-data/[dataset]` (proxied by `GET /api/market-data/[dataset]`).
- Aggregate reporting (Totals, Countries): driven by unified aggregate tables:
  - `market_totals(year, segment, total_value)`
  - `market_by_country_segment(year, country, segment, value)`
  - Endpoints:
    - `GET /api/market/totals?startYear&endYear&segment`
    - `GET /api/market/countries?year&segment&country&limit`
  - These endpoints gracefully fall back to vendor tables if the aggregates are empty.

## UI

- Market Data page: `/market-data?dataset=<id>&view=analysis|table`
  - Analysis view uses dataset-specific layouts in `src/components/market-data/MarketDataLayouts.tsx`.
  - Added components:
    - `MarketTotalsChart`: Stacked totals across years (from `/api/market/totals`).
    - `MarketCountriesChart`: Top countries for a given year/segment (from `/api/market/countries`).
  - `Total AM Market Size` uses `TotalMarketSizeLayout` (stacked totals). `AM Market Revenue 2024` displays `MarketCountriesChart`.

## Seeding Aggregate Tables

Use the generator script to create SQL from the provided vendor JSON files.

```
node scripts/generate-market-aggregates-sql.mjs > market-aggregates.sql
# review and run the SQL against your DB (e.g., via Supabase SQL editor)
```

What it does:
- Reads `Total_AM_market_size.json` and generates `INSERT` statements for `market_totals`:
  - Includes segment-level rows (excludes `Segment = 'Total'` to avoid double counting).
  - Uses `Type = 'Past revenue'` for years <= 2024 and `Type = 'Average forecast'` for years >= 2025.
- Reads `AM_market_revenue_2024.json` and generates `INSERT` statements for `market_by_country_segment` (Year = 2024).

If you need additional years for country/segment data, add JSON files for those years and extend the script accordingly.

## Notes

- The dataset configs normalization maps vendor CSV/JSON headers to column names expected by the API.
- For very large datasets, promote commonly used filters to server-side query params so the API can apply them before pagination.

