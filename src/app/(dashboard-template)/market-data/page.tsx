'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Database, RefreshCw } from 'lucide-react'
import { 
  RevenueAnalysisLayout,
  InvestmentAnalysisLayout, 
  MergerAcquisitionLayout,
  PricingAnalysisLayout,
  CompanyDirectoryLayout,
  GenericTableLayout,
  TotalMarketSizeLayout
} from '@/components/market-data/MarketDataLayouts'
import { LEGACY_DATASET_CONFIGS as DATASET_CONFIGS } from '@/lib/config/datasets'

// Replaced inline configs with shared DATASET_CONFIGS

export default function MarketDataPage() {
  const searchParams = useSearchParams()
  const dataset = searchParams.get('dataset')
  const view = (searchParams.get('view') || 'analysis').toLowerCase() as 'analysis' | 'table'
  
  const [csvData, setCsvData] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalRows, setTotalRows] = useState(0)
  const [pagination, setPagination] = useState<any>(null)

  const config = dataset ? DATASET_CONFIGS[dataset as keyof typeof DATASET_CONFIGS] : null

  // Using Supabase-only vendor data; no toggle needed

  const renderSchemaBasedLayout = () => {
    if (!dataset || !csvData.length) return null

    switch (dataset) {
      case 'am-market-revenue-2024':
      case 'revenue-by-industry-2024':
        return <RevenueAnalysisLayout data={csvData} dataset={dataset} />
      
      case 'fundings-investments':
        return <InvestmentAnalysisLayout data={csvData} dataset={dataset} />
      
      case 'mergers-acquisitions':
        return <MergerAcquisitionLayout data={csvData} dataset={dataset} />
      
      case 'print-services-pricing':
        return <PricingAnalysisLayout data={csvData} dataset={dataset} />
      
      case 'company-information':
      case 'company-roles':
      case 'directory':
        return <CompanyDirectoryLayout data={csvData} dataset={dataset} />
      
      case 'total-am-market-size':
        return <TotalMarketSizeLayout />
      default:
        return <GenericTableLayout data={csvData} dataset={dataset} />
    }
  }

  // No data source init required (Supabase-only)

  useEffect(() => {
    if (!config || !dataset) return

    setLoading(true)
    setError(null)

    const loadData = async () => {
      try {
        // Supabase-only vendor data
        const apiUrl = `/api/market-data/${dataset}`
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        setCsvData(data.data || [])
        setTotalRows(data.totalRows || data.rowCount || 0)
        setPagination(data.pagination || null)
      } catch (err) {
        console.error('Error loading market data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dataset, config])

  if (!dataset || !config) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No dataset selected. Please select a dataset from the sidebar.
            </p>
            <div className="mt-4 text-center">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-6 bg-card">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{config.name}</h1>
            <p className="text-muted-foreground mb-4">{config.description}</p>
            {/* Sub-tabs: URL-driven view selector */}
            <div className="flex items-center gap-2">
              {(['analysis'] as const).map(v => {
                const params = new URLSearchParams()
                params.set('dataset', dataset)
                params.set('view', v)
                const href = `/market-data?${params.toString()}`
                const isActive = view === v
                return (
                  <Link
                    key={v}
                    href={href}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      isActive
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    {v === 'analysis' ? 'Overview' : 'Table'}
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary">
                {loading ? 'Loading...' : 
                 totalRows > 0 ? `${totalRows.toLocaleString()} total rows` : 
                 csvData.length > 1 ? `${csvData.length - 1} rows` : 'No data'}
              </Badge>
              <Badge variant="default">
                <Database className="h-3 w-3 mr-1" />
                Live Database
              </Badge>
              <Badge variant="outline">Interactive Analysis</Badge>
              {pagination && (
                <Badge variant="secondary">
                  Page {pagination.page} of {pagination.pages}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="ghost" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {loading && (
          <div className="h-32 flex items-center justify-center">
            <div className="text-muted-foreground">Loading data...</div>
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && csvData.length > 0 && (
          <div>
            {view === 'table' ? (
              <GenericTableLayout data={csvData} dataset={dataset} />
            ) : (
              renderSchemaBasedLayout()
            )}
          </div>
        )}

        {!loading && !error && csvData.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No data available for this dataset.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
