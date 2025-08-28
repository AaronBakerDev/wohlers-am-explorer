import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsvMode, getDataRoot } from '@/lib/datasource/config'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result: { ok: boolean; checks: Record<string, { ok: boolean; data?: unknown; error?: string }> } = { ok: true, checks: {} }

  // Helper to safely run a check without failing the whole endpoint
  async function safe<T>(name: string, fn: () => Promise<T>) {
    try {
      const data = await fn()
      result.checks[name] = { ok: true, data }
    } catch (e: unknown) {
      result.ok = false
      result.checks[name] = { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  // CSV mode checks
  if (isCsvMode()) {
    await safe('files', async () => {
      const root = getDataRoot()
      const files = [
        'Total_AM_market_size.json',
        'AM_market_revenue_2024.json',
        'Print_services_Pricing_data.json',
      ]
      const present = files.map((f) => ({ file: f, exists: fs.existsSync(`${root}/${f}`) }))
      return { root, present }
    })

    await safe('market_totals', async () => {
      const root = getDataRoot()
      const raw = JSON.parse(fs.readFileSync(`${root}/Total_AM_market_size.json`, 'utf8'))
      const years = Array.from(new Set(raw.map((r: { Year: number }) => r.Year))).sort()
      const segments = Array.from(new Set(raw.map((r: { Segment: string }) => r.Segment))).sort()
      return { rows: raw.length, yearRange: { min: years[0], max: years[years.length - 1] }, segments }
    })

    await safe('market_by_country_segment', async () => {
      const root = getDataRoot()
      const raw = JSON.parse(fs.readFileSync(`${root}/AM_market_revenue_2024.json`, 'utf8'))
      const countries = Array.from(new Set(raw.map((r: { Country: string }) => r.Country))).sort()
      const segments = Array.from(new Set(raw.map((r: { Segment: string }) => r.Segment))).sort()
      return { rows: raw.length, latestYear: 2024, countries, segments }
    })

    await safe('pricing', async () => {
      const root = getDataRoot()
      const raw = JSON.parse(fs.readFileSync(`${root}/Print_services_Pricing_data.json`, 'utf8'))
      return { quotes: raw.length, benchmarks: null }
    })

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Supabase mode checks (defer client creation to avoid CSV-mode env requirements)
  const supabase = await createClient()

  await safe('companies', async () => {
    const { count: total } = await supabase.from('companies').select('*', { count: 'exact', head: true })
    const { count: geocoded } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    return { total: total ?? 0, geocoded: geocoded ?? 0 }
  })

  await safe('equipment', async () => {
    const { count } = await supabase.from('equipment').select('*', { count: 'exact', head: true })
    return { total: count ?? 0 }
  })

  await safe('company_summaries', async () => {
    const { count } = await supabase.from('company_summaries').select('*', { count: 'exact', head: true })
    return { total: count ?? 0 }
  })

  await safe('market_totals', async () => {
    const { data, error } = await supabase
      .from('market_totals')
      .select('year, segment, total_value')
      .order('year', { ascending: true })
      .limit(5000)
    if (error) throw error
    const years = Array.from(new Set((data || []).map((d: { year: number }) => d.year))).sort()
    const segments = Array.from(new Set((data || []).map((d: { segment: string }) => d.segment))).sort()
    return {
      rows: (data || []).length,
      yearRange: years.length ? { min: years[0], max: years[years.length - 1] } : { min: null, max: null },
      segments,
    }
  })

  await safe('market_by_country_segment', async () => {
    // Find latest year with data
    const { data: years, error: yearErr } = await supabase
      .from('market_by_country_segment')
      .select('year')
      .order('year', { ascending: false })
      .limit(1)
    if (yearErr) throw yearErr
    const latest = years?.[0]?.year
    if (!latest) return { rows: 0, latestYear: null }
    const { data, error } = await supabase
      .from('market_by_country_segment')
      .select('country, segment, value')
      .eq('year', latest)
      .limit(10000)
    if (error) throw error
    const countries = Array.from(new Set((data || []).map((d: { country: string }) => d.country))).sort()
    const segments = Array.from(new Set((data || []).map((d: { segment: string }) => d.segment))).sort()
    return { rows: (data || []).length, latestYear: latest, countries, segments }
  })

  await safe('pricing', async () => {
    const { count: quotes } = await supabase.from('service_pricing').select('*', { count: 'exact', head: true })
    // pricing_benchmarks may not exist if migrations skipped
    let benchmarks: number | null = null
    try {
      const { count } = await supabase.from('pricing_benchmarks').select('*', { count: 'exact', head: true })
      benchmarks = count ?? 0
    } catch {
      benchmarks = null
    }
    return { quotes: quotes ?? 0, benchmarks }
  })

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
