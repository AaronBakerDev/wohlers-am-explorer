# Wohlers AM Explorer — Consolidated Plan (MVP)

Status: Current (supersedes PRD-MVP.md, USER-STORIES.md, SPRINT-PLAN.md, SPRINT-BACKLOG.md, MVP-FOCUSED-SCOPE.md)
Last Updated: 2025-08-12

## Objective
- Deliver an end-of-August MVP of an on-demand AM market intelligence platform to support vendor selection.
- Focus on core value: data visualization, powerful filtering, company directory, and market intelligence.

## Target Users
- AM industry decision-makers (strategy, BD, procurement, marketing, research).

## Primary Use Cases
- PowerPoint-ready charts and snapshots for executive updates.
- Marketing lists of qualified companies for outreach.
- Market research: totals, country/segment breakdowns, quotes benchmarking.

## Tech Stack
- Next.js (App Router) + React; Supabase (Postgres, RLS optional later); Tailwind + shadcn/ui.

## Data In Scope
- Company directory: ~800–900 records (print services + AM systems manufacturers).
- Market/survey data: totals and breakdowns by country and segment (2023–2024 seed).
- Quotes/pricing benchmarks: service provider quotes with price and lead time samples.

## MVP Scope (P0)
- Company Directory: browse, filter, view profile, export filtered CSV.
- Market Insights tab:
  - Total AM Market: stacked bar chart by segment with year picker.
  - Revenue by Country & Segment: table + simple chart (pie or bar) and optional country map.
- Quotes Benchmark tab:
  - Compare providers by country, process, material, and quantity (1 vs 1000); show price and lead-time stats; export results.
- Prebuilt entry points: “Print Services” and “AM Systems Manufacturers” (curated filters).
- Exports: CSV everywhere; chart export to PNG for slide usage.

## Nice-to-Have (P1, time-permitting)
- Investments and/or M&A tab with filters and simple stats.
- Lightweight gating: premium badge + Request Access CTA on Market Insights / Quotes.
- Optional choropleth for country revenue.

## Explicitly Out of Scope (MVP)
- Payments/subscriptions, complex onboarding, advanced RBAC beyond lightweight gating.
- Large-scale forecasting, AI assistants, custom dashboard builders.

## Success Criteria
- End of August delivery with working tabs and seeded data.
- Charts and tables exportable for PPT use; CSV exports for lists.
- Intuitive filtering and responsive performance on the dataset size in scope.

## Key Decisions From Kickoff
- Deadline: end of August MVP.
- Core features: data viz, filtering, directory, market intelligence; quotes benchmark is important.
- Data model additions needed for survey/market tables; keep minimal.

## Minimal Data Model Additions (Supabase)
- market_totals: year int, segment text, value numeric.
- market_by_country_segment: year int, country text, segment text, value numeric.

## Risks & Mitigations
- Survey data format variance: define minimal schemas and seed only required 2023–2024 values.
- Time: prioritize Market Insights + Quotes; keep Investments lean and optional.
- Charting complexity: use one chart library across all visuals.

## Delivery Plan (3 weeks)
- Week 1: schema + seed; Market Insights (stacked bar + country/segment); shared filters; CSV export.
- Week 2: Quotes Benchmark (filters, comparison table, stats, export); prebuilt tabs.
- Week 3: polish; chart-to-PNG; optional Investments; gating CTA; demo script.

## Superseded Documents
- PRD-MVP.md, USER-STORIES.md, SPRINT-PLAN.md, SPRINT-BACKLOG.md, MVP-FOCUSED-SCOPE.md are superseded by: PLAN-CONSOLIDATED.md, USER-STORIES-CONSOLIDATED.md, SPRINT-BACKLOG-CONSOLIDATED.md.

