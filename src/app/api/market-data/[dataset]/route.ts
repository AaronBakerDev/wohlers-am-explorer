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

    // Build query with proper pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = (page - 1) * limit
    
    const { data, error, count } = await supabase
      .from(config.table)
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Supabase error for table '${config.table}':`, error)
      return NextResponse.json(
        { error: `Failed to fetch ${config.name} data: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform to CSV format for compatibility
    const visibleColumns = config.columns.filter(col => col !== 'id' && col !== 'created_at')
    const csvData = data ? [
      config.displayColumns,
      ...data.map(row => 
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
      rowCount: data?.length || 0,
      totalRows: count || 0,
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
