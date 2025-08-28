/**
 * Unified Data Types for AM Explorer
 * 
 * These types define the unified data structure for companies, technologies,
 * and materials in the AM industry, following the database schema from
 * sql-migrations/020_unified_companies_schema.sql
 */

export type CompanyType = 'equipment' | 'service' | 'material' | 'software'
export type CompanyRole = 'manufacturer' | 'provider' | 'supplier' | 'developer' | 'researcher'
export type CompanySegment = 'industrial' | 'professional' | 'desktop' | 'research' | 'enterprise'

export interface UnifiedCompany {
  id: string
  name: string
  website?: string | null
  description?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  lat?: number | null
  lng?: number | null
  company_type: CompanyType
  company_role: CompanyRole
  segment?: CompanySegment | null
  primary_market?: string | null
  secondary_markets?: string[] | null
  employee_count_range?: string | null
  annual_revenue_range?: string | null
  founded_year?: number | null
  is_public_company?: boolean
  stock_ticker?: string | null
  is_active: boolean
  data_source?: string | null
  last_verified?: string | null
  created_at: string
  updated_at: string
}

export interface Technology {
  id: string
  name: string
  category: string
  description?: string | null
  process_type: string
  typical_materials?: string[] | null
  key_applications?: string[] | null
  market_adoption?: string | null
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  name: string
  material_type: 'Metal' | 'Thermoplastic' | 'Thermoset' | 'Ceramic' | 'Composite'
  material_format: 'Powder' | 'Filament' | 'Resin' | 'Wire' | 'Sheet' | 'Pellet'
  description?: string | null
  properties?: Record<string, any> | null
  compatible_processes?: string[] | null
  typical_applications?: string[] | null
  created_at: string
  updated_at: string
}

export interface CompanyTechnology {
  company_id: string
  technology_id: string
  proficiency_level?: 'basic' | 'intermediate' | 'advanced' | 'expert' | null
  years_experience?: number | null
  created_at: string
}

export interface CompanyMaterial {
  company_id: string
  material_id: string
  usage_type?: 'primary' | 'secondary' | 'experimental' | null
  certifications?: string[] | null
  created_at: string
}

export interface EquipmentSystem {
  id: string
  company_id: string
  manufacturer?: string | null
  model?: string | null
  technology_id?: string | null
  build_volume?: string | null
  year_installed?: number | null
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated'
  capabilities?: string[] | null
  created_at: string
  updated_at: string
}

export interface CompanyService {
  id: string
  company_id: string
  service_type: 'printing' | 'design' | 'consulting' | 'training' | 'maintenance' | 'software'
  service_name: string
  description?: string | null
  pricing_model?: 'per_part' | 'per_hour' | 'per_project' | 'subscription' | 'custom' | null
  min_order_value?: number | null
  lead_time_days?: number | null
  capabilities?: string[] | null
  created_at: string
  updated_at: string
}

// Enriched types for API responses
export interface CompanyWithCapabilities extends UnifiedCompany {
  technologies?: (Technology & { proficiency_level?: string })[]
  materials?: (Material & { usage_type?: string })[]
  equipment?: EquipmentSystem[]
  services?: CompanyService[]
  technology_count?: number
  material_count?: number
  equipment_count?: number
  service_count?: number
}

// Filter types
export interface CompanyFilters {
  companyType?: CompanyType[]
  companyRole?: CompanyRole[]
  segment?: CompanySegment[]
  country?: string[]
  state?: string[]
  technologies?: string[]
  materials?: string[]
  search?: string
  hasEquipment?: boolean
  hasServices?: boolean
  employeeCountRange?: string[]
  revenueRange?: string[]
  foundedYearMin?: number
  foundedYearMax?: number
  isPublic?: boolean
  isActive?: boolean
  dataSource?: string[]
}

// Dataset configuration types
export interface DatasetConfig {
  id: string
  name: string
  description: string
  filters: Partial<CompanyFilters>
  displayColumns: string[]
  mapType?: 'equipment' | 'service' | 'hybrid'
  enableMap: boolean
  enableAnalytics: boolean
  enableExport: boolean
  sortBy?: {
    field: string
    order: 'asc' | 'desc'
  }
  groupBy?: string
  customViews?: string[]
}

// API response types
export interface CompanyFilterRequest extends CompanyFilters {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeCapabilities?: boolean
}

export interface CompanyFilterResponse {
  companies: CompanyWithCapabilities[]
  total: number
  filtered: number
  aggregations?: {
    byCountry: Record<string, number>
    byType: Record<CompanyType, number>
    bySegment: Record<CompanySegment, number>
    byTechnology: Record<string, number>
  }
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}