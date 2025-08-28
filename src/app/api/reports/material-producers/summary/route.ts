import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Pull from the view created in 007_wohlers_reports_schema.sql
    const { data, error } = await supabase
      .from('material_producers_summary' as any)
      .select('material_type, company_count, percentage')

    if (error) {
      console.error('Error fetching material_producers_summary:', error)
      return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
    }

    // Normalize and sort by Metal, Non-Metal, Both for a consistent display order
    const order = { Metal: 0, 'Non-Metal': 1, Both: 2 } as Record<string, number>
    const summary = (data || []).sort((a: any, b: any) => (order[a.material_type] ?? 99) - (order[b.material_type] ?? 99))

    // Provide chart-friendly shapes also
    const barData = summary.map((r: any) => ({ type: r.material_type, count: r.company_count }))
    const pieData = summary.map((r: any) => ({ name: r.material_type, value: r.company_count, percentage: r.percentage }))

    return NextResponse.json({ summary, barData, pieData })
  } catch (err) {
    console.error('Unhandled error (summary):', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

