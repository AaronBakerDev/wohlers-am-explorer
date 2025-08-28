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

export async function GET() {
  try {
    // Read from local extracted vendor data JSON
    const filePath = path.join(
      process.cwd(),
      'docs/project-documents/04-data/extracted-vendor-data/COMPANY___AM_systems_mfrs.json'
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
        process: String(r['Process'] || '').trim(),
        material_format: String(r['Material format'] || '').trim(),
        material_type: String(r['Material type'] || '').trim(),
        country: normCountry(r['Country']),
        website: r['Website'] || undefined,
        headquarters_city: r['Headquarters'] || r['City'] || undefined,
        founded_year: r['Founded'] ? Number(r['Founded']) : undefined,
        employee_count_range: r['Employee count'] || undefined,
        annual_revenue_range: r['Revenue range'] || undefined,
        primary_market: r['Primary market'] || undefined,
      }))

    return NextResponse.json({ data: rows })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}

