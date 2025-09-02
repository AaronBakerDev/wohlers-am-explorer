import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LEGACY_DATASET_CONFIGS } from '@/lib/config/datasets'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dataset: string }> }
) {
  try {
    const { dataset } = await params
    const { searchParams } = new URL(request.url)
    
    // Validate dataset
    if (!dataset || !(dataset in LEGACY_DATASET_CONFIGS)) {
      return NextResponse.json(
        { error: `Dataset '${dataset}' not found` },
        { status: 404 }
      )
    }

    const config = LEGACY_DATASET_CONFIGS[dataset as keyof typeof LEGACY_DATASET_CONFIGS]
    const supabase = await createClient()

    // Pagination controls. If `all=true` or `limit=all`, fetch the entire dataset in batches.
    const all = searchParams.get('all') === 'true' || searchParams.get('limit') === 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = all ? 0 : parseInt(searchParams.get('limit') || '1000')
    const batchSize = parseInt(searchParams.get('batch') || '1000')

    let rows: any[] = []
    let count = 0
    let error: any = null

    if (all) {
      // First request to get total count without a range
      const first = await supabase
        .from(config.table)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, batchSize - 1)
      if (first.error) {
        error = first.error
      } else {
        rows = first.data || []
        count = first.count || rows.length
        // Fetch additional pages if needed
        for (let start = rows.length; start < (count || 0); start += batchSize) {
          const { data: more, error: moreErr } = await supabase
            .from(config.table)
            .select('*')
            .order('created_at', { ascending: false })
            .range(start, Math.min(start + batchSize - 1, (count || 0) - 1))
          if (moreErr) { error = moreErr; break }
          if (more && more.length) rows = rows.concat(more)
          else break
        }
      }
    } else {
      const offset = (page - 1) * limit
      const res = await supabase
        .from(config.table)
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })
      rows = res.data || []
      error = res.error
      count = res.count || rows.length
    }

    if (error) {
      console.error(`Supabase error for table '${config.table}':`, error)
      return NextResponse.json(
        { error: `Failed to fetch ${config.name} data: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform to CSV format for compatibility
    const visibleColumns = config.columns.filter(col => col !== 'id' && col !== 'created_at')
    const csvData = rows && rows.length ? [
      config.displayColumns,
      ...rows.map(row => 
        visibleColumns.map(col => {
          const value = row[col]
          if (value === null || value === undefined) return ''
          if (typeof value === 'number' && (col.includes('_usd') || col.includes('revenue'))) {
            return value.toLocaleString()
          }
          return value.toString()
        })
      )
    ] : []

    return NextResponse.json({
      dataset,
      config: {
        name: config.name,
        description: config.description,
        table: config.table,
        columns: config.columns,
        displayColumns: config.displayColumns
      },
      data: csvData,
      rowCount: rows?.length || 0,
      totalRows: count || (rows?.length || 0),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error loading market data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
