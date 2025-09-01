import { NextResponse, NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Minimal country normalizer for CSV mode
function normCountry(input?: string | null): string {
  const s = String(input || '').trim()
  if (!s) return s
  if (s.startsWith('The ')) return normCountry(s.slice(4))
  if (['U.S.', 'US', 'USA', 'United States of America'].includes(s)) return 'United States'
  if (['U.K.', 'UK'].includes(s)) return 'United Kingdom'
  if (s === 'Viet Nam') return 'Vietnam'
  if (s === 'Czechia') return 'Czech Republic'
  return s
}

function normalizeCountType(v?: string | null): 'Exact' | 'Estimated' | 'Range' | 'Minimum' {
  const s = String(v || '').trim().toLowerCase()
  if (s === 'actual' || s === 'exact') return 'Exact'
  if (s === 'minimum' || s === 'min') return 'Minimum'
  if (s === 'range') return 'Range'
  return 'Estimated'
}

// Country coordinates for map display (with some jitter to avoid overlapping)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'United States': [39.8283, -98.5795],
  'China': [35.8617, 104.1954],
  'Germany': [51.1657, 10.4515],
  'Japan': [36.2048, 138.2529],
  'United Kingdom': [55.3781, -3.4360],
  'France': [46.2276, 2.2137],
  'Italy': [41.8719, 12.5674],
  'Canada': [56.1304, -106.3468],
  'Spain': [40.4637, -3.7492],
  'Netherlands': [52.1326, 5.2913],
  'Australia': [-25.2744, 133.7751],
  'South Korea': [35.9078, 127.7669],
  'India': [28.6139, 77.2090],
  'Brazil': [-14.2350, -51.9253],
  'Mexico': [23.6345, -102.5528],
  'Sweden': [60.1282, 18.6435],
  'Switzerland': [46.8182, 8.2275],
  'Belgium': [50.5039, 4.4699],
  'Israel': [31.0461, 34.8516],
  'Austria': [47.5162, 14.5501],
  'Poland': [51.9194, 19.1451],
  'Denmark': [56.2639, 9.5018],
  'Singapore': [1.3521, 103.8198],
  'Taiwan': [23.6978, 120.9605],
  'Russia': [61.5240, 105.3188],
  'South Africa': [-30.5595, 22.9375],
  'Argentina': [-38.4161, -63.6167],
  'Colombia': [4.5709, -74.2973],
  'Czech Republic': [49.8175, 15.4730],
  'Finland': [61.9241, 25.7482],
  'Norway': [60.4720, 8.4689],
  'Portugal': [39.3999, -8.2245],
  'Greece': [39.0742, 21.8243],
  'Turkey': [38.9637, 35.2433],
  'Ireland': [53.4129, -8.2439],
  'Hungary': [47.1625, 19.5033],
  'Romania': [45.9432, 24.9668],
  'Chile': [-35.6751, -71.5430],
  'Peru': [-9.1900, -75.0152],
  'Egypt': [26.8206, 30.8025],
  'Thailand': [15.8700, 100.9925],
  'Vietnam': [14.0583, 108.2772],
  'Philippines': [12.8797, 121.7740],
  'Indonesia': [-0.7893, 113.9213],
  'Malaysia': [4.2105, 101.9758],
  'New Zealand': [-40.9006, 174.8860],
}

function getCoordinates(country: string | undefined): { lat: number; lng: number } | null {
  if (!country) return null
  const coords = COUNTRY_COORDS[country]
  if (!coords) return null
  
  // Add small random offset to prevent markers from overlapping
  const jitterLat = (Math.random() - 0.5) * 2
  const jitterLng = (Math.random() - 0.5) * 3
  
  return {
    lat: coords[0] + jitterLat,
    lng: coords[1] + jitterLng
  }
}

interface UnifiedCompany {
  id: string
  company_name: string
  segment: string
  country: string
  process?: string
  material_type?: string
  material_format?: string
  website?: string
  headquarters_city?: string
  founded_year?: number
  employee_count_range?: string
  annual_revenue_range?: string
  primary_market?: string
  // Print services specific fields
  printer_manufacturer?: string
  printer_model?: string
  number_of_printers?: number
  count_type?: string
  update_year?: number
  services_offered?: string[]
  industries_served?: string[]
  certifications?: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const segment = searchParams.get('segment')
    const country = searchParams.get('country')
    const materialType = searchParams.get('materialType')
    const processFilter = searchParams.get('process')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Load both datasets - use relative paths from project root
    const baseDir = path.join(process.cwd(), 'docs/project-documents/04-data/company-data')
    const systemsPath = path.join(baseDir, 'COMPANY___AM_systems_mfrs.json')
    const servicesPath = path.join(baseDir, 'COMPANY___Print_services_global.json')

    let allData: UnifiedCompany[] = []

    // Load Systems Manufacturers data if needed
    if (!segment || segment === 'System manufacturer') {
      try {
        await fs.access(systemsPath)
        const systemsRaw = JSON.parse(await fs.readFile(systemsPath, 'utf8')) as Array<Record<string, any>>
        const systemsData = systemsRaw
          .filter((r) => r && r['Company name'])
          .map((r, idx) => {
            const country = normCountry(r['Country'])
            const coords = getCoordinates(country)
            return {
              id: `sys_${idx + 1}`,
              company_name: String(r['Company name'] || '').trim(),
              segment: 'System manufacturer',
              process: String(r['Process'] || '').trim(),
              material_format: String(r['Material format'] || '').trim(),
              material_type: String(r['Material type'] || '').trim(),
              country: country,
              lat: coords?.lat,
              lng: coords?.lng,
              website: r['Website'] || undefined,
              headquarters_city: r['Headquarters'] || r['City'] || undefined,
              founded_year: r['Founded'] ? Number(r['Founded']) : undefined,
              employee_count_range: r['Employee count'] || undefined,
              annual_revenue_range: r['Revenue range'] || undefined,
              primary_market: r['Primary market'] || undefined,
            }
          })
        allData = [...allData, ...systemsData]
      } catch (e) {
        // File doesn't exist or can't be read
        console.warn('Systems manufacturers data not found:', systemsPath)
      }
    }

    // Load Print Services data if needed
    if (!segment || segment === 'Printing services') {
      try {
        await fs.access(servicesPath)
        const servicesRaw = JSON.parse(await fs.readFile(servicesPath, 'utf8')) as Array<Record<string, any>>
        const servicesData = servicesRaw
          .filter((r) => r && r['Company name'])
          .map((r, idx) => {
            const country = normCountry(r['Country'])
            const coords = getCoordinates(country)
            return {
              id: `svc_${idx + 1}`,
              company_name: String(r['Company name'] || '').trim(),
              segment: 'Printing services',
              printer_manufacturer: String(r['Printer manufacturer'] || 'Unknown').trim(),
              printer_model: String(r['Printer model'] || 'Unknown Model').trim(),
              number_of_printers: Number(r['Number of printers'] || 1),
              count_type: normalizeCountType(r['Count type']),
              process: String(r['Process'] || 'Unknown Process').trim(),
              material_type: String(r['Material type'] || '').trim(),
              material_format: String(r['Material format'] || 'Unknown Format').trim(),
              country: country,
              lat: coords?.lat,
              lng: coords?.lng,
              update_year: r['Update year'] ? Number(r['Update year']) : new Date().getFullYear(),
              website: r['Website'] || undefined,
              headquarters_city: r['Headquarters'] || r['City'] || undefined,
              founded_year: r['Founded'] ? Number(r['Founded']) : undefined,
              employee_count_range: r['Employee count'] || undefined,
              services_offered: Array.isArray(r['Services offered']) ? r['Services offered'] : undefined,
              industries_served: Array.isArray(r['Industries served']) ? r['Industries served'] : undefined,
              certifications: Array.isArray(r['Certifications']) ? r['Certifications'] : undefined,
            }
          })
        allData = [...allData, ...servicesData]
      } catch (e) {
        // File doesn't exist or can't be read
        console.warn('Print services data not found:', servicesPath)
      }
    }

    // Apply filters
    let filtered = allData

    if (country) {
      filtered = filtered.filter(c => c.country === country)
    }

    if (materialType) {
      filtered = filtered.filter(c => c.material_type === materialType)
    }

    if (processFilter) {
      filtered = filtered.filter(c => c.process === processFilter)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c => 
        c.company_name.toLowerCase().includes(searchLower) ||
        c.country?.toLowerCase().includes(searchLower) ||
        c.material_type?.toLowerCase().includes(searchLower) ||
        c.process?.toLowerCase().includes(searchLower)
      )
    }

    // Calculate aggregations
    const aggregations = {
      byCountry: filtered.reduce((acc, c) => {
        if (c.country) {
          acc[c.country] = (acc[c.country] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      bySegment: filtered.reduce((acc, c) => {
        acc[c.segment] = (acc[c.segment] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byMaterialType: filtered.reduce((acc, c) => {
        if (c.material_type) {
          acc[c.material_type] = (acc[c.material_type] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      byProcess: filtered.reduce((acc, c) => {
        if (c.process) {
          acc[c.process] = (acc[c.process] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
    }

    // Apply pagination
    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({ 
      data: paginated,
      total,
      filtered: filtered.length,
      aggregations,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}