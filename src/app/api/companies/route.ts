/**
 * Unified Companies API Endpoint
 * 
 * This endpoint replaces all the individual dataset-specific routes (systems-manufacturers-map, 
 * print-services-map, etc.) with a single, flexible endpoint that supports dynamic filtering
 * based on the unified schema architecture.
 * 
 * Features:
 * - Dynamic filtering using CompanyFilters interface
 * - Dataset-based filtering for backward compatibility  
 * - Geographic bounds filtering for maps
 * - Full-text search across company data
 * - Pagination and sorting
 * - Comprehensive error handling
 * - Performance optimizations with proper caching
 * 
 * @route GET /api/companies
 * @query All CompanyFilterRequest parameters supported
 * @example /api/companies?companyType=equipment&companyRole=manufacturer&country=Germany,United States&limit=100
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  CompanyFilterRequest,
  CompanyFilterResponse,
  CompanyFilters,
  validateCompanyFilters,
  searchParamsToFilters,
  DATASET_FILTERS
} from '@/lib/filters/company-filters'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Request caching for performance (5 minutes)
const CACHE_TTL = 5 * 60 * 1000
const responseCache = new Map<string, { data: CompanyFilterResponse; timestamp: number }>()

// Lightweight country centroid map used to place markers when
// precise coordinates are missing. Keys are normalized to lowercase.
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'germany': [51.1657, 10.4515],
  'united states': [39.8283, -98.5795],
  'united states of america': [39.8283, -98.5795],
  'usa': [39.8283, -98.5795],
  'the united states': [39.8283, -98.5795],
  'united kingdom': [55.3781, -3.4360],
  'netherlands': [52.1326, 5.2913],
  'china': [35.8617, 104.1954],
  'france': [46.2276, 2.2137],
  'italy': [41.8719, 12.5674],
  'japan': [36.2048, 138.2529],
  'south korea': [35.9078, 127.7669],
  'canada': [56.1304, -106.3468],
  'austria': [47.5162, 14.5501],
  'switzerland': [46.8182, 8.2275],
  'israel': [31.0461, 34.8516],
  'australia': [-25.2744, 133.7751],
  'czech republic': [49.8175, 15.4730],
  'spain': [40.4637, -3.7492],
  'sweden': [60.1282, 18.6435],
  'denmark': [56.2639, 9.5018],
  'finland': [61.9241, 25.7482],
  'belgium': [50.5039, 4.4699],
  'norway': [60.4720, 8.4689],
  'poland': [51.9194, 19.1451],
  'russia': [61.5240, 105.3188],
  'india': [20.5937, 78.9629],
  'brazil': [-14.2350, -51.9253],
  'mexico': [23.6345, -102.5528],
  'south africa': [-30.5595, 22.9375],
  'hong kong': [22.3193, 114.1694],
  'singapore': [1.3521, 103.8198],
  'taiwan': [23.6978, 120.9605],
  'ireland': [53.4129, -8.2439],
  'portugal': [39.3999, -8.2245],
  'greece': [39.0742, 21.8243],
  'turkey': [38.9637, 35.2433],
  'slovenia': [46.1512, 14.9955],
  'hungary': [47.1625, 19.5033],
  'romania': [45.9432, 24.9668],
  'slovakia': [48.6690, 19.6990],
  'estonia': [58.5953, 25.0136],
  'latvia': [56.8796, 24.6032],
  'lithuania': [55.1694, 23.8813],
}

function getFallbackCoords(country: string | null | undefined): [number, number] | null {
  if (!country) return null
  const key = country.trim().toLowerCase()
  const coords = COUNTRY_COORDINATES[key]
  if (!coords) return null
  // Add a tiny jitter so markers don't perfectly overlap for large countries
  const jitterLat = (Math.random() - 0.5) * 0.8
  const jitterLng = (Math.random() - 0.5) * 1.6
  return [coords[0] + jitterLat, coords[1] + jitterLng]
}

/**
 * GET /api/companies
 * 
 * Returns filtered company data based on query parameters.
 * Supports both direct filtering and dataset-based filtering.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters from query parameters
    let filters: CompanyFilters = searchParamsToFilters(searchParams)
    
    // Handle dataset-based filtering for backward compatibility
    const datasetId = searchParams.get('dataset') || searchParams.get('datasetId')
    if (datasetId && DATASET_FILTERS[datasetId]) {
      // Merge dataset filters with any additional filters from query params
      const datasetFilters = DATASET_FILTERS[datasetId]
      filters = { ...datasetFilters, ...filters }
    }
    
    // Set defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)))
    const includeFilters = (searchParams.get('includeFilters') ?? 'true') !== 'false'
    const includeCount = (searchParams.get('includeCount') ?? 'true') !== 'false'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc'
    
    // Build complete filter request
    const filterRequest: CompanyFilterRequest = {
      ...filters,
      page,
      limit,
      sortBy: sortBy as any,
      sortOrder,
      includeCapabilities: searchParams.get('includeCapabilities') === 'true',
      includeEquipment: searchParams.get('includeEquipment') === 'true',
      includeServices: searchParams.get('includeServices') === 'true'
    }
    
    // Handle geographic bounds for map filtering
    const boundsParam = searchParams.get('bounds')
    if (boundsParam) {
      try {
        filterRequest.bounds = JSON.parse(boundsParam)
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid bounds parameter. Must be valid JSON.' },
          { status: 400 }
        )
      }
    }
    
    // Validate filters
    const validation = validateCompanyFilters(filterRequest)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid filters', details: validation.errors },
        { status: 400 }
      )
    }
    
    // Check cache
    const cacheKey = request.url
    const cached = responseCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      // Update execution time but return cached data
      cached.data.metadata.executionTime = Date.now() - startTime
      cached.data.metadata.timestamp = new Date().toISOString()
      return NextResponse.json(cached.data)
    }
    
    // Execute query
    const result = await getFilteredCompanies(filterRequest, { includeFilters, includeCount })
    
    // Cache successful results
    if (result.data.length > 0) {
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() })
      
      // Clean old cache entries (keep last 100 entries)
      if (responseCache.size > 100) {
        const entries = Array.from(responseCache.entries())
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        entries.slice(0, entries.length - 100).forEach(([key]) => {
          responseCache.delete(key)
        })
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Companies API error:', error)
    
    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch companies', 
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Core function to filter companies based on CompanyFilterRequest
 */
async function getFilteredCompanies(filterRequest: CompanyFilterRequest, opts: { includeFilters?: boolean, includeCount?: boolean } = {}): Promise<CompanyFilterResponse> {
  const startTime = Date.now()
  const supabase = await createClient()
  
  // Build the base query from company_summaries_unified view
  let query = supabase
    .from('company_summaries_unified')
    .select(`
      id,
      name,
      country,
      state, 
      city,
      lat,
      lng,
      company_type,
      company_role,
      segment,
      primary_market,
      website,
      is_active,
      technology_count,
      material_count,
      equipment_count,
      service_count,
      technologies,
      materials,
      service_types
    `, { count: (opts.includeCount ?? true) ? 'exact' : undefined })
  
  // Apply filters dynamically
  query = applyCompanyFilters(query, filterRequest)
  
  // Apply sorting
  if (filterRequest.sortBy && filterRequest.sortOrder) {
    query = query.order(filterRequest.sortBy, { ascending: filterRequest.sortOrder === 'asc' })
  }
  
  // Apply pagination  
  const offset = ((filterRequest.page || 1) - 1) * (filterRequest.limit || 100)
  query = query.range(offset, offset + (filterRequest.limit || 100) - 1)
  
  // Execute query
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }
  
  // Get available filter options for UI building
  const filterOptions = (opts.includeFilters ?? true) ? await getAvailableFilterOptions(supabase) : {
    countries: [], states: [], companyTypes: [], companyRoles: [], segments: [], technologies: [], materials: [], primaryMarkets: [], employeeCountRanges: [], revenueRanges: [], serviceTypes: [], systemTypes: []
  }
  
  // Transform data to expected format
  const transformedData = (data || []).map(row => ({
    id: row.id,
    name: row.name,
    country: row.country,
    state: row.state,
    city: row.city,
    // Prefer precise coordinates; otherwise fall back to country centroid
    // so global companies without geocoding still render on the map
    lat: (row.lat ?? null) !== null ? Number(row.lat) : (getFallbackCoords(row.country)?.[0] ?? null),
    lng: (row.lng ?? null) !== null ? Number(row.lng) : (getFallbackCoords(row.country)?.[1] ?? null),
    companyType: row.company_type,
    companyRole: row.company_role,
    segment: row.segment,
    website: row.website,
    description: null, // Not in summary view
    employeeCountRange: null,
    annualRevenueRange: null,
    foundedYear: null,
    primaryMarket: row.primary_market,
    secondaryMarkets: null,
    technologyCount: row.technology_count || 0,
    materialCount: row.material_count || 0,
    equipmentCount: row.equipment_count || 0,
    serviceCount: row.service_count || 0,
    technologies: row.technologies,
    materials: row.materials,
    serviceTypes: row.service_types,
    isActive: row.is_active,
    dataSource: null,
    lastVerified: null,
    createdAt: new Date().toISOString(), // Placeholder
    updatedAt: new Date().toISOString()  // Placeholder
  }))
  
  // Calculate pagination info
  const includeCount = opts.includeCount ?? true
  const total = includeCount ? (count || 0) : 0
  const pages = includeCount ? Math.ceil(total / (filterRequest.limit || 100)) : 0
  const currentPage = filterRequest.page || 1
  
  // Build response
  const response: CompanyFilterResponse = {
    data: transformedData,
    pagination: {
      page: currentPage,
      limit: filterRequest.limit || 100,
      total,
      pages,
      hasNext: includeCount ? (currentPage < pages) : ((transformedData.length || 0) === (filterRequest.limit || 100)),
      hasPrev: currentPage > 1
    },
    filters: {
      applied: filterRequest,
      available: filterOptions
    },
    metadata: {
      query: 'company_summaries_unified',
      executionTime: Date.now() - startTime,
      dataSource: 'supabase',
      timestamp: new Date().toISOString()
    }
  }
  
  return response
}

/**
 * Applies CompanyFilters to a Supabase query builder
 */
function applyCompanyFilters(query: any, filters: CompanyFilterRequest) {
  // Company classification filters
  if (filters.companyType?.length) {
    query = query.in('company_type', filters.companyType)
  }
  
  if (filters.companyRole?.length) {
    query = query.in('company_role', filters.companyRole)
  }
  
  if (filters.segment?.length) {
    query = query.in('segment', filters.segment)
  }
  
  // Geographic filters
  if (filters.country?.length) {
    query = query.in('country', filters.country)
  }
  
  if (filters.state?.length) {
    query = query.in('state', filters.state)
  }
  
  if (filters.city?.length) {
    query = query.in('city', filters.city)
  }
  
  // Market filters
  if (filters.primaryMarket?.length) {
    query = query.in('primary_market', filters.primaryMarket)
  }
  
  // Geographic bounds filtering (for maps)
  if (filters.bounds) {
    const { north, south, east, west } = filters.bounds
    query = query
      .gte('lat', south)
      .lte('lat', north)
      .gte('lng', west)  
      .lte('lng', east)
  }
  
  // Technology filtering (using array contains)
  if (filters.technologies?.length) {
    // Filter companies that have ANY of the specified technologies
    query = query.overlaps('technologies', filters.technologies)
  }
  
  // Material filtering (using array contains)
  if (filters.materials?.length) {
    query = query.overlaps('materials', filters.materials)
  }
  
  // Text search across name
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  
  // Status filters
  if (typeof filters.isActive === 'boolean') {
    query = query.eq('is_active', filters.isActive)
  }
  
  // Capability existence filters
  if (filters.hasWebsite) {
    query = query.not('website', 'is', null)
  }
  
  if (filters.hasCoordinates) {
    query = query.not('lat', 'is', null).not('lng', 'is', null)
  }
  
  if (filters.hasEquipment) {
    query = query.gt('equipment_count', 0)
  }
  
  if (filters.hasServices) {
    query = query.gt('service_count', 0)
  }
  
  return query
}

/**
 * Fetches available filter options for building dynamic UIs
 */
async function getAvailableFilterOptions(supabase: any) {
  try {
    // Get all unique values for dropdown filters
    const [countriesResult, companyTypesResult, segmentsResult, marketsResult] = await Promise.all([
      supabase.from('company_summaries_unified').select('country').not('country', 'is', null),
      supabase.from('company_summaries_unified').select('company_type').not('company_type', 'is', null),
      supabase.from('company_summaries_unified').select('segment').not('segment', 'is', null),
      supabase.from('company_summaries_unified').select('primary_market').not('primary_market', 'is', null)
    ])
    
    // Get technologies and materials from their respective tables
    const [technologiesResult, materialsResult] = await Promise.all([
      supabase.from('technologies_unified').select('id, name, category'),
      supabase.from('materials_unified').select('id, name, material_type, material_format')
    ])
    
    return {
      countries: [...new Set((countriesResult.data || []).map((r: any) => r.country))].sort(),
      states: [], // Would need separate query
      companyTypes: [...new Set((companyTypesResult.data || []).map((r: any) => r.company_type))].sort(),
      companyRoles: ['manufacturer', 'provider', 'supplier', 'developer', 'researcher'],
      segments: [...new Set((segmentsResult.data || []).map((r: any) => r.segment).filter(Boolean))].sort(),
      technologies: technologiesResult.data || [],
      materials: materialsResult.data || [],
      primaryMarkets: [...new Set((marketsResult.data || []).map((r: any) => r.primary_market).filter(Boolean))].sort(),
      employeeCountRanges: ['1-10', '11-50', '51-200', '201-500', '500+'],
      revenueRanges: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+'],
      serviceTypes: [], // Would need separate query
      systemTypes: []   // Would need separate query
    }
  } catch (error) {
    console.error('Error fetching filter options:', error)
    // Return empty options on error
    return {
      countries: [],
      states: [],
      companyTypes: [],
      companyRoles: [],
      segments: [],
      technologies: [],
      materials: [],
      primaryMarkets: [],
      employeeCountRanges: [],
      revenueRanges: [],
      serviceTypes: [],
      systemTypes: []
    }
  }
}

/**
 * POST /api/companies (for advanced filtering with request body)
 */
export async function POST(request: NextRequest) {
  try {
    const filterRequest: CompanyFilterRequest = await request.json()
    
    // Validate the request
    const validation = validateCompanyFilters(filterRequest)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid filters', details: validation.errors },
        { status: 400 }
      )
    }
    
    // Execute the same filtering logic as GET
    const result = await getFilteredCompanies(filterRequest)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Companies POST API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to process request', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

/**
 * OPTIONS /api/companies (for CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
