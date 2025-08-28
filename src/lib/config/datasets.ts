/**
 * Dataset Configuration System for Unified Architecture
 * 
 * This module provides centralized configuration for all "datasets" in the unified architecture.
 * Instead of hard-coding dataset information in components, this system defines datasets as 
 * filtered views of the unified company data with associated display and behavior configurations.
 * 
 * Key Features:
 * - Configuration-driven datasets (no code changes for new datasets)
 * - Comprehensive display and behavior settings
 * - Type-safe dataset definitions  
 * - Backward compatibility with existing URLs
 * - Performance optimizations for common queries
 * - Extensible for future dataset types
 * 
 * @see /sql-migrations/020_unified_companies_schema.sql for database schema
 * @see /lib/filters/company-filters.ts for filtering interfaces
 */

import { 
  CompanyFilters, 
  DatasetConfig,
  FILTER_PRESETS 
} from '@/lib/filters/company-filters'

// Legacy support for existing vendor data types
export type LegacyDatasetKey =
  | 'company-information'
  | 'fundings-investments'
  | 'print-services-pricing'
  | 'am-market-revenue-2024'
  | 'mergers-acquisitions'
  | 'company-roles'
  | 'revenue-by-industry-2024'
  | 'total-am-market-size'
  | 'directory'
  | 'am-systems-manufacturers'
  | 'print-services-global'

export type LegacyDatasetConfig = {
  table: string
  name: string
  description: string
  columns: string[]
  displayColumns: string[]
}

// ========================================
// UNIFIED DATASET CONFIGURATIONS
// ========================================

/**
 * Complete dataset configurations for the unified architecture
 * These define how each "dataset" appears and behaves in the application
 */
export const UNIFIED_DATASET_CONFIGS: Record<string, DatasetConfig> = {
  // Equipment Manufacturers Dataset
  'am-systems-manufacturers': {
    id: 'am-systems-manufacturers',
    name: 'AM Systems Manufacturers',
    description: 'Comprehensive directory of additive manufacturing systems and equipment manufacturers worldwide. This dataset includes detailed information about production systems, technology capabilities, and manufacturing specifications.',
    
    // Base filtering criteria
    filters: FILTER_PRESETS.AM_SYSTEMS_MANUFACTURERS,
    
    // Display configuration
    displayColumns: [
      'name',
      'country', 
      'segment',
      'technologies',
      'materials',
      'website'
    ],
    mapType: 'equipment',
    
    // UI customization
    icon: 'Building2',
    color: '#3B82F6', // Blue
    defaultSort: {
      field: 'name',
      order: 'asc'
    },
    
    // Feature availability
    enableMap: true,
    enableAnalytics: true,
    enableExport: true,
    
    // Metadata
    version: 'v1.5.0',
    isActive: true,
    createdAt: '2024-08-28T00:00:00Z',
    updatedAt: '2024-08-28T00:00:00Z'
  },
  
  // Service Providers Dataset  
  'print-services-global': {
    id: 'print-services-global',
    name: 'Global Printing Services',
    description: 'Global directory of additive manufacturing print service providers and bureaus. This comprehensive database covers service capabilities, materials offered, geographic reach, and pricing models across the worldwide AM services market.',
    
    filters: FILTER_PRESETS.PRINT_SERVICES_GLOBAL,
    
    displayColumns: [
      'name',
      'country',
      'segment', 
      'serviceTypes',
      'materials',
      'website'
    ],
    mapType: 'service',
    
    icon: 'Globe',
    color: '#10B981', // Green
    defaultSort: {
      field: 'name',
      order: 'asc'
    },
    
    enableMap: true,
    enableAnalytics: true,
    enableExport: true,
    
    version: 'v1.3.0',
    isActive: true,
    createdAt: '2024-08-28T00:00:00Z',
    updatedAt: '2024-08-28T00:00:00Z'
  },
  
  // Material Suppliers Dataset
  'material-suppliers': {
    id: 'material-suppliers',
    name: 'Material Suppliers',
    description: 'Comprehensive directory of additive manufacturing material suppliers and distributors. Includes polymer, metal, ceramic, and composite material providers with detailed material specifications and availability.',
    
    filters: FILTER_PRESETS.MATERIAL_SUPPLIERS,
    
    displayColumns: [
      'name',
      'country',
      'materials',
      'segment',
      'website'
    ],
    mapType: 'material',
    
    icon: 'Package',
    color: '#F59E0B', // Amber
    defaultSort: {
      field: 'name',
      order: 'asc'
    },
    
    enableMap: true,
    enableAnalytics: true,
    enableExport: true,
    
    version: 'v1.0.0',
    isActive: true,
    createdAt: '2024-08-28T00:00:00Z',
    updatedAt: '2024-08-28T00:00:00Z'
  },
  
  // Software Developers Dataset
  'software-developers': {
    id: 'software-developers',
    name: 'Software Developers',
    description: 'Directory of additive manufacturing software and platform developers. Includes CAD software, slicing software, workflow management platforms, and specialized AM applications.',
    
    filters: FILTER_PRESETS.SOFTWARE_DEVELOPERS,
    
    displayColumns: [
      'name',
      'country',
      'segment',
      'technologies',
      'website'
    ],
    mapType: 'software',
    
    icon: 'Code',
    color: '#8B5CF6', // Purple  
    defaultSort: {
      field: 'name',
      order: 'asc'
    },
    
    enableMap: true,
    enableAnalytics: false, // Limited analytics for software
    enableExport: true,
    
    version: 'v1.0.0',
    isActive: true,
    createdAt: '2024-08-28T00:00:00Z',
    updatedAt: '2024-08-28T00:00:00Z'
  }
}

// ========================================
// DATASET UTILITIES
// ========================================

/**
 * Gets all active datasets
 */
export function getActiveDatasets(): DatasetConfig[] {
  return Object.values(UNIFIED_DATASET_CONFIGS).filter(dataset => dataset.isActive)
}

/**
 * Gets dataset by ID with validation
 */
export function getDatasetById(id: string): DatasetConfig | null {
  return UNIFIED_DATASET_CONFIGS[id] || null
}

/**
 * Validates if a dataset ID exists and is active
 */
export function isValidDatasetId(id: string): boolean {
  const dataset = UNIFIED_DATASET_CONFIGS[id]
  return !!dataset && dataset.isActive
}

/**
 * Gets dataset filters for API usage
 */
export function getDatasetFilters(id: string): CompanyFilters | null {
  const dataset = UNIFIED_DATASET_CONFIGS[id]
  return dataset ? dataset.filters : null
}

// ========================================
// LEGACY VENDOR DATA CONFIGS (for backward compatibility)
// ========================================

export const LEGACY_DATASET_CONFIGS: Record<LegacyDatasetKey, LegacyDatasetConfig> = {
  'company-information': {
    table: 'vendor_company_information',
    name: 'Company Information',
    description: 'Vendor company profiles and headquarters',
    columns: ['id', 'company_name', 'website', 'headquarters', 'created_at'],
    displayColumns: ['Company Name', 'Website', 'Headquarters'],
  },
  'fundings-investments': {
    table: 'vendor_fundings_investments',
    name: 'Fundings & Investments',
    description: 'Investment rounds and funding data',
    columns: [
      'id',
      'year',
      'month',
      'company_name',
      'country',
      'amount_millions_usd',
      'funding_round',
      'lead_investor',
      'notes',
      'created_at',
    ],
    displayColumns: [
      'Year',
      'Month',
      'Company Name',
      'Country',
      'Amount (millions USD)',
      'Funding Round',
      'Lead Investor',
      'Notes',
    ],
  },
  'print-services-pricing': {
    table: 'vendor_print_service_pricing',
    name: 'Print Services Pricing',
    description: 'AM service pricing and lead time data',
    columns: [
      'id',
      'company_name',
      'material_type',
      'material',
      'process',
      'quantity',
      'manufacturing_cost',
      'day_ordered',
      'delivery_date',
      'lead_time',
      'country',
      'scattered_plot_info',
      'created_at',
    ],
    displayColumns: [
      'Company Name',
      'Material Type',
      'Material',
      'Process',
      'Quantity',
      'Manufacturing Cost',
      'Day Ordered',
      'Delivery Date',
      'Lead Time',
      'Country',
      'Plot Info',
    ],
  },
  'am-market-revenue-2024': {
    table: 'vendor_am_market_revenue_2024',
    name: 'AM Market Revenue 2024',
    description: '2024 market revenue by country and segment',
    columns: ['id', 'revenue_usd', 'country', 'segment', 'created_at'],
    displayColumns: ['Revenue (USD)', 'Country', 'Segment'],
  },
  'mergers-acquisitions': {
    table: 'vendor_mergers_acquisitions',
    name: 'Mergers & Acquisitions',
    description: 'M&A transactions in AM industry',
    columns: [
      'id',
      'deal_date',
      'acquired_company',
      'acquiring_company',
      'deal_size_millions',
      'country',
      'created_at',
    ],
    displayColumns: [
      'Deal Date',
      'Acquired Company',
      'Acquiring Company',
      'Deal Size (millions)',
      'Country',
    ],
  },
  'company-roles': {
    table: 'vendor_company_roles',
    name: 'Company Roles',
    description: 'Company role categorization',
    columns: ['id', 'company_name', 'category', 'created_at'],
    displayColumns: ['Company Name', 'Category'],
  },
  'revenue-by-industry-2024': {
    table: 'vendor_revenue_by_industry_2024',
    name: 'Revenue by Industry 2024',
    description: 'Industry segment revenue breakdown',
    columns: ['id', 'industry', 'share_of_revenue_percent', 'revenue_usd', 'region', 'material', 'created_at'],
    displayColumns: [
      'Industry',
      'Share of Revenue (%)',
      'Revenue (USD)',
      'Region',
      'Material',
    ],
  },
  'total-am-market-size': {
    table: 'vendor_total_am_market_size',
    name: 'Total AM Market Size',
    description: 'Market size forecasts and historical data',
    columns: ['id', 'year', 'forecast_type', 'segment', 'revenue_usd', 'created_at'],
    displayColumns: ['Year', 'Forecast Type', 'Segment', 'Revenue (USD)'],
  },
  'directory': {
    table: 'vendor_directory',
    name: 'Directory',
    description: 'Figure and sheet directory data',
    columns: ['id', 'figure_name', 'sheet_name_and_link', 'v1', 'notes', 'created_at'],
    displayColumns: ['Figure Name', 'Sheet Name and Link', 'V1', 'Notes'],
  },
  'am-systems-manufacturers': {
    table: 'vendor_am_systems_manufacturers',
    name: 'AM Systems Manufacturers',
    description: 'AM printer and system manufacturers',
    columns: ['company_name', 'segment', 'material_type', 'material_format', 'country', 'process'],
    displayColumns: ['Company Name', 'Segment', 'Material Type', 'Material Format', 'Country', 'Process'],
  },
  'print-services-global': {
    table: 'vendor_print_services_global',
    name: 'Global Printing Services',
    description: 'Global print service providers',
    columns: ['company_name', 'segment', 'material_type', 'material_format', 'country', 'printer_manufacturer', 'printer_model', 'number_of_printers', 'count_type', 'process', 'update_year', 'additional_info'],
    displayColumns: ['Company Name', 'Segment', 'Material Type', 'Material Format', 'Country', 'Printer Manufacturer', 'Printer Model', 'Number of Printers', 'Count Type', 'Process', 'Update Year', 'Additional Info'],
  },
}
