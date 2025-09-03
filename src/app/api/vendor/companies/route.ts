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

// Unified empty response helper for environments without the vendor_companies_merged view
function emptyResponse(segment: string, page: number, limit: number) {
  return NextResponse.json({
    data: [],
    pagination: { page, limit, total: 0, pages: 0, hasNext: false, hasPrev: false },
    filters: {
      applied: {},
      available: {
        countries: [],
        segments: [segment],
        technologies: [],
        materials: [],
        materialFormats: [],
        printerManufacturers: [],
        printerModels: [],
        countTypes: [],
      }
    },
    metadata: {
      query: 'vendor_companies_merged',
      dataSource: 'supabase',
      executionTime: 0,
      timestamp: new Date().toISOString(),
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Helper: unified empty/fallback response (prevents 500s in local dev)
    const emptyResponse = (segment: string, page: number, limit: number) => NextResponse.json({
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: {
        applied: {},
        available: {
          countries: [],
          segments: [segment],
          technologies: [],
          materials: [],
          materialFormats: [],
          printerManufacturers: [],
          printerModels: [],
          countTypes: [],
        },
      },
      metadata: {
        query: 'vendor_companies_merged',
        dataSource: 'supabase',
        executionTime: 0,
        timestamp: new Date().toISOString(),
      },
    })

    let supabase: any = null
    try {
      supabase = await createClient()
    } catch (e) {
      // When Supabase is not configured locally, avoid 500 and return an empty, valid payload
      const segment = searchParams.get('segment') || 'Printing services'
      const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10)))
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
      console.warn('Supabase not configured or failed to initialize in vendor API:', e)
      return emptyResponse(segment, page, limit)
    }

    const segment = searchParams.get('segment')
    if (!segment) {
      return NextResponse.json({ error: 'segment is required' }, { status: 400 })
    }
    
    // Debug: Test direct query
    try {
      const testQuery = await supabase
        .from('vendor_companies_merged')
        .select('count', { count: 'exact', head: true })
        .eq('segment', segment)
      console.log('Debug test query:', { segment, testQuery })
    } catch (testErr) {
      console.error('Debug test query failed:', testErr)
    }

    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10)))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const offset = (page - 1) * limit
    // Map 'name' to 'company_name' for sorting since that's the actual column name
    let sortBy = searchParams.get('sortBy') || 'company_name'
    // Map client field names to DB columns
    if (sortBy === 'name') sortBy = 'company_name'
    if (sortBy === 'materialType') sortBy = 'material_type'
    if (sortBy === 'materialFormat') sortBy = 'material_format'
    if (sortBy === 'printerManufacturer') sortBy = 'printer_manufacturer'
    if (sortBy === 'printerModel') sortBy = 'printer_model'
    if (sortBy === 'numberOfPrinters') sortBy = 'number_of_printers'
    if (sortBy === 'countType') sortBy = 'count_type'
    const sortOrder = (searchParams.get('sortOrder') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'

    // Base select - only include columns that exist in the table
    const fieldsMode = (searchParams.get('fields') || '').toLowerCase()
    // Whether to include an exact count in the SELECT (affects performance)
    // NOTE: This must be computed before building the select() options below.
    const includeCount = (searchParams.get('includeCount') ?? 'true') !== 'false'
    const baseColumns = [
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
      'update_year'
    ]
    const allColumns = fieldsMode === 'map' ? baseColumns : [...baseColumns, 'additional_info']
    let query = supabase
      .from('vendor_companies_merged')
      .select(allColumns.join(', '), { count: includeCount ? 'exact' : undefined })
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

    // New: filter by specific printer model(s)
    const printerModel = searchParams.get('printer_model')
    if (printerModel) {
      const list = printerModel.split(',').map(v => v.trim()).filter(Boolean)
      if (list.length) query = query.in('printer_model', list)
    }

    // New: filter by count type
    const countType = searchParams.get('count_type')
    if (countType) {
      const list = countType.split(',').map(v => v.trim()).filter(Boolean)
      if (list.length) query = query.in('count_type', list)
    }

    // New: numeric range filters for number_of_printers
    const minPrinters = searchParams.get('min_printers')
    if (minPrinters && !Number.isNaN(Number(minPrinters))) {
      query = query.gte('number_of_printers', Number(minPrinters))
    }
    const maxPrinters = searchParams.get('max_printers')
    if (maxPrinters && !Number.isNaN(Number(maxPrinters))) {
      query = query.lte('number_of_printers', Number(maxPrinters))
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
    
    console.log('vendor/companies query result:', { 
      hasData: !!data, 
      dataLength: data?.length || 0, 
      error: error?.message || null,
      errorCode: error?.code || null,
      count 
    })
    
    if (error) {
      // Gracefully handle common DB/view issues in local/dev environments
      // 42P01 = table/view not found, 42703 = column not found
      if (['42P01', '42703'].includes(error.code as string)) {
        console.warn(`vendor/companies: ${error.code} on vendor_companies_merged. Attempting legacy table fallback...`)

        const fallbackTable = segment === 'System manufacturer'
          ? 'vendor_am_systems_manufacturers'
          : 'vendor_print_services_global'

        try {
          let fbQuery = supabase
            .from(fallbackTable)
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

          // Re-apply filters
          if (country) {
            const list = country.split(',').map(v => v.trim()).filter(Boolean)
            if (list.length) fbQuery = fbQuery.in('country', list)
          }
          if (process) {
            const list = process.split(',').map(v => v.trim()).filter(Boolean)
            if (list.length) fbQuery = fbQuery.in('process', list)
          }
          if (materialType) {
            const list = materialType.split(',').map(v => v.trim()).filter(Boolean)
            if (list.length) fbQuery = fbQuery.in('material_type', list)
          }
          if (materialFormat) {
            const list = materialFormat.split(',').map(v => v.trim()).filter(Boolean)
            if (list.length) fbQuery = fbQuery.in('material_format', list)
          }
          if (manufacturer) {
            const list = manufacturer.split(',').map(v => v.trim()).filter(Boolean)
            if (list.length) fbQuery = fbQuery.in('printer_manufacturer', list)
          }
          if (printerModel) {
            const list = printerModel.split(',').map(v => v.trim()).filter(Boolean)
            if (list.length) fbQuery = fbQuery.in('printer_model', list)
          }
          if (countType) {
            const list = countType.split(',').map(v => v.trim()).filter(Boolean)
            if (list.length) fbQuery = fbQuery.in('count_type', list)
          }
          if (minPrinters && !Number.isNaN(Number(minPrinters))) {
            fbQuery = fbQuery.gte('number_of_printers', Number(minPrinters))
          }
          if (maxPrinters && !Number.isNaN(Number(maxPrinters))) {
            fbQuery = fbQuery.lte('number_of_printers', Number(maxPrinters))
          }
          if (updateYear) {
            const y = parseInt(updateYear, 10)
            if (!Number.isNaN(y)) fbQuery = fbQuery.eq('update_year', y)
          }
          if (search) {
            const s = `%${search}%`
            fbQuery = fbQuery.or(
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
          fbQuery = fbQuery.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1)

          const { data: fbData, error: fbError, count: fbCount } = await fbQuery
          if (fbError) {
            console.warn(`vendor/companies: fallback query failed (${fallbackTable}). Returning empty response.`, fbError)
            return emptyResponse(segment, page, limit)
          }

          const items = (fbData || []).map((row: any) => {
            const coords = getFallbackCoords(row.country)
            return {
              id: row.id,
              name: row.company_name,
              country: row.country,
              state: null,
              city: null,
              lat: coords ? coords[0] : null,
              lng: coords ? coords[1] : null,
              companyType: segment === 'System manufacturer' ? 'equipment' : 'service',
              companyRole: segment === 'System manufacturer' ? 'manufacturer' : 'provider',
              segment: row.segment,
              website: null,
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
              process: row.process || null,
              materialType: row.material_type || null,
              materialFormat: row.material_format || null,
              printerManufacturer: row.printer_manufacturer || null,
              printerModel: row.printer_model || null,
              numberOfPrinters: typeof row.number_of_printers === 'number' ? row.number_of_printers : (row.number_of_printers ? Number(row.number_of_printers) : null),
              countType: row.count_type || null,
              isActive: true,
              dataSource: fallbackTable,
              lastVerified: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          })

          // Available options from fallback table
          const fbBase = () => supabase.from(fallbackTable)
          const [countriesRes, processesRes, materialsRes, manufacturersRes, modelsRes, countTypesRes] = await Promise.all([
            applyCommon(fbBase().select('country').not('country', 'is', null).limit(10000), 'country'),
            applyCommon(fbBase().select('process').not('process', 'is', null).limit(10000), 'process'),
            applyCommon(fbBase().select('material_type, material_format').limit(10000), 'material_type'),
            applyCommon(fbBase().select('printer_manufacturer').not('printer_manufacturer', 'is', null).limit(10000), 'printer_manufacturer'),
            applyCommon(fbBase().select('printer_model').not('printer_model', 'is', null).limit(10000), 'printer_model'),
            applyCommon(fbBase().select('count_type').not('count_type', 'is', null).limit(10000), 'count_type'),
          ])

          const unique = <T,>(arr: T[]) => Array.from(new Set(arr))
          const available = {
            countries: unique((countriesRes.data || []).map((r: any) => r.country).filter(Boolean)).sort(),
            segments: [segment],
            technologies: unique((processesRes.data || []).map((r: any) => r.process).filter(Boolean)).map((name: string, i: number) => ({ id: String(i), name, category: 'process' })),
            materials: unique((materialsRes.data || []).map((r: any) => r.material_type).filter(Boolean)).map((name: string, i: number) => ({ id: String(i), name, materialType: name, materialFormat: '' })),
            materialFormats: unique((materialsRes.data || []).map((r: any) => r.material_format).filter(Boolean)).sort(),
            printerManufacturers: unique((manufacturersRes.data || []).map((r: any) => r.printer_manufacturer).filter(Boolean)).sort(),
            printerModels: unique((modelsRes.data || []).map((r: any) => r.printer_model).filter(Boolean)).sort(),
            countTypes: unique((countTypesRes.data || []).map((r: any) => r.count_type).filter(Boolean)).sort(),
          }

          const total = fbCount || items.length
          const pages = Math.ceil((total || 0) / limit)

          return NextResponse.json({
            data: items,
            pagination: { page, limit, total: total || 0, pages, hasNext: page < pages, hasPrev: page > 1 },
            filters: { applied: { /* intentionally minimal for fallback */ }, available },
            metadata: { query: fallbackTable, dataSource: 'supabase', executionTime: 0, timestamp: new Date().toISOString() },
          })
        } catch (fbErr) {
          console.warn('vendor/companies: legacy table fallback errored. Returning empty response.', fbErr)
          return emptyResponse(segment, page, limit)
        }
      }
      console.warn('vendor/companies unexpected query error. Returning empty response.', error)
      return emptyResponse(segment, page, limit)
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
        // Vendor-specific fields for table columns
        process: row.process || null,
        materialType: row.material_type || null,
        materialFormat: row.material_format || null,
        printerManufacturer: row.printer_manufacturer || null,
        printerModel: row.printer_model || null,
        numberOfPrinters: typeof row.number_of_printers === 'number' ? row.number_of_printers : (row.number_of_printers ? Number(row.number_of_printers) : null),
        countType: row.count_type || null,
        isActive: true,
        dataSource: 'vendor_companies_merged',
        lastVerified: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    // Available filters (distinct lists)
    // Context-aware: apply current filters (except the target dimension) so options reflect selection
    const base = () => supabase.from('vendor_companies_merged')

    const applyCommon = (q: any, exclude: string) => {
      // Always apply segment filter
      q = q.eq('segment', segment)
      if (exclude !== 'country' && country) {
        const list = country.split(',').map(v => v.trim()).filter(Boolean)
        if (list.length) q = q.in('country', list)
      }
      if (exclude !== 'process' && process) {
        const list = process.split(',').map(v => v.trim()).filter(Boolean)
        if (list.length) q = q.in('process', list)
      }
      if (exclude !== 'material_type' && materialType) {
        const list = materialType.split(',').map(v => v.trim()).filter(Boolean)
        if (list.length) q = q.in('material_type', list)
      }
      if (exclude !== 'material_format' && materialFormat) {
        const list = materialFormat.split(',').map(v => v.trim()).filter(Boolean)
        if (list.length) q = q.in('material_format', list)
      }
      if (exclude !== 'printer_manufacturer' && manufacturer) {
        const list = manufacturer.split(',').map(v => v.trim()).filter(Boolean)
        if (list.length) q = q.in('printer_manufacturer', list)
      }
      if (exclude !== 'printer_model' && printerModel) {
        const list = printerModel.split(',').map(v => v.trim()).filter(Boolean)
        if (list.length) q = q.in('printer_model', list)
      }
      if (exclude !== 'count_type' && countType) {
        const list = countType.split(',').map(v => v.trim()).filter(Boolean)
        if (list.length) q = q.in('count_type', list)
      }
      if (exclude !== 'number_of_printers' && minPrinters && !Number.isNaN(Number(minPrinters))) {
        q = q.gte('number_of_printers', Number(minPrinters))
      }
      if (exclude !== 'number_of_printers' && maxPrinters && !Number.isNaN(Number(maxPrinters))) {
        q = q.lte('number_of_printers', Number(maxPrinters))
      }
      if (exclude !== 'update_year' && updateYear) {
        const y = parseInt(updateYear, 10)
        if (!Number.isNaN(y)) q = q.eq('update_year', y)
      }
      return q
    }

    let available: any = { countries: [], segments: [segment], technologies: [], materials: [], materialFormats: [], printerManufacturers: [], printerModels: [], countTypes: [] }
    if ((searchParams.get('includeFilters') ?? 'true') !== 'false') {
      const [countriesRes, processesRes, materialsRes, manufacturersRes, modelsRes, countTypesRes] = await Promise.all([
        applyCommon(base().select('country').not('country', 'is', null).limit(10000), 'country'),
        applyCommon(base().select('process').not('process', 'is', null).limit(10000), 'process'),
        applyCommon(base().select('material_type, material_format').limit(10000), 'material_type'),
        applyCommon(base().select('printer_manufacturer').not('printer_manufacturer', 'is', null).limit(10000), 'printer_manufacturer'),
        applyCommon(base().select('printer_model').not('printer_model', 'is', null).limit(10000), 'printer_model'),
        applyCommon(base().select('count_type').not('count_type', 'is', null).limit(10000), 'count_type'),
      ])

      const unique = <T,>(arr: T[]) => Array.from(new Set(arr))
      available = {
        countries: unique((countriesRes.data || []).map((r: any) => r.country).filter(Boolean)).sort(),
        segments: [segment],
        technologies: unique((processesRes.data || []).map((r: any) => r.process).filter(Boolean)).map((name: string, i: number) => ({ id: String(i), name, category: 'process' })),
        materials: unique((materialsRes.data || []).map((r: any) => r.material_type).filter(Boolean)).map((name: string, i: number) => ({ id: String(i), name, materialType: name, materialFormat: '' })),
        materialFormats: unique((materialsRes.data || []).map((r: any) => r.material_format).filter(Boolean)).sort(),
        printerManufacturers: unique((manufacturersRes.data || []).map((r: any) => r.printer_manufacturer).filter(Boolean)).sort(),
        printerModels: unique((modelsRes.data || []).map((r: any) => r.printer_model).filter(Boolean)).sort(),
        countTypes: unique((countTypesRes.data || []).map((r: any) => r.count_type).filter(Boolean)).sort(),
      }
    }

    const total = includeCount ? (count || items.length) : 0
    const pages = includeCount ? Math.ceil((count || 0) / limit) : 0

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: includeCount ? (page < pages) : (items.length === limit),
        hasPrev: page > 1,
      },
      filters: {
        applied: {
          search: search || undefined,
          country: country ? country.split(',').filter(Boolean) : undefined,
          technologies: process ? process.split(',').filter(Boolean) : undefined,
          materials: materialType ? materialType.split(',').filter(Boolean) : undefined,
          materialFormats: materialFormat ? materialFormat.split(',').filter(Boolean) : undefined,
          printerManufacturers: manufacturer ? manufacturer.split(',').filter(Boolean) : undefined,
          printerModels: printerModel ? printerModel.split(',').filter(Boolean) : undefined,
          countTypes: countType ? countType.split(',').filter(Boolean) : undefined,
          minPrinters: minPrinters ? Number(minPrinters) : undefined,
          maxPrinters: maxPrinters ? Number(maxPrinters) : undefined,
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
    // As a last resort, keep the endpoint resilient
    try {
      const { searchParams } = new URL(request.url)
      const segment = searchParams.get('segment') || 'Printing services'
      const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10)))
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
      console.error('Vendor companies API error (caught):', e)
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total: 0, pages: 0, hasNext: false, hasPrev: false },
        filters: {
          applied: {},
          available: {
            countries: [],
            segments: [segment],
            technologies: [],
            materials: [],
            materialFormats: [],
            printerManufacturers: [],
            printerModels: [],
            countTypes: [],
          },
        },
        metadata: { query: 'vendor_companies_merged', dataSource: 'supabase', executionTime: 0, timestamp: new Date().toISOString() }
      })
    } catch (nested) {
      console.error('Vendor companies API fatal error:', nested)
      return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
    }
  }
}
