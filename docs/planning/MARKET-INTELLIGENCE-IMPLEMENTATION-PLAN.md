# Market Intelligence & Pricing Benchmarks Implementation Plan

**Project**: Wohlers AM Explorer MVP  
**Timeline**: Week 1-2 (Aug 12-23, 2025)  
**Priority**: P0 - Critical for MVP Demo

## 🎯 **GOAL**
Deliver complete Market Intelligence and Pricing Benchmarks features with:
- Market Insights: Total AM market charts, revenue by country/segment
- Quotes Benchmark: Price comparison, lead time analysis
- Export capabilities: CSV data, PNG charts for PowerPoint
- Performance: <200ms API, <3s page load

## 📊 **CURRENT STATE**
**Completed:**
- ✅ 5,199 companies imported
- ✅ 296 market_data records (partial)
- ✅ 68 service_pricing records (2% of available)
- ✅ Database structure exists

**Missing:**
- ❌ 3,456 pricing records not imported
- ❌ Market forecast data (2025-2034)
- ❌ UI pages for Market Insights
- ❌ UI pages for Quotes Benchmark
- ❌ Chart to PNG export

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Data Migration (Day 1-2)**

#### 1.1 Complete Pricing Data Import
```bash
# Import remaining 3,456 pricing records
node scripts/import-pricing-data.js
```

**Tasks:**
- Create enhanced import script for `Print_services_Pricing_data.csv`
- Map company names to existing company IDs
- Normalize process and material categories
- Handle currency conversion (if needed)
- Add data validation and error logging

#### 1.2 Import Market Forecast Data
```sql
-- Create forecast tables if needed
CREATE TABLE IF NOT EXISTS market_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  segment VARCHAR(255),
  scenario VARCHAR(50), -- 'low', 'average', 'high'
  value_usd NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create aggregation views
CREATE VIEW market_totals AS
SELECT 
  year,
  segment,
  SUM(value_usd) as total_value,
  COUNT(DISTINCT country) as country_count
FROM market_data
WHERE data_type = 'revenue'
GROUP BY year, segment;

CREATE VIEW market_by_country_segment AS
SELECT 
  year,
  country,
  segment,
  SUM(value_usd) as value,
  RANK() OVER (PARTITION BY year ORDER BY SUM(value_usd) DESC) as rank
FROM market_data
WHERE data_type = 'revenue'
GROUP BY year, country, segment;
```

#### 1.3 Create Price Benchmark Views
```sql
-- Aggregated pricing statistics
CREATE VIEW pricing_benchmarks AS
SELECT 
  sp.process,
  sp.material_category,
  sp.quantity,
  COUNT(*) as sample_count,
  MIN(sp.price_usd) as min_price,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY sp.price_usd) as q1_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sp.price_usd) as median_price,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY sp.price_usd) as q3_price,
  MAX(sp.price_usd) as max_price,
  AVG(sp.price_usd) as avg_price,
  MIN(sp.lead_time_days) as min_lead_time,
  AVG(sp.lead_time_days) as avg_lead_time,
  MAX(sp.lead_time_days) as max_lead_time
FROM service_pricing sp
GROUP BY sp.process, sp.material_category, sp.quantity;
```

### **Phase 2: API Development (Day 3-4)**

#### 2.1 Market Intelligence API
```typescript
// src/app/api/market/totals/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const segment = searchParams.get('segment');
  
  // Query implementation
  // Return JSON with caching headers
}

// src/app/api/market/countries/route.ts
export async function GET(request: Request) {
  // Return revenue by country and segment
}
```

#### 2.2 Pricing Benchmark API
```typescript
// src/app/api/quotes/benchmarks/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = {
    process: searchParams.get('process'),
    material: searchParams.get('material'),
    quantity: searchParams.get('quantity'),
    country: searchParams.get('country')
  };
  
  // Return pricing statistics and comparisons
}
```

### **Phase 3: UI Implementation (Day 5-7)**

#### 3.1 Market Insights Page
```typescript
// src/app/(dashboard-template)/market-insights/page.tsx
```
**Components:**
- Stacked bar chart (Total AM Market by segment)
- Year picker (2014-2034)
- Revenue table by country/segment
- Pie/bar chart for country breakdown
- CSV export button
- PNG chart export

#### 3.2 Quotes Benchmark Page
```typescript
// src/app/(dashboard-template)/quotes-benchmark/page.tsx
```
**Components:**
- Filter panel (country, process, material, quantity)
- Comparison table with statistics
- Box plot for price distribution
- Lead time analysis chart
- Provider ranking table
- CSV export functionality

### **Phase 4: Export Features (Day 8)**

#### 4.1 Chart to PNG Export
```typescript
// Using html2canvas or recharts built-in
import html2canvas from 'html2canvas';

const exportChartToPNG = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element);
  const url = canvas.toDataURL('image/png');
  // Trigger download
};
```

#### 4.2 Enhanced CSV Export
```typescript
// src/lib/export.ts
export const exportToCSV = (data: any[], filename: string, columns: Column[]) => {
  // Format data with proper headers
  // Handle special characters and encoding
  // Trigger download
};
```

### **Phase 5: Testing & Polish (Day 9-10)**

#### 5.1 E2E Tests
```typescript
// e2e/market-insights.spec.ts
test('Market Insights page loads and displays data', async ({ page }) => {
  await page.goto('/market-insights');
  await expect(page.locator('[data-testid="market-chart"]')).toBeVisible();
  // Test filters, export, etc.
});

// e2e/quotes-benchmark.spec.ts
test('Quotes Benchmark filters and compares', async ({ page }) => {
  await page.goto('/quotes-benchmark');
  // Test filtering, comparison, export
});
```

## 🧪 **TESTING STRATEGY**

### Unit Tests
- Data import validation
- API response formatting
- Export utilities
- Filter logic

### Integration Tests
- Database queries performance
- API endpoint responses
- Data aggregation accuracy

### E2E Tests
- Page load performance
- Filter interactions
- Chart rendering
- Export functionality
- Mobile responsiveness

## ⚠️ **RISKS & MITIGATIONS**

### Risk 1: Data Quality
- **Issue**: Inconsistent company names in pricing data
- **Mitigation**: Fuzzy matching algorithm, manual review queue

### Risk 2: Performance
- **Issue**: Large dataset queries slow
- **Mitigation**: Materialized views, pagination, caching

### Risk 3: Chart Complexity
- **Issue**: Complex visualizations hard to implement
- **Mitigation**: Use Recharts library, start simple

### Risk 4: Timeline
- **Issue**: 10 days aggressive for full implementation
- **Mitigation**: Focus on P0 features, defer enhancements

## 🔄 **ROLLBACK PLAN**

If issues arise:
1. **Database**: Keep backup before migration
2. **Code**: Use feature flags for new pages
3. **API**: Version endpoints (/api/v1/)
4. **UI**: Keep existing pages functional
5. **Quick disable**: Environment variable to hide features

## 📝 **SUCCESS CRITERIA**

- [ ] All 3,524 pricing records imported
- [ ] Market data complete 2014-2024 + forecasts
- [ ] Market Insights page functional
- [ ] Quotes Benchmark page functional
- [ ] CSV export working
- [ ] PNG chart export working
- [ ] Performance < 3s page load
- [ ] Mobile responsive
- [ ] Zero critical bugs
- [ ] Demo script validated

## 🚀 **QUICK START COMMANDS**

```bash
# Development
npm run dev

# Run data migration
npm run data:import

# Run tests
npm run test:e2e

# Build for production
npm run build

# Check TypeScript
npm run type-check
```

## 📅 **DAILY CHECKLIST**

### Day 1-2: Data
- [ ] Import all pricing data
- [ ] Import market forecasts
- [ ] Create database views
- [ ] Verify data integrity

### Day 3-4: APIs
- [ ] Market totals endpoint
- [ ] Country/segment endpoint
- [ ] Pricing benchmark endpoint
- [ ] Add caching headers

### Day 5-7: UI
- [ ] Market Insights page
- [ ] Quotes Benchmark page
- [ ] Chart components
- [ ] Filter components

### Day 8: Export
- [ ] CSV export utility
- [ ] PNG chart export
- [ ] Test all exports

### Day 9-10: Polish
- [ ] E2E test suite
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Demo preparation

---

**Next Step**: Start with data migration script for remaining pricing data.