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
}

// Approximate coordinates for major countries (for service providers without specific coordinates)
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
  'Belgium': [50.5039, 4.4699],
  'Portugal': [39.3999, -8.2245],
  'Greece': [39.0742, 21.8243],
  'Turkey': [38.9637, 35.2433],
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

    const supabase = await createClient()
    
    // Try to fetch print services global data, fallback to sample data if table doesn't exist
    let rows: any[] = []
    const { data, error } = await supabase
      .from('vendor_print_services_global')
      .select(`
        id,
        company_name,
        headquarters_city,
        country,
        website,
        services_offered,
        material_type,
        process,
        industries_served
      `)
      .limit(limit)
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, use sample data
      console.log('Print Services Global table does not exist, using sample data')
      rows = getSamplePrintServicesData()
    } else if (error) {
      throw error
    } else {
      rows = data || []
    }

    // Transform data into map marker format
    const items: PrintServiceMapItem[] = (rows || []).map((row) => {
      const countryCoords = COUNTRY_COORDINATES[row.country] || [0, 0]
      // Add some random offset to avoid all markers being in exactly the same spot
      const latOffset = (Math.random() - 0.5) * 2 // +/- 1 degree
      const lngOffset = (Math.random() - 0.5) * 4 // +/- 2 degrees
      
      return {
        id: row.id,
        name: row.company_name,
        city: row.headquarters_city,
        state: null, // Print services typically don't have state data for global
        country: row.country,
        lat: countryCoords[0] + latOffset,
        lng: countryCoords[1] + lngOffset,
        technologies: [row.process], // Single process per row
        materials: [row.material_type], // Single material type per row
        website: row.website,
        type: 'service', // All are service providers
        services: Array.isArray(row.services_offered) ? row.services_offered : [],
        capabilities: Array.isArray(row.industries_served) ? row.industries_served : [],
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
    console.error('Print services map API error:', e)
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Unexpected error' 
    }, { status: 500 })
  }
}