/**
 * Unified Data Adapter
 * 
 * This adapter provides a unified interface for accessing company data,
 * with the ability to switch between mock data and live Supabase data
 * based on environment configuration.
 */

import { 
  CompanyWithCapabilities,
  CompanyFilterRequest,
  CompanyFilterResponse,
  UnifiedCompany,
  Technology,
  Material
} from '@/lib/types/unified'

import { 
  MOCK_COMPANIES,
  MOCK_TECHNOLOGIES,
  MOCK_MATERIALS,
  getEnrichedCompanyData,
  MOCK_DATASET_FILTERS
} from '@/lib/mocks/unified-data'

// Check if we should use mocks
const USE_MOCKS = process.env.NODE_ENV === 'development' && 
  (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || 
   process.env.NEXT_PUBLIC_USE_MOCKS === '1')

console.log('Unified Data Adapter initialized:', { 
  USE_MOCKS, 
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS 
})

/**
 * Mock data implementation
 */
class MockUnifiedDataAdapter {
  async getCompaniesWithFilters(request: CompanyFilterRequest): Promise<CompanyFilterResponse> {
    console.log('MockAdapter: getCompaniesWithFilters called with:', request)
    
    let companies = getEnrichedCompanyData()
    
    // Apply filters
    if (request.companyType?.length) {
      companies = companies.filter(c => request.companyType!.includes(c.company_type))
    }
    
    if (request.companyRole?.length) {
      companies = companies.filter(c => request.companyRole!.includes(c.company_role))
    }
    
    if (request.segment?.length) {
      companies = companies.filter(c => c.segment && request.segment!.includes(c.segment))
    }
    
    if (request.country?.length) {
      companies = companies.filter(c => c.country && request.country!.includes(c.country))
    }
    
    if (request.technologies?.length) {
      companies = companies.filter(c => 
        c.technologies?.some(t => request.technologies!.includes(t.name))
      )
    }
    
    if (request.materials?.length) {
      companies = companies.filter(c => 
        c.materials?.some(m => request.materials!.includes(m.name))
      )
    }
    
    if (request.search) {
      const searchTerm = request.search.toLowerCase()
      companies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.description?.toLowerCase().includes(searchTerm) ||
        c.country?.toLowerCase().includes(searchTerm)
      )
    }
    
    if (request.isActive !== undefined) {
      companies = companies.filter(c => c.is_active === request.isActive)
    }
    
    // Sort
    if (request.sortBy) {
      companies.sort((a, b) => {
        const aVal = (a as any)[request.sortBy!]
        const bVal = (b as any)[request.sortBy!]
        
        if (aVal < bVal) return request.sortOrder === 'desc' ? 1 : -1
        if (aVal > bVal) return request.sortOrder === 'desc' ? -1 : 1
        return 0
      })
    }
    
    const total = companies.length
    
    // Pagination
    const limit = request.limit || 50
    const offset = request.offset || 0
    const paginatedCompanies = companies.slice(offset, offset + limit)
    
    // Generate aggregations
    const aggregations = {
      byCountry: companies.reduce((acc, c) => {
        if (c.country) acc[c.country] = (acc[c.country] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byType: companies.reduce((acc, c) => {
        acc[c.company_type] = (acc[c.company_type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      bySegment: companies.reduce((acc, c) => {
        if (c.segment) acc[c.segment] = (acc[c.segment] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byTechnology: companies.reduce((acc, c) => {
        c.technologies?.forEach(t => {
          acc[t.name] = (acc[t.name] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
    }
    
    return {
      companies: paginatedCompanies,
      total: MOCK_COMPANIES.length,
      filtered: total,
      aggregations,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  }
  
  async getCompanyById(id: string): Promise<CompanyWithCapabilities | null> {
    const companies = getEnrichedCompanyData()
    return companies.find(c => c.id === id) || null
  }
  
  async getTechnologies(): Promise<Technology[]> {
    return [...MOCK_TECHNOLOGIES]
  }
  
  async getMaterials(): Promise<Material[]> {
    return [...MOCK_MATERIALS]
  }
  
  async getDatasetCompanies(datasetId: string): Promise<CompanyFilterResponse> {
    const filters = MOCK_DATASET_FILTERS[datasetId as keyof typeof MOCK_DATASET_FILTERS]
    
    if (!filters) {
      throw new Error(`Unknown dataset: ${datasetId}`)
    }
    
    return this.getCompaniesWithFilters(filters)
  }
}

/**
 * Live data implementation (placeholder for now)
 */
class LiveUnifiedDataAdapter {
  async getCompaniesWithFilters(request: CompanyFilterRequest): Promise<CompanyFilterResponse> {
    // TODO: Implement live Supabase queries
    // For now, fall back to mock data with a warning
    console.warn('LiveAdapter: Falling back to mock data - live implementation not ready')
    const mockAdapter = new MockUnifiedDataAdapter()
    return mockAdapter.getCompaniesWithFilters(request)
  }
  
  async getCompanyById(id: string): Promise<CompanyWithCapabilities | null> {
    console.warn('LiveAdapter: Falling back to mock data - live implementation not ready')
    const mockAdapter = new MockUnifiedDataAdapter()
    return mockAdapter.getCompanyById(id)
  }
  
  async getTechnologies(): Promise<Technology[]> {
    console.warn('LiveAdapter: Falling back to mock data - live implementation not ready')
    const mockAdapter = new MockUnifiedDataAdapter()
    return mockAdapter.getTechnologies()
  }
  
  async getMaterials(): Promise<Material[]> {
    console.warn('LiveAdapter: Falling back to mock data - live implementation not ready')
    const mockAdapter = new MockUnifiedDataAdapter()
    return mockAdapter.getMaterials()
  }
  
  async getDatasetCompanies(datasetId: string): Promise<CompanyFilterResponse> {
    console.warn('LiveAdapter: Falling back to mock data - live implementation not ready')
    const mockAdapter = new MockUnifiedDataAdapter()
    return mockAdapter.getDatasetCompanies(datasetId)
  }
}

// Export the appropriate adapter based on configuration
const adapter = USE_MOCKS ? new MockUnifiedDataAdapter() : new LiveUnifiedDataAdapter()

export default adapter

// Named exports for specific functions
export const getCompaniesWithFilters = adapter.getCompaniesWithFilters.bind(adapter)
export const getCompanyById = adapter.getCompanyById.bind(adapter)
export const getTechnologies = adapter.getTechnologies.bind(adapter)
export const getMaterials = adapter.getMaterials.bind(adapter)
export const getDatasetCompanies = adapter.getDatasetCompanies.bind(adapter)

// Export for direct access to adapters (useful for testing)
export { MockUnifiedDataAdapter, LiveUnifiedDataAdapter }

// Helper to check current mode
export const isUsingMocks = () => USE_MOCKS