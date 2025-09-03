import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeCountry(input?: string | null): string | null {
  if (!input) return null
  const s = String(input).trim()
  if (!s) return null
  if (s.startsWith('The ')) return normalizeCountry(s.slice(4))
  const lower = s.toLowerCase()
  if (["u.s.", "us", "usa", "united states of america", "united states"].includes(lower)) return "United States"
  if (["u.k.", "uk", "united kingdom", "united kingdom of great britain and northern ireland"].includes(lower)) return "United Kingdom"
  if (lower === 'viet nam') return 'Vietnam'
  if (lower === 'czechia') return 'Czech Republic'
  if (lower === 'the netherlands' || lower === 'holland') return 'Netherlands'
  return s
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const segment = searchParams.get('segment')
    if (!segment) {
      return NextResponse.json({ error: 'segment is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const countriesParam = searchParams.get('country')
    const processParam = searchParams.get('process')
    const matTypeParam = searchParams.get('material_type')
    const matFormatParam = searchParams.get('material_format')
    const printerManufacturerParam = searchParams.get('printer_manufacturer')
    const printerModelParam = searchParams.get('printer_model')

    const countries = countriesParam ? countriesParam.split(',').map(s => s.trim()).filter(Boolean) : []
    const processes = processParam ? processParam.split(',').map(s => s.trim()).filter(Boolean) : []
    const materialTypes = matTypeParam ? matTypeParam.split(',').map(s => s.trim()).filter(Boolean) : []
    const materialFormats = matFormatParam ? matFormatParam.split(',').map(s => s.trim()).filter(Boolean) : []
    const printerManufacturers = printerManufacturerParam ? printerManufacturerParam.split(',').map(s => s.trim()).filter(Boolean) : []
    const printerModels = printerModelParam ? printerModelParam.split(',').map(s => s.trim()).filter(Boolean) : []

    const buildQuery = () => {
      let q = supabase
        .from('vendor_companies_merged')
        .select('country, number_of_printers, process, material_type, material_format, printer_manufacturer, printer_model')
        .eq('segment', segment)

      if (countries.length) q = q.in('country', countries)
      if (processes.length) q = q.in('process', processes)
      if (materialTypes.length) q = q.in('material_type', materialTypes)
      if (materialFormats.length) q = q.in('material_format', materialFormats)
      if (printerManufacturers.length) q = q.in('printer_manufacturer', printerManufacturers)
      if (printerModels.length) q = q.in('printer_model', printerModels)
      return q
    }

    // Page through all rows to avoid implicit 1000-row limit
    const PAGE = 1000
    let page = 0
    let data: any[] = []
    while (true) {
      const { data: chunk, error } = await buildQuery().range(page * PAGE, page * PAGE + PAGE - 1)
      if (error) {
        // capture and handle below
        if (data.length === 0) {
          // fall through to error handler when nothing collected
          (error as any).code = (error as any).code || 'UNKNOWN'
          // Assign to variable to drive fallback
          var firstError: any = error
        }
        break
      }
      const arr = chunk || []
      data.push(...arr)
      if (arr.length < PAGE) break
      page += 1
    }

    if (typeof firstError !== 'undefined') {
      // Fallback to legacy vendor tables in dev if merged view is missing
      if (['42P01', '42703'].includes(firstError.code as string)) {
        const fallback = segment === 'System manufacturer' ? 'vendor_am_systems_manufacturers' : 'vendor_print_services_global'
        // Page the fallback too
        const buildFb = () => supabase
          .from(fallback)
          .select('country, number_of_printers, process, material_type, material_format, printer_manufacturer, printer_model')
        let p = 0
        data = []
        while (true) {
          const { data: chunk } = await buildFb().range(p * PAGE, p * PAGE + PAGE - 1)
          const arr = chunk || []
          data.push(...arr)
          if (arr.length < PAGE) break
          p += 1
        }
      } else {
        console.warn('vendor/country-heatmap query error:', firstError)
        return NextResponse.json({ data: [] })
      }
    }

    const map = new Map<string, { country: string; company_count: number; total_machines: number }>()
    for (const row of data || []) {
      const country = normalizeCountry((row as any).country)
      if (!country) continue
      const key = country
      const cur = map.get(key) || { country, company_count: 0, total_machines: 0 }
      cur.company_count += 1
      const printers = Number((row as any).number_of_printers || 0)
      if (!Number.isNaN(printers)) cur.total_machines += printers
      map.set(key, cur)
    }

    const result = Array.from(map.values()).sort((a, b) => b.company_count - a.company_count)
    return NextResponse.json({ data: result })
  } catch (e: any) {
    console.warn('vendor/country-heatmap unexpected error:', e)
    return NextResponse.json({ data: [] })
  }
}
