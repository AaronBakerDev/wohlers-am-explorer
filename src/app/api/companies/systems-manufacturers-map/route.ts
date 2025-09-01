import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface AMSystemsManufacturerMapItem {
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
  segment: string
  process: string
  material_format: string
  material_type: string
  totalMachines?: number
  uniqueProcesses?: number
  uniqueMaterials?: number
  uniqueManufacturers?: number
  companies?: Array<{
    id: string
    name: string
    segment: string
    process: string
    material_format: string
    material_type: string
    country: string
  }>
}

// Approximate coordinates for major countries (for manufacturers without specific coordinates)
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'Germany': [51.1657, 10.4515],
  'United States': [39.8283, -98.5795],
  'United Kingdom': [55.3781, -3.4360],
  'Netherlands': [52.1326, 5.2913],
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
}

// Sample data fallback function
function getSampleAMSystemsData() {
  return [
    {
      id: 'sample-1',
      company_name: 'EOS GmbH',
      headquarters_city: 'Krailling',
      country: 'Germany',
      website: 'https://eos.info',
      segment: 'Industrial',
      process: 'DMLS',
      material_format: 'Powder',
      material_type: 'Metal'
    },
    {
      id: 'sample-2',
      company_name: 'Stratasys',
      headquarters_city: 'Eden Prairie',
      country: 'United States',
      website: 'https://stratasys.com',
      segment: 'Industrial',
      process: 'FDM',
      material_format: 'Filament',
      material_type: 'Thermoplastic'
    },
    {
      id: 'sample-3',
      company_name: 'Formlabs',
      headquarters_city: 'Somerville',
      country: 'United States',
      website: 'https://formlabs.com',
      segment: 'Professional',
      process: 'SLA',
      material_format: 'Resin',
      material_type: 'Thermoset'
    },
    {
      id: 'sample-4',
      company_name: 'Ultimaker',
      headquarters_city: 'Utrecht',
      country: 'Netherlands',
      website: 'https://ultimaker.com',
      segment: 'Professional',
      process: 'FDM',
      material_format: 'Filament',
      material_type: 'Thermoplastic'
    },
    {
      id: 'sample-5',
      company_name: 'Bambu Lab',
      headquarters_city: 'Shenzhen',
      country: 'China',
      website: 'https://bambulab.com',
      segment: 'Desktop',
      process: 'FDM',
      material_format: 'Filament',
      material_type: 'Thermoplastic'
    },
    {
      id: 'sample-6',
      company_name: 'Carbon',
      headquarters_city: 'Redwood City',
      country: 'United States',
      website: 'https://carbon3d.com',
      segment: 'Industrial',
      process: 'CLIP',
      material_format: 'Resin',
      material_type: 'Thermoset'
    },
    {
      id: 'sample-7',
      company_name: 'HP',
      headquarters_city: 'Palo Alto',
      country: 'United States',
      website: 'https://hp.com',
      segment: 'Industrial',
      process: 'MJF',
      material_format: 'Powder',
      material_type: 'Thermoplastic'
    },
    {
      id: 'sample-8',
      company_name: 'SLM Solutions',
      headquarters_city: 'Lübeck',
      country: 'Germany',
      website: 'https://slm-solutions.com',
      segment: 'Industrial',
      process: 'SLM',
      material_format: 'Powder',
      material_type: 'Metal'
    }
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10)))

    const supabase = await createClient()
    
    // Fetch from merged view with System manufacturer segment filter
    let rows: any[] = []
    const { data, error } = await supabase
      .from('vendor_companies_merged')
      .select(`
        id,
        company_name,
        country,
        segment,
        process,
        material_format,
        material_type
      `)
      .eq('segment', 'System manufacturer')
      .limit(limit)
    
    if (error && error.code === '42P01') {
      // View doesn't exist, use sample data
      console.log('vendor_companies_merged view does not exist, using sample data')
      rows = getSampleAMSystemsData()
    } else if (error) {
      throw error
    } else {
      rows = data || []
    }

    // Group companies by country to create cluster markers
    const countryClusters = new Map<string, any[]>()
    
    rows?.forEach((row) => {
      if (!countryClusters.has(row.country)) {
        countryClusters.set(row.country, [])
      }
      countryClusters.get(row.country)!.push({
        id: row.id,
        name: row.company_name,
        segment: row.segment,
        process: row.process,
        material_format: row.material_format,
        material_type: row.material_type,
        country: row.country
      })
    })

    // Create one marker per country with company count
    const items: AMSystemsManufacturerMapItem[] = Array.from(countryClusters.entries()).map(([country, companies]) => {
      const countryCoords = COUNTRY_COORDINATES[country] || [0, 0]
      const uniqueProcesses = new Set(companies.map(c => c.process)).size
      const uniqueMaterials = new Set(companies.map(c => c.material_type)).size
      
      return {
        id: `country-${country}`,
        name: `${country} (${companies.length} manufacturers)`,
        city: country,
        state: null,
        country: country,
        lat: countryCoords[0],
        lng: countryCoords[1],
        technologies: Array.from(new Set(companies.map(c => c.process))),
        materials: Array.from(new Set(companies.map(c => c.material_type))),
        website: null,
        type: 'equipment',
        segment: 'Multiple',
        process: 'Multiple',
        material_format: 'Multiple',
        material_type: 'Multiple',
        totalMachines: companies.length,
        uniqueProcesses: uniqueProcesses,
        uniqueMaterials: uniqueMaterials,
        uniqueManufacturers: companies.length,
        companies: companies // Include all companies for the sidebar
      }
    })

    return NextResponse.json({ 
      data: { 
        items,
        total: items.length,
        hasMore: items.length >= limit
      } 
    })
    
  } catch (e: unknown) {
    console.error('Systems manufacturers map API error:', e)
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Unexpected error' 
    }, { status: 500 })
  }
}