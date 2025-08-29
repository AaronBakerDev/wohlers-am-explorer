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
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || ''
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    // Validate dataset
    if (!dataset || !(dataset in LEGACY_DATASET_CONFIGS)) {
      return NextResponse.json(
        { error: 'Invalid dataset specified' },
        { status: 400 }
      )
    }

    const config = LEGACY_DATASET_CONFIGS[dataset as keyof typeof LEGACY_DATASET_CONFIGS]
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from(config.table)
      .select('*')

    // Apply search filter if provided
    if (search) {
      // Search across all text columns
      const textColumns = config.columns.filter(col => 
        !col.includes('_usd') && !col.includes('year') && !col.includes('amount') && !col.includes('cost') && !col.includes('time') && !col.includes('date')
      )
      
      if (textColumns.length > 0) {
        const searchConditions = textColumns.map(col => `${col}.ilike.%${search}%`).join(',')
        query = query.or(searchConditions)
      }
    }

    // Apply sorting if specified
    if (sortBy && config.columns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    } else if (config.columns.includes('company_name')) {
      // Default sort by company name if available
      query = query.order('company_name', { ascending: true })
    } else if (config.columns.includes('created_at')) {
      // Otherwise sort by created_at
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error(`Supabase error for table '${config.table}':`, {
        error,
        dataset,
        table: config.table,
        message: error.message,
        code: error.code
      })
      
      // Better error messages for common issues
      if (error.code === '42P01') {
        return NextResponse.json(
          { 
            error: `Table '${config.table}' does not exist`,
            dataset,
            suggestion: 'Please check if the database migrations have been run'
          },
          { status: 404 }
        )
      }
      
      if (error.code === 'PGRST301') {
        return NextResponse.json(
          { 
            error: `No data access for table '${config.table}'`,
            dataset,
            suggestion: 'Please check RLS policies or authentication'
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: `Failed to fetch data: ${error.message}`,
          dataset,
          table: config.table
        },
        { status: 500 }
      )
    }

    // Get total count for pagination (separate query for accuracy)
    let totalQuery = supabase
      .from(config.table)
      .select('*', { count: 'exact', head: true })

    if (search) {
      const textColumns = config.columns.filter(col => 
        !col.includes('_usd') && !col.includes('year') && !col.includes('amount') && !col.includes('cost') && !col.includes('time') && !col.includes('date')
      )
      
      if (textColumns.length > 0) {
        const searchConditions = textColumns.map(col => `${col}.ilike.%${search}%`).join(',')
        totalQuery = totalQuery.or(searchConditions)
      }
    }

    const { count: totalCount } = await totalQuery

    // Transform data to CSV-like format for compatibility with existing UI
    // Filter out id and created_at columns but preserve order for other columns
    const visibleColumns = config.columns.filter(col => col !== 'id' && col !== 'created_at')
    
    const csvData = data ? [
      config.displayColumns, // Header row (already excludes id and created_at)
      ...data.map(row => 
        visibleColumns.map(col => {
          const value = row[col]
          // Format numbers and dates appropriately
          if (value === null || value === undefined) return ''
          if (typeof value === 'number') {
            // Format large numbers with commas
            if (col.includes('_usd') || col.includes('revenue')) {
              return value.toLocaleString()
            }
            return value.toString()
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
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      },
      filters: {
        search,
        sortBy,
        sortOrder
      },
      rowCount: data?.length || 0,
      totalRows: totalCount || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error loading vendor data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
