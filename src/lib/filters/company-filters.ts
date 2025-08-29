/**
 * Company Filtering System for Unified Data Architecture
 * 
 * This module provides TypeScript interfaces and utilities for dynamic company filtering,
 * supporting the new unified schema where "datasets" are filtered views of company data.
 * 
 * Key Features:
 * - Type-safe filtering with comprehensive filter options
 * - Dynamic query building for complex filters
 * - Dataset configuration support  
 * - Geographic and capability-based filtering
 * - Performance optimization for large datasets
 * 
 * @see /sql-migrations/020_unified_companies_schema.sql
 */

// ========================================
// CORE FILTER INTERFACES
// ========================================

/**
 * Main filter interface for company queries
 * Supports all filtering dimensions available in the unified schema
 */
export interface CompanyFilters {
  // Basic company classification
  companyType?: ('equipment' | 'service' | 'material' | 'software')[]
  companyRole?: ('manufacturer' | 'provider' | 'supplier' | 'developer' | 'researcher')[]
  segment?: ('industrial' | 'professional' | 'desktop' | 'research' | 'enterprise')[]
  
  // Geographic filters
  country?: string[]
  state?: string[]
  city?: string[]
  region?: string // For regional groupings
  
  // Market and industry filters
  primaryMarket?: ('aerospace' | 'automotive' | 'healthcare' | 'consumer' | 'industrial' | 'research')[]
  secondaryMarkets?: string[] // Any additional markets
  
  // Technology and capability filters
  technologies?: string[] // Technology names or IDs
  materials?: string[] // Material names or IDs
  processes?: string[] // Specific AM processes
  
  // Business characteristics
  employeeCountRange?: string[]
  revenueRange?: string[]
  foundedYearMin?: number
  foundedYearMax?: number
  
  // Service-specific filters (for service providers)
  serviceTypes?: string[]
  qualityCertifications?: string[]
  leadTimeMaxDays?: number
  minQuantity?: number
  maxQuantity?: number
  
  // Equipment-specific filters (for manufacturers)
  systemTypes?: string[]
  priceRange?: string[]
  targetMarket?: string[]
  
  // General filters
  search?: string // Text search across name, description
  isActive?: boolean
  dataSource?: string[]
  lastVerifiedAfter?: string // ISO date string
  
  // Metadata filters
  hasWebsite?: boolean
  hasCoordinates?: boolean
  hasEquipment?: boolean
  hasServices?: boolean
}

/**
 * Filter operators for advanced filtering
 */
export type FilterOperator = 'equals' | 'in' | 'contains' | 'startsWith' | 'endsWith' | 'range' | 'exists'

/**
 * Advanced filter with operator support
 */
export interface AdvancedFilter {
  field: keyof CompanyFilters
  operator: FilterOperator
  value: string | number | boolean | string[] | number[] | [number, number] | null
}

/**
 * Geographic bounds for map-based filtering
 */
export interface GeographicBounds {
  north: number
  south: number
  east: number
  west: number
}

/**
 * Complete filter request with pagination and sorting
 */
export interface CompanyFilterRequest extends CompanyFilters {
  // Pagination
  page?: number
  limit?: number
  
  // Sorting
  sortBy?: keyof CompanyFilterResponse['data'][0]
  sortOrder?: 'asc' | 'desc'
  
  // Geographic
  bounds?: GeographicBounds
  
  // Advanced filters
  advancedFilters?: AdvancedFilter[]
  
  // Response options
  includeCapabilities?: boolean
  includeEquipment?: boolean
  includeServices?: boolean
  
  // Dataset context (for backward compatibility)
  datasetId?: string
}

// ========================================
// RESPONSE INTERFACES  
// ========================================

/**
 * Company data structure in API responses
 */
export interface CompanyFilterResult {
  id: string
  name: string
  
  // Geographic
  country: string | null
  state: string | null
  city: string | null
  lat: number | null
  lng: number | null
  
  // Classification
  companyType: 'equipment' | 'service' | 'material' | 'software'
  companyRole: 'manufacturer' | 'provider' | 'supplier' | 'developer' | 'researcher'
  segment: string | null
  
  // Business info
  website: string | null
  description: string | null
  employeeCountRange: string | null
  annualRevenueRange: string | null
  foundedYear: number | null
  primaryMarket: string | null
  secondaryMarkets: string[] | null
  
  // Aggregated capabilities (from summary view)
  technologyCount: number
  materialCount: number
  equipmentCount: number
  serviceCount: number
  
  // Capability arrays (for filtering)
  technologies: string[] | null
  materials: string[] | null
  serviceTypes: string[] | null
  
  // Metadata
  isActive: boolean
  dataSource: string | null
  lastVerified: string | null
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Optional detailed data (if requested)
  equipment?: EquipmentSystem[]
  services?: CompanyService[]
}

/**
 * Equipment/system data structure
 */
export interface EquipmentSystem {
  id: string
  systemName: string | null
  modelNumber: string | null
  systemType: string | null
  buildVolume: Record<string, any> | null
  resolution: Record<string, any> | null
  materialsSupported: string[] | null
  processesSupported: string[] | null
  priceRange: string | null
  targetMarket: string | null
  availabilityStatus: string | null
}

/**
 * Service data structure
 */
export interface CompanyService {
  id: string
  serviceType: string
  serviceName: string | null
  description: string | null
  processesOffered: string[] | null
  materialsOffered: string[] | null
  industriesServed: string[] | null
  leadTimeDaysMin: number | null
  leadTimeDaysMax: number | null
  qualityCertifications: string[] | null
  pricingModel: string | null
  priceRange: string | null
  isActive: boolean
}

/**
 * Complete API response structure
 */
export interface CompanyFilterResponse {
  data: CompanyFilterResult[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    applied: CompanyFilters
    available: FilterOptions
  }
  metadata: {
    query: string
    executionTime: number
    dataSource: string
    timestamp: string
  }
}

/**
 * Available filter options for building dynamic UIs
 */
export interface FilterOptions {
  countries: string[]
  states: string[]
  companyTypes: string[]
  companyRoles: string[]
  segments: string[]
  technologies: { id: string; name: string; category: string }[]
  materials: { id: string; name: string; materialType: string; materialFormat: string }[]
  primaryMarkets: string[]
  employeeCountRanges: string[]
  revenueRanges: string[]
  serviceTypes: string[]
  systemTypes: string[]
}

// ========================================
// DATASET CONFIGURATION INTERFACES
// ========================================

/**
 * Dataset configuration for predefined filtered views
 */
export interface DatasetConfig {
  id: string
  name: string
  description: string
  
  // Base filter criteria
  filters: CompanyFilters
  
  // Display configuration
  displayColumns: string[]
  mapType: 'equipment' | 'service' | 'material' | 'software'
  
  // UI configuration
  icon?: string
  color?: string
  defaultSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  
  // Feature flags
  enableMap?: boolean
  enableAnalytics?: boolean
  enableExport?: boolean
  
  // Metadata
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Dataset configuration response from API
 */
export interface DatasetConfigResponse {
  datasets: DatasetConfig[]
  total: number
  categories: {
    [key: string]: DatasetConfig[]
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Validates company filters for type safety and constraint checking
 */
export function validateCompanyFilters(filters: CompanyFilters): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate arrays are not empty if provided
  const arrayFields = ['companyType', 'companyRole', 'segment', 'country', 'technologies', 'materials']
  arrayFields.forEach(field => {
    const value = filters[field as keyof CompanyFilters]
    if (Array.isArray(value) && value.length === 0) {
      errors.push(`${field} array cannot be empty`)
    }
  })
  
  // Validate date ranges
  if (filters.foundedYearMin && filters.foundedYearMax) {
    if (filters.foundedYearMin > filters.foundedYearMax) {
      errors.push('foundedYearMin cannot be greater than foundedYearMax')
    }
  }
  
  // Validate pagination
  if (filters.page && filters.page < 1) {
    errors.push('page must be >= 1')
  }
  
  if (filters.limit && (filters.limit < 1 || filters.limit > 1000)) {
    errors.push('limit must be between 1 and 1000')
  }
  
  // Validate geographic bounds
  if (filters.bounds) {
    const { north, south, east, west } = filters.bounds
    if (north <= south) errors.push('bounds.north must be > bounds.south')
    if (east <= west) errors.push('bounds.east must be > bounds.west')
    if (north > 90 || south < -90) errors.push('bounds latitude must be between -90 and 90')
    if (east > 180 || west < -180) errors.push('bounds longitude must be between -180 and 180')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Builds a human-readable filter description
 */
export function describeFilters(filters: CompanyFilters): string {
  const parts: string[] = []
  
  if (filters.companyType?.length) {
    parts.push(`${filters.companyType.join(', ')} companies`)
  }
  
  if (filters.companyRole?.length) {
    parts.push(`${filters.companyRole.join(', ')}s`)
  }
  
  if (filters.country?.length) {
    parts.push(`in ${filters.country.join(', ')}`)
  }
  
  if (filters.technologies?.length) {
    parts.push(`using ${filters.technologies.join(', ')}`)
  }
  
  if (filters.segment?.length) {
    parts.push(`(${filters.segment.join(', ')} segment)`)
  }
  
  if (filters.search) {
    parts.push(`matching "${filters.search}"`)
  }
  
  return parts.length > 0 ? parts.join(' ') : 'All companies'
}

/**
 * Merges multiple filter objects, with later filters overriding earlier ones
 */
export function mergeFilters(...filters: Partial<CompanyFilters>[]): CompanyFilters {
  const merged: CompanyFilters = {}
  
  for (const filter of filters) {
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // For arrays, concatenate and deduplicate
          const existing = merged[key as keyof CompanyFilters] as any[]
          merged[key as keyof CompanyFilters] = Array.isArray(existing) 
            ? [...new Set([...existing, ...value])] as any
            : [...value] as any
        } else {
          // For non-arrays, override
          merged[key as keyof CompanyFilters] = value as any
        }
      }
    }
  }
  
  return merged
}

/**
 * Converts filters to URL search parameters
 */
export function filtersToSearchParams(filters: CompanyFilters): URLSearchParams {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','))
        }
      } else if (typeof value === 'object') {
        params.set(key, JSON.stringify(value))
      } else {
        params.set(key, String(value))
      }
    }
  })
  
  return params
}

/**
 * Parses URL search parameters back to filters
 */
export function searchParamsToFilters(searchParams: URLSearchParams): CompanyFilters {
  const filters: CompanyFilters = {}
  
  // Array-type filter keys that should always be treated as arrays
  const arrayKeys = [
    'companyType', 'companyRole', 'segment', 'country', 'state', 'city',
    'primaryMarket', 'secondaryMarkets', 'technologies', 'materials', 'serviceTypes'
  ]
  
  for (const [key, value] of searchParams.entries()) {
    try {
      // Try to parse as JSON first (for objects)
      if (value.startsWith('{') || value.startsWith('[')) {
        filters[key as keyof CompanyFilters] = JSON.parse(value) as any
      }
      // Handle comma-separated arrays
      else if (value.includes(',')) {
        filters[key as keyof CompanyFilters] = value.split(',').filter(v => v.trim()) as any
      }
      // Handle array-type keys - always convert to array
      else if (arrayKeys.includes(key)) {
        filters[key as keyof CompanyFilters] = [value] as any
      }
      // Handle booleans
      else if (value === 'true' || value === 'false') {
        filters[key as keyof CompanyFilters] = value === 'true' as any
      }
      // Handle numbers
      else if (!isNaN(Number(value))) {
        filters[key as keyof CompanyFilters] = Number(value) as any
      }
      // Handle strings
      else {
        filters[key as keyof CompanyFilters] = value as any
      }
    } catch (e) {
      // If parsing fails, treat as string
      filters[key as keyof CompanyFilters] = value as any
    }
  }
  
  return filters
}

// ========================================
// PREDEFINED FILTER SETS
// ========================================

/**
 * Common filter presets for quick access
 */
export const FILTER_PRESETS: Record<string, CompanyFilters> = {
  // Equipment manufacturers
  AM_SYSTEMS_MANUFACTURERS: {
    companyType: ['equipment'],
    companyRole: ['manufacturer'],
    isActive: true
  },
  
  // Service providers
  PRINT_SERVICES_GLOBAL: {
    companyType: ['service'], 
    companyRole: ['provider'],
    isActive: true
  },
  
  // Material suppliers
  MATERIAL_SUPPLIERS: {
    companyType: ['material'],
    companyRole: ['supplier'],
    isActive: true
  },
  
  // Software developers
  SOFTWARE_DEVELOPERS: {
    companyType: ['software'],
    companyRole: ['developer'],
    isActive: true
  },
  
  // Regional presets
  NORTH_AMERICA: {
    country: ['United States', 'Canada', 'Mexico'],
    isActive: true
  },
  
  EUROPE: {
    country: ['Germany', 'United Kingdom', 'France', 'Italy', 'Netherlands', 'Spain', 'Switzerland'],
    isActive: true
  },
  
  ASIA_PACIFIC: {
    country: ['China', 'Japan', 'South Korea', 'Singapore', 'Australia', 'India'],
    isActive: true
  },
  
  // Technology-specific
  METAL_3D_PRINTING: {
    technologies: ['DMLS', 'SLM', 'EBM'],
    materials: ['Titanium Ti6Al4V', 'Stainless Steel 316L', 'Aluminum AlSi10Mg'],
    isActive: true
  },
  
  POLYMER_3D_PRINTING: {
    technologies: ['FDM', 'SLA', 'SLS'],
    materials: ['PLA', 'ABS', 'Nylon', 'Standard Resin'],
    isActive: true
  }
}

/**
 * Dataset-specific filter configurations matching the database configs
 */
export const DATASET_FILTERS: Record<string, CompanyFilters> = {
  'am-systems-manufacturers': FILTER_PRESETS.AM_SYSTEMS_MANUFACTURERS,
  'print-services-global': FILTER_PRESETS.PRINT_SERVICES_GLOBAL,
  'material-suppliers': FILTER_PRESETS.MATERIAL_SUPPLIERS,
  'software-developers': FILTER_PRESETS.SOFTWARE_DEVELOPERS
}

// Export all interfaces and types for use in other modules
export type {
  CompanyFilters,
  FilterOperator,
  AdvancedFilter,
  GeographicBounds,
  CompanyFilterRequest,
  CompanyFilterResult,
  CompanyFilterResponse,
  FilterOptions,
  DatasetConfig,
  DatasetConfigResponse,
  EquipmentSystem,
  CompanyService
}