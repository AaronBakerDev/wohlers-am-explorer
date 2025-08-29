import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PrintServiceMapItem {
  id: string
  name: string
  city: string | null
  state: string | null
  country: string
  lat: number | null
  lng: number | null
  technologies: string[]
  materials: string[]
  website: string | null
  type: string | null
  services: string[]
  capabilities: string[]
  totalMachines?: number
  uniqueProcesses?: number
  uniqueMaterials?: number
  uniqueManufacturers?: number
  companies?: Array<{
    id: string
    name: string
    segment: string
    process: string
    material_type: string
    material_format: string
    printer_manufacturer: string
    printer_model: string
    number_of_printers: number
    country: string
    additional_info: string
  }>
  companyData?: {
    id: string
    company_name: string
    segment: string
    printer_manufacturer: string
    printer_model: string
    number_of_printers: number
    count_type: string
    process: string
    material_type: string
    material_format: string
    country: string
    update_year: number
    additional_info: string
  }
}

// Approximate coordinates for major countries (for service providers without specific coordinates)
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'Germany': [51.1657, 10.4515],
  'United States': [39.8283, -98.5795],
  'United Kingdom': [55.3781, -3.4360],
  'The United Kingdom': [55.3781, -3.4360], // Handle "The" prefix
  'Netherlands': [52.1326, 5.2913],
  'The Netherlands': [52.1326, 5.2913], // Handle "The" prefix
  'China': [35.8617, 104.1954],
  'France': [46.2276, 2.2137],
  'Italy': [41.8719, 12.5674],
  'Japan': [36.2048, 138.2529],
  'South Korea': [35.9078, 127.7669],
  'Canada': [56.1304, -106.3468],
  'Austria': [47.5162, 14.5501],
  'Switzerland': [46.8182, 8.2275],
  'Israel': [31.0461, 34.8516],
  'Australia': [-25.2744, 133.7751],
  'Czech Republic': [49.8175, 15.4730],
  'Spain': [40.4637, -3.7492],
  'Sweden': [60.1282, 18.6435],
  'Denmark': [56.2639, 9.5018],
  'Finland': [61.9241, 25.7482],
  'Belgium': [50.5039, 4.4699],
  'Norway': [60.4720, 8.4689],
  'Poland': [51.9194, 19.1451],
  'Russia': [61.5240, 105.3188],
  'India': [20.5937, 78.9629],
  'Brazil': [-14.2350, -51.9253],
  'Mexico': [23.6345, -102.5528],
  'South Africa': [-30.5595, 22.9375],
  'Hong Kong': [22.3193, 114.1694],
  'Singapore': [1.3521, 103.8198],
  'Taiwan': [23.6978, 120.9605],
  'Portugal': [39.3999, -8.2245],
  'Greece': [39.0742, 21.8243],
  'Turkey': [38.9637, 35.2433],
  // Common variations
  'USA': [39.8283, -98.5795],
  'US': [39.8283, -98.5795],
  'UK': [55.3781, -3.4360],
  'The UK': [55.3781, -3.4360],
  'P.R. China': [35.8617, 104.1954],
  'PRC': [35.8617, 104.1954],
}

// Sample data fallback function
function getSamplePrintServicesData() {
  return [
    {
      id: 'sample-1',
      company_name: 'Protolabs',
      headquarters_city: 'Maple Plain',
      country: 'United States',
      website: 'https://protolabs.com',
      services_offered: ['Rapid prototyping', 'Low-volume production'],
      material_type: 'Thermoplastic',
      process: 'FDM',
      industries_served: ['Automotive', 'Aerospace', 'Medical']
    },
    {
      id: 'sample-2',
      company_name: 'Shapeways',
      headquarters_city: 'New York',
      country: 'United States',
      website: 'https://shapeways.com',
      services_offered: ['Custom manufacturing', 'Design services'],
      material_type: 'Thermoplastic',
      process: 'SLS',
      industries_served: ['Fashion', 'Jewelry', 'Industrial']
    },
    {
      id: 'sample-3',
      company_name: 'Materialise',
      headquarters_city: 'Leuven',
      country: 'Belgium',
      website: 'https://materialise.com',
      services_offered: ['Medical devices', 'Automotive parts'],
      material_type: 'Thermoplastic',
      process: 'SLS',
      industries_served: ['Medical', 'Automotive', 'Aerospace']
    },
    {
      id: 'sample-4',
      company_name: 'Sculpteo',
      headquarters_city: 'Paris',
      country: 'France',
      website: 'https://sculpteo.com',
      services_offered: ['Online 3D printing', 'Batch production'],
      material_type: 'Thermoplastic',
      process: 'MJF',
      industries_served: ['Automotive', 'Healthcare', 'Education']
    },
    {
      id: 'sample-5',
      company_name: 'UnionTech',
      headquarters_city: 'Shanghai',
      country: 'China',
      website: 'https://uniontech3d.com',
      services_offered: ['Large-format printing', 'Automotive prototyping'],
      material_type: 'Thermoset',
      process: 'SLA',
      industries_served: ['Automotive', 'Consumer electronics', 'Industrial']
    }
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10)))

    // If running in mock mode, skip Supabase entirely
    const useMocks = String(process.env.NEXT_PUBLIC_USE_MOCKS || '').toLowerCase()
    const isMockEnabled = useMocks === 'true' || useMocks === '1'

    let rows: any[] = []
    let supabase: any = null

    if (!isMockEnabled) {
      try {
        supabase = await createClient()
      } catch (e) {
        console.warn('Supabase not configured, falling back to sample data for print-services-map:', e instanceof Error ? e.message : e)
      }
    }

    if (supabase) {
      // Try to fetch print services global data, fallback to sample data if table doesn't exist or permission issues
      const { data, error } = await supabase
        .from('vendor_print_services_global')
        .select(`
          id,
          company_name,
          country,
          material_type,
          process,
          segment,
          printer_manufacturer,
          printer_model,
          additional_info
        `)
        .limit(limit)

      if (error) {
        // 42P01 = undefined_table, 42501 = insufficient_privilege (RLS/permissions)
        if (error.code === '42P01' || error.code === '42501') {
          console.warn(`Print services source not available (${error.code}). Using sample data.`)
          rows = getSamplePrintServicesData()
        } else {
          // For any other error, also fallback to sample data to avoid breaking the UI
          console.warn('Error querying print services data. Using sample data.', error)
          rows = getSamplePrintServicesData()
        }
      } else {
        rows = data || []
      }
    } else {
      // No Supabase client available, use sample data
      rows = getSamplePrintServicesData()
    }

    // Group companies by country to create cluster markers (like systems manufacturers)
    const countryClusters = new Map<string, any[]>()
    
    rows?.forEach((row) => {
      if (!countryClusters.has(row.country)) {
        countryClusters.set(row.country, [])
      }
      countryClusters.get(row.country)!.push({
        id: row.id,
        name: row.company_name,
        segment: row.segment || 'Service Provider',
        process: row.process,
        material_type: row.material_type,
        material_format: row.material_format,
        printer_manufacturer: row.printer_manufacturer,
        printer_model: row.printer_model,
        number_of_printers: row.number_of_printers || 0,
        country: row.country,
        additional_info: row.additional_info
      })
    })

    // Create one marker per country with service provider count
    const items: PrintServiceMapItem[] = Array.from(countryClusters.entries()).map(([country, companies]) => {
      const countryCoords = COUNTRY_COORDINATES[country] || [0, 0]
      const uniqueProcesses = new Set(companies.map(c => c.process).filter(Boolean)).size
      const uniqueMaterials = new Set(companies.map(c => c.material_type).filter(Boolean)).size
      const totalPrinters = companies.reduce((sum, c) => sum + (c.number_of_printers || 0), 0)
      
      return {
        id: `country-${country}`,
        name: `${country} (${companies.length} service providers)`,
        city: country,
        state: null,
        country: country,
        lat: countryCoords[0],
        lng: countryCoords[1],
        technologies: Array.from(new Set(companies.map(c => c.process).filter(Boolean))),
        materials: Array.from(new Set(companies.map(c => c.material_type).filter(Boolean))),
        website: null,
        type: 'service',
        services: [],
        capabilities: [],
        totalMachines: totalPrinters,
        uniqueProcesses: uniqueProcesses,
        uniqueMaterials: uniqueMaterials,
        uniqueManufacturers: companies.length,
        companies: companies // Include all companies for the sidebar
      }
    })

    console.log(`Print services map API: returning ${items.length} country clusters with ${rows?.length || 0} total companies`)
    
    return NextResponse.json({ 
      data: { 
        items,
        total: items.length,
        hasMore: items.length >= limit
      } 
    })
    
  } catch (e: unknown) {
    console.error('Print services map API error:', e)
    // As a last resort, still return sample data rather than a hard 500
    const sampleRows = getSamplePrintServicesData()
    const countryClusters = new Map<string, any[]>()
    
    sampleRows.forEach((row: any) => {
      if (!countryClusters.has(row.country)) {
        countryClusters.set(row.country, [])
      }
      countryClusters.get(row.country)!.push({
        id: row.id,
        name: row.company_name,
        segment: 'Service Provider',
        process: row.process,
        material_type: row.material_type,
        material_format: 'Unknown',
        printer_manufacturer: 'Unknown',
        printer_model: 'Unknown',
        number_of_printers: 0,
        country: row.country,
        additional_info: ''
      })
    })
    
    const items = Array.from(countryClusters.entries()).map(([country, companies]) => {
      const countryCoords = COUNTRY_COORDINATES[country] || [0, 0]
      const uniqueProcesses = new Set(companies.map(c => c.process).filter(Boolean)).size
      const uniqueMaterials = new Set(companies.map(c => c.material_type).filter(Boolean)).size
      
      return {
        id: `country-${country}`,
        name: `${country} (${companies.length} service providers)`,
        city: country,
        state: null,
        country: country,
        lat: countryCoords[0],
        lng: countryCoords[1],
        technologies: Array.from(new Set(companies.map(c => c.process).filter(Boolean))),
        materials: Array.from(new Set(companies.map(c => c.material_type).filter(Boolean))),
        website: null,
        type: 'service',
        services: [],
        capabilities: [],
        totalMachines: 0,
        uniqueProcesses: uniqueProcesses,
        uniqueMaterials: uniqueMaterials,
        uniqueManufacturers: companies.length,
        companies: companies
      } as PrintServiceMapItem
    })
    
    return NextResponse.json({ 
      data: { items, total: items.length, hasMore: false }
    }, { status: 200 })
  }
}
