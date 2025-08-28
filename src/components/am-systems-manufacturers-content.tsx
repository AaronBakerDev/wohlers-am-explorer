'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search,
  Building2,
  Globe,
  Settings,
  RefreshCw,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"

// Type definitions
type AMSystemsManufacturer = {
  id: string
  company_name: string
  segment: string
  process: string
  material_format: string
  material_type: string
  country: string
  website?: string
  headquarters_city?: string
  founded_year?: number
  employee_count_range?: string
  annual_revenue_range?: string
  primary_market?: string
}

type FilterState = {
  search: string
  segment: string
  process: string
  material_format: string
  material_type: string
  country: string
}

export default function AMSystemsManufacturersContent() {
  const [data, setData] = useState<AMSystemsManufacturer[]>([])
  const [filteredData, setFilteredData] = useState<AMSystemsManufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    segment: '',
    process: '',
    material_format: '',
    material_type: '',
    country: ''
  })

  type SortKey = 'company_name' | 'segment' | 'process' | 'material_format' | 'material_type' | 'country'
  type SortState = { key: SortKey, direction: 'asc' | 'desc' }
  const [sort, setSort] = useState<SortState>({ key: 'company_name', direction: 'asc' })

  // Sample data for development (fallback only)
  const sampleData: AMSystemsManufacturer[] = [
    {
      id: '1',
      company_name: 'EOS GmbH',
      segment: 'Industrial',
      process: 'DMLS',
      material_format: 'Powder',
      material_type: 'Metal',
      country: 'Germany',
      website: 'https://eos.info',
      headquarters_city: 'Krailling',
      founded_year: 1989,
      employee_count_range: '500+',
      annual_revenue_range: '$50M+',
      primary_market: 'Aerospace'
    },
    {
      id: '2',
      company_name: 'Stratasys Fortus',
      segment: 'Industrial',
      process: 'FDM',
      material_format: 'Filament',
      material_type: 'Thermoplastic',
      country: 'United States',
      website: 'https://stratasys.com',
      headquarters_city: 'Eden Prairie',
      founded_year: 1988,
      employee_count_range: '500+',
      annual_revenue_range: '$50M+',
      primary_market: 'Automotive'
    },
    {
      id: '3',
      company_name: 'Formlabs Form 3L',
      segment: 'Professional',
      process: 'SLA',
      material_format: 'Resin',
      material_type: 'Thermoset',
      country: 'United States',
      website: 'https://formlabs.com',
      headquarters_city: 'Somerville',
      founded_year: 2011,
      employee_count_range: '201-500',
      annual_revenue_range: '$10M-$50M',
      primary_market: 'Healthcare'
    },
    {
      id: '4',
      company_name: 'Ultimaker S5',
      segment: 'Professional',
      process: 'FDM',
      material_format: 'Filament',
      material_type: 'Thermoplastic',
      country: 'Netherlands',
      website: 'https://ultimaker.com',
      headquarters_city: 'Geldermalsen',
      founded_year: 2011,
      employee_count_range: '201-500',
      annual_revenue_range: '$10M-$50M',
      primary_market: 'Industrial'
    },
    {
      id: '5',
      company_name: 'Prusa i3 MK3S+',
      segment: 'Desktop',
      process: 'FDM',
      material_format: 'Filament',
      material_type: 'Thermoplastic',
      country: 'Czech Republic',
      website: 'https://prusa3d.com',
      headquarters_city: 'Prague',
      founded_year: 2012,
      employee_count_range: '51-200',
      annual_revenue_range: '$10M-$50M',
      primary_market: 'Consumer'
    }
  ]

  // Load data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        // Supabase mode
        const supabase = createClient()
        const { data: rows, error } = await supabase
          .from('vendor_am_systems_manufacturers' as any)
          .select(
            'id, company_name, segment, process, material_format, material_type, country'
          )
          .limit(5000)
        if (error) throw new Error(error.message)
        if (rows && rows.length) {
          setData(rows as unknown as AMSystemsManufacturer[])
          setFilteredData(rows as unknown as AMSystemsManufacturer[])
        } else {
          // Fallback to sample in case of empty
          setData(sampleData)
          setFilteredData(sampleData)
        }
      } catch (err) {
        console.error('AM Systems Manufacturers load error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
        // Fallback to sample data to keep UI usable
        setData(sampleData)
        setFilteredData(sampleData)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = data

    // Text search across multiple fields
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item => 
        item.company_name.toLowerCase().includes(searchLower) ||
        item.country.toLowerCase().includes(searchLower) ||
        item.primary_market?.toLowerCase().includes(searchLower)
      )
    }

    // Dropdown filters
    if (filters.segment && filters.segment !== 'all') {
      filtered = filtered.filter(item => item.segment === filters.segment)
    }
    if (filters.process && filters.process !== 'all') {
      filtered = filtered.filter(item => item.process === filters.process)
    }
    if (filters.material_format && filters.material_format !== 'all') {
      filtered = filtered.filter(item => item.material_format === filters.material_format)
    }
    if (filters.material_type && filters.material_type !== 'all') {
      filtered = filtered.filter(item => item.material_type === filters.material_type)
    }
    if (filters.country && filters.country !== 'all') {
      filtered = filtered.filter(item => item.country === filters.country)
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      const key = sort.key
      const aVal = (a[key] ?? '').toString().toLowerCase()
      const bVal = (b[key] ?? '').toString().toLowerCase()
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredData(sorted)
  }, [filters, data, sort])

  // Get unique values for filter dropdowns
  const uniq = (arr: (string | null | undefined)[]) =>
    [...new Set(arr.map(v => (v ?? '').toString().trim()))]
      .filter(v => v.length > 0)
      .sort()
  const uniqueValues = {
    segments: uniq(data.map(item => item.segment)),
    processes: uniq(data.map(item => item.process)),
    materialFormats: uniq(data.map(item => item.material_format)),
    materialTypes: uniq(data.map(item => item.material_type)),
    countries: uniq(data.map(item => item.country))
  }

  const toggleSort = (key: SortKey) => {
    setSort(prev => prev.key === key
      ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' }
    )
  }

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sort.key !== column) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
    return sort.direction === 'asc' 
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
  }

  const handleExport = () => {
    // Convert to CSV
    const headers = ['Company Name', 'Segment', 'Process', 'Material Format', 'Material Type', 'Country']
    const csvData = [
      headers,
      ...filteredData.map(item => [
        item.company_name,
        item.segment,
        item.process,
        item.material_format,
        item.material_type,
        item.country
      ])
    ]
    
    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'am-systems-manufacturers.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading AM Systems Manufacturers data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AM Systems Manufacturers</h2>
            <Badge variant="secondary">{filteredData.length} manufacturers</Badge>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.segment} onValueChange={(value) => setFilters(prev => ({ ...prev, segment: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {uniqueValues.segments.map(segment => (
                <SelectItem key={segment} value={segment}>{segment}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.process} onValueChange={(value) => setFilters(prev => ({ ...prev, process: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Process" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Processes</SelectItem>
              {uniqueValues.processes.map(process => (
                <SelectItem key={process} value={process}>{process}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.material_format} onValueChange={(value) => setFilters(prev => ({ ...prev, material_format: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Material Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {uniqueValues.materialFormats.map(fmt => (
                <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.material_type} onValueChange={(value) => setFilters(prev => ({ ...prev, material_type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Material Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {uniqueValues.materialTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.country} onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {uniqueValues.countries.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => setFilters({ search: '', segment: '', process: '', material_format: '', material_type: '', country: '' })}
            className="text-muted-foreground"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead onClick={() => toggleSort('company_name')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Company Name<SortIndicator column="company_name" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('segment')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Segment<SortIndicator column="segment" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('process')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Process<SortIndicator column="process" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('material_format')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Material Format<SortIndicator column="material_format" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('material_type')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Material Type<SortIndicator column="material_type" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('country')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Country<SortIndicator column="country" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((manufacturer) => (
              <TableRow key={manufacturer.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {manufacturer.website ? (
                      <a 
                        href={manufacturer.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {manufacturer.company_name}
                      </a>
                    ) : (
                      manufacturer.company_name
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={manufacturer.segment === 'Industrial' ? 'default' : 
                             manufacturer.segment === 'Professional' ? 'secondary' : 'outline'}
                  >
                    {manufacturer.segment}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {manufacturer.process}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{manufacturer.material_format}</TableCell>
                <TableCell>
                  <Badge 
                    variant={manufacturer.material_type === 'Metal' ? 'default' : 'secondary'}
                    className={manufacturer.material_type === 'Metal' ? 'bg-blue-100 text-blue-800' : ''}
                  >
                    {manufacturer.material_type}
                  </Badge>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {manufacturer.country}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No manufacturers found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms to find AM systems manufacturers.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
