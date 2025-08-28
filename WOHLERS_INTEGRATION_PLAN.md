# Wohlers Reports Integration Plan

## Phase 1: Database Schema Extension ⏳ **2-3 days**

### 1.1 Run Schema Migration
```bash
# Execute in Supabase SQL Editor
\i sql-migrations/007_wohlers_reports_schema.sql
```

### 1.2 Update TypeScript Types
```bash
# Regenerate types after schema changes
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.ts
```

### 1.3 Add New Query Functions
**File:** `src/lib/supabase/queries.ts`
- `getWohlersReportData(reportType)` 
- `getMaterialProducersSummary()`
- `getCategoryDistributionByCountry()`
- `getMATimelineData()`
- `getEventSpeakersSummary()`
- `getAmericaMakesStateDistribution()`

---

## Phase 2: New UI Components ⏳ **4-5 days**

### 2.1 Create Visualization Components

**File:** `src/components/charts/StackedBarChart.tsx`
```typescript
interface StackedBarChartProps {
  data: Array<{
    category: string;
    series: Array<{ name: string; value: number; color: string }>;
  }>;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
}
```

**File:** `src/components/charts/TimeSeriesChart.tsx`
```typescript
interface TimeSeriesChartProps {
  data: Array<{
    date: string;
    values: Array<{ name: string; value: number }>;
  }>;
  title: string;
}
```

**File:** `src/components/maps/WorldMap.tsx`
```typescript
interface WorldMapProps {
  data: Array<{
    country: string;
    value: number;
    color: string;
  }>;
  onCountrySelect?: (country: string) => void;
}
```

**File:** `src/components/maps/USStateMap.tsx`
```typescript
interface USStateMapProps {
  data: Array<{
    state: string;
    value: number;
    memberStatus: string;
  }>;
  onStateSelect?: (state: string) => void;
}
```

### 2.2 Enhanced Data Tables

**File:** `src/components/tables/WohlersDataTable.tsx`
- Extends existing `data-table-content.tsx`
- Adds report-specific filtering
- Export functionality for Wohlers format
- Pagination and search

---

## Phase 3: Report Dashboard Pages ⏳ **3-4 days**

### 3.1 Create Report Route Structure
```
src/app/(dashboard-template)/wohlers-reports/
├── page.tsx                    # Report dashboard overview
├── material-producers/
│   └── page.tsx               # Report 1
├── service-providers/  
│   └── page.tsx               # Report 2
├── category-distribution/
│   └── page.tsx               # Report 3
├── mergers-acquisitions/
│   └── page.tsx               # Report 4
├── coe-associations/
│   └── page.tsx               # Report 5
├── contributors/
│   └── page.tsx               # Report 6
├── organizations-speakers/
│   └── page.tsx               # Report 7
├── icam-events/
│   └── page.tsx               # Report 8
└── america-makes-members/
    └── page.tsx               # Report 9
```

### 3.2 Report Content Components

**File:** `src/components/wohlers-reports-content.tsx`
```typescript
interface WohlersReportsContentProps {
  reportType: 'material-producers' | 'service-providers' | 'category-distribution' | 'mergers-acquisitions' | 'coe-associations' | 'contributors' | 'organizations-speakers' | 'icam-events' | 'america-makes-members';
}
```

---

## Phase 4: API Routes & Data Integration ⏳ **2-3 days**

### 4.1 Create API Endpoints

**Files to Create:**
```
src/app/api/wohlers-reports/
├── material-producers/route.ts
├── service-providers/route.ts  
├── category-distribution/route.ts
├── mergers-acquisitions/route.ts
├── coe-associations/route.ts
├── contributors/route.ts
├── organizations-speakers/route.ts
├── icam-events/route.ts
└── america-makes-members/route.ts
```

### 4.2 Data Processing Functions

**File:** `src/lib/wohlers-data-processor.ts`
```typescript
export class WohlersDataProcessor {
  static processMaterialProducers(rawData: any[]): MaterialProducerData[]
  static processCategoryDistribution(rawData: any[]): CategoryDistributionData[]
  static processMATimeline(rawData: any[]): MATimelineData[]
  static processEventSpeakers(rawData: any[]): EventSpeakerData[]
  static processAmericaMakesStates(rawData: any[]): StateMemberData[]
}
```

---

## Phase 5: Sidebar & Navigation ⏳ **1 day**

### 5.1 Update App Sidebar

**File:** `src/components/app-sidebar.tsx`
```typescript
// Add Wohlers Reports section
const wohlersReportsSection = {
  title: "Wohlers Reports",
  icon: ChartBarIcon,
  items: [
    { title: "Material Producers", url: "/wohlers-reports/material-producers" },
    { title: "Service Providers", url: "/wohlers-reports/service-providers" },
    { title: "Category Distribution", url: "/wohlers-reports/category-distribution" },
    { title: "M&A Analysis", url: "/wohlers-reports/mergers-acquisitions" },
    { title: "COE & Associations", url: "/wohlers-reports/coe-associations" },
    { title: "Contributors", url: "/wohlers-reports/contributors" },
    { title: "Organizations & Speakers", url: "/wohlers-reports/organizations-speakers" },
    { title: "ICAM Events", url: "/wohlers-reports/icam-events" },
    { title: "America Makes Members", url: "/wohlers-reports/america-makes-members" }
  ]
}
```

---

## Phase 6: Testing & Validation ⏳ **2-3 days**

### 6.1 E2E Test Coverage

**File:** `e2e/wohlers-reports.spec.ts`
```typescript
test.describe('Wohlers Reports Integration', () => {
  test('should display material producers report', async ({ page }) => {
    // Test report rendering, data loading, export functionality
  });
  
  test('should handle interactive map selections', async ({ page }) => {
    // Test world map and US state map interactions
  });
  
  test('should export reports in multiple formats', async ({ page }) => {
    // Test CSV, PDF, PNG export functionality
  });
});
```

### 6.2 Data Validation Scripts

**File:** `scripts/validate-wohlers-data.ts`
- Verify data integrity across all report tables
- Check foreign key relationships
- Validate geographic coordinate data
- Test aggregation view accuracy

---

## Required Dependencies

### New NPM Packages
```json
{
  "dependencies": {
    "d3-geo": "^3.1.0",           // World map projections
    "topojson-client": "^3.1.0",  // Map topology data
    "world-atlas": "^2.0.2",      // World map data
    "us-atlas": "^3.0.1",         // US states map data
    "@visx/geo": "^3.3.0",        // React map components
    "@visx/responsive": "^3.3.0"   // Responsive visualizations
  },
  "devDependencies": {
    "@types/d3-geo": "^3.1.0",
    "@types/topojson-client": "^3.1.0"
  }
}
```

### Install Command
```bash
npm install d3-geo topojson-client world-atlas us-atlas @visx/geo @visx/responsive
npm install -D @types/d3-geo @types/topojson-client
```

---

## Database Migration Sequence

1. **Backup current database** (Supabase dashboard)
2. **Run migration 007** (`sql-migrations/007_wohlers_reports_schema.sql`)
3. **Regenerate TypeScript types**
4. **Test schema with sample data insertions**
5. **Validate all views return expected results**

---

## Expected File Structure After Integration

```
src/
├── app/
│   ├── (dashboard-template)/
│   │   └── wohlers-reports/        # 🆕 New report pages
│   └── api/
│       └── wohlers-reports/        # 🆕 New API routes
├── components/
│   ├── charts/                     # 🆕 New chart components  
│   ├── maps/                       # 🆕 New map components
│   ├── tables/                     # 🆕 Enhanced table components
│   └── wohlers-reports-content.tsx # 🆕 Report layouts
├── lib/
│   ├── supabase/
│   │   ├── queries.ts             # 🔧 Extended with Wohlers queries
│   │   └── types.ts               # 🔧 Updated with new table types
│   └── wohlers-data-processor.ts   # 🆕 Data transformation logic
└── sql-migrations/
    └── 007_wohlers_reports_schema.sql # 🆕 Schema extension
```

---

## Success Metrics

✅ **Database Integration**: All 9 report data models fully integrated with proper relationships  
✅ **UI Completeness**: All visualization types from reports implemented and interactive  
✅ **Performance**: Report loading times < 2 seconds with 10,000+ records  
✅ **Export Functionality**: All reports exportable as CSV, PNG, and PDF  
✅ **Test Coverage**: >90% E2E test coverage for report functionality  
✅ **Type Safety**: Zero TypeScript errors, full type coverage for new entities  

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| **Phase 1** | 2-3 days | Complete schema migration, updated types |
| **Phase 2** | 4-5 days | All visualization components functional |
| **Phase 3** | 3-4 days | 9 report dashboard pages live |
| **Phase 4** | 2-3 days | API routes with caching and optimization |
| **Phase 5** | 1 day | Navigation and sidebar integration |
| **Phase 6** | 2-3 days | Full testing coverage and validation |

**Total Estimated Time: 14-19 days** (2.5-4 weeks)

---

## Risk Mitigation

**🚨 Data Migration Risks**
- Test schema changes on staging environment first
- Create rollback scripts for each migration step
- Validate data integrity before and after migration

**🚨 Performance Risks**  
- Implement proper indexing strategy (included in migration)
- Use database views for complex aggregations
- Add caching layers for expensive queries

**🚨 UI/UX Risks**
- Create responsive designs that work on mobile devices
- Ensure accessibility compliance for all new components
- Test with large datasets to validate performance