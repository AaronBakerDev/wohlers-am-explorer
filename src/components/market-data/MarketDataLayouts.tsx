'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { BarChart3, TrendingUp, MapPin, Building2, Calendar, DollarSign, Filter, Search, Download, PieChart } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis } from 'recharts'
import { MarketTotalsChart } from '@/components/market-data/MarketTotalsChart'
import { MarketCountriesChart } from '@/components/market-data/MarketCountriesChart'

interface MarketDataLayoutProps {
  data: string[][]
  dataset: string
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
  if (!data || data.length === 0) return <div>No data available</div>
  
  const headers = data[0] || []
  const rows = data.slice(1)
  
  // Map column indices by dataset (some datasets have different column orders)
  const { revenueIdx, nameIdx, segmentIdx } = useMemo(() => {
    switch (dataset) {
      case 'revenue-by-industry-2024':
        // display columns: ['industry', 'share_of_revenue_percent', 'revenue_usd', 'region', 'material'] (id and created_at excluded)
        // Use industry as the display name, region as a segment-like grouping for filtering
        return { revenueIdx: 1, nameIdx: 0, segmentIdx: 3 }
      case 'am-market-revenue-2024':
      default:
        // display columns: ['revenue_usd', 'country', 'segment'] (id and created_at excluded)
        return { revenueIdx: 0, nameIdx: 1, segmentIdx: 2 }
    }
  }, [dataset])
  
  // State for filters
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
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
    
    if (searchTerm) {
      filteredRows = filteredRows.filter(row => 
        row.some(cell => cell?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    return filteredRows
  }, [rows, selectedSegment, selectedCountry, searchTerm])
  
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
  }, [processedData])
  
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
  }, [processedData])
  
  // Color palette for pie charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084A7'
  ]
  
  // Custom tooltip formatter
  const formatTooltip = (value: number, name: string) => {
    return [`$${(value / 1000000).toFixed(1)}M`, name]
  }
  
  // Get unique segments and countries for filters
  // Populate filter dropdowns from data
  const uniqueSegments = Array.from(new Set(rows.map(row => row[segmentIdx]).filter(Boolean)))
  const uniqueCountries = Array.from(new Set(rows.map(row => row[nameIdx]).filter(Boolean)))

  const segmentTotal = useMemo(() => segmentData.reduce((s, d) => s + (d.value || 0), 0), [segmentData])
  const countryTotal = useMemo(() => countryData.reduce((s, d) => s + (d.value || 0), 0), [countryData])
  
  return (
    <div className="space-y-6">
      {dataset === 'am-market-revenue-2024' ? (
        <MarketCountriesChart defaultYear={2024} />
      ) : null}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">Revenue data points</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries/Industries</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map(row => row[1] || '')).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map(row => row[2] || '')).size}
            </div>
            <p className="text-xs text-muted-foreground">Market segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.1M</div>
            <p className="text-xs text-muted-foreground">Per segment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.filter(country => country && country.toString().trim()).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger>
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {uniqueSegments.filter(segment => segment && segment.toString().trim()).map(segment => (
                  <SelectItem key={segment} value={segment.toString()}>{segment}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="Search revenue data..." 
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Button className="w-full" onClick={() => {
              setSelectedSegment('all')
              setSelectedCountry('all')
              setSearchTerm('')
            }}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts Section */}
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
                  <RechartsPieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`segment-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltip} />
                    <Legend />
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
                  <RechartsPieChart>
                    <Pie
                      data={countryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {countryData.map((entry, index) => (
                        <Cell key={`country-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltip} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.slice(0, 50).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cellIndex === 0 ? (
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
export function InvestmentAnalysisLayout({ data, dataset }: MarketDataLayoutProps) {
  if (!data || data.length === 0) return <div>No data available</div>
  
  const headers = data[0] || []
  const rows = data.slice(1)
  
  return (
    <div className="space-y-6">
      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">Investment rounds</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map(row => row[3] || '')).size}
            </div>
            <p className="text-xs text-muted-foreground">Active markets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funding Types</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map(row => row[5] || '')).size}
            </div>
            <p className="text-xs text-muted-foreground">Round types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Range</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2020-2024</div>
            <p className="text-xs text-muted-foreground">Investment period</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Timeline & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Investment Timeline & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.from(new Set(rows.map(row => row[0]).filter(year => year && year.toString().trim()))).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.from(new Set(rows.map(row => row[3]).filter(country => country && country.toString().trim()))).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Round Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Array.from(new Set(rows.map(row => row[5]).filter(type => type && type.toString().trim()))).map(type => (
                  <SelectItem key={type} value={type.toString()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input placeholder="Search companies..." />
            
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Timeline Chart
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row, rowIndex) => (
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
export function MergerAcquisitionLayout({ data, dataset }: MarketDataLayoutProps) {
  if (!data || data.length === 0) return <div>No data available</div>
  
  const headers = data[0] || []
  const rows = data.slice(1)
  
  return (
    <div className="space-y-6">
      {/* M&A Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">M&A transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Markets</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map(row => row[4] || '')).size}
            </div>
            <p className="text-xs text-muted-foreground">Countries involved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disclosed Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.filter(row => row[3] && row[3] !== '0').length}
            </div>
            <p className="text-xs text-muted-foreground">With deal size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2024</div>
            <p className="text-xs text-muted-foreground">Recent deals</p>
          </CardContent>
        </Card>
      </div>

      {/* M&A Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            M&A Deal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.from(new Set(rows.map(row => row[4]).filter(country => country && country.toString().trim()))).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Deal Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="disclosed">Disclosed Only</SelectItem>
                <SelectItem value="undisclosed">Undisclosed</SelectItem>
              </SelectContent>
            </Select>
            
            <Input placeholder="Search companies..." />
            
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Deal Flow Chart
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* M&A Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">M&A Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cellIndex === 3 ? ( // Deal size column
                          cell && cell !== '0' ? (
                            <Badge variant="secondary">${cell}M</Badge>
                          ) : (
                            <Badge variant="outline">Undisclosed</Badge>
                          )
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
export function PricingAnalysisLayout({ data, dataset }: MarketDataLayoutProps) {
  if (!data || data.length === 0) return <div>No data available</div>
  
  const headers = data[0] || []
  const rows = data.slice(1)
  
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
  
  // Filter data
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesProcess = selectedProcess === 'all' || row[processIdx] === selectedProcess
      const matchesMaterial = selectedMaterial === 'all' || row[materialIdx] === selectedMaterial
      const matchesCountry = selectedCountry === 'all' || row[countryIdx] === selectedCountry
      const matchesQuantity = selectedQuantity === 'all' || 
        (selectedQuantity === '1' && parseInt(row[quantityIdx]) === 1) ||
        (selectedQuantity === '1000' && parseInt(row[quantityIdx]) >= 1000)
      const matchesSearch = searchTerm === '' || 
        row[companyIdx]?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesProcess && matchesMaterial && matchesCountry && matchesQuantity && matchesSearch
    })
  }, [rows, selectedProcess, selectedMaterial, selectedCountry, selectedQuantity, searchTerm])
  
  // Prepare scatter plot data
  const scatterData = filteredRows.map((row, index) => ({
    x: parseInt(row[leadTimeIdx]) || 0, // Lead time (days)
    y: parseFloat(row[costIdx]) || 0,   // Manufacturing cost ($USD)
    country: row[countryIdx] || 'Unknown',
    company: row[companyIdx] || 'Unknown',
    process: row[processIdx] || 'Unknown',
    material: row[materialIdx] || 'Unknown',
    quantity: parseInt(row[quantityIdx]) || 0,
    z: parseInt(row[quantityIdx]) || 1 // Size of dots
  }))
  
  // Country colors
  const countryColors = {
    'U.S.': '#2563eb',      // Blue  
    'China': '#dc2626',      // Red
    'Germany': '#f59e0b',    // Orange/Yellow
    'Japan': '#16a34a',      // Green
    'UK': '#9333ea',         // Purple
    'France': '#06b6d4',     // Cyan
    'Italy': '#e11d48',      // Rose
    'Canada': '#0891b2',     // Sky
    'Netherlands': '#84cc16', // Lime
    'Unknown': '#6b7280'     // Gray
  }
  
  const getCountryColor = (country: string) => countryColors[country as keyof typeof countryColors] || '#6b7280'
  
  // Calculate averages for filtered data
  const avgLeadTime = filteredRows.length > 0 
    ? Math.round(filteredRows.reduce((sum, row) => sum + (parseInt(row[leadTimeIdx]) || 0), 0) / filteredRows.length)
    : 0
  const avgCost = filteredRows.length > 0
    ? Math.round(filteredRows.reduce((sum, row) => sum + (parseFloat(row[costIdx]) || 0), 0) / filteredRows.length)
    : 0
  
  return (
    <div className="space-y-6">
      {/* Pricing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRows.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredRows.length !== rows.length ? `${rows.length} total, ${filteredRows.length} filtered` : 'Price quotes'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Manufacturing cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLeadTime}</div>
            <p className="text-xs text-muted-foreground">Days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredRows.map(row => row[countryIdx] || '')).size}
            </div>
            <p className="text-xs text-muted-foreground">Active markets</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.from(new Set(rows.map(row => row[countryIdx]).filter(country => country && country.toString().trim()))).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger>
                <SelectValue placeholder="Process" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Processes</SelectItem>
                {Array.from(new Set(rows.map(row => row[processIdx]).filter(process => process && process.toString().trim()))).map(process => (
                  <SelectItem key={process} value={process.toString()}>{process}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {Array.from(new Set(rows.map(row => row[materialIdx]).filter(material => material && material.toString().trim()))).map(material => (
                  <SelectItem key={material} value={material.toString()}>{material}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedQuantity} onValueChange={setSelectedQuantity}>
              <SelectTrigger>
                <SelectValue placeholder="Production Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quantities</SelectItem>
                <SelectItem value="1">1 Unit (Prototype)</SelectItem>
                <SelectItem value="1000">1K+ Units (Production)</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="Search companies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Button 
              onClick={() => {
                setSelectedCountry('all')
                setSelectedProcess('all')
                setSelectedMaterial('all') 
                setSelectedQuantity('all')
                setSearchTerm('')
              }}
              variant="outline"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Manufacturing Cost vs Lead Time
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Scatter plot showing cost vs delivery time, colored by country. Larger dots indicate higher quantities.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  name="Lead Time"
                  unit=" days"
                  label={{ value: 'Lead Time (days)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="y" 
                  type="number" 
                  name="Cost"
                  unit=" USD"
                  label={{ value: 'Manufacturing Cost ($USD)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'Cost' ? `$${value.toLocaleString()}` : value,
                    name === 'Cost' ? 'Manufacturing Cost' : 'Lead Time'
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload
                      return `${data.company} (${data.country})`
                    }
                    return label
                  }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    borderRadius: '6px'
                  }}
                />
                {/* Group data points by country for different colors */}
                {Object.entries(
                  scatterData.reduce((acc, point) => {
                    if (!acc[point.country]) acc[point.country] = []
                    acc[point.country].push(point)
                    return acc
                  }, {} as Record<string, typeof scatterData>)
                ).map(([country, points]) => (
                  <Scatter
                    key={country}
                    name={country}
                    data={points}
                    fill={getCountryColor(country)}
                    fillOpacity={0.7}
                  />
                ))}
                <Legend />
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
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cellIndex === 5 ? ( // Manufacturing cost
                          <Badge variant="secondary">${cell}</Badge>
                        ) : cellIndex === 9 ? ( // Lead time
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
export function CompanyDirectoryLayout({ data, dataset }: MarketDataLayoutProps) {
  if (!data || data.length === 0) return <div>No data available</div>
  
  const headers = data[0] || []
  const rows = data.slice(1)
  
  return (
    <div className="space-y-6">
      {/* Company Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">Company records</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map(row => row[2] || '')).size}
            </div>
            <p className="text-xs text-muted-foreground">Global presence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Websites</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.filter(row => row[1] && row[1].includes('http')).length}
            </div>
            <p className="text-xs text-muted-foreground">Active websites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Companies</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.filter(row => row[4] && row[4].trim()).length}
            </div>
            <p className="text-xs text-muted-foreground">Publicly traded</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Directory Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Directory & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {Array.from(new Set(rows.map(row => row[2]).filter(country => country && country.toString().trim()))).map(country => (
                  <SelectItem key={country} value={country.toString()}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="public">Public Companies</SelectItem>
                <SelectItem value="subsidiary">Subsidiaries</SelectItem>
                <SelectItem value="independent">Independent</SelectItem>
              </SelectContent>
            </Select>
            
            <Input placeholder="Search companies..." />
            
            <Button>
              <MapPin className="h-4 w-4 mr-2" />
              View on Map
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row, rowIndex) => (
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
  if (!data || data.length === 0) return <div>No data available</div>
  
  const headers = data[0] || []
  const rows = data.slice(1)
  
  return (
    <div className="space-y-6">
      {/* Generic Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground">Data entries</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Columns</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{headers.length}</div>
            <p className="text-xs text-muted-foreground">Data fields</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Export</Button>
              <Button size="sm" variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generic Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg capitalize">{dataset.replace(/-/g, ' ')} Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
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
