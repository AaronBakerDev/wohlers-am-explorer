import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface GlobalCompanyMapItem {
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
  totalMachines: number
  uniqueProcesses: number
  uniqueMaterials: number
  uniqueManufacturers: number
}

// Approximate coordinates for major countries (for companies without specific coordinates)
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
  'Ireland': [53.4129, -8.2439],
  'Portugal': [39.3999, -8.2245],
  'Greece': [39.0742, 21.8243],
  'Turkey': [38.9637, 35.2433],
  'Slovenia': [46.1512, 14.9955],
  'Hungary': [47.1625, 19.5033],
  'Romania': [45.9432, 24.9668],
  'Slovakia': [48.6690, 19.6990],
  'Estonia': [58.5953, 25.0136],
  'Latvia': [56.8796, 24.6032],
  'Lithuania': [55.1694, 23.8813],
}

// Sample data fallback function
function getSampleGlobalCompaniesData() {
  return [
    {
      id: 'global-1',
      name: 'Stratasys',
      city: 'Eden Prairie',
      state: 'Minnesota',
      country: 'United States',
      website: 'https://stratasys.com',
      company_type: 'equipment',
      technologies: ['FDM', 'PolyJet'],
      materials: ['Thermoplastic', 'Photopolymer'],
    },
    {
      id: 'global-2',
      name: 'EOS GmbH',
      city: 'Krailling',
      state: null,
      country: 'Germany',
      website: 'https://eos.info',
      company_type: 'equipment',
      technologies: ['DMLS', 'SLS'],
      materials: ['Metal', 'Thermoplastic'],
    },
    {
      id: 'global-3',
      name: '3D Systems',
      city: 'Rock Hill',
      state: 'South Carolina',
      country: 'United States',
      website: 'https://3dsystems.com',
      company_type: 'equipment',
      technologies: ['SLA', 'DMLS', 'SLS'],
      materials: ['Photopolymer', 'Metal', 'Thermoplastic'],
    },
    {
      id: 'global-4',
      name: 'Formlabs',
      city: 'Somerville',
      state: 'Massachusetts',
      country: 'United States',
      website: 'https://formlabs.com',
      company_type: 'equipment',
      technologies: ['SLA'],
      materials: ['Photopolymer'],
    },
    {
      id: 'global-5',
      name: 'Ultimaker',
      city: 'Utrecht',
      state: null,
      country: 'Netherlands',
      website: 'https://ultimaker.com',
      company_type: 'equipment',
      technologies: ['FDM'],
      materials: ['Thermoplastic'],
    },
    {
      id: 'global-6',
      name: 'Protolabs',
      city: 'Maple Plain',
      state: 'Minnesota',
      country: 'United States',
      website: 'https://protolabs.com',
      company_type: 'service',
      technologies: ['FDM', 'SLA', 'SLS'],
      materials: ['Thermoplastic', 'Photopolymer'],
    },
    {
      id: 'global-7',
      name: 'Materialise',
      city: 'Leuven',
      state: null,
      country: 'Belgium',
      website: 'https://materialise.com',
      company_type: 'service',
      technologies: ['SLA', 'SLS', 'DMLS'],
      materials: ['Photopolymer', 'Thermoplastic', 'Metal'],
    },
    {
      id: 'global-8',
      name: 'Autodesk',
      city: 'San Rafael',
      state: 'California',
      country: 'United States',
      website: 'https://autodesk.com',
      company_type: 'software',
      technologies: ['CAD', 'Simulation'],
      materials: [],
    },
    {
      id: 'global-9',
      name: 'DSM',
      city: 'Heerlen',
      state: null,
      country: 'Netherlands',
      website: 'https://dsm.com',
      company_type: 'material',
      technologies: ['SLA', 'FDM'],
      materials: ['Photopolymer', 'Thermoplastic'],
    },
    {
      id: 'global-10',
      name: 'BASF',
      city: 'Ludwigshafen',
      state: null,
      country: 'Germany',
      website: 'https://basf.com',
      company_type: 'material',
      technologies: ['SLS', 'FDM'],
      materials: ['Thermoplastic'],
    },
    {
      id: 'global-11',
      name: 'Raise3D',
      city: 'Shanghai',
      state: null,
      country: 'China',
      website: 'https://raise3d.com',
      company_type: 'equipment',
      technologies: ['FDM'],
      materials: ['Thermoplastic'],
    },
    {
      id: 'global-12',
      name: 'FlashForge',
      city: 'Jinhua',
      state: null,
      country: 'China',
      website: 'https://flashforge.com',
      company_type: 'equipment',
      technologies: ['FDM'],
      materials: ['Thermoplastic'],
    }
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(2000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10)))

    const supabase = await createClient()
    
    // Try to fetch global companies data, fallback to sample data if table doesn't exist
    let rows: any[] = []
    const { data, error } = await supabase
      .from('company_summaries')
      .select(`
        id,
        name,
        city,
        state,
        country,
        latitude,
        longitude,
        website,
        company_type,
        processes,
        materials
      `)
      .limit(limit)
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, use sample data
      console.log('Company summaries table does not exist, using sample data')
      rows = getSampleGlobalCompaniesData()
    } else if (error) {
      throw error
    } else {
      rows = data || []
    }

    // Transform data into map marker format
    const items: GlobalCompanyMapItem[] = (rows || []).map((row) => {
      let lat = row.latitude
      let lng = row.longitude
      
      // If no coordinates, use country coordinates with random offset
      if (!lat || !lng) {
        const countryCoords = COUNTRY_COORDINATES[row.country] || [0, 0]
        const latOffset = (Math.random() - 0.5) * 2 // +/- 1 degree
        const lngOffset = (Math.random() - 0.5) * 4 // +/- 2 degrees
        lat = countryCoords[0] + latOffset
        lng = countryCoords[1] + lngOffset
      }
      
      return {
        id: row.id,
        name: row.name,
        city: row.city,
        state: row.state,
        country: row.country,
        lat: lat,
        lng: lng,
        technologies: Array.isArray(row.processes) ? row.processes : [],
        materials: Array.isArray(row.materials) ? row.materials : [],
        website: row.website,
        type: row.company_type,
        totalMachines: 0, // Not available in this context
        uniqueProcesses: Array.isArray(row.processes) ? row.processes.length : 0,
        uniqueMaterials: Array.isArray(row.materials) ? row.materials.length : 0,
        uniqueManufacturers: 0, // Not applicable for this view
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
    console.error('Global companies map API error:', e)
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Unexpected error' 
    }, { status: 500 })
  }
}