# Refactor Print Services Global to Use Unified Data Architecture

## Overview
The Global Printing Services component (`src/components/print-services-global-content.tsx`) currently uses the old vendor table approach (`vendor_print_services_global`). This task is to refactor it to use our new unified data architecture with mock data support.

## Current State Analysis
- **File**: `src/components/print-services-global-content.tsx`
- **Current Data Source**: `vendor_print_services_global` Supabase table (lines 266-272)
- **Current Types**: Custom `PrintServiceProvider` type with vendor-specific fields
- **Current API**: Direct Supabase queries with custom filtering logic
- **Size**: ~978 lines with complex filtering and UI logic

## Target Architecture
The component should use:
- **Unified API**: `/api/unified/companies?dataset=print-services-global`
- **Unified Types**: `CompanyWithCapabilities` from `src/lib/types/unified.ts`
- **Mock Data Support**: Automatically switches between mock/live data via `NEXT_PUBLIC_USE_MOCKS`

## Detailed Implementation Steps

### Step 1: Update Type Imports and Definitions
**Files to modify:** `src/components/print-services-global-content.tsx`

1. **Replace old imports** (lines 1-48):
```typescript
// Remove old Supabase import
- import { createClient } from '@/lib/supabase/client'

// Add new unified imports
+ import { CompanyWithCapabilities } from '@/lib/types/unified'
```

2. **Replace PrintServiceProvider type** (lines 50-70):
```typescript
// Remove old type definition
- type PrintServiceProvider = {
-   id: string
-   company_name: string
-   printer_manufacturer: string
-   // ... old fields
- }

// Use unified type instead
+ type PrintServiceProvider = CompanyWithCapabilities
```

3. **Update FilterState type** (lines 72-85) to match unified filtering:
```typescript
type FilterState = {
  company_name: string
  country: string
  segment: string
  technologies: string[]
  materials: string[]
  services: string[]
  // Remove printer-specific fields that don't exist in unified model
  // Keep only fields that make sense for service providers
}
```

### Step 2: Replace Data Loading Logic
**Target:** Lines 247-302 (the `useEffect` with data loading)

1. **Remove old Supabase code** (lines 266-289):
```typescript
// Remove this entire block
- const supabase = createClient()
- const { data: rows, error } = await supabase
-   .from('vendor_print_services_global')
-   .select('*')
-   .limit(5000)
```

2. **Add unified API call**:
```typescript
// Replace with unified API call
const response = await fetch('/api/unified/companies?dataset=print-services-global&limit=1000')
if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
const result = await response.json()

if (result.companies?.length) {
  setData(result.companies)
  setFilteredData(result.companies)
} else {
  // Keep existing fallback to sample data
  setData(sampleData)
  setFilteredData(sampleData)
}
```

### Step 3: Update Sample Data
**Target:** Lines 118-245 (sampleData array)

1. **Replace sample data** with unified structure:
```typescript
const sampleData: CompanyWithCapabilities[] = [
  {
    id: '1',
    name: 'Protolabs Inc.',
    website: 'https://protolabs.com',
    description: 'On-demand manufacturing services including 3D printing',
    country: 'United States',
    state: 'Minnesota',
    city: 'Maple Plain',
    company_type: 'service',
    company_role: 'provider',
    segment: 'professional',
    primary_market: 'services',
    founded_year: 1999,
    is_active: true,
    // Add services array
    services: [
      {
        id: 'svc-1',
        company_id: '1',
        service_type: 'printing',
        service_name: '3D Printing Service',
        description: 'On-demand 3D printing with multiple materials',
        pricing_model: 'per_part',
        lead_time_days: 3,
        capabilities: ['SLA', 'SLS', 'FDM', 'Metal printing']
      }
    ],
    // Add technologies array
    technologies: [
      { id: 'tech-1', name: 'SLA', category: 'Vat Photopolymerization' },
      { id: 'tech-2', name: 'SLS', category: 'Powder Bed Fusion' }
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Add 3-4 more realistic service provider examples
]
```

### Step 4: Update Filtering Logic
**Target:** Lines 332-398 (filtering useEffect)

1. **Update field mappings**:
```typescript
// Old printer-specific filters need to be mapped to new structure
// company_name -> name
// printer_manufacturer -> technologies (array search)
// printer_model -> equipment.model (if applicable)
// segment -> segment (same)
// country -> country (same)

// Example filter update:
if (filters.technologies?.length) {
  filtered = filtered.filter(item => 
    item.technologies?.some(tech => 
      filters.technologies!.includes(tech.name)
    )
  )
}
```

2. **Remove printer-specific filters**:
```typescript
// Remove these filter blocks:
- if (filters.printer_manufacturer && filters.printer_manufacturer !== 'all') {
-   filtered = filtered.filter(item => item.printer_manufacturer === filters.printer_manufacturer)
- }
- if (filters.printer_model && filters.printer_model !== 'all') {
-   filtered = filtered.filter(item => item.printer_model === filters.printer_model)
- }
- if (filters.number_of_printers_min !== '') {
-   // Remove printer count filtering
- }
```

3. **Add service-specific filters**:
```typescript
// Add filters for services
if (filters.services?.length) {
  filtered = filtered.filter(item => 
    item.services?.some(service => 
      filters.services!.includes(service.service_type)
    )
  )
}
```

### Step 5: Update UI Components and Display
**Target:** Lines 594-976 (filter UI and table)

1. **Update filter controls** (lines 594-743):
```typescript
// Replace printer-specific dropdowns with service-specific ones:

// Remove printer manufacturer/model dropdowns
- <SearchableDropdown
-   label="Manufacturers"
-   options={uniqueValues.manufacturers}
- />

// Add technology filter
+ <SearchableDropdown
+   label="Technologies"
+   options={uniqueValues.technologies}
+   value={filters.technologies}
+   onChange={(value) => setFilters(prev => ({ ...prev, technologies: value }))}
+ />

// Add services filter
+ <Select value={filters.services} onValueChange={(value) => setFilters(prev => ({ ...prev, services: value }))}>
+   <SelectTrigger><SelectValue /></SelectTrigger>
+   <SelectContent>
+     <SelectItem value="all">All Services</SelectItem>
+     <SelectItem value="printing">3D Printing</SelectItem>
+     <SelectItem value="design">Design Services</SelectItem>
+     <SelectItem value="consulting">Consulting</SelectItem>
+   </SelectContent>
+ </Select>
```

2. **Update table headers** (lines 820-854):
```typescript
// Replace printer-specific columns:
- <TableHead>Printer Manufacturer</TableHead>
- <TableHead>Printer Model</TableHead>
- <TableHead>Printers</TableHead>

// Add service-specific columns:
+ <TableHead>Technologies</TableHead>
+ <TableHead>Services</TableHead>
+ <TableHead>Materials</TableHead>
```

3. **Update table body** (lines 857-929):
```typescript
// Replace table cells to show unified data:
<TableCell>
  {/* Technologies */}
  <div className="flex flex-wrap gap-1">
    {provider.technologies?.slice(0, 3).map(tech => (
      <Badge key={tech.id} variant="outline" className="text-xs">
        {tech.name}
      </Badge>
    ))}
    {(provider.technologies?.length || 0) > 3 && (
      <span className="text-xs text-muted-foreground">
        +{(provider.technologies?.length || 0) - 3} more
      </span>
    )}
  </div>
</TableCell>

<TableCell>
  {/* Services */}
  <div className="flex flex-wrap gap-1">
    {provider.services?.slice(0, 2).map(service => (
      <Badge key={service.id} variant="secondary" className="text-xs">
        {service.service_name}
      </Badge>
    ))}
  </div>
</TableCell>
```

### Step 6: Update Unique Values Calculation
**Target:** Lines 400-424 (uniqueValues calculation)

```typescript
const uniqueValues = {
  segments: uniq(data.map(item => item.segment)),
  countries: uniq(data.map(item => item.country)),
  technologies: uniq(data.flatMap(item => item.technologies?.map(t => t.name) || [])),
  materials: uniq(data.flatMap(item => item.materials?.map(m => m.name) || [])),
  serviceTypes: uniq(data.flatMap(item => item.services?.map(s => s.service_type) || [])),
  // Remove printer-specific unique values
}
```

### Step 7: Update Export Function
**Target:** Lines 505-539 (handleExport function)

```typescript
const handleExport = () => {
  const headers = [
    'Company Name', 'Country', 'Segment', 'Technologies', 
    'Services', 'Materials', 'Website', 'Founded Year'
  ]
  const csvData = [
    headers,
    ...filteredData.map(item => [
      item.name,
      item.country || '',
      item.segment || '',
      item.technologies?.map(t => t.name).join('; ') || '',
      item.services?.map(s => s.service_name).join('; ') || '',
      item.materials?.map(m => m.name).join('; ') || '',
      item.website || '',
      item.founded_year?.toString() || ''
    ])
  ]
  // Rest of export logic stays the same
}
```

### Step 8: Update Summary Statistics
**Target:** Lines 502-503 (summary stats)

```typescript
// Replace printer-specific stats:
- const totalPrinters = filteredData.reduce((sum, item) => sum + item.number_of_printers, 0)
- const avgPrintersPerProvider = filteredData.length > 0 ? (totalPrinters / filteredData.length).toFixed(1) : '0'

// Add service-specific stats:
+ const totalServices = filteredData.reduce((sum, item) => sum + (item.services?.length || 0), 0)
+ const avgServicesPerProvider = filteredData.length > 0 ? (totalServices / filteredData.length).toFixed(1) : '0'
+ const totalTechnologies = new Set(filteredData.flatMap(item => item.technologies?.map(t => t.name) || [])).size
```

## Testing Instructions

### Environment Setup
1. Ensure `NEXT_PUBLIC_USE_MOCKS=true` is set in `.env.local`
2. Start development server: `npm run dev`

### Testing Steps
1. **Mock Data Test**: 
   - Navigate to `/dashboard?dataset=print-services-global&view=table`
   - Verify mock service providers are displayed
   - Check that technologies and services are shown correctly

2. **Filtering Test**:
   - Test company name search
   - Test country filtering
   - Test technology filtering (should filter by technologies array)
   - Test service type filtering

3. **API Integration Test**:
   - Verify API call: `curl "http://localhost:3000/api/unified/companies?dataset=print-services-global"`
   - Confirm response includes service companies with `company_type: 'service'`

4. **Export Test**:
   - Click "Export CSV" button
   - Verify exported CSV contains unified data structure fields

## Success Criteria
- ✅ Component loads mock service providers via unified API
- ✅ Filtering works with unified data structure (technologies, services, materials)
- ✅ Table displays relevant service provider information
- ✅ Export generates CSV with unified data fields
- ✅ No console errors related to missing fields
- ✅ UI remains responsive and visually consistent
- ✅ Mobile view still works correctly

## Files Modified
- `src/components/print-services-global-content.tsx` (primary file)

## Files to Reference
- `src/lib/types/unified.ts` - Type definitions
- `src/lib/mocks/unified-data.ts` - Mock data structure examples
- `src/app/api/unified/companies/route.ts` - API endpoint
- `src/app/mock-demo/page.tsx` - Example of unified API usage

## Notes
- This refactor maintains backward compatibility by keeping the same URL structure
- The component will automatically use mock data in development when `NEXT_PUBLIC_USE_MOCKS=true`
- Once the unified database schema is implemented, this component will seamlessly switch to live data
- The filtering logic becomes simpler because the unified API handles filtering server-side
- This refactor removes printer-specific concepts and focuses on service capabilities

## Estimated Effort
- **Complexity**: Medium
- **Time Estimate**: 2-3 hours
- **Lines of Code**: ~300-400 lines modified/replaced
- **Testing Time**: 30-45 minutes