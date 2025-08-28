/**
 * Unified Companies API Route
 * 
 * This route provides access to company data through the unified adapter,
 * which can serve either mock data or live Supabase data based on configuration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCompaniesWithFilters, getDatasetCompanies, isUsingMocks } from '@/lib/data/unified-adapter'
import { CompanyFilterRequest } from '@/lib/types/unified'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    console.log('Unified API called with params:', Object.fromEntries(searchParams.entries()))
    console.log('Using mocks:', isUsingMocks())
    
    // Handle dataset-specific requests
    const datasetId = searchParams.get('dataset')
    if (datasetId) {
      const result = await getDatasetCompanies(datasetId)
      
      return NextResponse.json({
        ...result,
        meta: {
          source: isUsingMocks() ? 'mock' : 'live',
          timestamp: new Date().toISOString(),
          dataset: datasetId
        }
      })
    }
    
    // Handle general filtered requests
    const filters: CompanyFilterRequest = {
      companyType: searchParams.get('companyType')?.split(',') as any,
      companyRole: searchParams.get('companyRole')?.split(',') as any,
      segment: searchParams.get('segment')?.split(',') as any,
      country: searchParams.get('country')?.split(','),
      state: searchParams.get('state')?.split(','),
      technologies: searchParams.get('technologies')?.split(','),
      materials: searchParams.get('materials')?.split(','),
      search: searchParams.get('search') || undefined,
      hasEquipment: searchParams.get('hasEquipment') === 'true' ? true : undefined,
      hasServices: searchParams.get('hasServices') === 'true' ? true : undefined,
      isActive: searchParams.get('isActive') === 'false' ? false : true,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      includeCapabilities: searchParams.get('includeCapabilities') !== 'false'
    }
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof CompanyFilterRequest] === undefined) {
        delete filters[key as keyof CompanyFilterRequest]
      }
    })
    
    const result = await getCompaniesWithFilters(filters)
    
    return NextResponse.json({
      ...result,
      meta: {
        source: isUsingMocks() ? 'mock' : 'live',
        timestamp: new Date().toISOString(),
        filters: filters
      }
    })
    
  } catch (error) {
    console.error('Unified API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch companies', 
        details: error instanceof Error ? error.message : 'Unknown error',
        source: isUsingMocks() ? 'mock' : 'live'
      },
      { status: 500 }
    )
  }
}

// Support POST for complex filters
export async function POST(request: NextRequest) {
  try {
    const filters: CompanyFilterRequest = await request.json()
    
    console.log('Unified API POST called with filters:', filters)
    console.log('Using mocks:', isUsingMocks())
    
    const result = await getCompaniesWithFilters(filters)
    
    return NextResponse.json({
      ...result,
      meta: {
        source: isUsingMocks() ? 'mock' : 'live',
        timestamp: new Date().toISOString(),
        method: 'POST',
        filters: filters
      }
    })
    
  } catch (error) {
    console.error('Unified API POST error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch companies', 
        details: error instanceof Error ? error.message : 'Unknown error',
        source: isUsingMocks() ? 'mock' : 'live'
      },
      { status: 500 }
    )
  }
}