# Wohlers AM Explorer MVP — User Flows and User Stories

This document translates the MVP scope into actionable personas, user stories, and end‑to‑end user flows across the core features: authentication, dashboard, map explorer, data table, analytics, market insights, quotes benchmark, filtering, exporting, and saved searches. It reflects the current implementation in this repository and the planned enhancements described in MARKET-INTELLIGENCE-IMPLEMENTATION-PLAN.md and DESIGN-TASK-SPECIFICATIONS.md.

Sources reviewed
- Repository code under `src/app`, `src/components`, `src/lib`, and API routes under `src/app/api`.
- Market intelligence plan: [MARKET-INTELLIGENCE-IMPLEMENTATION-PLAN.md](MARKET-INTELLIGENCE-IMPLEMENTATION-PLAN.md).
- Design specifications: [DESIGN-TASK-SPECIFICATIONS.md](DESIGN-TASK-SPECIFICATIONS.md).


## Personas

- Market Analyst: Researches AM companies, segments, and trends. Needs filterable map/table, analytics, and reliable exports for reporting.
- Business Development (BD) Lead: Identifies prospects and benchmarks competitors. Needs fast search, saved filters, exports for outreach.
- Operations Manager (Service Bureau/OEM): Evaluates vendors, processes, and materials. Needs quotes benchmark and quick comparisons.
- Executive/Investor: Consumes top‑level KPIs and market insights. Needs easy dashboards, exports (PNG/CSV), and mobile readability.
- Trial/Guest User: Evaluates value quickly. Needs frictionless onboarding and guided experience with limited scope.
- Admin/Editor: Manages access, validates data, and performs QA. Needs guardrails (RBAC), diagnostics, and testable flows.


## Global Principles and Assumptions

- Auth in development: Authentication is currently disabled in middleware and user profile helpers for local MVP demos (see [AUTH.md](../setup/AUTH.md)). Flows and ACs below include both current behavior (dev) and the intended production behavior.
- Shared filters: The unified `FilterBar` is used across Map, Table, and Analytics for consistent filtering: technologies, materials, process categories, company size ranges, countries, and states.
- Export formats: Data export supports CSV and XLSX (via `lib/export.ts`). Chart export supports PNG (via `ChartExportButton`).
- Performance target: API p50 under 200ms, page load under 3s (per implementation plan), with progressive rendering and loading skeletons.
- Accessibility: Keyboard navigation, visible focus states, and semantic landmarks. Charts and maps provide textual context where possible.


## Authentication

User stories
- As a user, I can sign in with email and password so I can access protected views (Dashboard, Map, Table, Analytics).
- As a new user, I can register and verify my account so I can sign in and save preferences/searches.
- As a user who forgot my password, I can request a reset and set a new password so I can regain access.
- As a signed‑in user, I can sign out so I can secure my account on shared devices.
- As an admin, I can gate access to premium areas so only authorized roles can view Analytics/Insights (planned RBAC).

Acceptance criteria
- Login: Valid credentials redirect to `/dashboard`; invalid shows inline error; loading state on submit.
- Registration: Valid submissions create an account, send verification (if enabled), and route user to confirmation or login.
- Forgot/Reset: Request shows success notice; reset form updates password; success redirects to `/dashboard`.
- Route protection (production): Visiting protected routes without a session redirects to `/login?next=<path>`.
- RBAC (production): Analytics is restricted to `premium|admin`; unauthorized users are redirected with a notice.
- Dev behavior: Landing redirects to `/dashboard`; a “Bypass Auth” button exists on login.

Success metrics
- Authentication success rate and median time‑to-dashboard after login.
- Password reset completion rate; failures by cause.
- RBAC violations blocked; zero unauthorized Analytics page views.


## Dashboard

Overview
- Provides a top‑level entry to: Overview, Map, Table, and Analytics tabs, plus Saved Searches.
- Shows dataset metadata (source, last updated, counts) and quick metrics tiles.

User stories
- As a user, I can land on the dashboard and see the overview tab with dataset metadata and key stats so I can understand coverage at a glance.
- As a user, I can switch tabs (Overview, Map, Data Table, Analytics) so I can change context without page reloads.
- As a user, I can view/manage Saved Searches so I can reuse common queries.

Acceptance criteria
- Tab switching updates visible content without a full page reload.
- Overview displays: data source, last updated, total companies, geographic coverage, and data points per company.
- Saved Searches list appears with create and delete actions; errors surface inline.
- Keyboard and screen reader navigation work for tabs and controls.

Success metrics
- Dashboard time‑to‑interactive < 2s on desktop.
- Tab switch latency < 200ms after initial load.
- Saved search creation rate and reuse frequency.


## Map Explorer

Overview
- Interactive Leaflet map with pin and heatmap modes, clustering, search, filter sidebar, company detail panel, result counts, and export.

User stories
- As a user, I can search by company name or location to quickly narrow visible companies.
- As a user, I can apply technology/material/process/size/geography filters so the map updates to matching companies.
- As a user, I can toggle between Pins and Heatmap to change visual aggregation.
- As a user, I can select a company pin to view details (location, type, technologies, materials, machine stats) and a website link.
- As a user, I can export the currently filtered set to CSV/XLSX for offline analysis.

Acceptance criteria
- Search filters results by name/city/state; resets when cleared.
- FilterBar (vertical) shows active filter counts, supports clear all, and loads option lists with loading states.
- Pins reflect company type colors; cluster markers display counts; heatmap shades are proportional to total machines by state.
- Detail panel shows counts (machines, processes, materials, manufacturers) and lists technologies/materials.
- Export button is enabled when there are results and includes filter context in the filename.
- Map remains responsive to pan/zoom; container resize triggers `invalidateSize` to avoid rendering glitches.

Success metrics
- Median map results render < 1.2s after filter change (client + API).
- Interaction FPS remains > 30 during typical pan/zoom on laptop hardware.
- Export success rate; average export generation time.


## Data Table

Overview
- Filterable, searchable, sortable, paginated company table with column visibility controls, row selection, details dialog, and export.

User stories
- As a user, I can search and sort by company, location, type, and machine metrics so I can find relevant companies quickly.
- As a user, I can apply the same unified filters used in the Map to restrict the table results.
- As a user, I can change visible columns and page size so I can focus on the most useful data.
- As a user, I can select rows and export either all filtered rows or only selected rows to CSV/XLSX.
- As a user, I can open a company detail dialog and review process/material equipment breakdown (when available).

Acceptance criteria
- Search matches name/city/state/type/website substrings (case‑insensitive).
- Multi‑column sorting (toggle asc/desc/remove) works and persists through pagination.
- Column visibility toggles update the view without reload; defaults match spec.
- Pagination controls show total, current range, and allow page size changes.
- Export filename includes timestamp and active filter context; selected‑only export includes selection count.
- Detail dialog loads equipment breakdown asynchronously and displays loading/empty states.

Success metrics
- Time‑to‑first‑page of results < 1s after filter change.
- Export completion under 2s for 1–2k rows on desktop.
- Reduction in bounce rate from table page.


## Analytics (Dashboard Insights)

Overview
- KPI tiles and interactive charts (trends, geographic distribution, technology and material distributions, top cities). Fullscreen and export available. Forecasting provides a simple, transparent projection.

User stories
- As a user, I can view key stats (companies, states, technologies, machines) to understand current coverage.
- As a user, I can view trend charts and optionally export the time series data to CSV/XLSX.
- As a user, I can click bars/slices to add cross‑filters (e.g., clicking a state adds it to the state filter).
- As a user, I can toggle fullscreen charts to inspect details and export chart data.
- As a user, I can adjust the time range selector and refresh data.

Acceptance criteria
- Summary tiles reflect current filtered scope.
- Charts render with tooltips, legends, and theme‑aware colors; no overflow on small screens.
- Click interactions add the respective filter (e.g., state) to the FilterBar and refresh dependent charts.
- Fullscreen toggle enlarges the chart; escape/close returns to embedded view.
- Export controls generate CSV/XLSX matching the visible series; filenames include filter context.
- Forecast callout is clearly labeled as a heuristic (no guarantee), and can be hidden if no time series exists.

Success metrics
- Chart render < 800ms post data fetch.
- Export initiation to download < 1.5s for typical datasets.
- Interaction success rate (click‑to‑filter applies without error).


## Market Insights (Totals and Country/Segment)

Overview
- Stacked totals by segment across years, country breakdowns for the selected year/segment, and exports (CSV/JSON, with PNG for charts).

User stories
- As a user, I can select a year and segment to analyze market totals and country contributions.
- As a user, I can review top countries by revenue and segment breakdowns for the selected year.
- As a user, I can export underlying totals and country summaries to CSV or JSON, and export chart PNGs for presentations.

Acceptance criteria
- Year selector updates charts and tables; default is current year for country view and a sensible year range for totals.
- Segment selector filters charts to the chosen segment or “all”.
- Top countries list includes contribution percentage and sorts by value.
- Export buttons are active when data exists and include year/segment in filenames.
- Debug banners appear when views are missing (e.g., `market_totals`, `market_by_country_segment`) with concise guidance.

Success metrics
- Country/segment API p50 < 200ms with caching; totals API p50 < 200ms.
- PNG export success rate; export initiation to download < 2s.
- Time‑to‑first‑insight: user applies year/segment and views updated visuals < 1.2s.


## Quotes Benchmark

Overview
- Price comparison across providers by process, material, quantity, and country, with statistics (min/avg/median/max), view switching (table, scatter, comparison), and exports.

User stories
- As a user, I can filter quotes by process/material/quantity/country and see matching records sorted by price.
- As a user, I can switch between table, scatter (quantity vs. price per unit), and process comparison views.
- As a user, I can export quotes and statistics to CSV or JSON for offline analysis.

Acceptance criteria
- Filters populate from available values; “all” resets the dimension to unfiltered.
- Table shows company, location, process/material, quantity, total price, price per unit, and lead time when present.
- Scatter plot maps quantity to X and price‑per‑unit to Y; tooltips show company and totals.
- Process comparison shows min/avg/max and count per process with clear labeling.
- Export includes selected filters and a timestamp in the filename; JSON bundle includes data, statistics, filters, and metadata.
- Debug banner shows migration hints when data/views are missing (controllable via `NEXT_PUBLIC_DEBUG_BENCHMARK`).

Success metrics
- API p50 < 200ms for benchmark queries; page load < 3s.
- Median time‑to‑first chart < 1.2s after filter change.
- Export success rate and average export time by format.


## Filtering (Unified FilterBar)

Overview
- A shared filter component used on Map, Table, and Analytics. Supports technologies, materials, process categories, employee size ranges, countries, and states; shows active counts and “clear all”; includes vertical and horizontal layouts.

User stories
- As a user, I can open each filter category, select multiple values, and see active counts so I understand which filters are applied.
- As a user, I can quickly clear all filters to reset the view.
- As a user, I can apply filters in any order and see the Map, Table, and Analytics update accordingly.

Acceptance criteria
- Options load asynchronously with loading indicators and handle empty/error states gracefully.
- Active count badge reflects the total applied across categories.
- Vertical orientation is used in the map sidebar; horizontal in table/analytics headers.
- Clearing filters resets relevant data views and badges.
- Filter context is included in export filenames (e.g., `tech‑#, mat‑#, proc‑#`).

Success metrics
- Filter change to updated results < 1s for Map/Table; < 1.2s for heavier Analytics.
- Reduction in repeated filter interactions (save sets planned) and increased filter use depth.


## Exporting

Overview
- Data export: CSV/XLSX via a unified utility; includes filter context and timestamps in filenames. Chart export: PNG via html2canvas; uses theme‑aware background.

User stories
- As a user, I can export filtered datasets from Map/Table/Analytics to CSV or Excel.
- As a user, I can export individual charts as PNGs that look good in dark/light themes.

Acceptance criteria
- Export buttons reflect row counts and selection state (e.g., “selected rows”).
- Filenames are sanitized and include timestamp and filter summary.
- XLSX export uses column headers matching the UI and data keys.
- PNG export matches the visible chart area and uses a non‑transparent background.

Success metrics
- Export completion rate; < 2s median for typical datasets/charts.
- Zero export file corruption reports.


## Saved Searches

Overview
- Users can name and store reusable queries. In development, persistence is mocked/no‑op; production re‑enables Supabase storage with RBAC.

User stories
- As a user, I can save the current query (filters/search) with a name so I can reload it later.
- As a user, I can list and delete my saved searches.
- As a user, I can apply a saved search to Map/Table/Analytics when selected from the list (planned: cross‑screen apply).

Acceptance criteria
- Save form validates non‑empty name; success refreshes the list; errors surface inline.
- List displays name and created date; delete confirms and removes from the list.
- Production: saved queries persist per user; unauthenticated users are prompted to sign in.

Success metrics
- Saved search creation/use ratio; repeat usage within 7 days.
- Error rate for save/load/delete operations.


## Non‑Functional Requirements (Cross‑cutting)

- Performance: Follow targets in the implementation plan; add caching headers on API routes; paginate where needed.
- Reliability: Handle empty states gracefully; show loading and error feedback; avoid UI dead ends.
- Accessibility: Keyboard/focus states for menus, dropdowns, filters, map controls, tabs, and dialogs. Provide text equivalents for chart insights where feasible.
- Mobile: Ensure layouts adapt for small screens; avoid horizontal scroll for primary content; finger‑target sizes ≥ 44px.
- Security: Re‑enable middleware route protection and Supabase profile/roles before production; never expose secrets client‑side.


## End‑to‑End User Flows

Authentication flow (production)
1) Visit `/login` → enter credentials → submit → success redirects to `/dashboard` (or `next` param) → dashboard content renders.
2) Forgot password → request email → follow magic link → set new password → redirect `/dashboard`.
3) Sign out from user menu → redirect to `/login`.

Dashboard flow
1) Land on `/dashboard` → see Overview metadata and Saved Searches.
2) Click Map/Data Table/Analytics tab → content swaps without page reload.
3) Create a Saved Search from current query → appears in list → can delete.

Map explorer flow
1) Open Map tab → FilterBar (vertical) loads options; map shows pins and counts.
2) Type in search → markers filter by name/city/state.
3) Apply filters → map results update; counts refresh; heatmap toggle on/off.
4) Click a marker → company panel opens with details; open website link.
5) Click Export → choose CSV/XLSX → file downloads with filter context.

Data table flow
1) Open Data Table tab → header shows search, FilterBar, badge counts.
2) Search and/or apply filters → table updates; pagination reflects filtered count.
3) Sort columns; toggle visible columns; select some rows.
4) Export all filtered or only selected as CSV/XLSX.
5) Open a row dialog to view equipment breakdown; close.

Analytics flow
1) Open Analytics tab → tiles and charts render; filters available.
2) Click a bar/slice (e.g., CA) → state filter added; all charts update.
3) Toggle fullscreen on a chart; export its series; exit fullscreen.
4) Change time range; optionally refresh data.

Market insights flow
1) Open Market Insights page → totals chart renders (stacked by segment).
2) Use year/segment pickers → totals and country summaries update.
3) Export CSV/JSON; export chart PNG if needed.

Quotes benchmark flow
1) Open Quotes Benchmark page → filter selectors populate.
2) Choose process/material/quantity/country → table updates; switch to scatter/comparison views.
3) Export CSV/JSON including statistics and current filters.


## Success Metrics (MVP)

- Adoption
  - Weekly active users and feature engagement (Map/Table/Analytics/Insights/Benchmark).
  - Saved search creation rate and reuse frequency.
- Performance
  - p50 API latency < 200ms for market/benchmark endpoints; page load < 3s.
  - Filter‑to‑result latency < 1.2s for Map/Table; < 1.5s for Analytics.
- Reliability
  - Export success rate > 99%; zero corrupted downloads.
  - Error rate on API calls < 1% (5xx), retries < 2%.
- UX Quality
  - Time‑to‑first‑insight < 90 seconds for new users (trial flows).
  - Task success for “find 10 DMLS providers in CA and export” ≥ 95% in testing.


## Gaps and Planned Enhancements

- Authentication: Re‑enable middleware protections and Supabase profile storage; add OAuth providers.
- FilterBar: Saved filter sets and history; searchable dropdowns; dependent country→state lists; suggestions.
- Map: Technology mode, fullscreen, and enhanced clustering controls per design spec.
- Data Table: Drag‑reorder columns, quick column filters, inline editing for admin.
- Analytics: Cross‑filtering between all charts; concentration and competitive landscape visuals per spec.
- Market Insights: Expand forecast series (2025–2034), more segments, and richer country drill‑downs.
- Quotes Benchmark: Box plots, provider ranking tables, and improved sampling density.


## Test Coverage Recommendations (E2E)

- Auth: login, registration, reset (happy and error paths; gated routes in production mode).
- Map: apply filters → markers/heatmap count changes; export CSV/XLSX; company panel detail visibility.
- Table: search, multi‑sort, pagination, column toggle, selection and export; detail dialog states.
- Analytics: tiles match filtered counts; click‑to‑filter; fullscreen; export of series.
- Market Insights: year/segment changes update totals and country summaries; CSV/JSON export; debug banner visibility when views missing.
- Quotes Benchmark: filters, view switches, stats correctness ranges; CSV/JSON export; debug banner.

