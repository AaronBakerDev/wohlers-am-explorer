**Database Schema Overview**

- **Primary schemas:** `public`, `auth`, `storage`, `realtime`, `vault`, `supabase_migrations`, `extensions`, `graphql`.
- **Focus (app data):** `public` schema. Auth/user metadata in `auth` + `public.profiles`/`public.user_preferences`.
- **Row Level Security:** Enabled on most `public` tables. Many tables allow public SELECT; user-owned tables scope by `auth.uid()`.
- **Installed extensions:** `pg_trgm` (public), `pg_graphql` (graphql), `pgcrypto` (extensions), `uuid-ossp` (extensions), `supabase_vault` (vault), `pg_stat_statements` (extensions). Others are available but not installed.

**Key Domains**
- **Companies & Assets:** `companies`, `equipment`, `technologies`, `materials`, `company_categories`.
- **Finance & Events:** `investments`, `mergers_acquisitions`.
- **Service Pricing:** `service_pricing` + view `pricing_benchmarks`.
- **Market Data:** `market_data`, `market_forecasts` + views `market_by_country_segment`, `market_summary`, `market_totals`.
- **User Data:** `profiles`, `user_preferences`, `saved_searches` (with owner-scoped RLS).
- **Vendor Source Tables:** `vendor_*` staging/source-aligned datasets and the view `vendor_companies_merged`.

---

**Tables — Public Schema**

1) `public.companies` — Additive manufacturing companies database
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:**
  - `name varchar` (required)
  - `website varchar` (nullable)
  - `city varchar` (nullable)
  - `state varchar` (nullable)
  - `country varchar DEFAULT 'United States'` (nullable)
  - `latitude numeric` (nullable)
  - `longitude numeric` (nullable)
  - `company_type varchar` CHECK in ['equipment','service','software','material','other'] (nullable)
  - `description text` (nullable)
  - `founded_year int` (nullable)
  - `employee_count_range varchar` (nullable)
  - `revenue_range varchar` (nullable)
  - `is_public_company boolean DEFAULT false` (nullable)
  - `stock_ticker varchar` (nullable)
  - `public_stock_ticker varchar` (nullable)
  - `parent_company varchar` (nullable)
  - `subsidiary_info text` (nullable)
  - `last_funding_date date` (nullable)
  - `total_funding_usd numeric` (nullable)
  - `created_at timestamptz DEFAULT now()` (nullable)
  - `updated_at timestamptz DEFAULT now()` (nullable)
- **FKs (referenced by):**
  - `equipment.company_id -> companies.id`
  - `company_categories.company_id -> companies.id`
  - `investments.company_id -> companies.id`
  - `mergers_acquisitions.acquired_company_id/acquiring_company_id -> companies.id`
  - `service_pricing.company_id -> companies.id`
- **RLS:** enabled; public SELECT; public INSERT.

2) `public.equipment`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:**
  - `company_id uuid` (nullable) → `companies.id`
  - `manufacturer varchar` (nullable)
  - `model varchar` (nullable)
  - `count int DEFAULT 1` (nullable)
  - `count_type varchar DEFAULT 'Minimum'` CHECK in ['Minimum','Actual','Estimated'] (nullable)
  - `technology_id uuid` (nullable) → `technologies.id`
  - `material_id uuid` (nullable) → `materials.id`
  - `created_at timestamptz DEFAULT now()` (nullable)
  - `updated_at timestamptz DEFAULT now()` (nullable)
- **RLS:** enabled; public SELECT; public INSERT.

3) `public.technologies`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `name varchar UNIQUE` (required), `category varchar` (nullable), `description text` (nullable), timestamps.
- **Used by:** `equipment.technology_id`.
- **RLS:** enabled; public SELECT.

4) `public.materials`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `name varchar UNIQUE` (required), `category varchar` (nullable), `description text` (nullable), timestamps.
- **Used by:** `equipment.material_id`.
- **RLS:** enabled; public SELECT.

5) `public.company_categories`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `company_id uuid` → `companies.id`, `category varchar`, `is_primary boolean DEFAULT false`, timestamps.
- **RLS:** enabled; public SELECT; public INSERT.

6) `public.investments`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `company_id uuid` → `companies.id`, `investment_year int`, `investment_month varchar`, `amount_millions numeric`, `funding_round varchar`, `lead_investor varchar`, `country varchar`, `notes text`, timestamps.
- **RLS:** enabled; public SELECT; public INSERT.

7) `public.mergers_acquisitions`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `acquired_company_name varchar`, `acquiring_company_name varchar`, `acquired_company_id uuid` → `companies.id`, `acquiring_company_id uuid` → `companies.id`, `announcement_date date`, `deal_size_millions numeric`, `deal_status varchar DEFAULT 'completed'`, `notes text`, timestamps.
- **RLS:** enabled; public SELECT; public INSERT.

8) `public.service_pricing`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `company_id uuid` → `companies.id`, `material_category varchar`, `specific_material varchar`, `process varchar`, `quantity int`, `price_usd numeric`, `lead_time_days int`, `notes text`, `data_source varchar DEFAULT 'vendor_import_2025'`, timestamps.
- **RLS:** enabled; public SELECT; public INSERT.

9) `public.market_data`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `data_type varchar` (e.g. 'revenue'), `year int`, `segment varchar`, `region varchar`, `country varchar`, `industry varchar`, `value_usd numeric`, `percentage numeric`, `unit varchar`, `data_source varchar DEFAULT 'vendor_import_2025'`, `created_at timestamptz DEFAULT now()`.
- **RLS:** enabled; public SELECT; public INSERT.

10) `public.market_forecasts` — AM market forecast data (2025–2034 scenarios)
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `year int`, `segment varchar`, `scenario varchar` CHECK in ['low','average','high'], `value_usd numeric`, `growth_rate numeric`, `notes text`, `data_source varchar DEFAULT 'wohlers_forecast_2025'`, timestamps.
- **RLS:** enabled; public SELECT.

11) `public.profiles`
- **PK:** `user_id uuid` → `auth.users.id`
- **Columns:** `email text`, `full_name text`, `avatar_url text`, `role text DEFAULT 'basic'`, timestamps.
- **RLS:** enabled; owner-only SELECT/UPDATE/INSERT via `(auth.uid() = user_id)`.

12) `public.user_preferences`
- **PK:** `user_id uuid` → `auth.users.id`
- **Columns:** `theme text DEFAULT 'system'`, `default_filters jsonb DEFAULT '{}'`, `export_preferences jsonb DEFAULT '{}'`, timestamps.
- **RLS:** enabled; owner-only SELECT/UPDATE/INSERT via `(auth.uid() = user_id)`.

13) `public.saved_searches`
- **PK:** `id uuid DEFAULT gen_random_uuid()`
- **Columns:** `user_id uuid` → `auth.users.id`, `name text`, `query jsonb`, `created_at timestamptz DEFAULT now()`.
- **RLS:** enabled; owner-only SELECT/INSERT/DELETE via `(auth.uid() = user_id)`.

14) `public.dataset_configs_unified`
- **PK:** `id varchar`
- **Columns:** `name varchar`, `description text`, `filters jsonb`, `display_columns text[]`, `map_type varchar`, `enable_map bool DEFAULT true`, `enable_analytics bool DEFAULT true`, `enable_export bool DEFAULT true`, `sort_by jsonb`, `group_by varchar`, `custom_views text[]`, `version varchar DEFAULT '1.0'`, `is_active bool DEFAULT true`, timestamps.
- **RLS:** enabled; public SELECT.

15) Vendor/staging tables (`public.vendor_*`)
- Source-aligned datasets powering imports and analytics; all with RLS allowing public SELECT and (often) INSERT. Highlights:
  - `vendor_company_information` — company_name UNIQUE, website, headquarters.
  - `vendor_company_roles` — company_name, category.
  - `vendor_print_services_global` — company_name, segment, material_type/format, country, printer_manufacturer/model, number_of_printers, count_type, process, update_year, additional_info.
  - `vendor_print_service_pricing` — material/process pricing and lead times.
  - `vendor_material_pricing` — 2,652 material price points (Mar 2023–Sep 2025); maps `CompanyID` + material/form to `materials` + `companies` for rate benchmarking.
  - `vendor_fundings_investments` — year/month, company_name, amount, round, lead_investor, notes.
  - `vendor_mergers_acquisitions` — deal_date, acquired/acquiring_company, deal_size, country.
  - `vendor_am_market_revenue_2024` — revenue_usd by country/segment.
  - `vendor_revenue_by_industry_2024` — industry share_of_revenue_percent, revenue_usd, region/material.
  - `vendor_total_am_market_size` — year, forecast_type, segment, revenue_usd.
  - `vendor_company_locations` — 7,853 HQ/branch aliases with `AlternateID`, `LocationType`, address metadata for company dedupe.
  - `vendor_employee_counts` — 1,984 headcount rows (updated through 1 Sep 2025) with `CountType`, snapshot date, and source.
  - `vendor_system_material_details` — 870 process/material format combinations per company (sheet `SM Details`).
  - `vendor_print_services_eu` — 2,459 machine inventory rows with manufacturer/model, process, material_type, count_type, update_year (sheet `SP - EU details`).
  - `vendor_company_contact_info` — 1,178 outreach interactions with contacts, channel, and last-interaction year.
  - `vendor_currency_conversion_rates` — 60 yearly FX rates (AUD, CNY, EUR, GBP, HKD, ILS, KRW, NOK, SEK, USD) spanning 2020–2025 for revenue normalization.
  - `vendor_system_sales` — 2,148 system shipment records with `PeriodCumulative`, `Units`, and `Measure` flags.
  - `vendor_company_revenue` — 1,173 financial metrics (FY 2019–FY 2025) per company with native currency, USD conversion, and estimate flags.
  - `vendor_trade_data` — 69,771 customs trade flows (HS codes 848520/848580, years 2022–2025) with reporter/partner country, value, and unit.
  - `DEP_companies_unified` — legacy/unified interim table (readable publicly).

---

**Views — Public Schema**
- `company_summaries`: Aggregates per-company machine counts, unique processes/materials/manufacturers, arrays of process/material names. LEFT JOINs `equipment`→`technologies`/`materials`.
- `company_summaries_unified`: Normalizes company shape with role/segment/market defaults; includes `equipment_count` per company.
- `pricing_benchmarks`: Per (process, material_category, quantity, country) aggregates — sample_count, min/median/avg/max price, stddev, and lead-time stats.
- `market_by_country_segment`: Revenue-only rollups by year/country/segment with rank and share percentages.
- `market_summary`: Latest-year totals and top 5 countries (as JSON array); counts of countries/segments.
- `market_totals`: Revenue totals by year and segment.
- `vendor_companies_merged`: UNION of print services and system manufacturers into a single company-like result.

---

**Auth & Related**
- `auth.users` with typical Supabase columns + generated `confirmed_at`; related tables: `auth.identities`, `auth.sessions`, `auth.refresh_tokens`, MFA tables. Public-side links: `public.profiles.user_id`, `public.user_preferences.user_id`, `public.saved_searches.user_id` FKs → `auth.users.id`.
- Enums (auth): `aal_level`, `code_challenge_method`, `factor_status`, `factor_type`, `oauth_registration_type`, `one_time_token_type`.

**Storage & Vault**
- `storage.buckets`, `storage.objects` with object metadata and ownership (deprecated `owner` in favor of `owner_id`).
- `vault.secrets` and `vault.decrypted_secrets` view via Supabase Vault for at-rest encryption of secrets.

---

**Row Level Security Summary (Public)**
- Open read: `companies`, `company_categories`, `equipment`, `investments`, `materials`, `technologies`, `market_data`, `market_forecasts`, `service_pricing`, most `vendor_*`, `dataset_configs_unified`, `DEP_companies_unified`.
- Owner-scoped: `profiles`, `user_preferences`, `saved_searches` enforce `(auth.uid() = user_id)` for SELECT/INSERT/UPDATE/DELETE as applicable.
- Many tables also permit public INSERT (for ingestion/import flows). Review policies before enabling write paths in production.

---

**Notable Relationships**
- `equipment.company_id` → `companies.id`
- `equipment.technology_id` → `technologies.id`
- `equipment.material_id` → `materials.id`
- `company_categories.company_id` → `companies.id`
- `investments.company_id` → `companies.id`
- `mergers_acquisitions.acquired_company_id`/`acquiring_company_id` → `companies.id`
- `service_pricing.company_id` → `companies.id`
- `profiles.user_id`/`user_preferences.user_id`/`saved_searches.user_id` → `auth.users.id`

---

**Rate & Financial Data Integration — September 2025**
- `vendor_print_service_pricing` (4,396 July–Sep 2025 orders) normalizes to `service_pricing` via `CompanyID` → `companies.id`; `Process` aligns with `technologies.name`, `Material_type` feeds `materials.category`, and `Lead time` populates `service_pricing.lead_time_days`/`pricing_benchmarks` (note: outliers include negative and 600+ day lead times to clean).
- `vendor_material_pricing` (2,652 price points, 31 Mar 2023–15 Sep 2025) joins on `Material`/`Form` → `materials` and `CompanyID` → `companies` to extend pricing benchmarks beyond service quotes.
- `vendor_currency_conversion_rates` (annual FX 2020–2025) standardizes `vendor_company_revenue.RevenueNativeCurrency` and `vendor_trade_data.Value`; join on `NativeCurrency = XtoUSD` before loading `RevenueUSD`/`Value` fields.
- `vendor_company_revenue` (FY 2019–FY 2025) supplies company-level ARR/total revenue; `CompanyID` ties back to `companies` and `FinancialMetric` should align with analytics fact tables (e.g., `market_data`).
- `vendor_trade_data` (69,771 customs records, 2022–2025) rolls into trade rate insights; `ReporterName`/`PartnerName` map to country dimension tables, `TradeFlowType` drives import/export rate comparisons, and FX conversion relies on the currency table above.
- `vendor_system_sales` (2,148 unit shipments) complements rate analysis by anchoring pricing to actual volume sold per company/year/system type.

---

**Usage Tips**
- Use `company_summaries`/`company_summaries_unified` for company cards and map markers (counts and basic rollups included).
- For pricing analytics, query `pricing_benchmarks` with filters on `process`, `material_category`, `country`.
- Market insights: `market_by_country_segment` and `market_summary` power dashboards with ranks and top countries.
- When writing to user-owned tables, ensure client is authenticated; RLS requires `auth.uid()` to match `user_id`.

**Next Steps / Open Questions**
- Confirm which `vendor_*` tables should be merged into the unified `companies`/`equipment` model and which remain source-of-truth for analytics.
- Consider adding selective UNIQUE constraints and indexes (e.g., on `companies.name`+`country` or `equipment(company_id, manufacturer, model)`) for deduplication and performance.
- Validate whether public INSERT policies are desired for production; tighten with service roles or admin-only APIs.

---

**ER Diagram**

```mermaid
erDiagram
    companies {
        uuid id PK
        varchar name
        varchar website
        varchar city
        varchar state
        varchar country
        numeric latitude
        numeric longitude
        varchar company_type
        timestamptz created_at
    }

    equipment {
        uuid id PK
        uuid company_id FK
        varchar manufacturer
        varchar model
        int count
        varchar count_type
        uuid technology_id FK
        uuid material_id FK
        timestamptz created_at
    }

    technologies {
        uuid id PK
        varchar name UNIQUE
        varchar category
    }

    materials {
        uuid id PK
        varchar name UNIQUE
        varchar category
    }

    company_categories {
        uuid id PK
        uuid company_id FK
        varchar category
        bool is_primary
    }

    investments {
        uuid id PK
        uuid company_id FK
        int investment_year
        varchar investment_month
        numeric amount_millions
        varchar funding_round
    }

    mergers_acquisitions {
        uuid id PK
        uuid acquired_company_id FK
        uuid acquiring_company_id FK
        date announcement_date
        numeric deal_size_millions
        varchar deal_status
    }

    service_pricing {
        uuid id PK
        uuid company_id FK
        varchar process
        varchar material_category
        int quantity
        numeric price_usd
        int lead_time_days
    }

    profiles {
        uuid user_id PK
        text email
        text full_name
        text role
    }

    user_preferences {
        uuid user_id PK
        text theme
        jsonb default_filters
    }

    saved_searches {
        uuid id PK
        uuid user_id FK
        text name
        jsonb query
    }

    dataset_configs_unified {
        varchar id PK
        varchar name
        jsonb filters
        text[] display_columns
    }

    auth_users {
        uuid id PK
        text email
    }

    companies ||--o{ equipment : has
    companies ||--o{ company_categories : has
    technologies ||--o{ equipment : tech_of
    materials ||--o{ equipment : material_of
    companies ||--o{ investments : funds
    companies ||--o{ service_pricing : offers
    companies ||--o{ mergers_acquisitions : acquired
    companies ||--o{ mergers_acquisitions : acquiring
    auth_users ||--|| profiles : owns
    auth_users ||--|| user_preferences : owns
    auth_users ||--o{ saved_searches : owns
```

Note: `auth_users` is a visual stand-in for `auth.users` to illustrate ownership links.

---

**Sample SQL**

- Map markers (via view):

```sql
select id, name, lat, lng, company_role, equipment_count
from company_summaries_unified
where is_active
  and lat is not null and lng is not null
order by equipment_count desc
limit 500;
```

- Map markers (raw, with filters):

```sql
select
  c.id,
  c.name,
  c.website,
  c.city,
  c.state,
  c.country,
  c.latitude as lat,
  c.longitude as lng,
  coalesce(
    (select cc.category from company_categories cc
      where cc.company_id = c.id and cc.is_primary = true limit 1),
    c.company_type
  ) as company_role,
  count(distinct e.id)::int as equipment_count
from companies c
left join equipment e on e.company_id = c.id
where c.latitude is not null and c.longitude is not null
  and (c.country = 'United States' or 'United States' is null)
  and (c.company_type = 'service' or 'service' is null)
group by c.id, c.name, c.website, c.city, c.state, c.country, c.latitude, c.longitude, company_role
order by equipment_count desc
limit 500;
```

- Equipment by process/material:

```sql
select c.id, c.name,
       count(e.id) as machines,
       array_agg(distinct t.name) filter (where t.name is not null) as processes,
       array_agg(distinct m.name) filter (where m.name is not null) as materials
from companies c
join equipment e on e.company_id = c.id
left join technologies t on t.id = e.technology_id
left join materials m on m.id = e.material_id
where (t.name = 'SLS' or 'SLS' is null)
  and (m.name = 'Nylon' or 'Nylon' is null)
group by c.id, c.name
order by machines desc
limit 100;
```

- Pricing benchmarks (pre-aggregated view):

```sql
select *
from pricing_benchmarks
where process = 'FDM'
  and material_category = 'PLA'
  and quantity = 10
  and country = 'United States'
order by median_price asc;
```

- Service pricing export (join with companies):

```sql
select c.name as company_name,
       c.country,
       sp.process,
       sp.material_category,
       sp.specific_material,
       sp.quantity,
       sp.price_usd,
       sp.lead_time_days,
       sp.notes
from service_pricing sp
left join companies c on c.id = sp.company_id
where sp.process in ('SLS','MJF')
  and sp.quantity between 1 and 10
order by c.country, sp.material_category, sp.quantity;
```

- Market summary and breakdowns:

```sql
-- High-level market snapshot
select * from market_summary;

-- Year/segment breakdown by country
select year, country, segment, value, segment_share, total_share
from market_by_country_segment
where year = 2024 and segment = 'Hardware'
order by value desc
limit 10;
```

- Owned data patterns (RLS with auth.uid()):

```sql
-- Save a search for the current user
insert into saved_searches (id, user_id, name, query)
values (gen_random_uuid(), auth.uid(), 'My Search', '{"country":"Germany"}'::jsonb);

-- Read back current user's searches
select id, name, query, created_at
from saved_searches
where user_id = auth.uid()
order by created_at desc;
```
