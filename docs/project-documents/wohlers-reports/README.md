# Wohlers Reports Data Models

## Table of Contents

1. [AM Material Producers Report](#1-am-material-producers-report)
2. [Service Providers Website Report](#2-service-providers-website-report)
3. [Aggregated Data Category Distribution Report](#3-aggregated-data-category-distribution-report)
4. [Mergers & Acquisitions Report](#4-mergers--acquisitions-report)
5. [COE Associations Split Report](#5-coe-associations-split-report)
6. [Contributors Across Countries Report](#6-contributors-across-countries-report)
7. [Organizations Speakers Count Report](#7-organizations-speakers-count-report)
8. [ICAM Organizations Speakers Report](#8-icam-organizations-speakers-report)
9. [America Makes Member States Report](#9-america-makes-member-states-report)
10. [Summary of Common Entities](#summary-of-common-entities)

---

## 1. AM Material Producers Report

**File:** `AM-Material-Producers-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `companies` | Base company information | `id`, `name`, `type`, `location` |
| `materials` | Material classification data | `id`, `name`, `type` (Metal/Non-Metal/Both) |
| `material_producers` | Junction table linking companies to materials | `company_id`, `material_id`, `production_capability` |

### Data Relationships
- **Companies** → **Material Producers** (1:Many)
- **Materials** → **Material Producers** (1:Many)

### Visualization Requirements
- Bar chart showing company counts by material type
- Pie chart showing percentage distribution of material types
- Material type legend with color coding

---

## 2. Service Providers Website Report

**File:** `Service-Providers-Website-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `service_providers` | Service provider companies | `id`, `name`, `country_id`, `website_url` |
| `countries` | Geographic classification | `id`, `name`, `code` |
| `websites` | Website metadata and parameters | `id`, `company_id`, `url`, `parameters` |

### Data Relationships
- **Countries** → **Service Providers** (1:Many)
- **Service Providers** → **Websites** (1:1)

### Visualization Requirements
- Tabular display of service providers by country
- Website parameter tracking and analysis

---

## 3. Aggregated Data Category Distribution Report

**File:** `Aggregated-Data-Category-Distribution-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `companies` | Base company data | `id`, `name`, `country_id`, `category_id` |
| `categories` | Company categories | `id`, `name` (System Manufacturers, Service Providers, Material Producers, Non Metal Producers) |
| `countries` | Geographic classification | `id`, `name`, `code` |
| `am_processes` | AM process types | `id`, `name` (MEX, VPP, DED, Unknown, Thermoplastic) |
| `materials` | Material types | `id`, `name` (Metal, Unknown) |
| `company_processes` | Company AM process capabilities | `company_id`, `process_id` |

### Data Relationships
- **Countries** → **Companies** (1:Many)
- **Categories** → **Companies** (1:Many)
- **Companies** → **Company Processes** (1:Many)
- **AM Processes** → **Company Processes** (1:Many)

### Visualization Requirements
- Stacked bar chart by country showing category distribution
- Pie chart showing overall category distribution
- Cross-tabulation table with country/company/category/process data

---

## 4. Mergers & Acquisitions Report

**File:** `Mergers-Acquisitions-MA-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `mergers_acquisitions` | M&A transaction records | `id`, `year`, `month`, `acquiring_company`, `acquired_company`, `deal_size_million`, `country_id` |
| `countries` | Geographic data for deals | `id`, `name`, `code` |
| `companies` | Company information | `id`, `name`, `country_id` |
| `deal_timeline` | Time-series aggregation | `year`, `month`, `deal_count`, `total_value` |

### Data Relationships
- **Countries** → **M&A Records** (1:Many)
- **Companies** → **M&A Records** (Many:Many) - as acquiring/acquired
- **M&A Records** → **Deal Timeline** (Many:1)

### Visualization Requirements
- Time-series line chart showing deal trends by month/year
- Bar chart showing total deal size by country
- Detailed transaction table with all deal information
- Pie chart showing M&A distribution by country

---

## 5. COE Associations Split Report

**File:** `COE-Associations-Split-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `coes_associations` | Centers of Excellence and Associations | `id`, `name`, `type`, `country_id` |
| `countries` | Geographic classification | `id`, `name`, `code` |
| `organization_types` | Type classification | `id`, `name` (COE, Association) |

### Data Relationships
- **Countries** → **COEs/Associations** (1:Many)
- **Organization Types** → **COEs/Associations** (1:Many)

### Visualization Requirements
- Stacked bar chart showing COE vs Association split by country
- Detailed listing table of all associations by country
- Count aggregations by organization type

---

## 6. Contributors Across Countries Report

**File:** `Contributors-Across-Countries-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `contributors` | Individual contributor records | `id`, `name`, `company_id`, `country_id` |
| `companies` | Contributor affiliated organizations | `id`, `name`, `type`, `country_id` |
| `countries` | Geographic data with coordinates | `id`, `name`, `code`, `latitude`, `longitude` |
| `geographic_regions` | Global regions for mapping | `id`, `name`, `countries[]` |

### Data Relationships
- **Countries** → **Contributors** (1:Many)
- **Countries** → **Companies** (1:Many)
- **Companies** → **Contributors** (1:Many)
- **Geographic Regions** → **Countries** (1:Many)

### Visualization Requirements
- World map with country-level contributor visualization
- Pie chart showing contributor distribution by country
- Detailed contributor listing with company affiliations
- Color-coded geographic regions

---

## 7. Organizations Speakers Count Report

**File:** `Organizations-Speakers-Count-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `events` | Events and symposiums | `id`, `name`, `year`, `location`, `organization_id` |
| `organizations` | Event organizing bodies | `id`, `name`, `type` |
| `speakers` | Individual speakers/presenters | `id`, `name`, `organization_id`, `speaker_type` |
| `speaker_types` | Classification system | `id`, `name` (Invited, Regular) |
| `scientific_organizing_committee` | SOC data | `id`, `event_id`, `location`, `chief_speaker` |

### Data Relationships
- **Organizations** → **Events** (1:Many)
- **Events** → **Speakers** (1:Many)
- **Speaker Types** → **Speakers** (1:Many)
- **Events** → **Scientific Organizing Committee** (1:1)

### Visualization Requirements
- Time-series charts showing organization and speaker counts (2020-2024)
- Stacked bar charts separating invited vs regular speakers
- SOC details table with locations and leadership
- Year-over-year trend analysis

---

## 8. ICAM Organizations Speakers Report

**File:** `ICAM-Organizations-Speakers-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `icam_events` | ICAM-specific symposium data | `id`, `name`, `year`, `title`, `organization_id` |
| `icam_speakers` | ICAM speaker records | `id`, `name`, `event_id`, `organization_id`, `type` |
| `icam_organizations` | Organizations in ICAM | `id`, `name`, `affiliation_type` |

### Data Relationships
- **ICAM Organizations** → **ICAM Events** (1:Many)
- **ICAM Events** → **ICAM Speakers** (1:Many)

### Visualization Requirements
- Similar structure to Organizations Speakers Count but ICAM-focused
- Event-specific tracking and speaker management
- Organizational affiliation analysis

---

## 9. America Makes Member States Report

**File:** `America-Makes-Member-States-Report.png`

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `america_makes_members` | Member companies | `id`, `name`, `member_status_id`, `state_id`, `city` |
| `us_states` | US state data | `id`, `name`, `code`, `latitude`, `longitude` |
| `member_status` | Membership tiers | `id`, `name` (Gold, Platinum, Public, Silver), `color_code` |
| `state_coordinates` | Geographic visualization data | `state_id`, `lat`, `lng`, `member_count` |

### Data Relationships
- **US States** → **America Makes Members** (1:Many)
- **Member Status** → **America Makes Members** (1:Many)

### Visualization Requirements
- Choropleth map of US states showing member density
- Member status distribution pie chart
- State-by-state member listing with company details
- Color-coded membership tier visualization

---

## Summary of Common Entities

### Core Tables Used Across Multiple Reports

| Table | Used In Reports | Primary Purpose |
|-------|----------------|-----------------|
| `companies` | 1, 3, 4, 6 | Base company information across all business contexts |
| `countries` | 2, 3, 4, 5, 6 | Geographic classification and mapping |
| `materials` | 1, 3 | AM material types and classifications |
| `categories` | 3 | Company category classification (manufacturers, service providers, etc.) |
| `organizations` | 7, 8 | Event organizing bodies and institutional affiliations |

### Data Integration Patterns

1. **Geographic Hierarchy**: Countries → States/Regions → Cities
2. **Company Classification**: Companies → Categories → Specific Capabilities
3. **Event Management**: Organizations → Events → Speakers
4. **Material Capabilities**: Companies → Materials → Processes
5. **Time Series**: Year/Month aggregations for trend analysis

### Recommended Database Schema Considerations

- **Foreign Key Relationships**: Maintain referential integrity across geographic and organizational hierarchies
- **Indexing Strategy**: Geographic queries, time-series data, and company lookups require optimized indexes
- **Data Normalization**: Separate lookup tables for countries, materials, categories to avoid duplication
- **Aggregation Views**: Pre-calculated views for common reporting aggregations (counts by country, year, etc.)