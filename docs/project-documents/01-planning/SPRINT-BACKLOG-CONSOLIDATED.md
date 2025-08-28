# Sprint Backlog — MVP (Consolidated)

Status: Current (supersedes SPRINT-BACKLOG.md and SPRINT-PLAN.md)
Last Updated: 2025-08-12

Scope basis: End-of-August MVP, core features only, dataset ~800–900 companies + survey/market + quotes.

## Priorities
- P0: Must deliver for MVP acceptance.
- P1: Nice-to-have if time remains; do not jeopardize P0.

## P0 Backlog (Must-Haves)
- Data: Create `market_totals` and `market_by_country_segment` tables in Supabase.
- Data: Seed 2023–2024 minimal values from spreadsheet snapshot.
- Market Insights: Stacked bar — Total AM Market by segment with year picker.
- Market Insights: Revenue by Country & Segment — table + simple chart; filters; CSV export.
- Quotes Benchmark: Comparison table with filters (country, process, material, qty 1/1000) + summary stats; CSV export.
- Directory: Shared filter bar across directory views; export filtered companies CSV.
- Prebuilt Tabs: “Print Services” and “AM Systems Manufacturers” curated entry points.
- Exports: Chart snapshot to PNG (bar and pie) for PPT.
- Demo Readiness: Scripted flow and seeded data for all P0 views.

## P1 Backlog (Time-Permitting)
- Market Insights: Country choropleth map.
- Investments Tab: Filterable list + summary counts.
- Gating: Premium badge + Request Access CTA on Market Insights and Quotes.
- Quotes Benchmark: Export table snapshot to PNG.

## 3-Week Execution Plan (Dates adjust to calendar)
- Week 1
  - Data schemas + seed; Market Insights (stacked bar, country/segment table+chart); wiring filter bar; CSV exports.
- Week 2
  - Quotes Benchmark core (filters, table, stats, CSV export); prebuilt tabs; chart-to-PNG.
- Week 3
  - Polish; add P1 items if time; QA pass; finalize demo script.

## Definition of Done
- Meets acceptance criteria in USER-STORIES-CONSOLIDATED.md.
- Responsive and performant on in-scope dataset.
- CSV/PNG exports operational where specified.
- Demo walkthrough reviewed with stakeholders.

