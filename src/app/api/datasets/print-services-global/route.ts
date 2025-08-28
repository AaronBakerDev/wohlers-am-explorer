import { NextResponse } from 'next/server'
import fs from 'fs'
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

export async function GET() {
  try {
    // Read from local company data JSON
    const filePath = path.join(
      process.cwd(),
      'docs/project-documents/04-data/company-data/COMPANY___Print_services_global.json'
    )
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Data file not found`, filePath },
        { status: 404 }
      )
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Array<Record<string, any>>

    const rows = raw
      .filter((r) => r && r['Company name'])
      .map((r, idx) => ({
        id: String(idx + 1),
        company_name: String(r['Company name'] || '').trim(),
        segment: String(r['Segment'] || '').trim(),
        printer_manufacturer: String(r['Printer manufacturer'] || 'Unknown').trim(),
        printer_model: String(r['Printer model'] || 'Unknown Model').trim(),
        number_of_printers: Number(r['Number of printers'] || 1),
        count_type: normalizeCountType(r['Count type']),
        process: String(r['Process'] || 'Unknown Process').trim(),
        material_type: String(r['Material type'] || '').trim(),
        material_format: String(r['Material format'] || 'Unknown Format').trim(),
        country: normCountry(r['Country']),
        update_year: r['Update year'] ? Number(r['Update year']) : new Date().getFullYear(),
        website: r['Website'] || undefined,
        headquarters_city: r['Headquarters'] || r['City'] || undefined,
        founded_year: r['Founded'] ? Number(r['Founded']) : undefined,
        employee_count_range: r['Employee count'] || undefined,
        services_offered: Array.isArray(r['Services offered']) ? r['Services offered'] : undefined,
        industries_served: Array.isArray(r['Industries served']) ? r['Industries served'] : undefined,
        certifications: Array.isArray(r['Certifications']) ? r['Certifications'] : undefined,
      }))

    return NextResponse.json({ data: rows })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}

