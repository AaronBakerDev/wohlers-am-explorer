import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Supabase mode: aggregate company_summaries by state/country
    const supabase = await createClient()
    const { data: rows, error } = await supabase
      .from('company_summaries')
      .select('state, country, id')
      .not('state', 'is', null)
    if (error) throw error
    const map = new Map<string, { state: string; country: string; company_count: number; total_machines: number }>()
    for (const r of rows || []) {
      const state = (r as { state: string; country: string; id: string }).state
      const country = (r as { state: string; country: string; id: string }).country
      const key = `${state}-${country}`
      const cur = map.get(key) || { state, country, company_count: 0, total_machines: 0 }
      cur.company_count += 1
      map.set(key, cur)
    }
    const data = Array.from(map.values())
    return NextResponse.json({ data })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 500 })
  }
}
