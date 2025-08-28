# Market Data UI System

This directory contains the schema-based UI components for displaying different types of market data with specialized layouts optimized for each dataset type.

## Architecture

The Market Data UI system uses a schema-based approach where each dataset type gets a specialized layout component tailored to its data structure and analysis needs.

### Dataset Types & Layouts

| Dataset | Layout Component | Description |
|---------|------------------|-------------|
| `am-market-revenue-2024` | `RevenueAnalysisLayout` | Revenue data by country/segment with summary cards and filters |
| `revenue-by-industry-2024` | `RevenueAnalysisLayout` | Industry revenue breakdown with regional/material filters |
| `fundings-investments` | `InvestmentAnalysisLayout` | Investment timeline with funding round analysis |
| `mergers-acquisitions` | `MergerAcquisitionLayout` | M&A deal tracking with deal size analysis |
| `print-services-pricing` | `PricingAnalysisLayout` | Pricing benchmarks with cost vs lead time analysis |
| `company-information` | `CompanyDirectoryLayout` | Company profiles with website links and stock info |
| `company-roles` | `CompanyDirectoryLayout` | Company role categorization |
| `directory` | `CompanyDirectoryLayout` | General company directory |
| `total-am-market-size` | `GenericTableLayout` | Fallback layout for uncategorized data |

## Layout Components

### 1. RevenueAnalysisLayout
**Used for:** Revenue data (AM Market Revenue 2024, Revenue by Industry 2024)

**Features:**
- Summary cards: Total records, Countries/Industries, Segments, Average revenue
- Filters: Country/Industry selector, Segment selector, Search, Chart generation
- Data visualization suggestions: Pie charts, bar charts by segment
- Revenue formatting with badges

**Schema expectations:**
- Column 0: Revenue (USD) - formatted as currency
- Column 1: Country/Industry 
- Column 2: Segment
- Additional columns: Region, Material (for industry data)

### 2. InvestmentAnalysisLayout
**Used for:** Fundings & Investments

**Features:**
- Investment timeline analysis
- Summary cards: Total investments, Countries, Funding types, Time range
- Filters: Year, Country, Round type, Company search
- Timeline chart generation
- Investment amount formatting

**Schema expectations:**
- Column 0: Year
- Column 1: Month
- Column 2: Company name
- Column 3: Country
- Column 4: Amount (in millions USD)
- Column 5: Funding round
- Column 6: Lead investor

### 3. MergerAcquisitionLayout
**Used for:** Mergers & Acquisitions

**Features:**
- M&A deal tracking and analysis
- Summary cards: Total deals, Markets, Disclosed deals, Latest activity
- Deal size categorization (disclosed vs undisclosed)
- Country and deal size filters
- Deal flow visualization

**Schema expectations:**
- Column 0: Deal date
- Column 1: Acquired company
- Column 2: Acquiring company
- Column 3: Deal size ($M)
- Column 4: Country

### 4. PricingAnalysisLayout
**Used for:** Print Services Pricing

**Features:**
- Pricing benchmarks and cost analysis
- Summary cards: Total quotes, Processes, Materials, Lead time
- Multi-dimensional filtering: Process, Material, Country, Company search
- Cost vs Lead time scatter plot suggestion
- Manufacturing cost and lead time formatting

**Schema expectations:**
- Column 0: Company name
- Column 1: Material type
- Column 2: Material
- Column 3: Process
- Column 4: Quantity
- Column 5: Manufacturing cost
- Column 6: Shipping cost
- Column 7: Day ordered
- Column 8: Delivery date
- Column 9: Lead time
- Column 10: Country

### 5. CompanyDirectoryLayout
**Used for:** Company Information, Company Roles, Directory

**Features:**
- Company directory with profile information
- Summary cards: Total companies, Countries, Active websites, Public companies
- Company type filtering and search
- Website link integration
- Stock ticker display
- Map view integration

**Schema expectations:**
- Column 0: Company name
- Column 1: Website (clickable links)
- Column 2: Headquarters/Country
- Column 3: Owned by / Subsidiary of
- Column 4: Public stock (ticker symbols)
- Column 5: Number of employees

### 6. GenericTableLayout
**Used for:** Fallback for uncategorized datasets

**Features:**
- Basic table display with standard functionality
- Generic summary cards: Records count, Columns count, Export/Filter actions
- Simple table view with no specialized formatting
- Minimal processing requirements

## Usage

```tsx
import { 
  RevenueAnalysisLayout,
  InvestmentAnalysisLayout, 
  MergerAcquisitionLayout,
  PricingAnalysisLayout,
  CompanyDirectoryLayout,
  GenericTableLayout
} from '@/components/market-data/MarketDataLayouts'

// In your component
const renderLayout = () => {
  switch (datasetType) {
    case 'revenue-data':
      return <RevenueAnalysisLayout data={csvData} dataset={datasetId} />
    // ... other cases
    default:
      return <GenericTableLayout data={csvData} dataset={datasetId} />
  }
}
```

## Data Processing

All layouts expect data in the format:
```typescript
string[][] // Array of arrays where first row is headers
```

Common processing:
- First row (index 0) contains column headers
- Subsequent rows contain data
- Empty rows are filtered out
- Cell values are trimmed of whitespace
- Special formatting applied based on column semantics

## Design Patterns

### Summary Cards
Each layout includes 3-4 summary cards showing:
- Record counts and totals
- Unique value counts (countries, categories, etc.)
- Key metrics (averages, ranges, etc.)
- Status indicators

### Filtering Systems
- Dropdown selectors for categorical data
- Search inputs for text-based filtering
- Action buttons for visualization generation
- Filter state management (future enhancement)

### Data Visualization Integration
- Chart generation buttons for appropriate visualizations
- Scatter plot suggestions for numerical correlations
- Timeline views for date-based data
- Geographic mapping integration

### Responsive Design
- Grid layouts adapt from 1 column (mobile) to 4+ columns (desktop)
- Tables with horizontal scroll on smaller screens
- Collapsible filters and content areas
- Touch-friendly interaction areas

## Future Enhancements

1. **Interactive Filtering**: Implement actual filtering logic with state management
2. **Chart Integration**: Connect to charting libraries (Recharts) for data visualization
3. **Export Functionality**: CSV, JSON, Excel export capabilities
4. **Real-time Updates**: WebSocket integration for live data updates
5. **Advanced Analytics**: Statistical analysis and trend detection
6. **Custom Views**: User-defined layout preferences and saved filters
7. **Performance Optimization**: Virtual scrolling for large datasets
8. **Accessibility**: Enhanced screen reader support and keyboard navigation

## Technical Notes

- All components are client-side rendered (`'use client'`)
- Built with shadcn/ui components for consistency
- Uses Tailwind CSS for styling
- TypeScript for type safety
- Responsive design patterns throughout
- Optimized for performance with data slicing (50 rows max display)