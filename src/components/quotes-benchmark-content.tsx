"use client"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Download, TrendingUp, DollarSign, Clock, MapPin, Package, Factory } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface PricingData {
  id: string
  company: string
  country: string
  segment: string
  printerManufacturer: string
  printerModel: string
  numberOfPrinters: number
  countType: string
  process: string
  materialType: string
  materialFormat: string
  updateYear: number | null
  additionalInfo: string | null
}

interface Statistics { printers: { min: number; max: number; avg: number; median: number; count: number; total: number }, updateYear: { min: number; max: number; latest: number; count: number } }

export default function QuotesBenchmarkContent() {
  const [pricingData, setPricingData] = useState<PricingData[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [filters, setFilters] = useState<{ processes: string[]; materials: string[]; segments: string[]; countries: string[]; manufacturers: string[] }>({ processes: [], materials: [], segments: [], countries: [], manufacturers: [] })
  const [totalQuotes, setTotalQuotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const showDebug = process.env.NEXT_PUBLIC_DEBUG_BENCHMARK === 'true'

  const [selectedProcess, setSelectedProcess] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState('all')
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [selectedManufacturer, setSelectedManufacturer] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'scatter' | 'comparison'>('table')
  const scatterChartRef = useRef<HTMLDivElement | null>(null)
  const comparisonChartRef = useRef<HTMLDivElement | null>(null)

  // Fetch total count on mount
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const response = await fetch('/api/quotes/count')
        if (response.ok) {
          const data = await response.json()
          setTotalQuotes(data.totalQuotes || 0)
        }
      } catch (error) {
        console.error('Error fetching total count:', error)
      }
    }
    fetchTotalCount()
  }, [])

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (selectedProcess !== 'all') params.append('process', selectedProcess)
        if (selectedMaterial !== 'all') params.append('material', selectedMaterial)
        if (selectedSegment !== 'all') params.append('segment', selectedSegment)
        if (selectedManufacturer !== 'all') params.append('manufacturer', selectedManufacturer)
        if (selectedCountry !== 'all') params.append('country', selectedCountry)
        const response = await fetch(`/api/quotes/benchmarks?${params}`)
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          setPricingData([])
          setStatistics(null)
          setFilters({ processes: [], materials: [], quantities: [], countries: [] })
          setError(err?.error || `Failed to load pricing benchmarks (${response.status})`)
          return
        }
        const data = await response.json()
        setPricingData(data.data || [])
        setStatistics(data.statistics || null)
        setFilters(data.filters || { processes: [], materials: [], quantities: [], countries: [] })
      } catch (error) {
        console.error('Error fetching pricing data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load pricing data')
      } finally {
        setLoading(false)
      }
    }
    fetchPricingData()
  }, [selectedProcess, selectedMaterial, selectedSegment, selectedCountry, selectedManufacturer])

  const scatterData = pricingData.map(item => ({ x: item.updateYear || 2024, y: item.numberOfPrinters || 0, company: item.company, process: item.process, manufacturer: item.printerManufacturer }))
  const comparisonData = filters.segments.map(segment => {
    const segmentData = pricingData.filter(item => item.segment === segment)
    const printers = segmentData.map(item => item.numberOfPrinters || 0)
    return { segment, min: Math.min(...printers), avg: printers.length > 0 ? printers.reduce((a, b) => a + b, 0) / printers.length : 0, max: Math.max(...printers), total: printers.reduce((a, b) => a + b, 0), count: segmentData.length }
  }).filter(item => item.count > 0)

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = { quotes: pricingData, statistics, filters: { process: selectedProcess, material: selectedMaterial, quantity: selectedQuantity, country: selectedCountry }, metadata: { exportDate: new Date().toISOString(), totalQuotes: pricingData.length } }
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quotes-benchmark-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } else {
      const csvRows = ['Company,Country,Segment,Manufacturer,Model,Number of Printers,Count Type,Process,Material Type,Material Format,Update Year']
      pricingData.forEach(item => { csvRows.push(`"${item.company}","${item.country}","${item.segment || ''}","${item.printerManufacturer || ''}","${item.printerModel || ''}",${item.numberOfPrinters || 0},"${item.countType || ''}","${item.process || ''}","${item.materialType || ''}","${item.materialFormat || ''}",${item.updateYear || ''}`) })
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quotes-benchmark-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Equipment & Services Directory</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData('csv')} className="h-7 text-xs"><Download className="h-3 w-3 mr-2" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportData('json')} className="h-7 text-xs"><Download className="h-3 w-3 mr-2" /> JSON</Button>
        </div>
      </div>

      {!loading && pricingData.length === 0 && (
        <div className="mb-4 p-3 border border-dashed border-border rounded bg-muted/30 text-xs text-muted-foreground">No pricing quotes found. Optionally seed demo data via sql-migrations/006_seed_market_demo_data.sql.</div>
      )}
      {showDebug && !loading && (error || pricingData.length === 0) && (
        <div className="mb-4 p-3 rounded border border-amber-300 bg-amber-50 text-amber-900 text-xs">
          <div className="font-medium mb-1">Debug: Quotes Benchmark data unavailable</div>
          <div>Ensure migrations are applied: 005_create_market_views.sql. View: pricing_benchmarks; table: service_pricing.</div>
          {error && <div className="mt-1">API error: {error}</div>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Companies</CardTitle></CardHeader><CardContent><div className="flex items-baseline gap-2"><Package className="h-3 w-3 text-muted-foreground" />{loading ? (<Skeleton className="h-6 w-12" />) : (<><span className="text-lg font-semibold">{statistics?.printers.count || 0}</span></>)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Printers</CardTitle></CardHeader><CardContent><div className="flex items-baseline gap-2"><Factory className="h-3 w-3 text-green-500" />{loading ? (<Skeleton className="h-6 w-16" />) : (<span className="text-lg font-semibold text-green-500">{statistics?.printers.total || 0}</span>)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Printer Range</CardTitle></CardHeader><CardContent><div className="flex items-baseline gap-1"><TrendingUp className="h-3 w-3 text-blue-500" />{loading ? (<Skeleton className="h-6 w-24" />) : (<span className="text-xs font-semibold">{statistics?.printers.min || 0} - {statistics?.printers.max || 0}</span>)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Printers</CardTitle></CardHeader><CardContent><div className="flex items-baseline gap-2"><Factory className="h-3 w-3 text-purple-500" />{loading ? (<Skeleton className="h-6 w-16" />) : (<span className="text-lg font-semibold text-purple-500">{statistics?.printers.avg.toFixed(1) || 0}</span>)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Latest Update</CardTitle></CardHeader><CardContent><div className="flex items-baseline gap-2"><Clock className="h-3 w-3 text-orange-500" />{loading ? (<Skeleton className="h-6 w-12" />) : (<span className="text-lg font-semibold text-orange-500">{statistics?.updateYear.latest || 'N/A'}</span>)}</div></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={selectedProcess} onValueChange={setSelectedProcess}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Process" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all"><div className="flex items-center gap-2"><Factory className="h-3 w-3" /> All Processes</div></SelectItem>
            {filters.processes.map(process => (<SelectItem key={process} value={process}>{process}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Material" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {filters.materials.map(material => (<SelectItem key={material} value={material}>{material}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={selectedSegment} onValueChange={setSelectedSegment}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            {filters.segments.map(segment => (<SelectItem key={segment} value={segment}>{segment}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Manufacturer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all"><div className="flex items-center gap-2"><Factory className="h-3 w-3" /> All Manufacturers</div></SelectItem>
            {filters.manufacturers.map(mfr => (<SelectItem key={mfr} value={mfr}>{mfr}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all"><div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> All Countries</div></SelectItem>
            {filters.countries.map(country => (<SelectItem key={country} value={country}>{country}</SelectItem>))}
          </SelectContent>
        </Select>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="table" className="hidden">Table</TabsTrigger>
            <TabsTrigger value="scatter">Scatter</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment & Services Overview</CardTitle>
            <CardDescription>Printer inventory and capabilities by company</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[360px] w-full" />
            ) : pricingData.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No pricing data to display.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Printers</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingData.slice(0, 20).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.company}</TableCell>
                        <TableCell><Badge variant="outline">{item.segment || 'N/A'}</Badge></TableCell>
                        <TableCell className="text-sm">{item.printerManufacturer || '—'}</TableCell>
                        <TableCell className="text-sm">{item.printerModel || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-semibold">{item.numberOfPrinters || 0}</div>
                            {item.countType && (<div className="text-xs text-muted-foreground">{item.countType}</div>)}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{item.process || 'N/A'}</Badge></TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{item.materialType || '—'}</div>
                            {item.materialFormat && (<div className="text-xs text-muted-foreground">{item.materialFormat}</div>)}
                          </div>
                        </TableCell>
                        <TableCell>{item.country || '—'}</TableCell>
                        <TableCell className="text-right">{item.updateYear || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pricingData.length > 20 && (<div className="text-center mt-3 text-xs text-muted-foreground">Showing 20 of {pricingData.length} quotes. Export to see all.</div>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'scatter' && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Printer Inventory Timeline</CardTitle>
              <CardDescription>Number of printers by update year</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[360px] w-full" />
            ) : pricingData.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No pricing data to display.</div>
            ) : (
              <div ref={scatterChartRef} className="w-full">
                <ResponsiveContainer width="100%" height={360}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="Year" domain={['dataMin - 1', 'dataMax + 1']} />
                    <YAxis type="number" dataKey="y" name="Number of Printers" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                    <Scatter name="Quotes" data={scatterData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'comparison' && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Segment Printer Distribution</CardTitle>
              <CardDescription>Min/Avg/Max printers by segment</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[360px] w-full" />
            ) : comparisonData.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No comparison data to display.</div>
            ) : (
              <div ref={comparisonChartRef} className="w-full">
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                    <Legend />
                    <Bar dataKey="min" fill="#10B981" />
                    <Bar dataKey="avg" fill="#3B82F6" />
                    <Bar dataKey="total" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
