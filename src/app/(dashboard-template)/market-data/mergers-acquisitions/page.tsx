'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Database, RefreshCw } from 'lucide-react'
import { 
  MergerAcquisitionLayout,
  GenericTableLayout
} from '@/components/market-data/MarketDataLayouts'

export default function MergersAcquisitionsPage() {
  const [csvData, setCsvData] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalRows, setTotalRows] = useState(0)
  const [view, setView] = useState<'analysis' | 'table'>('analysis')

  const dataset = 'mergers-acquisitions'
  const config = {
    name: 'Mergers & Acquisitions',
    description: 'M&A transactions in the additive manufacturing industry'
  }

  useEffect(() => {
    setLoading(true)
    setError(null)

    const loadData = async () => {
      try {
        const apiUrl = `/api/market-data/${dataset}`
        console.log('Fetching from:', apiUrl)
        const response = await fetch(apiUrl)
        
        console.log('Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (parseErr) {
            console.warn('Could not parse error response:', parseErr)
            const responseText = await response.text().catch(() => 'Unknown error')
            errorMessage = responseText || errorMessage
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log('Data loaded successfully:', data.totalRows, 'rows')
        setCsvData(data.data || [])
        setTotalRows(data.totalRows || data.rowCount || 0)
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
              <MergerAcquisitionLayout data={csvData} dataset={dataset} />
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
