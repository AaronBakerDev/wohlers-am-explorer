# CSV Mode to Supabase Migration Guide

This guide documents the complete implementation for migrating the Wohlers AM Explorer from CSV-only mode to full Supabase database integration while maintaining backward compatibility.

## Overview

The application now supports two data modes:
- **CSV Mode**: Reads data directly from JSON files (controlled by `DATA_SOURCE=csv` environment variable)
- **Supabase Mode**: Uses PostgreSQL database with full relational capabilities (default)

## Implementation Summary

### ✅ Completed Features

#### 1. CSV Support for Lookup/Catalog API
- **File**: `src/lib/datasource/csv.ts`
- **Function**: `getCatalogCsv()`
- **Enhancement**: Added technology and material extraction from pricing data
- **API**: Updated `/api/lookup/catalog/route.ts` to support CSV mode

#### 2. Data Import Scripts

##### Market Data Import Script
- **File**: `scripts/import-market-data.js`
- **Features**:
  - Imports Total AM market size data
  - Imports country revenue breakdown (2024)
  - Imports industry revenue data
  - Updates company information
  - Imports company categories/roles
  - Imports investment/funding data
  - Imports M&A transactions
  - Imports service pricing data
- **Usage**: `node scripts/import-market-data.js`

##### Catalog Tables Population
- **File**: `scripts/populate-catalog-tables.js`
- **Features**:
  - Populates `technologies` table from pricing data
  - Populates `materials` table from pricing data
  - Categorizes technologies and materials automatically
  - Updates service pricing with foreign key relationships
- **Usage**: `node scripts/populate-catalog-tables.js`

##### Data Verification
- **File**: `scripts/verify-data-consistency.js`
- **Features**:
  - Compares record counts between CSV and Supabase
  - Verifies data integrity across all major tables
  - Performs sample value comparisons
  - Provides detailed verification report
- **Usage**: `node scripts/verify-data-consistency.js`

## Data Flow Architecture

### CSV Mode Data Sources
```
project-documents/04-data/extracted-vendor-data/
├── Total_AM_market_size.json           → Market totals API
├── AM_market_revenue_2024.json         → Country revenue API
├── Revenue_by_industry_2024.json       → Industry breakdown
├── Company_information.json            → Company directory
├── Company_roles.json                  → Company categories
├── Fundings_and_investments.json       → Investment data
├── M_A.json                            → M&A transactions
└── Print_services_Pricing_data.json    → Pricing benchmarks + catalog
```

### Supabase Tables
```
market_data                    ← Market totals, country revenue, industry data
companies                     ← Company directory information
company_categories            ← Company roles and categories
investments                   ← Funding and investment rounds
mergers_acquisitions          ← M&A transaction records
service_pricing               ← Pricing benchmarks
technologies                  ← Catalog of AM processes
materials                     ← Catalog of AM materials
```

## Migration Process

### Step 1: Ensure Database Schema
Verify all required tables exist by running migrations in order:
```sql
-- Run these in Supabase SQL editor:
sql-migrations/001_create_am_companies_schema.sql
sql-migrations/002_update_schema_for_csv_data.sql
sql-migrations/003_restructure_for_equipment_data.sql
sql-migrations/004_add_market_intel_tables.sql
sql-migrations/005_create_market_views.sql
sql-migrations/20250812_auth_profiles_preferences.sql
```

### Step 2: Import Data
Run the import scripts in sequence:

```bash
# 1. Import all market data and company information
node scripts/import-market-data.js

# 2. Populate technologies and materials catalogs
node scripts/populate-catalog-tables.js

# 3. Verify data consistency
node scripts/verify-data-consistency.js
```

### Step 3: Test Both Modes
```bash
# Test CSV mode
DATA_SOURCE=csv npm run build
DATA_SOURCE=csv npm run dev

# Test Supabase mode (default)
npm run build
npm run dev
```

## API Endpoints Supporting Both Modes

All major endpoints now support both CSV and Supabase modes:

### Company Endpoints
- `/api/companies/search` - Company directory search
- `/api/companies/filters` - Available filter options
- `/api/companies/heatmap` - Geographic company distribution

### Market Intelligence
- `/api/market/totals` - Market size over time
- `/api/market/countries` - Revenue by country
- `/api/market/health` - Data availability health check

### Quotes & Benchmarks
- `/api/quotes/benchmarks` - Pricing data and statistics

### Lookup Services
- `/api/lookup/catalog` - Technologies and materials catalog

## Configuration

### Environment Variables
```bash
# Enable CSV mode
DATA_SOURCE=csv

# Optional: Override data directory
DATA_DIR=/path/to/extracted-vendor-data

# Supabase configuration (required for Supabase mode)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # For imports only
```

## Data Categorization

### Technology Categories
- **Powder Bed Fusion**: PBF, SLS processes
- **Material Extrusion**: MEX, FDM, FFF processes  
- **Vat Photopolymerization**: VPP, SLA, DLP processes
- **Binder Jetting**: BJT, binder-based processes
- **Directed Energy Deposition**: AM-LWC, directed energy processes
- **Other**: All other processes

### Material Categories  
- **Plastics**: PLA, ABS, PETG, Nylon, PC, ASA, TPU
- **Metals**: Steel, Aluminum, Titanium, Bronze, Brass, 316L, Inconel
- **Resins**: Photopolymer resins
- **Ceramics**: Ceramic and sand materials
- **Composites**: Carbon fiber, glass fiber, Kevlar reinforced
- **Other**: All other materials

## Performance Considerations

### CSV Mode
- **Pros**: No database dependencies, fast for small datasets
- **Cons**: In-memory processing, no complex queries, limited scalability
- **Best for**: Development, testing, demo environments

### Supabase Mode
- **Pros**: Indexed queries, relational data, real-time capabilities, scalable
- **Cons**: Database setup required, network latency
- **Best for**: Production, large datasets, complex filtering

## Data Import Statistics

Expected import volumes (based on current data):
- Market data: ~200-300 records
- Companies: ~500-1000 unique companies
- Company categories: ~1000-2000 role assignments
- Investments: ~100-200 funding rounds
- Service pricing: ~2000-4000 pricing quotes
- Technologies: ~15-25 unique processes
- Materials: ~50-100 unique materials

## Troubleshooting

### Common Issues

#### Import Script Fails
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check data directory exists
ls -la project-documents/04-data/extracted-vendor-data/
```

#### CSV Mode Not Working
```bash
# Verify data files exist
DATA_SOURCE=csv node -e "console.log(process.env.DATA_SOURCE)"

# Check build with CSV mode
DATA_SOURCE=csv npm run build
```

#### Supabase Connection Issues
- Verify URL and keys in environment variables
- Check Supabase project is active
- Verify RLS policies allow data access

### Data Verification Failures
If verification script shows inconsistencies:
1. Check data file integrity in `extracted-vendor-data/`
2. Re-run import scripts with fresh database
3. Compare sample records manually
4. Check for data transformation differences

## Future Enhancements

### Recommended Improvements
1. **Incremental Updates**: Support for updating only changed data
2. **Data Versioning**: Track data import versions and sources
3. **Real-time Sync**: Automatic data refresh from external sources
4. **Advanced Analytics**: More sophisticated market intelligence queries
5. **Data Quality**: Automated data validation and cleansing

### Migration Path Forward
1. **Phase 1**: Current state - CSV and Supabase modes coexist
2. **Phase 2**: Gradually migrate users to Supabase mode
3. **Phase 3**: Deprecate CSV mode, keep as development fallback
4. **Phase 4**: Full Supabase integration with advanced features

## Contact & Support

For questions about this migration:
- Review CLAUDE.md files for project context
- Check existing import scripts for patterns
- Test changes in both CSV and Supabase modes
- Verify data consistency after modifications

---

*This migration maintains full backward compatibility while providing a clear path to scalable database-driven functionality.*