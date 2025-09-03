'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { BarChart3, TrendingUp, MapPin, Building2, Calendar, DollarSign, Filter, Search, Download, PieChart, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
// import { Separator } from '@/components/ui/separator'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis, BarChart as ReBarChart, Bar, Brush, ReferenceArea } from 'recharts'
import { MarketTotalsChart } from '@/components/market-data/MarketTotalsChart'
import { MarketCountriesChart } from '@/components/market-data/MarketCountriesChart'
import { KpiCard } from '@/components/market-data/KpiCard'
import { FilterCard } from '@/components/market-data/FilterCard'

interface MarketDataLayoutProps {
  data: string[][]
  dataset: string
}

// Compact styling helpers used across filter panels and KPI cards
const compact = {
  header: 'px-4 py-2',
  content: 'px-4 pt-0 pb-3',
  kpiHeader: 'flex flex-row items-center justify-between space-y-0 pb-1 px-4',
  kpiContent: 'px-4 py-2',
  kpiTitle: 'text-xs font-medium',
  kpiValue: 'text-xl font-bold',
}

/**
 * RevenueAnalysisLayout
 *
 * Displays revenue distributions as two pie charts (by segment and by country/label)
 * and a data table. This layout is used for:
 * - am-market-revenue-2024 (columns: ['revenue_usd', 'country', 'segment'])
 * - revenue-by-industry-2024 (columns: ['industry', 'share_of_revenue_percent', 'revenue_usd', 'region', 'material'])
 *
 * Data shape: string[][] where row[0] is the header row. This shape is produced by
 * the vendor data API: src/app/api/vendor-data/[dataset]/route.ts, which in turn is
 * referenced by the market-data proxy: src/app/api/market-data/[dataset]/route.ts.
 * Column definitions come from src/lib/config/datasets.ts (DATASET_CONFIGS).
 *
 * Note on indices:
 *  - We compute indices for revenue, name (country/industry), and segment dynamically
 *    based on the dataset, so this component can render both datasets correctly.
 */
export function RevenueAnalysisLayout({ data, dataset }: MarketDataLayoutProps) {
  const safeData = data || []
  const headers = safeData[0] || []
  const rows = safeData.slice(1)
  
  // Map column indices by dataset (some datasets have different column orders)
  const { revenueIdx, nameIdx, segmentIdx, materialIdx } = useMemo(() => {
    switch (dataset) {
      case 'revenue-by-industry-2024':
        // display columns: ['industry', 'share_of_revenue_percent', 'revenue_usd', 'region', 'material'] (id and created_at excluded)
        // Use industry as the display name, region as a segment-like grouping for filtering
        return { revenueIdx: 1, nameIdx: 0, segmentIdx: 3, materialIdx: 4 }
      case 'am-market-revenue-2024':
      default:
        // display columns: ['revenue_usd', 'country', 'segment'] (id and created_at excluded)
        return { revenueIdx: 0, nameIdx: 1, segmentIdx: 2, materialIdx: -1 }
    }
  }, [dataset])
  
  // State for filters
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Process data for pie charts
  // Apply filters (segment, country/label, free-text search)
  const processedData = useMemo(() => {
    // Filter rows based on selections
    let filteredRows = rows
    
    if (selectedSegment !== 'all') {
      filteredRows = filteredRows.filter(row => row[segmentIdx] === selectedSegment)
    }
    
    if (selectedCountry !== 'all') {
      // For am-market-revenue-2024 this is a country filter; for revenue-by-industry-2024 it's the industry name
      filteredRows = filteredRows.filter(row => row[nameIdx] === selectedCountry)
    }
    
    if (materialIdx >= 0 && selectedMaterial !== 'all') {
      filteredRows = filteredRows.filter(row => row[materialIdx] === selectedMaterial)
    }
    
    if (searchTerm) {
      filteredRows = filteredRows.filter(row => 
        row.some(cell => cell?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    return filteredRows
  }, [rows, selectedSegment, selectedCountry, searchTerm, segmentIdx, nameIdx, materialIdx, selectedMaterial])
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Prepare data for pie charts
  const segmentData = useMemo(() => {
    const segmentRevenue = new Map<string, number>()
    
    processedData.forEach(row => {
      const segment = row[segmentIdx] || 'Unknown'
      // Revenue values are currency-formatted strings in the CSV-like array; strip non-numeric characters before parse
      const revenue = parseFloat(row[revenueIdx]?.toString().replace(/[^\d.-]/g, '') || '0')
      
      segmentRevenue.set(segment, (segmentRevenue.get(segment) || 0) + revenue)
    })
    
    return Array.from(segmentRevenue.entries())
      .map(([segment, revenue]) => ({ name: segment, value: revenue }))
      .sort((a, b) => b.value - a.value)
  }, [processedData, segmentIdx, revenueIdx])
  
  const countryData = useMemo(() => {
    const countryRevenue = new Map<string, number>()
    
    processedData.forEach(row => {
      const country = row[nameIdx] || 'Unknown'
      // Same parsing as segmentData
      const revenue = parseFloat(row[revenueIdx]?.toString().replace(/[^\d.-]/g, '') || '0')
      
      countryRevenue.set(country, (countryRevenue.get(country) || 0) + revenue)
    })
    
    return Array.from(countryRevenue.entries())
      .map(([country, revenue]) => ({ name: country, value: revenue }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 countries
  }, [processedData, nameIdx, revenueIdx])
  
  // Color palette for pie charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084A7'
  ]
  
  // Custom tooltip formatter
  const formatTooltip = (value: number, name: string) => {
    return [`$${(value / 1000000).toFixed(1)}M`, name]
  }

  // Render percent labels inside each slice to avoid overflow
  const RADIAN = Math.PI / 180
  const renderInsideLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
    // Hide labels for very small slices
    if (!percent || percent < 0.03) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
      >
        {(percent * 100).toFixed(1)}%
      </text>
    )
  }
  
  // Get unique segments and countries for filters
  // Populate filter dropdowns from data
  const uniqueSegments = Array.from(new Set(
    rows
      .filter(row => row.length > segmentIdx && row[segmentIdx])
      .map(row => row[segmentIdx])
      .filter(item => item && item.toString().trim())
  ))
  const uniqueCountries = Array.from(new Set(
    rows
      .filter(row => row.length > nameIdx && row[nameIdx])
      .map(row => row[nameIdx])
      .filter(item => item && item.toString().trim())
  ))
  const uniqueMaterials = materialIdx >= 0
    ? Array.from(new Set(
        rows
          .filter(row => row.length > materialIdx && row[materialIdx])
          .map(row => row[materialIdx])
          .filter(item => item && item.toString().trim())
      ))
    : []

  const segmentTotal = useMemo(() => segmentData.reduce((s, d) => s + (d.value || 0), 0), [segmentData])
  const countryTotal = useMemo(() => countryData.reduce((s, d) => s + (d.value || 0), 0), [countryData])

  // Sorted data for the table (based on processedData)
  const sortedTableData = useMemo(() => {
    const numericCols: number[] = (() => {
      if (dataset === 'revenue-by-industry-2024') return [1, 2]
      return [revenueIdx]
    })()

    const arr = [...processedData]
    if (sortColumn === null) return arr
    const isNumeric = numericCols.includes(sortColumn)
    const parseVal = (v: any) => {
      if (v == null) return ''
      if (!isNumeric) return v.toString().toLowerCase()
      const num = parseFloat(v.toString().replace(/[^\d.-]/g, '') || '0')
      return isNaN(num) ? 0 : num
    }

    arr.sort((a, b) => {
      const av = parseVal(a[sortColumn!])
      const bv = parseVal(b[sortColumn!])
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [processedData, sortColumn, sortDirection, dataset, revenueIdx])

  const handleSort = (index: number) => {
    setSortColumn((prev) => {
      if (prev === index) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return index
    })
  }
  
  // Show/hide global filters and KPI row depending on dataset
  const isAMMarketRevenue = dataset === 'am-market-revenue-2024'

  return (
    <div className="space-y-3">
      {/* Global filters: hidden for AM Market Revenue to avoid confusion with the top chart */}
      {!isAMMarketRevenue && (
      <FilterCard size="xxs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="h-6 order-1 md:order-1">
                <SelectValue placeholder={dataset === 'revenue-by-industry-2024' ? 'Industry' : 'Country'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dataset === 'revenue-by-industry-2024' ? 'All Industries' : 'All Countries'}</SelectItem>
                {uniqueCountries.filter(country => country && country.toString().trim()).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {dataset !== 'revenue-by-industry-2024' && (
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger className="h-6 order-3 md:order-2">
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {uniqueSegments.filter(segment => segment && segment.toString().trim()).map(segment => (
                    <SelectItem key={segment} value={segment.toString()}>{segment}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {dataset === 'revenue-by-industry-2024' && (
              <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger className="h-6 order-3 md:order-2">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {uniqueMaterials.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
            
            <Input 
              placeholder="Search revenue data..." 
              className="h-6 order-4 md:order-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Button 
              className="h-6 order-2 md:order-4" 
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedSegment('all')
                setSelectedCountry('all')
                setSelectedMaterial('all')
                setSearchTerm('')
              }}
            >
              Reset
            </Button>
          </div>
      </FilterCard>
      )}

      {/* Summary Cards (compact): remove for AM Market Revenue to free space */}
      {!isAMMarketRevenue && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        <KpiCard size="xxs" title="Total Records" icon={BarChart3} value={rows.length} subtitle="Revenue data points" />
        <KpiCard size="xxs" title="Countries/Industries" icon={MapPin} value={new Set(rows.map(row => row[1] || '')).size} subtitle="Unique entries" />
        <KpiCard size="xxs" title="Segments" icon={Building2} value={new Set(rows.map(row => row[2] || '')).size} subtitle="Market segments" />
        <KpiCard size="xxs" title="Avg Revenue" icon={DollarSign} value={(() => {
          if (rows.length === 0) return '$0'
          const totalRevenue = rows.reduce((sum, row) => {
            const revenue = parseFloat(row[revenueIdx]?.toString().replace(/[^\\d.-]/g, '') || '0')
            return sum + revenue
          }, 0)
          const avgRevenue = totalRevenue / rows.length
          return `$${(avgRevenue / 1000000).toFixed(1)}M`
        })()} subtitle="Per data point" />
      </div>
      )}

      {/* Market Countries Chart (moved after filters and summary) */}
      {dataset === 'am-market-revenue-2024' ? (
        <MarketCountriesChart defaultYear={2024} />
      ) : null}

      {/* For AM Market Revenue, filters will be rendered above the table rows instead of here */}

      {/* Industry Share Bar Chart (only for revenue-by-industry-2024) */}
      {dataset === 'revenue-by-industry-2024' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share of total AM revenue attributed to each industry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  const industryMap = new Map<string, number>()
                  processedData.forEach((row) => {
                    const ind = row[nameIdx] || 'Unknown'
                    const percent = parseFloat(row[revenueIdx]?.toString().replace(/[^\d.-]/g, '') || '0')
                    industryMap.set(ind, (industryMap.get(ind) || 0) + percent)
                  })
                  const chartData = Array.from(industryMap.entries())
                    .map(([industry, percent]) => ({ industry, percent }))
                    .sort((a, b) => b.percent - a.percent)

                  const maxVal = chartData.reduce((m, d) => Math.max(m, d.percent || 0), 0)

                  if (chartData.length === 0) {
                    return (
                      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                        No data for selected filters.
                      </div>
                    )
                  }

                  return (
                    <ReBarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 120, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, Math.ceil((maxVal + 1) / 1) * 1]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="industry" width={140} />
                      <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                      <Bar dataKey="percent" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                    </ReBarChart>
                  )
                })()}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Pie Charts Section */}
      {dataset !== 'revenue-by-industry-2024' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Revenue Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {segmentData.length === 0 || segmentTotal === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  No segment distribution available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius="45%"
                      outerRadius="80%"
                      paddingAngle={1}
                      labelLine={false}
                      label={renderInsideLabel}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`segment-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltip} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 12 }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Country Revenue Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Revenue by Country (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {countryData.length === 0 || countryTotal === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  No country distribution available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={countryData}
                      cx="50%"
                      cy="50%"
                      innerRadius="45%"
                      outerRadius="80%"
                      paddingAngle={1}
                      labelLine={false}
                      label={renderInsideLabel}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {countryData.map((entry, index) => (
                        <Cell key={`country-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltip} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 12 }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Revenue Data</CardTitle>
            <Badge variant="secondary">
              {processedData.length} of {rows.length} records shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* AM Market Revenue: move filters to the top of the table rows */}
          {isAMMarketRevenue && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-2">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-6 order-1 md:order-1">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries
                    .filter(country => country && country.toString().trim())
                    .map(country => (
                      <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger className="h-6 order-3 md:order-2">
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {uniqueSegments
                    .filter(segment => segment && segment.toString().trim())
                    .map(segment => (
                      <SelectItem key={segment} value={segment.toString()}>{segment}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search revenue data..."
                className="h-6 order-4 md:order-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                className="h-6 order-2 md:order-4"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedSegment('all')
                  setSelectedCountry('all')
                  setSelectedMaterial('all')
                  setSearchTerm('')
                }}
              >
                Reset
              </Button>
            </div>
          )}
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold cursor-pointer select-none" onClick={() => handleSort(index)}>
                      <div className="inline-flex items-center gap-1">
                        <span>{header}</span>
                        {sortColumn === index ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTableData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {dataset === 'revenue-by-industry-2024' ? (
                          // Formatting for industry dataset: [Industry, Share %, Revenue USD, Region, Material]
                          cellIndex === 1 ? (
                            <Badge variant="secondary">{Number(parseFloat(cell?.toString() || '0')).toFixed(1)}%</Badge>
                          ) : cellIndex === 2 ? (
                            <Badge variant="secondary">${(parseFloat(cell?.toString().replace(/[^\d.-]/g, '') || '0') / 1_000_000).toFixed(1)}M</Badge>
                          ) : cellIndex >= 3 ? (
                            <Badge variant="outline">{cell}</Badge>
                          ) : (
                            cell
                          )
                        ) : (
                          // Default formatting for country revenue dataset: [Revenue USD, Country, Segment]
                          cellIndex === 0 ? (
                            <Badge variant="secondary">
                              ${(parseFloat(cell?.toString().replace(/[^\d.-]/g, '') || '0') / 1000000).toFixed(1)}M
                            </Badge>
                          ) : cellIndex === 1 ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {cell}
                            </div>
                          ) : cellIndex === 2 ? (
                            <Badge variant="outline">{cell}</Badge>
                          ) : (
                            cell
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Total AM Market Size Layout - uses unified totals endpoint
export function TotalMarketSizeLayout() {
  return (
    <div className="space-y-6">
      <MarketTotalsChart />
    </div>
  )
}

// Investment Analysis Layout - for Fundings & Investments
export function InvestmentAnalysisLayout({ data, dataset: _dataset }: MarketDataLayoutProps) {
  
  const safeData = data || []
  const headers = safeData[0] || []
  const rows = safeData.slice(1)
  
  // Filter state
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Normalize quantity values to consistent buckets (1 vs 1000+)
  const normalizeQty = (v: any) => {
    const n = parseInt((v ?? '').toString().replace(/[^0-9]/g, ''))
    if (!Number.isFinite(n) || n <= 0) return 0
    return n >= 1000 ? 1000 : 1
  }

  // Filter data
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesYear = yearFilter === 'all' || row[0]?.toString().includes(yearFilter)
      const matchesCountry = countryFilter === 'all' || row[3] === countryFilter
      const matchesType = typeFilter === 'all' || row[5] === typeFilter
      const matchesSearch = searchTerm === '' ||
        row[1]?.toLowerCase().includes(searchTerm.toLowerCase()) || // Company name
        row[2]?.toLowerCase().includes(searchTerm.toLowerCase())    // Investor name
      
      return matchesYear && matchesCountry && matchesType && matchesSearch
    })
  }, [rows, yearFilter, countryFilter, typeFilter, searchTerm])
  
  // Calculate time range from actual data
  const timeRange = useMemo(() => {
    if (filteredRows.length === 0) return 'No data'
    
    const years = filteredRows
      .map(row => row[0]?.toString())
      .filter(year => year && !isNaN(parseInt(year)))
      .map(year => parseInt(year))
    
    if (years.length === 0) return 'Unknown'
    
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    
    return minYear === maxYear ? minYear.toString() : `${minYear}-${maxYear}`
  }, [filteredRows])
  
  // Sort filtered table rows
  const sortedInvestmentRows = useMemo(() => {
    const numericCols = [0, 4]
    const arr = [...filteredRows]
    if (sortColumn === null) return arr
    const isNumeric = numericCols.includes(sortColumn)
    const parseVal = (v: any) => {
      if (v == null) return ''
      if (!isNumeric) return v.toString().toLowerCase()
      const num = parseFloat(v.toString().replace(/[^\d.-]/g, '') || '0')
      return isNaN(num) ? 0 : num
    }
    arr.sort((a, b) => {
      const av = parseVal(a[sortColumn!])
      const bv = parseVal(b[sortColumn!])
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filteredRows, sortColumn, sortDirection])

  const handleSort = (index: number) => {
    setSortColumn((prev) => {
      if (prev === index) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return index
    })
  }
  
  return (
    <div className="space-y-3">
      {/* Filters */}
      <FilterCard size="xxs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > 0 && row[0])
                    .map(row => row[0])
                    .filter(year => year && year.toString().trim())
                )).sort().map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > 3 && row[3])
                    .map(row => row[3])
                    .filter(country => country && country.toString().trim())
                )).sort().map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Round Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > 5 && row[5])
                    .map(row => row[5])
                    .filter(type => type && type.toString().trim())
                )).sort().map(type => (
                  <SelectItem key={type} value={type.toString()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="Search companies..." 
              className="h-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Button 
              className="h-6" 
              size="sm" 
              variant="outline"
              onClick={() => {
                setYearFilter('all')
                setCountryFilter('all')
                setTypeFilter('all')
                setSearchTerm('')
              }}
            >
              Reset
            </Button>
          </div>
      </FilterCard>

      {/* Investment Summary (compact) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        <KpiCard size="xxs" title="Total Investments" icon={TrendingUp} value={filteredRows.length} subtitle={filteredRows.length !== rows.length ? `${rows.length} total, ${filteredRows.length} filtered` : 'Investment rounds'} />
        <KpiCard size="xxs" title="Countries" icon={MapPin} value={new Set(filteredRows.map(row => row[3] || '').filter(c => c)).size} subtitle="Active markets" />
        <KpiCard size="xxs" title="Funding Types" icon={Building2} value={new Set(filteredRows.map(row => row[5] || '').filter(t => t)).size} subtitle="Round types" />
        <KpiCard size="xxs" title="Time Range" icon={Calendar} value={timeRange} subtitle="Investment period" />
      </div>


      {/* Investment Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold cursor-pointer select-none" onClick={() => handleSort(index)}>
                      <div className="inline-flex items-center gap-1">
                        <span>{header}</span>
                        {sortColumn === index ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvestmentRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cellIndex === 4 ? ( // Amount column
                          <Badge variant="outline">${cell}M</Badge>
                        ) : cellIndex === 5 ? ( // Funding round column
                          <Badge>{cell}</Badge>
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// M&A Analysis Layout - for Mergers & Acquisitions
export function MergerAcquisitionLayout({ data, dataset: _dataset }: MarketDataLayoutProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  const safeData = data || []
  const headers = safeData[0] || []
  const rows = safeData.slice(1)
  
  // Our data structure: ['Announcement Date', 'Acquired Company', 'Acquiring Company', 'Deal Size (millions)', 'Deal Status', 'Notes']
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [dealSizeFilter, setDealSizeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Column indices
  const dateIdx = 0
  const acquiredIdx = 1
  const acquiringIdx = 2
  const dealSizeIdx = 3
  const statusIdx = 4
  const notesIdx = 5
  
  // Extract country from notes (format: "Country: X")
  const getCountryFromNotes = (notes: string): string => {
    if (!notes) return 'Unknown'
    const match = notes.match(/Country:\s*([^,\n]+)/i)
    return match ? match[1].trim() : 'Unknown'
  }
  
  // Filter data
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === '2024' && row[dateIdx]?.includes('2024')) ||
        (dateFilter === '2023' && row[dateIdx]?.includes('2023'))
      
      const dealSize = parseFloat(row[dealSizeIdx] || '0')
      const matchesDealSize = dealSizeFilter === 'all' ||
        (dealSizeFilter === 'disclosed' && dealSize > 0) ||
        (dealSizeFilter === 'undisclosed' && dealSize === 0) ||
        (dealSizeFilter === 'large' && dealSize >= 50) ||
        (dealSizeFilter === 'medium' && dealSize >= 10 && dealSize < 50) ||
        (dealSizeFilter === 'small' && dealSize > 0 && dealSize < 10)
      
      const matchesStatus = statusFilter === 'all' || row[statusIdx] === statusFilter
      
      const matchesSearch = searchTerm === '' ||
        row[acquiredIdx]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row[acquiringIdx]?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesDate && matchesDealSize && matchesStatus && matchesSearch
    })
  }, [rows, dateFilter, dealSizeFilter, statusFilter, searchTerm])
  
  // Calculate metrics
  const totalDealValue = useMemo(() => {
    return filteredRows.reduce((sum, row) => {
      const dealSize = parseFloat(row[dealSizeIdx] || '0')
      return sum + dealSize
    }, 0)
  }, [filteredRows])
  
  const disclosedDeals = useMemo(() => {
    return filteredRows.filter(row => parseFloat(row[dealSizeIdx] || '0') > 0)
  }, [filteredRows])
  
  const countriesInvolved = useMemo(() => {
    const countries = new Set<string>()
    filteredRows.forEach(row => {
      const country = getCountryFromNotes(row[notesIdx] || '')
      if (country !== 'Unknown') countries.add(country)
    })
    return countries.size
  }, [filteredRows])
  
  const largestDeal = useMemo(() => {
    return filteredRows.reduce((max, row) => {
      const dealSize = parseFloat(row[dealSizeIdx] || '0')
      return dealSize > max ? dealSize : max
    }, 0)
  }, [filteredRows])
  
  // Sort filtered rows for table
  const sortedMaRows = useMemo(() => {
    const numericCols = [dealSizeIdx]
    const arr = [...filteredRows]
    if (sortColumn === null) return arr
    const isNumeric = numericCols.includes(sortColumn)
    const parseVal = (v: any) => {
      if (v == null) return ''
      if (!isNumeric) return v.toString().toLowerCase()
      const num = parseFloat(v.toString().replace(/[^\d.-]/g, '') || '0')
      return isNaN(num) ? 0 : num
    }
    arr.sort((a, b) => {
      const av = parseVal(a[sortColumn!])
      const bv = parseVal(b[sortColumn!])
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filteredRows, sortColumn, sortDirection, dealSizeIdx])

  const handleSort = (index: number) => {
    setSortColumn((prev) => {
      if (prev === index) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return index
    })
  }
  
  return (
    <div className="space-y-3">
      {/* Filters */}
      <FilterCard size="xxs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dealSizeFilter} onValueChange={setDealSizeFilter}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Deal Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="disclosed">Disclosed Only</SelectItem>
                <SelectItem value="undisclosed">Undisclosed</SelectItem>
                <SelectItem value="large">Large ($50M+)</SelectItem>
                <SelectItem value="medium">Medium ($10-50M)</SelectItem>
                <SelectItem value="small">Small (&lt;$10M)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > statusIdx && row[statusIdx])
                    .map(row => row[statusIdx])
                    .filter(status => status && status.toString().trim())
                )).map(status => (
                  <SelectItem key={status} value={status.toString()}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="Search companies..." 
              className="h-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Button 
              className="h-6" 
              size="sm" 
              variant="outline"
              onClick={() => {
                setDateFilter('all')
                setDealSizeFilter('all')
                setStatusFilter('all')
                setSearchTerm('')
              }}
            >
              Reset
            </Button>
          </div>
      </FilterCard>

      {/* M&A Summary (compact) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        <KpiCard size="xxs" title="Total Deals" icon={Building2} value={filteredRows.length} subtitle={filteredRows.length !== rows.length ? `${rows.length} total, ${filteredRows.length} filtered` : 'M&A transactions'} />
        <KpiCard size="xxs" title="Total Value" icon={DollarSign} value={totalDealValue > 0 ? `$${totalDealValue.toFixed(0)}M` : 'N/A'} subtitle="Disclosed deals only" />
        <KpiCard size="xxs" title="Disclosed Rate" icon={TrendingUp} value={`${filteredRows.length > 0 ? Math.round((disclosedDeals.length / filteredRows.length) * 100) : 0}%`} subtitle={`${disclosedDeals.length} with deal size`} />
        <KpiCard size="xxs" title="Largest Deal" icon={Calendar} value={largestDeal > 0 ? `$${largestDeal}M` : 'N/A'} subtitle="Single transaction" />
      </div>

      {/* M&A Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">M&A Transactions</CardTitle>
            <Badge variant="secondary">
              {filteredRows.length} of {rows.length} deals shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead 
                      key={index} 
                      className="font-semibold cursor-pointer select-none"
                      onClick={() => handleSort(index)}
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>{header}</span>
                        {sortColumn === index ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMaRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cellIndex === dateIdx ? ( // Date column
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {cell}
                          </div>
                        ) : cellIndex === dealSizeIdx ? ( // Deal size column
                          cell && parseFloat(cell) > 0 ? (
                            <Badge variant="secondary">${parseFloat(cell).toFixed(1)}M</Badge>
                          ) : (
                            <Badge variant="outline">Undisclosed</Badge>
                          )
                        ) : cellIndex === statusIdx ? ( // Status column
                          <Badge variant="outline">{cell}</Badge>
                        ) : cellIndex === notesIdx ? ( // Notes column (extract country)
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {getCountryFromNotes(cell || '')}
                          </div>
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Pricing Analysis Layout - for Print Services Pricing
export function PricingAnalysisLayout({ data, dataset: _dataset }: MarketDataLayoutProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const safeData = data || []
  const headers = safeData[0] || []
  const rows = safeData.slice(1)
  
  // State for filters
  const [selectedProcess, setSelectedProcess] = useState<string>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all') 
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedQuantity, setSelectedQuantity] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Column indices based on display data (id and created_at are excluded):
  // ['company_name', 'material_type', 'material', 'process', 'quantity', 'manufacturing_cost', 'day_ordered', 'delivery_date', 'lead_time', 'country', 'scattered_plot_info']
  const companyIdx = 0
  const materialTypeIdx = 1  
  const materialIdx = 2
  const processIdx = 3
  const quantityIdx = 4
  const costIdx = 5
  const leadTimeIdx = 8
  const countryIdx = 9
  
  // Normalize quantity values to consistent buckets (1 vs 1000+)
  const normalizeQty = (v: any) => {
    const n = parseInt((v ?? '').toString().replace(/[^0-9]/g, ''))
    if (!Number.isFinite(n) || n <= 0) return 0
    return n >= 1000 ? 1000 : 1
  }

  // Filter data
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesProcess = selectedProcess === 'all' || row[processIdx] === selectedProcess
      const matchesMaterial = selectedMaterial === 'all' || row[materialIdx] === selectedMaterial
      const matchesCountry = selectedCountry === 'all' || row[countryIdx] === selectedCountry
      const q = normalizeQty(row[quantityIdx])
      const matchesQuantity = selectedQuantity === 'all' || 
        (selectedQuantity === '1' && q === 1) ||
        (selectedQuantity === '1000' && q === 1000)
      const matchesSearch = searchTerm === '' || 
        row[companyIdx]?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesProcess && matchesMaterial && matchesCountry && matchesQuantity && matchesSearch
    })
  }, [rows, selectedProcess, selectedMaterial, selectedCountry, selectedQuantity, searchTerm])
  
  // Prepare scatter plot data
  const scatterData = filteredRows.map((row, index) => ({
    // Clamp to >= 0 to avoid negative values causing odd axis ranges
    x: Math.max(0, parseInt(row[leadTimeIdx]) || 0), // Lead time (days)
    // Use min of 1 so log scale works (no zero)
    y: Math.max(1, parseFloat(row[costIdx]) || 0),   // Manufacturing cost ($USD)
    country: row[countryIdx] || 'Unknown',
    company: row[companyIdx] || 'Unknown',
    process: row[processIdx] || 'Unknown',
    material: row[materialIdx] || 'Unknown',
    quantity: normalizeQty(row[quantityIdx]) || 0,
    z: normalizeQty(row[quantityIdx]) || 1 // Size of dots
  }))
  
  // Quantity-based coloring: 1 vs 1000+ orders
  const QTY_COLORS = {
    one: '#2563eb',      // blue for quantity = 1
    bulk: '#f59e0b',     // orange for quantity >= 1000
  }
  
  // Calculate averages for filtered data
  const avgLeadTime = filteredRows.length > 0 
    ? Math.round(filteredRows.reduce((sum, row) => sum + (parseInt(row[leadTimeIdx]) || 0), 0) / filteredRows.length)
    : 0
  const avgCost = filteredRows.length > 0
    ? Math.round(filteredRows.reduce((sum, row) => sum + (parseFloat(row[costIdx]) || 0), 0) / filteredRows.length)
    : 0

  // (Removed toggles) Always show full range on linear scale

  // Helpers
  const formatUsdShort = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
    return `$${Math.round(n)}`
  }

  // Compute domains (full range, linear) and build a jittered dataset to reduce overlap
  const { xDomain, yDomain, jittered } = useMemo(() => {
    const xs = scatterData.map(d => d.x).filter(v => Number.isFinite(v))
    const ys = scatterData.map(d => d.y).filter(v => Number.isFinite(v))
    if (xs.length === 0 || ys.length === 0) {
      return { xDomain: ['auto', 'auto'] as any, yDomain: ['auto', 'auto'] as any, jittered: scatterData }
    }

    const minX = Math.max(0, Math.min(...xs))
    const maxX = Math.max(...xs)
    const minY = Math.max(0, Math.min(...ys))
    const maxY = Math.max(...ys)

    const niceCeil = (n: number) => {
      if (n <= 0) return 0
      const pow = Math.pow(10, Math.floor(Math.log10(n)))
      return Math.ceil(n / pow) * pow
    }

    const xDom: [number, number] = [0, Math.max(10, Math.ceil(maxX))]
    // Ensure bottom of domain is 1 for log scaling
    const yDom: [number, number] = [Math.max(1, Math.min(...ys)), niceCeil(maxY * 1.05)]

    // Deterministic jitter to ease overplotting while keeping values recognizable
    const jitterAmountX = Math.max(0.5, (xDom[1] - xDom[0]) * 0.01) // ~1% of range or 0.5 day
    const jitterAmountY = Math.max(100, (yDom[1] - yDom[0]) * 0.01) // ~1% of range or $100

    const hash = (s: string) => {
      let h = 2166136261
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
      }
      return h >>> 0
    }
    const rand01 = (s: string) => (hash(s) % 10000) / 10000

    const jitteredData = scatterData.map((d, i) => {
      const seed = `${d.company}-${d.material}-${d.quantity}-${d.x}-${d.y}-${i}`
      const r1 = rand01(seed)
      const r2 = rand01(seed + 'y')
      const jx = (r1 - 0.5) * 2 * jitterAmountX
      const jy = (r2 - 0.5) * 2 * jitterAmountY
      return {
        ...d,
        x: Math.max(0, d.x + jx),
        y: Math.max(0, d.y + jy),
      }
    })

    return { xDomain: xDom as any, yDomain: yDom as any, jittered: jitteredData }
  }, [scatterData])

  // Split by quantity buckets so we can color and control layer order
  const qty1Data = useMemo(() => jittered.filter((d:any) => (d.quantity || 0) === 1), [jittered])
  const qtyBulkData = useMemo(() => jittered.filter((d:any) => (d.quantity || 0) >= 1000), [jittered])

  // No categorical series; render a single series. Keep tooltip to reveal country if needed.

  // Ticks: fewer, readable labels on both axes
  const xTicks = useMemo(() => {
    const max = typeof (xDomain as any)[1] === 'number' ? (xDomain as any)[1] : 120
    const step = max > 120 ? 30 : 15
    const arr: number[] = []
    for (let t = 0; t <= max; t += step) arr.push(t)
    return arr
  }, [xDomain])

  const yTicks = useMemo(() => {
    const max = typeof (yDomain as any)[1] === 'number' ? (yDomain as any)[1] : 1_000_000
    const arr: number[] = []
    let t = 1_000
    while (t <= max) {
      arr.push(t)
      t *= 10
    }
    return arr.length ? arr : [1_000, 10_000, 100_000, 1_000_000]
  }, [yDomain])
  
  // Sort filtered rows
  const sortedPricingRows = useMemo(() => {
    const numericCols = [quantityIdx, costIdx, leadTimeIdx]
    const arr = [...filteredRows]
    if (sortColumn === null) return arr
    const isNumeric = numericCols.includes(sortColumn)
    const parseVal = (v: any) => {
      if (v == null) return ''
      if (!isNumeric) return v.toString().toLowerCase()
      const num = parseFloat(v.toString().replace(/[^\d.-]/g, '') || '0')
      return isNaN(num) ? 0 : num
    }
    arr.sort((a, b) => {
      const av = parseVal(a[sortColumn!])
      const bv = parseVal(b[sortColumn!])
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filteredRows, sortColumn, sortDirection])

  const handleSort = (index: number) => {
    setSortColumn((prev) => {
      if (prev === index) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return index
    })
  }
  
  return (
    <div className="space-y-3">
      {/* Filters */}
      <FilterCard size="xxs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > countryIdx && row[countryIdx])
                    .map(row => row[countryIdx])
                    .filter(country => country && country.toString().trim())
                )).sort((a, b) => a.toString().localeCompare(b.toString())).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Process" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Processes</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > processIdx && row[processIdx])
                    .map(row => row[processIdx])
                    .filter(process => process && process.toString().trim())
                )).sort((a, b) => a.toString().localeCompare(b.toString())).map(process => (
                  <SelectItem key={process} value={process.toString()}>{process}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > materialIdx && row[materialIdx])
                    .map(row => row[materialIdx])
                    .filter(material => material && material.toString().trim())
                )).sort((a, b) => a.toString().localeCompare(b.toString())).map(material => (
                  <SelectItem key={material} value={material.toString()}>{material}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Quantity filter hidden per request */}
            
            <Input 
              className="h-6"
              placeholder="Search companies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Button 
              className="h-6"
              size="sm"
              onClick={() => {
                setSelectedCountry('all')
                setSelectedProcess('all')
                setSelectedMaterial('all') 
                setSelectedQuantity('all')
                setSearchTerm('')
              }}
              variant="outline"
            >
              Reset
            </Button>
          </div>
      </FilterCard>

      {/* Pricing Summary (compact) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        <KpiCard size="xxs" title="Total Quotes" icon={DollarSign} value={filteredRows.length} subtitle={filteredRows.length !== rows.length ? `${rows.length} total, ${filteredRows.length} filtered` : 'Price quotes'} />
        <KpiCard size="xxs" title="Avg Cost" icon={DollarSign} value={`$${avgCost.toLocaleString()}`} subtitle="Manufacturing cost" />
        <KpiCard size="xxs" title="Avg Lead Time" icon={Calendar} value={avgLeadTime} subtitle="Days" />
        <KpiCard size="xxs" title="Countries" icon={MapPin} value={new Set(filteredRows.map(row => row[countryIdx] || '')).size} subtitle="Active markets" />
      </div>

      {/* Scatter Plot */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Manufacturing Cost vs Lead Time
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Scatter plot showing cost vs delivery time, colored by quantity. Larger dots indicate higher quantities.
              </p>
            </div>
            {/* Removed focus/log toggles for simplicity */}
          </div>
        </CardHeader>
        <CardContent>
          {/* Quantity legend (color-coded) */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2" aria-label="Quantity legend">
            <span className="font-medium">Quantity</span>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full" style={{ width: 12, height: 12, background: QTY_COLORS.one, opacity: 0.9 }} />
                <span>1 ({qty1Data.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full" style={{ width: 12, height: 12, background: QTY_COLORS.bulk, opacity: 0.9 }} />
                <span>1k+ ({qtyBulkData.length})</span>
              </div>
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 24, right: 28, bottom: 76, left: 104 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  name="Lead Time"
                  domain={xDomain as any}
                  ticks={xTicks}
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickMargin={10}
                  minTickGap={10}
                  interval="preserveStartEnd"
                  padding={{ left: 10, right: 10 }}
                  label={{ value: 'Lead Time (days)', position: 'bottom', offset: 30 }}
                />
                <YAxis 
                  dataKey="y" 
                  type="number" 
                  name="Cost"
                  // Log scale compresses outliers and reveals the main cluster
                  scale={'log'}
                  domain={yDomain as any}
                  allowDataOverflow
                  ticks={yTicks}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickMargin={8}
                  label={{ value: 'Manufacturing Cost (USD)', angle: -90, position: 'left', offset: 22 }}
                  tickFormatter={(value) => formatUsdShort(Number(value))}
                />
                {/* Bubble size still reflects quantity */}
                <ZAxis dataKey="z" name="Quantity" range={[8, 28]} />
                {/* Custom tooltip with quantity, process, material */}
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null as any
                    const d: any = payload[0].payload
                    return (
                      <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: 8 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.company} ({d.country})</div>
                        <div>Cost: {formatUsdShort(Number(d.y))}</div>
                        <div>Lead time: {Math.round(Number(d.x))} days</div>
                        <div>Quantity: {Number(d.z || 0).toLocaleString()}</div>
                        <div>Process: {d.process}</div>
                        <div>Material: {d.material}</div>
                      </div>
                    )
                  }}
                />
                {/* Target zone: fast + low cost */}
                <ReferenceArea x1={0} x2={45} y1={1} y2={500000} fill="#10b981" fillOpacity={0.05} />
                {/* Draw bulk first, then qty=1 on top for visibility */}
                <Scatter
                  name="Qty 1k+"
                  data={qtyBulkData}
                  fill={QTY_COLORS.bulk}
                  fillOpacity={0.45}
                  stroke={QTY_COLORS.bulk}
                  strokeOpacity={0.6}
                />
                <Scatter
                  name="Qty 1"
                  data={qty1Data}
                  fill={QTY_COLORS.one}
                  fillOpacity={0.7}
                  stroke={QTY_COLORS.one}
                  strokeWidth={0.8}
                />
                {/* Overall trend line */}
                <Scatter
                  name="Trend"
                  data={jittered}
                  shape={() => null}
                  line
                  lineType="fitting"
                  line={{ stroke: '#334155', strokeDasharray: '4 4', strokeWidth: 1.5 }}
                  legendType="none"
                />
                <Brush dataKey="x" height={18} stroke="#cbd5e1" travellerWidth={8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold cursor-pointer select-none" onClick={() => handleSort(index)}>
                      <div className="inline-flex items-center gap-1">
                        <span>{header}</span>
                        {sortColumn === index ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPricingRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cellIndex === quantityIdx ? ( // Quantity bucket display (1 or 1k+)
                          <Badge variant="outline">{normalizeQty(cell) === 1000 ? '1k+' : '1'}</Badge>
                        ) : cellIndex === 5 ? ( // Manufacturing cost
                          <Badge variant="secondary">${cell}</Badge>
                        ) : cellIndex === 8 ? ( // Lead time
                          <Badge variant="outline">{cell} days</Badge>
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Company Directory Layout - for Company Information, Company Roles, Directory
export function CompanyDirectoryLayout({ data, dataset: _dataset }: MarketDataLayoutProps) {
  const safeData = data || []
  const headers = safeData[0] || []
  const rows = safeData.slice(1)
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedDirRows = useMemo(() => {
    const arr = [...rows]
    if (sortColumn === null) return arr
    const parseVal = (v: any) => v?.toString().toLowerCase() || ''
    arr.sort((a, b) => {
      const av = parseVal(a[sortColumn!])
      const bv = parseVal(b[sortColumn!])
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [rows, sortColumn, sortDirection])

  const handleSort = (index: number) => {
    setSortColumn((prev) => {
      if (prev === index) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return index
    })
  }
  
  return (
    <div className="space-y-3">
      {/* Filters */}
      <FilterCard size="xxs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            <Select>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.from(new Set(
                  rows
                    .filter(row => row.length > 2 && row[2])
                    .map(row => row[2])
                    .filter(country => country && country.toString().trim())
                )).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger size="sm" className="h-6">
                <SelectValue placeholder="Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="public">Public Companies</SelectItem>
                <SelectItem value="subsidiary">Subsidiaries</SelectItem>
                <SelectItem value="independent">Independent</SelectItem>
              </SelectContent>
            </Select>
            
            <Button className="h-6" size="sm" variant="outline">
              Reset
            </Button>
          </div>
      </FilterCard>

      {/* Company Summary (compact) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        <KpiCard size="xxs" title="Total Companies" icon={Building2} value={rows.length} subtitle="Company records" />
        <KpiCard size="xxs" title="Countries" icon={MapPin} value={new Set(rows.map(row => row[2] || '')).size} subtitle="Global presence" />
        <KpiCard size="xxs" title="With Websites" icon={Search} value={rows.filter(row => row[1] && row[1].includes('http')).length} subtitle="Active websites" />
        <KpiCard size="xxs" title="Public Companies" icon={TrendingUp} value={rows.filter(row => row[4] && row[4].trim()).length} subtitle="Publicly traded" />
      </div>


      {/* Company Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold cursor-pointer select-none" onClick={() => handleSort(index)}>
                      <div className="inline-flex items-center gap-1">
                        <span>{header}</span>
                        {sortColumn === index ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDirRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cellIndex === 1 && cell?.includes('http') ? ( // Website column
                          <a 
                            href={cell} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visit Website
                          </a>
                        ) : cellIndex === 4 && cell ? ( // Stock column
                          <Badge variant="outline">{cell}</Badge>
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Generic Table Layout - fallback for other datasets
export function GenericTableLayout({ data, dataset }: MarketDataLayoutProps) {
  const safeData = data || []
  const headers = safeData[0] || []
  const rows = safeData.slice(1)
  
  // Dataset-specific mapping for filters, labels, and numeric columns
  const map = useMemo(() => {
    // Defaults: no special mapping
    const base = { nameIdx: -1, nameLabel: 'Name', segmentIdx: -1, segmentLabel: 'Segment', numericCols: [] as number[], revenueIdx: -1 }
    switch (dataset) {
      case 'am-market-revenue-2024':
        return { ...base, nameIdx: 1, nameLabel: 'Country', segmentIdx: 2, segmentLabel: 'Segment', numericCols: [0], revenueIdx: 0 }
      case 'revenue-by-industry-2024':
        return { ...base, nameIdx: 0, nameLabel: 'Industry', segmentIdx: 3, segmentLabel: 'Region', numericCols: [1,2], revenueIdx: 2 }
      case 'fundings-investments':
        return { ...base, nameIdx: 2, nameLabel: 'Company', segmentIdx: 3, segmentLabel: 'Country', numericCols: [0,4], revenueIdx: -1 }
      case 'mergers-acquisitions':
        return { ...base, nameIdx: 2, nameLabel: 'Acquiring Company', segmentIdx: 4, segmentLabel: 'Deal Status', numericCols: [3], revenueIdx: -1 }
      case 'print-services-pricing':
        return { ...base, nameIdx: 0, nameLabel: 'Company', segmentIdx: 3, segmentLabel: 'Process', numericCols: [4,5,8], revenueIdx: 5 }
      case 'company-information':
        return { ...base, nameIdx: 0, nameLabel: 'Company', segmentIdx: 2, segmentLabel: 'Country', numericCols: [], revenueIdx: -1 }
      case 'company-roles':
        return { ...base, nameIdx: 0, nameLabel: 'Company', segmentIdx: 1, segmentLabel: 'Category', numericCols: [], revenueIdx: -1 }
      case 'directory':
        return { ...base, nameIdx: 0, nameLabel: 'Figure', segmentIdx: 2, segmentLabel: 'V1', numericCols: [], revenueIdx: -1 }
      default:
        return base
    }
  }, [dataset])

  // Filters
  const [selectedName, setSelectedName] = useState<string>('all')
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const uniqueNames = useMemo(
    () => (map.nameIdx >= 0 ? Array.from(new Set(rows.map(r => r[map.nameIdx]).filter(Boolean))) : []),
    [rows, map.nameIdx]
  )
  const uniqueSegments = useMemo(
    () => (map.segmentIdx >= 0 ? Array.from(new Set(rows.map(r => r[map.segmentIdx]).filter(Boolean))) : []),
    [rows, map.segmentIdx]
  )

  const filteredRows = useMemo(() => {
    let out = rows
    if (map.nameIdx >= 0 && selectedName !== 'all') out = out.filter(r => r[map.nameIdx] === selectedName)
    if (map.segmentIdx >= 0 && selectedSegment !== 'all') out = out.filter(r => r[map.segmentIdx] === selectedSegment)
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      out = out.filter(r => r.some(c => c?.toString().toLowerCase().includes(q)))
    }
    return out
  }, [rows, selectedName, selectedSegment, searchTerm, map.nameIdx, map.segmentIdx])

  // Sorting
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const sortedRows = useMemo(() => {
    const numericCols: number[] = map.numericCols
    const arr = [...filteredRows]
    if (sortColumn === null) return arr
    const isNumeric = numericCols.includes(sortColumn)
    const parseVal = (v: any) => {
      if (v == null) return ''
      if (!isNumeric) return v.toString().toLowerCase()
      const num = parseFloat(v.toString().replace(/[^\d.-]/g, '') || '0')
      return isNaN(num) ? 0 : num
    }
    arr.sort((a, b) => {
      const av = parseVal(a[sortColumn!])
      const bv = parseVal(b[sortColumn!])
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filteredRows, sortColumn, sortDirection, map.numericCols])

  const handleSort = (index: number) => {
    setSortColumn((prev) => {
      if (prev === index) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return index
    })
  }

  // CSV export
  const exportCsv = () => {
    const rowsToExport = [headers, ...sortedRows]
    const csv = rowsToExport
      .map(r => r.map(cell => {
        const s = cell?.toString() ?? ''
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"'
        }
        return s
      }).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dataset}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className={compact.header}>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm capitalize">{dataset.replace(/-/g, ' ')}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{sortedRows.length} of {rows.length}</Badge>
              <Button size="sm" variant="outline" onClick={exportCsv}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={compact.content}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            {map.nameIdx >= 0 && (
              <Select value={selectedName} onValueChange={setSelectedName}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder={`Filter by ${map.nameLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueNames.map(n => (
                    <SelectItem key={n?.toString()} value={n?.toString() || ''}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {map.segmentIdx >= 0 && (
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder={`Filter by ${map.segmentLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueSegments.map(s => (
                    <SelectItem key={s?.toString()} value={s?.toString() || ''}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input 
              placeholder="Search..."
              className="h-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              className="h-8" 
              size="sm"
              variant="outline"
              onClick={() => { setSelectedName('all'); setSelectedSegment('all'); setSearchTerm('') }}
            >
              Reset
            </Button>
          </div>

          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold cursor-pointer select-none" onClick={() => handleSort(index)}>
                      <div className="inline-flex items-center gap-1">
                        <span>{header}</span>
                        {sortColumn === index ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {dataset === 'am-market-revenue-2024' && cellIndex === map.revenueIdx ? (
                          <Badge variant="secondary">
                            {(parseFloat(cell?.toString().replace(/[^\d.-]/g, '') || '0') / 1_000_000).toFixed(1)}M
                          </Badge>
                        ) : dataset === 'revenue-by-industry-2024' && cellIndex === map.revenueIdx ? (
                          <Badge variant="secondary">
                            {(parseFloat(cell?.toString().replace(/[^\d.-]/g, '') || '0') / 1_000_000).toFixed(1)}M
                          </Badge>
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
