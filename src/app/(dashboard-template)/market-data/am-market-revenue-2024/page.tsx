'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { 
  RevenueAnalysisLayout,
  GenericTableLayout
} from '@/components/market-data/MarketDataLayouts'

export default function AMMarketRevenue2024Page() {
  const [csvData, setCsvData] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'analysis' | 'table'>('analysis')

  const dataset = 'am-market-revenue-2024'
  const config = {
    name: 'AM Market Revenue 2024',
    description: 'Revenue data by country and segment for the additive manufacturing industry in 2024'
  }

  useEffect(() => {
    setLoading(true)
    setError(null)

    const loadData = async () => {
      try {
        const apiUrl = `/api/market-data/${dataset}`
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        setCsvData(data.data || [])
      } catch (err) {
        console.error('Error loading market data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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
            
            {/* Overview tab hidden per request */}
            
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
              <RevenueAnalysisLayout data={csvData} dataset={dataset} />
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
