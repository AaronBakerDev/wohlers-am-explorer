import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: typesRows } = await supabase
      .from('companies')
      .select('company_type')
      .not('company_type', 'is', null)
      .limit(10000)
    const { data: countryRows } = await supabase
      .from('companies')
      .select('country')
      .not('country', 'is', null)
      .limit(10000)
    const uniq = <T,>(arr: T[]) => Array.from(new Set(arr))
    const types = uniq((typesRows || []).map((r: { company_type: string }) => r.company_type).filter(Boolean)).sort()
    const countries = uniq((countryRows || []).map((r: { country: string }) => r.country).filter(Boolean)).sort()
    return NextResponse.json({ types, countries })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 500 })
  }
}
