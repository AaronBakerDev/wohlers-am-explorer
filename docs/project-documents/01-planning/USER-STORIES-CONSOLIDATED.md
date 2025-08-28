# User Stories — MVP (Consolidated)

Status: Current (supersedes USER-STORIES.md)
Last Updated: 2025-08-12

Note: Stories reflect kickoff focus and gap analysis; scoped for ~3-week MVP with ~800–900 companies, survey/market data, and quotes/benchmarking.

## Epic A — Company Directory

A1. Browse & Filter Directory (P0)
As an AM decision-maker, I can browse and filter the company directory by type (print services, AM systems manufacturers), country/region, process/technology, and materials so I can quickly find relevant companies.
Acceptance: Filters combine; results update instantly; URL reflects state; CSV export includes applied filters.

A2. Company Profile (P0)
As a user, I can view a concise company profile showing location, roles, technologies/materials, and links so I can qualify companies at a glance.
Acceptance: Profile renders key fields and related tags; missing fields labeled gracefully.

A3. Export Marketing List (P0)
As a marketer, I can export the filtered company list (CSV) with basic contact/site fields so I can create outreach lists.
Acceptance: Export button on list; file includes timestamp and applied filters metadata.

## Epic B — Market Insights

B1. Total AM Market (Stacked Bar) (P0)
As an analyst, I can view total AM market by segment with a stacked bar and year picker so I can communicate the overall market composition.
Acceptance: Data from market_totals; segment toggle; year toggle (seed 2023–2024); export chart as PNG.

B2. Revenue by Country & Segment (P0)
As a strategist, I can see revenue by country and segment with a table and a simple chart (pie or bar), with filters for country/segment so I can identify key geographies.
Acceptance: Data from market_by_country_segment; country/segment filters; CSV export of table.

B3. Country Overview Map (P1)
As a presenter, I can view a light choropleth of revenue by country for the selected year to add geographic context.
Acceptance: Uses same data; hover tooltip shows country total; legend included.

## Epic C — Quotes Benchmark

C1. Compare Providers (P0)
As a procurement manager, I can compare service providers by country, process, material, and quantity (1 vs 1000) so I can benchmark pricing and lead times.
Acceptance: Filters as listed; table shows provider, material, process, qty, price, lead time; summary row shows min/median/max; CSV export available.

C2. Result Snapshot Export (PNG) (P1)
As a user, I can export the comparison table snapshot as PNG for PPT inclusion.
Acceptance: Exports current view with filters metadata.

## Epic D — Investments/M&A (Optional)

D1. Investments Listing (P1)
As an analyst, I can view investments with filters (year, round, country) and see total count and sum so I can reference activity.
Acceptance: Table with filters; summary metrics; CSV export.

## Epic E — Prebuilt Entry Points

E1. Print Services Tab (P0)
As a user, I can open a pre-filtered tab that focuses on print services using the directory/map/analytics pattern so I can start with a curated view.
Acceptance: Pre-applied filters; clear label; can modify filters.

E2. AM Systems Manufacturers Tab (P0)
As a user, I can open a pre-filtered tab that focuses on AM systems manufacturers so I can analyze OEMs quickly.
Acceptance: As above.

## Epic F — Access & Gating (Lightweight)

F1. Premium Gating CTA (P1)
As a visitor, when accessing Market Insights or Quotes, I see a Premium badge and a Request Access CTA that triggers an email so I can request an upgrade.
Acceptance: No payment flow; route-level check displays CTA modal/section.

---

Non-Goals for MVP
- Payments/subscriptions, advanced RBAC, saved searches, alerts, complex dashboards, AI features.

Definition of Done (per story)
- Functional with seeded data; responsive; accessible basics; CSV/PNG export where stated; acceptance verified in a short demo.

