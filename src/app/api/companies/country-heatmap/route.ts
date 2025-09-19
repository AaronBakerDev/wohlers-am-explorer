import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Normalize common country aliases to improve grouping consistency
function normalizeCountry(input?: string | null): string | null {
  if (!input) return null
  const s = String(input).trim()
  if (!s) return null
  if (s.startsWith('The ')) return normalizeCountry(s.slice(4))
  
  // Check common aliases (case-insensitive)
  const lower = s.toLowerCase()
  if (["u.s.", "us", "usa", "united states of america", "united states"].includes(lower)) return "United States"
  if (["u.k.", "uk", "united kingdom", "united kingdom of great britain and northern ireland"].includes(lower)) return "United Kingdom"
  if (["bahamas, the"].includes(lower)) return "Bahamas"
  if (["gambia, the"].includes(lower)) return "Gambia"
  if (lower === "viet nam") return "Vietnam"
  if (lower === "czechia") return "Czech Republic"
  if (lower === "the netherlands") return "Netherlands"
  if (lower === "holland") return "Netherlands"
  if (lower === "syrian arab republic") return "Syria"
  if (lower === "iran, islamic republic of" || lower === "iran (islamic republic of)") return "Iran"
  if (lower === "turkiye") return "Turkey"
  if (lower === "democratic republic of the congo" || lower === "congo, democratic republic of the" || lower === "congo-kinshasa") return "Democratic Republic of the Congo"
  if (lower === "republic of the congo" || lower === "congo, republic of the" || lower === "congo-brazzaville") return "Congo"
  if (lower === "burma") return "Myanmar"
  if (lower === "ivory coast" || lower === "cote d'ivoire" || lower === "côte d’ivoire") return "Côte d'Ivoire"
  if (lower === "cape verde") return "Cabo Verde"
  if (lower === "east timor") return "Timor-Leste"
  if (lower === "micronesia, federated states of" || lower === "federated states of micronesia") return "Micronesia"
  if (lower === "holy see (vatican city state)" || lower === "vatican city") return "Vatican"
  if (lower === "swaziland") return "Eswatini"
  
  // Title case the rest for consistency
  return s
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

/**
 * GET /api/companies/country-heatmap
 * Aggregates companies by country for choropleth heatmap.
 * Optional query params:
 *  - type | companyType: 'equipment' | 'service' | 'material' | 'software'
 *  - role | companyRole: classification role
 *  - segment: one of unified segments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()

    // Parse optional filters
    const type = searchParams.get('type') || searchParams.get('companyType')
    const role = searchParams.get('role') || searchParams.get('companyRole')
    const segment = searchParams.get('segment')
    const countriesParam = searchParams.get('country')
    const technologiesParam = searchParams.get('technologies')
    const materialsParam = searchParams.get('materials')
    const countries = countriesParam ? countriesParam.split(',').map(s => s.trim()).filter(Boolean) : []
    const technologies = technologiesParam ? technologiesParam.split(',').map(s => s.trim()).filter(Boolean) : []
    const materials = materialsParam ? materialsParam.split(',').map(s => s.trim()).filter(Boolean) : []

    // Pull minimal fields in pages to avoid implicit 1000-row limit
    const buildQuery = () => {
      let q = supabase
        .from('company_summaries')
        .select('id, country, equipment_count')
      if (type) q = q.eq('company_type', type)
      if (role) q = q.eq('company_role', role)
      if (segment) q = q.eq('segment', segment)
      if (technologies.length) q = q.overlaps('technologies', technologies)
      if (materials.length) q = q.overlaps('materials', materials)
      if (countries.length) q = q.in('country', countries)
      return q
    }

    const PAGE = 1000
    let page = 0
    const data: Record<string, unknown>[] = []
    while (true) {
      const { data: chunk, error } = await buildQuery().range(page * PAGE, page * PAGE + PAGE - 1)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const arr = chunk || []
      data.push(...arr)
      if (arr.length < PAGE) break
      page += 1
    }

    // Aggregate by normalized country
    const map = new Map<string, { country: string; company_count: number; total_machines: number }>()
    for (const row of data || []) {
      const country = normalizeCountry((row as any).country)
      if (!country) continue
      const key = country
      const cur = map.get(key) || { country, company_count: 0, total_machines: 0 }
      cur.company_count += 1
      const eqCount = Number((row as any).equipment_count || 0)
      if (!Number.isNaN(eqCount)) cur.total_machines += eqCount
      map.set(key, cur)
    }

    const result = Array.from(map.values()).sort((a, b) => b.company_count - a.company_count)

    return NextResponse.json({ data: result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
