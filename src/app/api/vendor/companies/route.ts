import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lightweight country centroid map used to place markers when precise
// coordinates are missing. Keys are normalized to lowercase.
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'germany': [51.1657, 10.4515],
  'united states': [39.8283, -98.5795],
  'united states of america': [39.8283, -98.5795],
  'usa': [39.8283, -98.5795],
  'the united states': [39.8283, -98.5795],
  'united kingdom': [55.3781, -3.4360],
  'the united kingdom': [55.3781, -3.4360],
  'netherlands': [52.1326, 5.2913],
  'the netherlands': [52.1326, 5.2913],
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
  'brazil': [-14.2350, -51.9253],
  'mexico': [23.6345, -102.5528],
  'south africa': [-30.5595, 22.9375],
  'hong kong': [22.3193, 114.1694],
  'singapore': [1.3521, 103.8198],
  'taiwan': [23.6978, 120.9605],
}

function getFallbackCoords(country: string | null | undefined): [number, number] | null {
  if (!country) return null
  const key = country.trim().toLowerCase()
  const coords = COUNTRY_COORDINATES[key]
  if (!coords) return null
  const jitterLat = (Math.random() - 0.5) * 0.8
  const jitterLng = (Math.random() - 0.5) * 1.6
  return [coords[0] + jitterLat, coords[1] + jitterLng]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()

    const segment = searchParams.get('segment')
    if (!segment) {
      return NextResponse.json({ error: 'segment is required' }, { status: 400 })
    }

    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10)))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const offset = (page - 1) * limit
    // Map 'name' to 'company_name' for sorting since that's the actual column name
    let sortBy = searchParams.get('sortBy') || 'company_name'
    if (sortBy === 'name') sortBy = 'company_name'
    const sortOrder = (searchParams.get('sortOrder') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'

    // Base select - only include columns that exist in the table
    let query = supabase
      .from('vendor_companies_merged')
      .select(
        [
          'id',
          'company_name',
          'country',
          'segment',
          'process',
          'material_format',
          'material_type',
          'printer_manufacturer',
          'printer_model',
          'number_of_printers',
          'count_type',
          'update_year',
          'additional_info'
        ].join(', '),
        { count: 'exact' }
      )
      .eq('segment', segment)

    // Filters
    const country = searchParams.get('country')
    if (country) {
      const list = country.split(',').map(v => v.trim()).filter(Boolean)
      if (list.length) query = query.in('country', list)
    }

    const process = searchParams.get('process')
    if (process) {
      const list = process.split(',').map(v => v.trim()).filter(Boolean)
      if (list.length) query = query.in('process', list)
    }

    const materialType = searchParams.get('material_type')
    if (materialType) {
      const list = materialType.split(',').map(v => v.trim()).filter(Boolean)
      if (list.length) query = query.in('material_type', list)
    }

    const materialFormat = searchParams.get('material_format')
    if (materialFormat) {
      const list = materialFormat.split(',').map(v => v.trim()).filter(Boolean)
      if (list.length) query = query.in('material_format', list)
    }

    const manufacturer = searchParams.get('printer_manufacturer')
    if (manufacturer) {
      const list = manufacturer.split(',').map(v => v.trim()).filter(Boolean)
      if (list.length) query = query.in('printer_manufacturer', list)
    }

    const updateYear = searchParams.get('update_year')
    if (updateYear) {
      const y = parseInt(updateYear, 10)
      if (!Number.isNaN(y)) query = query.eq('update_year', y)
    }

    const search = searchParams.get('search')
    if (search) {
      const s = `%${search}%`
      // Search across several text fields
      query = query.or(
        [
          `company_name.ilike.${s}`,
          `country.ilike.${s}`,
          `process.ilike.${s}`,
          `material_type.ilike.${s}`,
          `material_format.ilike.${s}`,
          `printer_manufacturer.ilike.${s}`,
          `printer_model.ilike.${s}`,
        ].join(',')
      )
    }

    // Sorting and pagination
    query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) {
      // 42P01 = table not found
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], pagination: { page: 1, limit, total: 0, pages: 0, hasNext: false, hasPrev: false }, filters: { applied: {}, available: { countries: [], segments: [], technologies: [], materials: [] } }, metadata: { query: 'vendor_companies_merged', dataSource: 'supabase', executionTime: 0, timestamp: new Date().toISOString() } })
      }
      throw error
    }

    const items = (data || []).map((row: any) => {
      const coords = getFallbackCoords(row.country)
      return {
        id: row.id,
        name: row.company_name,
        country: row.country,
        state: null,
        city: null, // headquarters_city doesn't exist in the table
        lat: coords ? coords[0] : null,
        lng: coords ? coords[1] : null,
        // Classify: map segment to type for marker coloring
        companyType: segment === 'System manufacturer' ? 'equipment' : 'service',
        companyRole: segment === 'System manufacturer' ? 'manufacturer' : 'provider',
        segment: row.segment,
        website: null, // website doesn't exist in the table
        description: null,
        employeeCountRange: null,
        annualRevenueRange: null,
        foundedYear: null,
        primaryMarket: segment === 'System manufacturer' ? 'manufacturing' : 'services',
        secondaryMarkets: null,
        technologyCount: row.process ? 1 : 0,
        materialCount: row.material_type ? 1 : 0,
        equipmentCount: 0,
        serviceCount: 0,
        technologies: row.process ? [row.process] : [],
        materials: row.material_type ? [row.material_type] : [],
        serviceTypes: segment === 'Printing services' ? ['printing'] : [],
        isActive: true,
        dataSource: 'vendor_companies_merged',
        lastVerified: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    // Available filters (distinct lists)
    // We keep this simple by pulling all rows for the segment (up to a cap) then deduping
    const [countriesRes, processesRes, materialsRes] = await Promise.all([
      supabase.from('vendor_companies_merged').select('country').eq('segment', segment).not('country', 'is', null).limit(10000),
      supabase.from('vendor_companies_merged').select('process').eq('segment', segment).not('process', 'is', null).limit(10000),
      supabase.from('vendor_companies_merged').select('material_type, material_format').eq('segment', segment).not('material_type', 'is', null).limit(10000),
    ])

    const unique = <T,>(arr: T[]) => Array.from(new Set(arr))

    const available = {
      countries: unique((countriesRes.data || []).map((r: any) => r.country).filter(Boolean)).sort(),
      segments: [segment],
      technologies: unique((processesRes.data || []).map((r: any) => r.process).filter(Boolean)).map((name: string, i: number) => ({ id: String(i), name, category: 'process' })),
      materials: unique((materialsRes.data || []).map((r: any) => r.material_type).filter(Boolean)).map((name: string, i: number) => ({ id: String(i), name, materialType: name, materialFormat: '' })),
    }

    const total = count || items.length
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      filters: {
        applied: {
          search: search || undefined,
          country: country ? country.split(',').filter(Boolean) : undefined,
          technologies: process ? process.split(',').filter(Boolean) : undefined,
          materials: materialType ? materialType.split(',').filter(Boolean) : undefined,
        },
        available,
      },
      metadata: {
        query: 'vendor_companies_merged',
        dataSource: 'supabase',
        executionTime: 0,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (e: any) {
    console.error('Vendor companies API error:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

