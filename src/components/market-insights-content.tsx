"use client"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, TrendingUp, Globe, DollarSign, Factory, Calendar, FileText, BarChart3, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#D084D0']

interface MarketData { year: number; [key: string]: number }
interface CountryData { country: string; value: number; percentage: string }

export default function MarketInsightsContent() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [segments, setSegments] = useState<string[]>([])
  const [countryData, setCountryData] = useState<any>({ topCountries: [], bySegment: [] })
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [chartType, setChartType] = useState<'stacked' | 'line'>('stacked')
  const [error, setError] = useState<string | null>(null)
  const showDebug = process.env.NEXT_PUBLIC_DEBUG_BENCHMARK === 'true'
  const totalsChartRef = useRef<HTMLDivElement | null>(null)
  const pieChartRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/market/totals?startYear=2020&endYear=2030')
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          setMarketData([])
          setSegments([])
          setError(err?.error || `Failed to load market totals (${response.status})`)
          return
        }
        const data = await response.json()
        setMarketData(data.data || [])
        setSegments(data.segments || [])
      } catch (error) {
        console.error('Error fetching market data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load market data')
      } finally {
        setLoading(false)
      }
    }
    fetchMarketData()
  }, [])

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const params = new URLSearchParams({ year: selectedYear })
        if (selectedSegment !== 'all') params.append('segment', selectedSegment)
        const response = await fetch(`/api/market/countries?${params}`)
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          setCountryData({ topCountries: [], bySegment: [] })
          setError(err?.error || `Failed to load country data (${response.status})`)
          return
        }
        const data = await response.json()
        setCountryData(data.summary || { topCountries: [], bySegment: [] })
      } catch (error) {
        console.error('Error fetching country data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load country data')
      }
    }
    fetchCountryData()
  }, [selectedYear, selectedSegment])

  const calculateStats = () => {
    if (!marketData.length) return { totalMarket: 0, cagr: 0, topSegment: '', yearOverYear: 0 }
    const currentYear = parseInt(selectedYear)
    const currentYearData = marketData.find(d => d.year === currentYear) || marketData[0] // Use first available year if selected year not found
    const previousYearData = marketData.find(d => d.year === currentYear - 1)
    const totalMarket = currentYearData?.total || 0
    const yearOverYear = previousYearData?.total ? ((totalMarket - previousYearData.total) / previousYearData.total) * 100 : 0
    // Only calculate CAGR if we have multiple years of data
    const startData = marketData.find(d => d.year === 2020) || marketData[0]
    const endData = marketData[marketData.length - 1]
    const years = endData && startData ? endData.year - startData.year : 0
    const cagr = startData?.total && endData?.total && years > 0 ? (Math.pow(endData.total / startData.total, 1 / years) - 1) * 100 : 0
    const segmentValues = segments.map(seg => ({ segment: seg, value: currentYearData?.[seg] || 0 })).sort((a,b) => b.value - a.value)
    const topSegment = segmentValues[0]?.segment || ''
    return { totalMarket, cagr, topSegment, yearOverYear }
  }
  const stats = calculateStats()

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = { marketTotals: marketData, countryAnalysis: countryData, metadata: { exportDate: new Date().toISOString(), selectedYear, selectedSegment } }
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `market-insights-${selectedYear}.json`
      a.click()
    } else {
      const csvRows = ['Year,Segment,Value']
      marketData.forEach(yearData => { segments.forEach(segment => { csvRows.push(`${yearData.year},${segment},${yearData[segment] || 0}`) }) })
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `market-insights-${selectedYear}.csv`
      a.click()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Market Insights</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData('csv')} className="h-7 text-xs">
            <Download className="h-3 w-3 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('json')} className="h-7 text-xs">
            <Download className="h-3 w-3 mr-2" /> JSON
          </Button>
        </div>
      </div>

      {!loading && (marketData.length === 0 || !marketData) && (
        <div className="mb-4 p-3 border border-dashed border-border rounded bg-muted/30 text-xs text-muted-foreground">
          No market data available. Demo data has been seeded for year 2024 only.
        </div>
      )}
      {showDebug && !loading && (error || marketData.length === 0) && (
        <div className="mb-4 p-3 rounded border border-amber-300 bg-amber-50 text-amber-900 text-xs">
          <div className="font-medium mb-1">Debug: Market Insights data unavailable</div>
          <div>Ensure migrations are applied: 005_create_market_views.sql. Views: market_totals, market_by_country_segment.</div>
          {error && <div className="mt-1">API error: {error}</div>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Market Size</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              {loading ? (<Skeleton className="h-6 w-20" />) : (<span className="text-lg font-semibold">${(stats.totalMarket/1000000).toFixed(1)}B</span>)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">YoY Growth</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {loading ? (<Skeleton className="h-6 w-16" />) : (<span className="text-lg font-semibold text-green-500">{stats.yearOverYear>0?'+':''}{stats.yearOverYear.toFixed(1)}%</span>)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">vs {parseInt(selectedYear)-1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">CAGR (2020-{selectedYear})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              {loading ? (<Skeleton className="h-6 w-16" />) : (<span className="text-lg font-semibold text-blue-500">{stats.cagr.toFixed(1)}%</span>)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Top Segment</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <Factory className="h-3 w-3 text-purple-500" />
              {loading ? (<Skeleton className="h-6 w-24" />) : (<span className="text-base font-semibold text-purple-500">{stats.topSegment || 'N/A'}</span>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
              <SelectItem key={year} value={year.toString()}><div className="flex items-center gap-2"><Calendar className="h-3 w-3" />{year}</div></SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSegment} onValueChange={setSelectedSegment}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            {segments.map(segment => (<SelectItem key={segment} value={segment}>{segment}</SelectItem>))}
          </SelectContent>
        </Select>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'stacked' | 'line')}>
          <TabsList>
            <TabsTrigger value="stacked">Stacked Bar</TabsTrigger>
            <TabsTrigger value="line">Line Chart</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* AM Market Revenue 2024 Report Card */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">AM Market Revenue Report 2024</CardTitle>
          </div>
          <CardDescription>
            Comprehensive analysis of additive manufacturing market performance and key industry metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Key Findings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                Key Findings
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Global Market Size</span>
                  {loading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="font-medium">${(stats.totalMarket/1000000).toFixed(1)}B</span>
                  )}
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Year-over-Year Growth</span>
                  {loading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className={`font-medium ${stats.yearOverYear >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.yearOverYear > 0 ? '+' : ''}{stats.yearOverYear.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Leading Segment</span>
                  {loading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <span className="font-medium">{stats.topSegment || 'N/A'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Market Highlights */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Market Highlights
              </h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border-l-4 border-blue-500">
                  <div className="font-medium text-blue-700 dark:text-blue-300">Strong Growth Trajectory</div>
                  <div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    {stats.cagr > 0 ? `${stats.cagr.toFixed(1)}% CAGR` : 'Growth data pending'} demonstrates sustained market expansion
                  </div>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded border-l-4 border-green-500">
                  <div className="font-medium text-green-700 dark:text-green-300">Geographic Diversification</div>
                  <div className="text-green-600 dark:text-green-400 text-xs mt-1">
                    {countryData?.topCountries?.length || 0} countries contributing to market growth
                  </div>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded border-l-4 border-purple-500">
                  <div className="font-medium text-purple-700 dark:text-purple-300">Technology Advancement</div>
                  <div className="text-purple-600 dark:text-purple-400 text-xs mt-1">
                    {segments.length} distinct market segments driving innovation
                  </div>
                </div>
              </div>
            </div>

            {/* Top Markets */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-orange-500" />
                Top Markets
              </h4>
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))
                ) : countryData?.topCountries?.length > 0 ? (
                  countryData.topCountries.slice(0, 3).map((country: CountryData, index: number) => (
                    <div key={country.country} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <span className="text-orange-600 font-medium">{country.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Market data by country not available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Report Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-indigo-500 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Industry Outlook</h5>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  The additive manufacturing market in 2024 shows {stats.yearOverYear >= 0 ? 'positive momentum' : 'adjustment trends'} with 
                  {stats.totalMarket > 0 ? ` a total market size of $${(stats.totalMarket/1000000).toFixed(1)}B` : ' developing market fundamentals'}.
                  {stats.topSegment && ` The ${stats.topSegment} segment continues to lead market growth,`} supported by 
                  technological advances and expanding global adoption across industries.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Market Size by Segment (2020-2030)</CardTitle>
              <CardDescription>Forecast in USD millions</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[360px] w-full" />
            ) : marketData.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No market totals to display.</div>
            ) : (
              <div ref={totalsChartRef} className="w-full">
                <ResponsiveContainer width="100%" height={360}>
                  {chartType === 'stacked' ? (
                    <BarChart data={marketData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                      <Legend />
                      {segments.map((segment, index) => (
                        <Bar key={segment} dataKey={segment} stackId="a" fill={COLORS[index % COLORS.length]} />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={marketData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                      <Legend />
                      {segments.map((segment, index) => (
                        <Line key={segment} type="monotone" dataKey={segment} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Countries by Market Size</CardTitle>
            <CardDescription>{selectedYear} market distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (countryData?.topCountries?.length || 0) === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No country breakdown available.</div>
            ) : (
              <div className="space-y-3">
                {countryData.topCountries.slice(0, 10).map((country: CountryData, index: number) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">${(country.value / 1000000).toFixed(1)}M</span>
                      <span className="text-sm font-medium text-blue-500">{country.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Market by Segment</CardTitle>
              <CardDescription>{selectedYear} segment breakdown</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (countryData?.bySegment?.length || 0) === 0 || stats.totalMarket === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No segment distribution available.</div>
            ) : (
              <div ref={pieChartRef} className="w-full">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={countryData.bySegment} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.segment}: ${((entry.value / stats.totalMarket) * 100).toFixed(1)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {countryData.bySegment.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

