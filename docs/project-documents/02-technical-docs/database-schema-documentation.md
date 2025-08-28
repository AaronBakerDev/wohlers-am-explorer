# Wohlers AM Explorer Database Schema Documentation

**Last Updated:** August 28, 2025  
**Schema Version:** 3.1 (includes vendor data integration)  
**Database System:** Supabase PostgreSQL with Row Level Security

## Overview

The Wohlers AM Explorer database consists of two primary schema categories:

1. **Core Application Schema** - Original AM company and market intelligence tables
2. **Vendor Data Schema** - One-to-one mappings from extracted vendor CSV/JSON files

This dual architecture enables the application to seamlessly switch between CSV file data and live database sources while maintaining data integrity and performance.

## Database Architecture

### Migration History

The database schema has evolved through 10+ migration files:

1. `001_create_am_companies_schema.sql` - Base company and technology tables
2. `002_update_schema_for_csv_data.sql` - CSV compatibility updates
3. `003_restructure_for_equipment_data.sql` - Equipment tracking tables
4. `004_add_market_intel_tables.sql` - Market intelligence data
5. `005_create_market_views.sql` - Performance optimization views
6. `006_seed_market_demo_data.sql` - Demo data seeding
7. `007_wohlers_reports_schema.sql` - Wohlers report integration
8. `008_am_systems_manufacturers.sql` - AM systems manufacturer data
9. `009_print_services_global.sql` - Global print services data
10. **`010_vendor_data_schema_mapping.sql` - One-to-one vendor data mapping**

## Core Application Schema

### Primary Entities

#### Companies Table
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    website VARCHAR,
    location JSONB,
    coordinates POINT,
    company_type VARCHAR,
    employee_count_range VARCHAR,
    revenue_range VARCHAR,
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### Technologies and Materials
```sql
CREATE TABLE technologies (
    id UUID PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR
);

CREATE TABLE materials (
    id UUID PRIMARY KEY, 
    name VARCHAR UNIQUE NOT NULL,
    material_type VARCHAR,
    properties JSONB
);

CREATE TABLE company_technologies (
    company_id UUID REFERENCES companies(id),
    technology_id UUID REFERENCES technologies(id),
    PRIMARY KEY (company_id, technology_id)
);
```

#### Market Intelligence Tables
```sql
CREATE TABLE investments (
    id UUID PRIMARY KEY,
    company_name VARCHAR,
    amount_usd DECIMAL(15,2),
    funding_round VARCHAR,
    lead_investor VARCHAR,
    investment_date DATE,
    country VARCHAR
);

CREATE TABLE mergers_acquisitions (
    id UUID PRIMARY KEY,
    acquiring_company VARCHAR,
    acquired_company VARCHAR,
    deal_size_usd DECIMAL(15,2),
    deal_date DATE,
    deal_type VARCHAR,
    country VARCHAR
);
```

## Vendor Data Schema (NEW)

### Schema Design Principles

The vendor data schema follows a **one-to-one mapping approach** where each CSV/JSON source file has an exact corresponding database table. This ensures:

- **Data Integrity**: No data transformation or loss during import
- **Schema Consistency**: Database columns match CSV headers exactly
- **Dual Source Support**: Applications can switch between CSV files and database seamlessly
- **Vendor Autonomy**: Each dataset maintains its original structure and naming

### Vendor Tables Overview

All vendor tables use the `vendor_` prefix and include standard metadata fields:

```sql
-- Standard fields for all vendor tables
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT NOW(),
-- [source-specific columns...]
```

#### 1. Company Information (`vendor_company_information`)
**Source:** `Company_information.json`  
**Purpose:** Basic company profiles and headquarters data

```sql
CREATE TABLE vendor_company_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500) NOT NULL,
    website VARCHAR(1000), 
    headquarters VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name)
);
```

**Key Indexes:** `company_name`, `headquarters`  
**Records:** ~1,500 companies

#### 2. Fundings & Investments (`vendor_fundings_investments`)
**Source:** `Fundings_and_investments.json`  
**Purpose:** Investment rounds and funding data

```sql
CREATE TABLE vendor_fundings_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER,
    month VARCHAR(20),
    company_name VARCHAR(500),
    country VARCHAR(100),
    amount_millions_usd DECIMAL(10,2),
    funding_round VARCHAR(100),
    lead_investor VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `year`, `company_name`, `country`, `amount_millions_usd`  
**Records:** ~800 funding rounds

#### 3. Print Services Pricing (`vendor_print_service_pricing`)
**Source:** `Print_services_Pricing_data.json`  
**Purpose:** AM service pricing and lead time data

```sql
CREATE TABLE vendor_print_service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    material_type VARCHAR(100),
    material VARCHAR(200),
    process VARCHAR(100),
    quantity INTEGER,
    manufacturing_cost DECIMAL(10,2),
    day_ordered INTEGER,
    delivery_date INTEGER,
    lead_time INTEGER,
    country VARCHAR(100),
    scattered_plot_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `company_name`, `material`, `process`, `country`  
**Records:** ~2,000 pricing data points

#### 4. AM Market Revenue 2024 (`vendor_am_market_revenue_2024`)
**Source:** `AM_market_revenue_2024.json`  
**Purpose:** 2024 market revenue by country and segment

```sql
CREATE TABLE vendor_am_market_revenue_2024 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revenue_usd BIGINT,
    country VARCHAR(100),
    segment VARCHAR(100),
    filter_info_1 VARCHAR(200), -- Maps to __EMPTY_1
    filter_info_2 VARCHAR(200), -- Maps to __EMPTY_2
    filter_info_3 VARCHAR(200), -- Maps to __EMPTY_3
    filter_info_4 VARCHAR(200), -- Maps to __EMPTY_4
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `country`, `segment`  
**Records:** ~500 revenue data points

#### 5. Mergers & Acquisitions (`vendor_mergers_acquisitions`)
**Source:** `M_A.json`  
**Purpose:** M&A transactions in AM industry

```sql
CREATE TABLE vendor_mergers_acquisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_date VARCHAR(20),
    acquired_company VARCHAR(500),
    acquiring_company VARCHAR(500),
    deal_size_millions DECIMAL(12,2),
    country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `acquired_company`, `acquiring_company`, `country`  
**Records:** ~150 M&A transactions

#### 6. Company Roles (`vendor_company_roles`)
**Source:** `Company_roles.json`  
**Purpose:** Company role categorization

```sql
CREATE TABLE vendor_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    category VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name, category)
);
```

**Key Indexes:** `company_name`, `category`  
**Records:** ~2,500 company-role mappings

#### 7. Revenue by Industry 2024 (`vendor_revenue_by_industry_2024`)
**Source:** `Revenue_by_industry_2024.json`  
**Purpose:** Industry segment revenue breakdown

```sql
CREATE TABLE vendor_revenue_by_industry_2024 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100),
    share_of_revenue_percent DECIMAL(5,2),
    revenue_usd BIGINT,
    region VARCHAR(100),
    material VARCHAR(100),
    filter_info_1 VARCHAR(200), -- Additional filter fields
    filter_info_2 VARCHAR(200),
    filter_info_3 VARCHAR(200), 
    filter_info_4 VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `industry`, `region`  
**Records:** ~300 industry revenue segments

#### 8. Total AM Market Size (`vendor_total_am_market_size`)
**Source:** `Total_AM_market_size.json`  
**Purpose:** Market size forecasts and historical data

```sql
CREATE TABLE vendor_total_am_market_size (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER,
    forecast_type VARCHAR(50),
    segment VARCHAR(100),
    revenue_usd BIGINT,
    filter_info_1 VARCHAR(200),
    filter_info_2 VARCHAR(200),
    filter_info_3 VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, forecast_type, segment)
);
```

**Key Indexes:** `year`, `forecast_type`, `segment`  
**Records:** ~200 market size data points

#### 9. Directory (`vendor_directory`)
**Source:** `Directory.json`  
**Purpose:** Figure and sheet directory data

```sql
CREATE TABLE vendor_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    figure_name VARCHAR(500),
    sheet_name_and_link VARCHAR(500),
    v1 TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `figure_name`  
**Records:** ~100 directory entries

#### 10. AM Systems Manufacturers (`vendor_am_systems_manufacturers`)
**Source:** `COMPANY___AM_systems_mfrs.json`  
**Purpose:** AM printer and system manufacturers

```sql
CREATE TABLE vendor_am_systems_manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    segment VARCHAR(200),
    material_type VARCHAR(100),
    material_format VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `company_name`, `country`, `material_type`  
**Records:** ~500 manufacturer entries

#### 11. Print Services Global (`vendor_print_services_global`)
**Source:** `COMPANY___Print_services_global.json`  
**Purpose:** Global print service providers

```sql
CREATE TABLE vendor_print_services_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    segment VARCHAR(200),
    material_type VARCHAR(100),
    material_format VARCHAR(100),
    country VARCHAR(100),
    additional_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Indexes:** `company_name`, `country`  
**Records:** ~800 service provider entries

## Security & Access Control

### Row Level Security (RLS)

All vendor tables have RLS enabled with permissive policies:

```sql
-- Example policy structure
CREATE POLICY "Enable read access for all users" 
ON vendor_company_information FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" 
ON vendor_company_information FOR INSERT WITH CHECK (true);
```

### User Authentication

The application supports multiple authentication methods:

```sql
-- User profiles and preferences
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role VARCHAR DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    preference_key VARCHAR NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance Optimizations

### Indexing Strategy

**Vendor Tables:** Each vendor table has indexes on:
- Primary searchable text fields (company names, countries)
- Numeric fields used for filtering and sorting
- Date/time fields for temporal queries
- Combination indexes for common query patterns

**Core Tables:** Optimized indexes on:
- Geographic coordinates (GIST indexes)
- Full-text search fields (GIN indexes)  
- Foreign key relationships
- Commonly filtered columns

### Materialized Views

```sql
-- Example: Pre-aggregated company summaries
CREATE MATERIALIZED VIEW company_summaries AS
SELECT 
    c.id,
    c.name,
    c.location,
    COUNT(DISTINCT ct.technology_id) as technology_count,
    COUNT(DISTINCT e.id) as equipment_count
FROM companies c
LEFT JOIN company_technologies ct ON c.id = ct.company_id
LEFT JOIN equipment e ON c.id = e.company_id
GROUP BY c.id, c.name, c.location;
```

## API Integration Architecture

### Dual Data Source Support

The application supports seamless switching between data sources:

#### API Route Structure
```typescript
// /api/vendor-data/[dataset]/route.ts - Vendor database queries
// /api/market-data/[dataset]/route.ts - CSV files with vendor fallback

// Example vendor data query
const config = VENDOR_DATASET_CONFIGS[dataset]
const supabase = await createClient()
let query = supabase.from(config.table).select('*')
```

#### Data Source Configuration
```typescript
const VENDOR_DATASET_CONFIGS = {
  'company-information': {
    table: 'vendor_company_information',
    name: 'Company Information',
    columns: ['company_name', 'website', 'headquarters'],
    displayColumns: ['Company Name', 'Website', 'Headquarters']
  }
  // ... additional configs
}
```

### Query Features

All vendor data APIs support:

- **Pagination**: `?page=1&limit=100`
- **Search**: `?search=tesla` (searches across text columns)
- **Sorting**: `?sortBy=company_name&sortOrder=asc`
- **Filtering**: Dynamic filters based on column types

### Response Format

```typescript
{
  dataset: string,
  config: {
    name: string,
    description: string,
    table: string,
    columns: string[],
    displayColumns: string[]
  },
  data: string[][], // CSV-compatible format
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  },
  filters: {
    search: string,
    sortBy: string,
    sortOrder: string
  },
  rowCount: number,
  totalRows: number,
  timestamp: string
}
```

## Data Import Pipeline

### Import Process

1. **Source Data**: Vendor CSV/JSON files in `/docs/project-documents/04-data/extracted-vendor-data/`
2. **Schema Mapping**: One-to-one column mapping defined in migration files
3. **Import Script**: `scripts/import-vendor-csv-data.js` handles batch processing
4. **Data Validation**: Type checking and constraint validation during import
5. **Error Handling**: Detailed logging and rollback capabilities

### Import Statistics
```bash
# Example import results
Successfully imported 13,685 records across 9 vendor tables:
- vendor_company_information: 1,499 records
- vendor_fundings_investments: 847 records  
- vendor_print_service_pricing: 1,547 records
- vendor_am_market_revenue_2024: 126 records
- vendor_mergers_acquisitions: 77 records
- vendor_company_roles: 2,547 records
- vendor_revenue_by_industry_2024: 288 records
- vendor_total_am_market_size: 196 records
- vendor_directory: 89 records
```

## UI Integration

### Data Source Toggle

The application provides seamless switching between CSV and database sources:

```typescript
// Toggle functionality in market-data page
const toggleDataSource = () => {
  const newSource = dataSource === 'csv' ? 'vendor' : 'csv'
  setDataSource(newSource)
  
  const params = new URLSearchParams(searchParams.toString())
  params.set('source', newSource)
  router.push(`/market-data?${params.toString()}`)
}
```

### Visual Indicators

- **Live Database**: Green "Live" badges indicate vendor data availability
- **Data Source Toggle**: Button shows current source (CSV vs Database)
- **Record Counts**: Accurate counts displayed for each dataset
- **Loading States**: Proper loading indicators during data source switches

## Future Enhancements

### Planned Features

1. **Real-time Sync**: Automatic updates from vendor data sources
2. **Data Versioning**: Track changes to vendor datasets over time
3. **Enhanced Analytics**: Cross-dataset analytics and visualizations
4. **Export Tools**: Enhanced export capabilities for combined datasets
5. **Data Quality**: Automated data quality checks and validation

### Scalability Considerations

- **Partitioning**: Time-based partitioning for large historical datasets
- **Caching**: Redis integration for frequently accessed data
- **CDN**: Static asset caching for better global performance
- **Read Replicas**: Geographic distribution of read-only database replicas

---

**Documentation Maintained By:** Development Team  
**Review Schedule:** Quarterly updates or after major schema changes  
**Contact:** Technical team for schema modification requests