# Wohlers AM Explorer — MVP Gap Analysis

Date: 2025-08-12
Author: Orchestrator

## Summary
Based on the kickoff transcript and the current codebase, the app is on the right track (table + map + stats UX, shared filters, exports, Supabase schema with company index). The main gaps for MVP are: (1) survey/forecast “Market Insights” data and charts, (2) a cross-provider “Pricing Intelligence” (Quotes Benchmark) tool, (3) global Investments/M&A reporting tabs, and (4) dedicated pre-filtered tabs for Print Services and AM Systems Manufacturers. A lightweight gating/upgrade flow and data normalization will round out the MVP.

## What stakeholders want (from transcript)
- Tabs as interactive “focus reports,” not 1:1 with paper guide.
- Core datasets:
  - Company directory: Print Services and AM Systems Manufacturers.
  - Survey/forecast: total AM market, revenue by country/segment, industry/material/region breakdowns.
- Visualization patterns:
  - Keep prototype’s table + map + stats pattern.
  - Filters are essential (region, material, segment, country).
  - Stacked bars (market size by segment), pie charts, world map views.
- Specific views:
  - “Total AM Market Size”: stacked bars with company segment filter (print services, printer sales, materials, software, health).
  - “2024 Revenue by Country and Segment”: map/pie + filters.
  - “Investments/M&A”: table + filters + (optionally) map view.
  - “Quote Benchmark tool”: compare service providers across countries, materials, quantity (1 vs 1000), show cost and lead time.
- Delivery/Scope:
  - MVP with real data by end of August; defer heavy auth/payments (allow email-based upgrade in MVP).

## Current implementation (high level)
- Dashboard and tabs:
  - Overview/Map/Data Table/Analytics: `src/app/(dashboard-template)/dashboard/page.tsx`
  - Map Explorer: `src/components/map-explorer-content.tsx` (+ Leaflet choropleth/pins)
  - Data Table: `src/app/(dashboard-template)/data-table/page.tsx`
  - Analytics: `src/app/(dashboard-template)/analytics/page.tsx` (derives insights from company/equipment data)
  - Company Directory UI: `src/app/(dashboard-template)/companies/page.tsx`
  - Company Profile w/ Investments, M&A, Service Pricing: `src/app/(dashboard-template)/companies/[id]/page.tsx`
- Data model:
  - Supabase tables for `companies`, `equipment`, `technologies`, `materials`, `investments`, `mergers_acquisitions`, `service_pricing`, and `company_summaries` view.
- Shared filters + export:
  - FilterBar: `src/components/filters/FilterBar`
  - Export CSV/XLSX: `src/components/ExportButton.tsx`

## Gaps vs. requirements
1) Market Insights (survey/forecast) — MISSING
- Need Supabase tables and ingestion for market totals and breakdowns (e.g., `market_totals`, `market_by_country_segment`, and optionally industry/material/region tables).
- Need UI:
  - Stacked bar with segment filter (Total AM Market).
  - Country + segment view (pie/map/table) with filters.

2) Pricing Intelligence / Quotes Benchmark — MISSING
- Cross-provider comparison page using `service_pricing`; filters for country, material category/specific, process, quantity (1 vs 1000); summary stats (min/median/max/avg lead time); charts.

3) Investments/M&A top-level reporting — MISSING
- Dedicated “Investments” and (optionally) “M&A” tabs with filters, table, basic stats, and global view/map aggregation.

4) Prebuilt company-type reports — PARTIAL
- Dedicated “Print Services” and “AM Systems Manufacturers” tabs (pre-filtered entry points) reusing Map/Table/Analytics with default filters.

5) Visualizations library — PARTIAL
- Implement stacked bars and pie charts (e.g., Recharts/Chart.js/Tremor) to match stakeholder expectations for survey/forecast visuals.

6) Data normalization — PARTIAL
- Add ETL or ingestion normalization for countries (United States/USA), states, company types, categories; optional lookup tables for consistency.

7) Gating/upgrade flow — PARTIAL
- Middleware checks role for `/analytics`. Add lightweight “Request Access” CTA for Market Insights/Pricing tabs (email trigger) versus full payments in MVP.

## Proposed minimal Supabase schema additions (MVP)
- `market_totals`:
  - year (int), segment (text: 'print_services' | 'printer_sales' | 'materials' | 'software' | 'health'), value (numeric)
- `market_by_country_segment`:
  - year (int), country (text), segment (text), value (numeric)
Optional later:
- `market_by_industry` (year, industry, value)
- `market_by_material_region` (year, material, region, value)

## Action plan (sequenced for MVP)
Week 1
- Data
  - Create `market_totals` and `market_by_country_segment`.
  - Seed initial subset from spreadsheet for 2023–2024.
  - Add normalization step in import script (countries/states/types).
- UI
  - New “Market Insights” tab:
    - View A: Total AM Market (stacked bar, segment filter, year picker).
    - View B: Revenue by Country & Segment (pie/map + table, filters).
  - Integrate charts lib for stacked bar/pie.

Week 2
- “Pricing Intelligence” tab (Quotes Benchmark):
  - Filters: country, material category/specific, process, quantity 1/1000.
  - Comparison table + summary stats; simple bar charts by country.
- “Investments” (and optional “M&A”) tab:
  - Year/round/country filters; map/pie + table; summary metrics.
- Prebuilt company-type tabs:
  - “Print Services” and “AM Systems Manufacturers” as curated entry points.

Week 3 (buffer/refinement)
- Gating: Restrict Market Insights/Pricing to premium, add “Upgrade/Request Access” CTA.
- Chart export to PNG (optional).
- Map: choropleth for country revenue (optional).

## Risks and mitigations
- Survey data availability/format: Keep schema minimal, seed only required values. Confirm column mapping early.
- Timeline: Prioritize Market Insights + Pricing Intelligence; keep Investments/M&A lean.
- Charting complexity: Use a single chart lib; prefer reuse of UI patterns to limit custom code.

## MVP acceptance checklist
- Data
  - Survey tables created and seeded; normalization applied at ingestion.
- Tabs
  - Market Insights: Stacked bar (Total AM Market) + Revenue by Country & Segment (pie/map + table).
  - Pricing Intelligence: Cross-provider comparison with filters and summary stats.
  - Investments (and/or M&A): Filterable listings with simple aggregates.
  - Prebuilt reports: Print Services and AM Systems Manufacturers entry points.
- Interactions
  - Filters: region, material, segment, country, quantity (1 vs 1000) as applicable.
  - Views: table + map + stats per tab where relevant.
  - Exports: CSV (and optionally PNG for charts).
- Scope fit
  - No full payments; simple “request access” CTA for premium pages.
- Delivery
  - Demo with real data mid-August; MVP complete by end of August.

## Next steps
- Approve minimal schema for survey/forecast data.
- Provide the latest spreadsheet snapshot for Market Insights seeding.
- Confirm which tabs are “premium” for MVP gating.
