/**
 * Mock Data for Unified AM Explorer
 * 
 * This file contains comprehensive mock data that follows the unified
 * data structure defined in src/lib/types/unified.ts
 */

import { 
  UnifiedCompany, 
  Technology, 
  Material, 
  CompanyTechnology, 
  CompanyMaterial, 
  EquipmentSystem, 
  CompanyService,
  CompanyWithCapabilities 
} from '@/lib/types/unified'

// Base Technologies
export const MOCK_TECHNOLOGIES: Technology[] = [
  {
    id: 'tech-1',
    name: 'DMLS',
    category: 'Metal Printing',
    description: 'Direct Metal Laser Sintering',
    process_type: 'DMLS',
    typical_materials: ['Titanium Ti6Al4V', 'Stainless Steel 316L', 'Aluminum AlSi10Mg'],
    key_applications: ['Aerospace', 'Medical', 'Automotive'],
    market_adoption: 'High',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech-2',
    name: 'SLM',
    category: 'Metal Printing',
    description: 'Selective Laser Melting',
    process_type: 'SLM',
    typical_materials: ['Titanium Ti6Al4V', 'Inconel 718', 'Aluminum AlSi10Mg'],
    key_applications: ['Aerospace', 'Medical', 'Energy'],
    market_adoption: 'High',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech-3',
    name: 'FDM',
    category: 'Material Extrusion',
    description: 'Fused Deposition Modeling',
    process_type: 'FDM',
    typical_materials: ['PLA', 'ABS', 'PETG', 'Nylon'],
    key_applications: ['Prototyping', 'Tooling', 'End-use parts'],
    market_adoption: 'Very High',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech-4',
    name: 'SLA',
    category: 'Vat Photopolymerization',
    description: 'Stereolithography',
    process_type: 'SLA',
    typical_materials: ['Standard Resin', 'Tough Resin', 'Castable Resin'],
    key_applications: ['Jewelry', 'Dental', 'Prototyping'],
    market_adoption: 'High',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech-5',
    name: 'SLS',
    category: 'Powder Bed Fusion',
    description: 'Selective Laser Sintering',
    process_type: 'SLS',
    typical_materials: ['Nylon PA12', 'Nylon PA11', 'TPU'],
    key_applications: ['Functional prototypes', 'End-use parts', 'Complex geometries'],
    market_adoption: 'High',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tech-6',
    name: 'MJF',
    category: 'Powder Bed Fusion',
    description: 'Multi Jet Fusion',
    process_type: 'MJF',
    typical_materials: ['Nylon PA12', 'Nylon PA11'],
    key_applications: ['Production parts', 'Functional prototypes'],
    market_adoption: 'Medium',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Base Materials
export const MOCK_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    name: 'Titanium Ti6Al4V',
    material_type: 'Metal',
    material_format: 'Powder',
    description: 'Titanium alloy for aerospace and medical applications',
    properties: { density: 4.43, tensile_strength: 1170, yield_strength: 1100 },
    compatible_processes: ['DMLS', 'SLM', 'EBM'],
    typical_applications: ['Aerospace components', 'Medical implants', 'High-performance parts'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mat-2',
    name: 'Stainless Steel 316L',
    material_type: 'Metal',
    material_format: 'Powder',
    description: 'Corrosion-resistant stainless steel',
    properties: { density: 7.9, tensile_strength: 600, yield_strength: 300 },
    compatible_processes: ['DMLS', 'SLM'],
    typical_applications: ['Marine components', 'Medical devices', 'Chemical processing'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mat-3',
    name: 'PLA',
    material_type: 'Thermoplastic',
    material_format: 'Filament',
    description: 'Polylactic acid - biodegradable thermoplastic',
    properties: { density: 1.24, glass_transition: 60, melting_point: 180 },
    compatible_processes: ['FDM', 'FFF'],
    typical_applications: ['Prototyping', 'Educational models', 'Consumer products'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mat-4',
    name: 'ABS',
    material_type: 'Thermoplastic',
    material_format: 'Filament',
    description: 'Acrylonitrile Butadiene Styrene - durable thermoplastic',
    properties: { density: 1.05, glass_transition: 105, melting_point: 220 },
    compatible_processes: ['FDM', 'FFF'],
    typical_applications: ['Functional prototypes', 'Tooling', 'Automotive parts'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mat-5',
    name: 'Nylon PA12',
    material_type: 'Thermoplastic',
    material_format: 'Powder',
    description: 'Polyamide 12 - versatile engineering plastic',
    properties: { density: 1.01, tensile_strength: 48, elongation: 300 },
    compatible_processes: ['SLS', 'MJF'],
    typical_applications: ['End-use parts', 'Functional prototypes', 'Complex geometries'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mat-6',
    name: 'Standard Resin',
    material_type: 'Thermoset',
    material_format: 'Resin',
    description: 'General purpose photopolymer resin',
    properties: { density: 1.2, shore_hardness: 'D85', elongation: 6 },
    compatible_processes: ['SLA', 'DLP', 'MSLA'],
    typical_applications: ['Detailed prototypes', 'Miniatures', 'Concept models'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Mock Companies - Equipment Manufacturers
export const MOCK_EQUIPMENT_COMPANIES: UnifiedCompany[] = [
  {
    id: 'comp-1',
    name: 'EOS GmbH',
    website: 'https://www.eos.info',
    description: 'Leading manufacturer of industrial 3D printing systems for metals and polymers',
    country: 'Germany',
    state: 'Bavaria',
    city: 'Krailling',
    lat: 48.0986,
    lng: 11.4196,
    company_type: 'equipment',
    company_role: 'manufacturer',
    segment: 'industrial',
    primary_market: 'manufacturing',
    secondary_markets: ['aerospace', 'automotive', 'medical'],
    employee_count_range: '1000-5000',
    annual_revenue_range: '500M-1B',
    founded_year: 1989,
    is_public_company: false,
    stock_ticker: null,
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  },
  {
    id: 'comp-2',
    name: 'Stratasys Ltd.',
    website: 'https://www.stratasys.com',
    description: 'Global leader in additive manufacturing and 3D printing technology',
    country: 'United States',
    state: 'Minnesota',
    city: 'Eden Prairie',
    lat: 44.8547,
    lng: -93.4708,
    company_type: 'equipment',
    company_role: 'manufacturer',
    segment: 'professional',
    primary_market: 'manufacturing',
    secondary_markets: ['aerospace', 'automotive', 'healthcare'],
    employee_count_range: '1000-5000',
    annual_revenue_range: '500M-1B',
    founded_year: 1989,
    is_public_company: true,
    stock_ticker: 'SSYS',
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  },
  {
    id: 'comp-3',
    name: '3D Systems Corporation',
    website: 'https://www.3dsystems.com',
    description: 'Provider of 3D printing and digital manufacturing solutions',
    country: 'United States',
    state: 'South Carolina',
    city: 'Rock Hill',
    lat: 34.9249,
    lng: -81.0254,
    company_type: 'equipment',
    company_role: 'manufacturer',
    segment: 'professional',
    primary_market: 'manufacturing',
    secondary_markets: ['healthcare', 'aerospace', 'automotive'],
    employee_count_range: '1000-5000',
    annual_revenue_range: '500M-1B',
    founded_year: 1986,
    is_public_company: true,
    stock_ticker: 'DDD',
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  },
  {
    id: 'comp-4',
    name: 'Formlabs Inc.',
    website: 'https://formlabs.com',
    description: 'Desktop and professional 3D printers for various industries',
    country: 'United States',
    state: 'Massachusetts',
    city: 'Somerville',
    lat: 42.3876,
    lng: -71.0995,
    company_type: 'equipment',
    company_role: 'manufacturer',
    segment: 'professional',
    primary_market: 'manufacturing',
    secondary_markets: ['dental', 'jewelry', 'engineering'],
    employee_count_range: '500-1000',
    annual_revenue_range: '100M-500M',
    founded_year: 2011,
    is_public_company: false,
    stock_ticker: null,
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  },
  {
    id: 'comp-5',
    name: 'HP Inc.',
    website: 'https://www.hp.com/3d-printing',
    description: 'Multi Jet Fusion 3D printing technology and solutions',
    country: 'United States',
    state: 'California',
    city: 'Palo Alto',
    lat: 37.4419,
    lng: -122.1430,
    company_type: 'equipment',
    company_role: 'manufacturer',
    segment: 'industrial',
    primary_market: 'manufacturing',
    secondary_markets: ['automotive', 'consumer goods'],
    employee_count_range: '50000+',
    annual_revenue_range: '50B+',
    founded_year: 1939,
    is_public_company: true,
    stock_ticker: 'HPQ',
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  }
]

// Mock Companies - Service Providers
export const MOCK_SERVICE_COMPANIES: UnifiedCompany[] = [
  {
    id: 'comp-6',
    name: 'Protolabs Inc.',
    website: 'https://www.protolabs.com',
    description: 'On-demand manufacturing services including 3D printing',
    country: 'United States',
    state: 'Minnesota',
    city: 'Maple Plain',
    lat: 45.0059,
    lng: -93.6556,
    company_type: 'service',
    company_role: 'provider',
    segment: 'professional',
    primary_market: 'services',
    secondary_markets: ['aerospace', 'automotive', 'medical'],
    employee_count_range: '1000-5000',
    annual_revenue_range: '500M-1B',
    founded_year: 1999,
    is_public_company: true,
    stock_ticker: 'PRLB',
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  },
  {
    id: 'comp-7',
    name: 'Sculpteo',
    website: 'https://www.sculpteo.com',
    description: 'Online 3D printing and digital manufacturing service',
    country: 'France',
    state: 'Île-de-France',
    city: 'Paris',
    lat: 48.8566,
    lng: 2.3522,
    company_type: 'service',
    company_role: 'provider',
    segment: 'professional',
    primary_market: 'services',
    secondary_markets: ['automotive', 'aerospace', 'consumer goods'],
    employee_count_range: '100-500',
    annual_revenue_range: '10M-50M',
    founded_year: 2009,
    is_public_company: false,
    stock_ticker: null,
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  },
  {
    id: 'comp-8',
    name: 'Shapeways Holdings Inc.',
    website: 'https://www.shapeways.com',
    description: 'Digital manufacturing platform and 3D printing marketplace',
    country: 'United States',
    state: 'New York',
    city: 'New York',
    lat: 40.7128,
    lng: -74.0060,
    company_type: 'service',
    company_role: 'provider',
    segment: 'professional',
    primary_market: 'services',
    secondary_markets: ['consumer goods', 'jewelry', 'arts'],
    employee_count_range: '100-500',
    annual_revenue_range: '50M-100M',
    founded_year: 2007,
    is_public_company: true,
    stock_ticker: 'SHPW',
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  },
  {
    id: 'comp-9',
    name: 'Fast Radius Inc.',
    website: 'https://www.fastradius.com',
    description: 'Cloud manufacturing platform with 3D printing capabilities',
    country: 'United States',
    state: 'Illinois',
    city: 'Chicago',
    lat: 41.8781,
    lng: -87.6298,
    company_type: 'service',
    company_role: 'provider',
    segment: 'industrial',
    primary_market: 'services',
    secondary_markets: ['automotive', 'aerospace', 'industrial'],
    employee_count_range: '100-500',
    annual_revenue_range: '10M-50M',
    founded_year: 2017,
    is_public_company: false,
    stock_ticker: null,
    is_active: true,
    data_source: 'mock_data',
    last_verified: '2024-08-28T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-08-28T00:00:00Z'
  }
]

// All mock companies combined
export const MOCK_COMPANIES: UnifiedCompany[] = [
  ...MOCK_EQUIPMENT_COMPANIES,
  ...MOCK_SERVICE_COMPANIES
]

// Company-Technology Relationships
export const MOCK_COMPANY_TECHNOLOGIES: CompanyTechnology[] = [
  // EOS GmbH technologies
  { company_id: 'comp-1', technology_id: 'tech-1', proficiency_level: 'expert', years_experience: 35, created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-1', technology_id: 'tech-2', proficiency_level: 'expert', years_experience: 30, created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-1', technology_id: 'tech-5', proficiency_level: 'expert', years_experience: 25, created_at: '2024-01-01T00:00:00Z' },
  
  // Stratasys technologies
  { company_id: 'comp-2', technology_id: 'tech-3', proficiency_level: 'expert', years_experience: 35, created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-2', technology_id: 'tech-4', proficiency_level: 'advanced', years_experience: 20, created_at: '2024-01-01T00:00:00Z' },
  
  // 3D Systems technologies  
  { company_id: 'comp-3', technology_id: 'tech-4', proficiency_level: 'expert', years_experience: 38, created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-3', technology_id: 'tech-3', proficiency_level: 'advanced', years_experience: 30, created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-3', technology_id: 'tech-1', proficiency_level: 'advanced', years_experience: 15, created_at: '2024-01-01T00:00:00Z' },
  
  // Formlabs technologies
  { company_id: 'comp-4', technology_id: 'tech-4', proficiency_level: 'expert', years_experience: 13, created_at: '2024-01-01T00:00:00Z' },
  
  // HP technologies
  { company_id: 'comp-5', technology_id: 'tech-6', proficiency_level: 'expert', years_experience: 10, created_at: '2024-01-01T00:00:00Z' }
]

// Company-Material Relationships  
export const MOCK_COMPANY_MATERIALS: CompanyMaterial[] = [
  // EOS materials
  { company_id: 'comp-1', material_id: 'mat-1', usage_type: 'primary', certifications: ['ISO 13485', 'AS9100'], created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-1', material_id: 'mat-2', usage_type: 'primary', certifications: ['ISO 9001'], created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-1', material_id: 'mat-5', usage_type: 'primary', certifications: [], created_at: '2024-01-01T00:00:00Z' },
  
  // Stratasys materials
  { company_id: 'comp-2', material_id: 'mat-3', usage_type: 'primary', certifications: [], created_at: '2024-01-01T00:00:00Z' },
  { company_id: 'comp-2', material_id: 'mat-4', usage_type: 'primary', certifications: [], created_at: '2024-01-01T00:00:00Z' },
  
  // Formlabs materials
  { company_id: 'comp-4', material_id: 'mat-6', usage_type: 'primary', certifications: [], created_at: '2024-01-01T00:00:00Z' },
  
  // HP materials
  { company_id: 'comp-5', material_id: 'mat-5', usage_type: 'primary', certifications: ['ISO 9001'], created_at: '2024-01-01T00:00:00Z' }
]

// Mock Equipment Systems
export const MOCK_EQUIPMENT_SYSTEMS: EquipmentSystem[] = [
  {
    id: 'eq-1',
    company_id: 'comp-1',
    manufacturer: 'EOS GmbH',
    model: 'M 290',
    technology_id: 'tech-1',
    build_volume: '250 × 250 × 325 mm',
    year_installed: 2023,
    status: 'active',
    capabilities: ['DMLS', 'High precision', 'Metal powders'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'eq-2',
    company_id: 'comp-2',
    manufacturer: 'Stratasys',
    model: 'F900',
    technology_id: 'tech-3',
    build_volume: '914 × 610 × 914 mm',
    year_installed: 2022,
    status: 'active',
    capabilities: ['Large format', 'Production grade', 'Engineering materials'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Mock Company Services
export const MOCK_COMPANY_SERVICES: CompanyService[] = [
  {
    id: 'svc-1',
    company_id: 'comp-6',
    service_type: 'printing',
    service_name: '3D Printing Service',
    description: 'On-demand 3D printing with multiple materials and technologies',
    pricing_model: 'per_part',
    min_order_value: 50,
    lead_time_days: 3,
    capabilities: ['SLA', 'SLS', 'FDM', 'Metal printing'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'svc-2',
    company_id: 'comp-7',
    service_type: 'printing',
    service_name: 'Online Manufacturing',
    description: 'Digital manufacturing platform with instant quoting',
    pricing_model: 'per_part',
    min_order_value: 25,
    lead_time_days: 5,
    capabilities: ['SLA', 'SLS', 'MJF', 'HP MJF'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Helper function to get enriched company data
export function getEnrichedCompanyData(): CompanyWithCapabilities[] {
  return MOCK_COMPANIES.map(company => {
    // Get technologies for this company
    const companyTechs = MOCK_COMPANY_TECHNOLOGIES
      .filter(ct => ct.company_id === company.id)
      .map(ct => {
        const tech = MOCK_TECHNOLOGIES.find(t => t.id === ct.technology_id)
        return tech ? { ...tech, proficiency_level: ct.proficiency_level } : undefined
      })
      .filter(Boolean) as (Technology & { proficiency_level?: string })[]

    // Get materials for this company
    const companyMats = MOCK_COMPANY_MATERIALS
      .filter(cm => cm.company_id === company.id)
      .map(cm => {
        const mat = MOCK_MATERIALS.find(m => m.id === cm.material_id)
        return mat ? { ...mat, usage_type: cm.usage_type } : undefined
      })
      .filter(Boolean) as (Material & { usage_type?: string })[]

    // Get equipment for this company
    const equipment = MOCK_EQUIPMENT_SYSTEMS.filter(eq => eq.company_id === company.id)

    // Get services for this company
    const services = MOCK_COMPANY_SERVICES.filter(svc => svc.company_id === company.id)

    return {
      ...company,
      technologies: companyTechs,
      materials: companyMats,
      equipment,
      services,
      technology_count: companyTechs.length,
      material_count: companyMats.length,
      equipment_count: equipment.length,
      service_count: services.length
    }
  })
}

// Dataset-specific filters for mock data
export const MOCK_DATASET_FILTERS = {
  'am-systems-manufacturers': {
    companyType: ['equipment'] as const,
    companyRole: ['manufacturer'] as const
  },
  'print-services-global': {
    companyType: ['service'] as const,
    companyRole: ['provider'] as const
  }
} as const