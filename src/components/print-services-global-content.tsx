'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu"
import { 
  Search,
  PrinterIcon,
  Globe,
  Factory,
  RefreshCw,
  Download,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  ChevronDown
} from "lucide-react"
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Type definitions
type PrintServiceProvider = {
  id: string
  company_name: string
  segment: string
  printer_manufacturer: string
  printer_model: string
  number_of_printers: number
  count_type: 'Exact' | 'Estimated' | 'Range' | 'Minimum'
  process: string
  material_type: string
  material_format: string
  country: string
  update_year: number
  website?: string
  headquarters_city?: string
  founded_year?: number
  employee_count_range?: string
  services_offered?: string[]
  industries_served?: string[]
  certifications?: string[]
}

type FilterState = {
  company_name: string
  segment: string
  printer_manufacturer: string
  printer_model: string
  number_of_printers_min: string
  number_of_printers_max: string
  count_type: string
  process: string
  material_type: string
  material_format: string
  country: string
  update_year: string
}

export default function PrintServicesGlobalContent() {
  const [data, setData] = useState<PrintServiceProvider[]>([])
  const [filteredData, setFilteredData] = useState<PrintServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialFilters: FilterState = useMemo(() => ({
    company_name: (searchParams?.get('company_name') || '').toString(),
    segment: (searchParams?.get('segment') || 'all').toString(),
    printer_manufacturer: (searchParams?.get('manufacturer') || 'all').toString(),
    printer_model: (searchParams?.get('model') || 'all').toString(),
    number_of_printers_min: (searchParams?.get('min_printers') || '').toString(),
    number_of_printers_max: (searchParams?.get('max_printers') || '').toString(),
    count_type: (searchParams?.get('count_type') || 'all').toString(),
    process: (searchParams?.get('process') || 'all').toString(),
    material_type: (searchParams?.get('material_type') || 'all').toString(),
    material_format: (searchParams?.get('material_format') || 'all').toString(),
    country: (searchParams?.get('country') || 'all').toString(),
    update_year: (searchParams?.get('update_year') || 'all').toString(),
  }), [searchParams])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const debouncedCompany = useDebouncedValue(filters.company_name, 300)

  type SortKey = 'company_name' | 'segment' | 'printer_manufacturer' | 'printer_model' | 'number_of_printers' | 'count_type' | 'process' | 'material_type' | 'material_format' | 'country' | 'update_year'
  type SortState = { key: SortKey, direction: 'asc' | 'desc' }
  const [sort, setSort] = useState<SortState>({ key: 'company_name', direction: 'asc' })


  // Sample data for development (fallback only)
  const sampleData: PrintServiceProvider[] = [
    {
      id: '1',
      company_name: 'Protolabs',
      segment: 'Manufacturing',
      printer_manufacturer: 'Stratasys',
      printer_model: 'Fortus 450mc',
      number_of_printers: 25,
      count_type: 'Exact',
      process: 'FDM',
      material_type: 'Thermoplastic',
      material_format: 'Filament',
      country: 'United States',
      update_year: 2024,
      website: 'https://protolabs.com',
      headquarters_city: 'Maple Plain',
      founded_year: 1999,
      employee_count_range: '500+',
      services_offered: ['Rapid prototyping', 'Low-volume production', 'CNC machining'],
      industries_served: ['Automotive', 'Aerospace', 'Medical'],
      certifications: ['ISO 9001', 'AS9100', 'ISO 13485']
    },
    {
      id: '2',
      company_name: '3D Hubs',
      segment: 'Service Bureau',
      printer_manufacturer: 'HP',
      printer_model: 'Multi Jet Fusion 5200',
      number_of_printers: 15,
      count_type: 'Estimated',
      process: 'MJF',
      material_type: 'Thermoplastic',
      material_format: 'Powder',
      country: 'United States',
      update_year: 2024,
      website: 'https://3dhubs.com',
      headquarters_city: 'New York',
      founded_year: 2013,
      employee_count_range: '201-500',
      services_offered: ['On-demand manufacturing', 'Prototyping', 'End-use parts'],
      industries_served: ['Industrial', 'Automotive', 'Consumer electronics'],
      certifications: ['ISO 9001']
    },
    {
      id: '3',
      company_name: 'GE Additive Services',
      segment: 'Manufacturing',
      printer_manufacturer: 'EOS',
      printer_model: 'M400-4',
      number_of_printers: 8,
      count_type: 'Exact',
      process: 'DMLS',
      material_type: 'Metal',
      material_format: 'Powder',
      country: 'United States',
      update_year: 2024,
      website: 'https://ge.com/additive',
      headquarters_city: 'Cincinnati',
      founded_year: 2016,
      employee_count_range: '500+',
      services_offered: ['Metal 3D printing', 'Post-processing', 'Design optimization'],
      industries_served: ['Aerospace', 'Power generation', 'Oil and gas'],
      certifications: ['AS9100', 'ISO 9001', 'Nadcap']
    },
    {
      id: '4',
      company_name: 'Materialise Manufacturing',
      segment: 'Manufacturing',
      printer_manufacturer: 'EOS',
      printer_model: 'P396',
      number_of_printers: 22,
      count_type: 'Exact',
      process: 'SLS',
      material_type: 'Thermoplastic',
      material_format: 'Powder',
      country: 'Belgium',
      update_year: 2024,
      website: 'https://materialise.com',
      headquarters_city: 'Leuven',
      founded_year: 1990,
      employee_count_range: '500+',
      services_offered: ['Medical devices', 'Automotive parts', 'Aerospace components'],
      industries_served: ['Medical', 'Automotive', 'Aerospace'],
      certifications: ['ISO 13485', 'ISO 9001', 'AS9100', 'FDA registered']
    },
    {
      id: '5',
      company_name: 'UnionTech',
      segment: 'Manufacturing',
      printer_manufacturer: 'UnionTech',
      printer_model: 'RSPro 600',
      number_of_printers: 35,
      count_type: 'Exact',
      process: 'SLA',
      material_type: 'Thermoset',
      material_format: 'Resin',
      country: 'China',
      update_year: 2024,
      website: 'https://uniontech3d.com',
      headquarters_city: 'Shanghai',
      founded_year: 2000,
      employee_count_range: '500+',
      services_offered: ['Large-format printing', 'Automotive prototyping', 'Consumer goods'],
      industries_served: ['Automotive', 'Consumer electronics', 'Industrial'],
      certifications: ['ISO 9001']
    },
    {
      id: '6',
      company_name: 'Formlabs Service Network',
      segment: 'Medical',
      printer_manufacturer: 'Formlabs',
      printer_model: 'Form 3B+',
      number_of_printers: 12,
      count_type: 'Range',
      process: 'SLA',
      material_type: 'Thermoset',
      material_format: 'Resin',
      country: 'Germany',
      update_year: 2024,
      website: 'https://formlabs.com',
      headquarters_city: 'Berlin',
      founded_year: 2018,
      employee_count_range: '11-50',
      services_offered: ['Dental applications', 'Medical devices', 'Biocompatible parts'],
      industries_served: ['Dental', 'Healthcare', 'Research'],
      certifications: ['ISO 13485', 'FDA registered']
    }
  ]

  // Load data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'csv') {
          const res = await fetch('/api/datasets/print-services-global')
          if (!res.ok) throw new Error(`Failed to fetch CSV data (${res.status})`)
          const json = await res.json()
          const rows = (json?.data || []) as PrintServiceProvider[]
          if (rows.length) {
            setData(rows)
            setFilteredData(rows)
            return
          }
        }

        // Supabase mode - use the vendor_print_services_global table
        const supabase = createClient()
        const { data: rows, error } = await supabase
          .from('vendor_print_services_global')
          .select('*')
          .limit(5000)
        if (error) throw new Error(error.message)
        if (rows && rows.length) {
          // Map count_type text defensively
          const norm = (v: any): 'Exact' | 'Estimated' | 'Range' | 'Minimum' => {
            const s = String(v || '').toLowerCase()
            if (s === 'actual' || s === 'exact') return 'Exact'
            if (s === 'minimum' || s === 'min') return 'Minimum'
            if (s === 'range') return 'Range'
            return 'Estimated'
          }
          const mapped = (rows as any[]).map((r) => ({ ...r, count_type: norm(r.count_type) }))
          setData(mapped as unknown as PrintServiceProvider[])
          setFilteredData(mapped as unknown as PrintServiceProvider[])
        } else {
          // Fallback to sample in case of empty
          setData(sampleData)
          setFilteredData(sampleData)
        }
      } catch (err) {
        console.error('Print Services Global load error:', err)
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

  // Sync filters to URL (omit defaults/empties for cleanliness) with change guard
  const lastQueryRef = useRef<string | null>(null)
  useEffect(() => {
    const url = new URL(window.location.href)
    const setOrDelete = (key: string, val: string) => {
      const v = (val || '').trim()
      if (!v || v === 'all') url.searchParams.delete(key)
      else url.searchParams.set(key, v)
    }
    setOrDelete('company_name', filters.company_name)
    setOrDelete('segment', filters.segment)
    setOrDelete('manufacturer', filters.printer_manufacturer)
    setOrDelete('model', filters.printer_model)
    setOrDelete('min_printers', filters.number_of_printers_min)
    setOrDelete('max_printers', filters.number_of_printers_max)
    setOrDelete('count_type', filters.count_type)
    setOrDelete('process', filters.process)
    setOrDelete('material_type', filters.material_type)
    setOrDelete('material_format', filters.material_format)
    setOrDelete('country', filters.country)
    setOrDelete('update_year', filters.update_year)
    const next = `${pathname}?${url.searchParams.toString()}`
    if (lastQueryRef.current !== next) {
      lastQueryRef.current = next
      router.replace(next)
    }
  }, [filters, router, pathname])

  // Apply filters
  useEffect(() => {
    let filtered = data

    // Company name filter
    if (debouncedCompany) {
      const nameLower = debouncedCompany.toLowerCase()
      filtered = filtered.filter(item => item.company_name.toLowerCase().includes(nameLower))
    }

    // Dropdown filters
    if (filters.segment && filters.segment !== 'all') {
      filtered = filtered.filter(item => item.segment === filters.segment)
    }
    if (filters.printer_manufacturer && filters.printer_manufacturer !== 'all') {
      filtered = filtered.filter(item => item.printer_manufacturer === filters.printer_manufacturer)
    }
    if (filters.printer_model && filters.printer_model !== 'all') {
      filtered = filtered.filter(item => item.printer_model === filters.printer_model)
    }
    if (filters.count_type && filters.count_type !== 'all') {
      filtered = filtered.filter(item => item.count_type === filters.count_type)
    }
    if (filters.process && filters.process !== 'all') {
      filtered = filtered.filter(item => item.process === filters.process)
    }
    if (filters.material_type && filters.material_type !== 'all') {
      filtered = filtered.filter(item => item.material_type === filters.material_type)
    }
    if (filters.material_format && filters.material_format !== 'all') {
      filtered = filtered.filter(item => item.material_format === filters.material_format)
    }
    if (filters.country && filters.country !== 'all') {
      filtered = filtered.filter(item => item.country === filters.country)
    }
    if (filters.update_year && filters.update_year !== 'all') {
      filtered = filtered.filter(item => item.update_year.toString() === filters.update_year)
    }

    // Number of printers range
    const minStr = filters.number_of_printers_min.trim()
    const maxStr = filters.number_of_printers_max.trim()
    if (minStr !== '') {
      const min = Number(minStr)
      if (!Number.isNaN(min)) filtered = filtered.filter(item => item.number_of_printers >= min)
    }
    if (maxStr !== '') {
      const max = Number(maxStr)
      if (!Number.isNaN(max)) filtered = filtered.filter(item => item.number_of_printers <= max)
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      const key = sort.key
      if (key === 'number_of_printers' || key === 'update_year') {
        const av = (a as any)[key] ?? 0
        const bv = (b as any)[key] ?? 0
        return sort.direction === 'asc' ? av - bv : bv - av
      }
      const aVal = ((a as any)[key] ?? '').toString().toLowerCase()
      const bVal = ((b as any)[key] ?? '').toString().toLowerCase()
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
    setFilteredData(sorted)
  }, [filters, data, sort, debouncedCompany])

  // Get unique values for filter dropdowns
  const uniq = (arr: (string | null | undefined)[]) =>
    [...new Set(arr.map(v => (v ?? '').toString().trim()))]
      .filter(v => v.length > 0)
      .sort()
  const uniqueValues = {
    segments: uniq(data.map(item => item.segment)),
    manufacturers: uniq(data.map(item => item.printer_manufacturer)),
    models: uniq(data.map(item => item.printer_model)),
    processes: uniq(data.map(item => item.process)),
    materialTypes: uniq(data.map(item => item.material_type)),
    materialFormats: uniq(data.map(item => item.material_format)),
    countries: uniq(data.map(item => item.country)),
    updateYears: [...new Set(data.map(item => item.update_year))].filter(Boolean as any).sort((a, b) => b - a)
  }

  // Dependent: models for currently selected manufacturer (if any)
  const modelsForManufacturer = useMemo(() => {
    if (!filters.printer_manufacturer || filters.printer_manufacturer === 'all') return uniqueValues.models
    return uniq(
      data
        .filter(d => d.printer_manufacturer === filters.printer_manufacturer)
        .map(d => d.printer_model)
    )
  }, [filters.printer_manufacturer, data])

  const activeFilterCount = useMemo(() => {
    const entries: Array<[keyof FilterState, string]> = Object.entries(filters) as any
    return entries.reduce((acc, [, v]) => acc + ((v && v !== 'all') ? 1 : 0), 0)
  }, [filters])

  const clearFilters = () => {
    setFilters({
      company_name: '',
      segment: 'all',
      printer_manufacturer: 'all',
      printer_model: 'all',
      number_of_printers_min: '',
      number_of_printers_max: '',
      count_type: 'all',
      process: 'all',
      material_type: 'all',
      material_format: 'all',
      country: 'all',
      update_year: 'all'
    })
  }

  // Lightweight searchable dropdown using DropdownMenu + Input
  function SearchableDropdown({
    label,
    options,
    value,
    onChange,
    disabled = false,
    className = '',
  }: {
    label: string
    options: string[]
    value: string
    onChange: (v: string) => void
    disabled?: boolean
    className?: string
  }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase()
      const opts = ['all', ...options]
      if (!q) return opts
      return opts.filter(o => (o === 'all' ? 'all' : o).toLowerCase().includes(q))
    }, [options, query])
    const display = value === 'all' ? `All ${label}` : value
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`justify-between ${className}`} disabled={disabled}>
            <span className="truncate max-w-[180px] text-left">{display || label}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 p-0">
          <div className="p-2 border-b border-border">
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <DropdownMenuRadioGroup value={value} onValueChange={(v) => { onChange(v); setOpen(false) }}>
            <DropdownMenuRadioItem value="all">All {label}</DropdownMenuRadioItem>
            {filtered.filter(v => v !== 'all').map((opt) => (
              <DropdownMenuRadioItem key={opt} value={opt}>{opt}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Calculate summary statistics
  const totalPrinters = filteredData.reduce((sum, item) => sum + item.number_of_printers, 0)
  const avgPrintersPerProvider = filteredData.length > 0 ? (totalPrinters / filteredData.length).toFixed(1) : '0'

  const handleExport = () => {
    // Convert to CSV
    const headers = [
      'Company Name', 'Segment', 'Printer Manufacturer', 'Printer Model', 
      'Number of Printers', 'Count Type', 'Process', 'Material Type', 
      'Material Format', 'Country', 'Update Year', 'City', 'Founded'
    ]
    const csvData = [
      headers,
      ...filteredData.map(item => [
        item.company_name,
        item.segment,
        item.printer_manufacturer,
        item.printer_model,
        item.number_of_printers.toString(),
        item.count_type,
        item.process,
        item.material_type,
        item.material_format,
        item.country,
        item.update_year.toString(),
        item.headquarters_city || '',
        item.founded_year?.toString() || ''
      ])
    ]
    
    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'print-services-global.csv'
    a.click()
    window.URL.revokeObjectURL(url)
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading Global Printing Services data...
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
            <PrinterIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Global Printing Services</h2>
            <Badge variant="secondary">{filteredData.length} providers</Badge>
            <Badge variant="outline">{totalPrinters} printers</Badge>
            <Badge variant="outline">Avg: {avgPrintersPerProvider} per provider</Badge>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8 gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Company name"
              value={filters.company_name}
              onChange={(e) => setFilters(prev => ({ ...prev, company_name: e.target.value }))}
              className="pl-10"
            />
          </div>

          <Select value={filters.segment} onValueChange={(value) => setFilters(prev => ({ ...prev, segment: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {uniqueValues.segments.map(segment => (
                <SelectItem key={segment} value={segment}>{segment}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SearchableDropdown
            label="Manufacturers"
            options={uniqueValues.manufacturers}
            value={filters.printer_manufacturer}
            onChange={(value) => setFilters(prev => ({ ...prev, printer_manufacturer: value, printer_model: 'all' }))}
            className="h-10"
          />

          <SearchableDropdown
            label="Models"
            options={modelsForManufacturer}
            value={filters.printer_model}
            onChange={(value) => setFilters(prev => ({ ...prev, printer_model: value }))}
            disabled={filters.printer_manufacturer === 'all'}
            className="h-10"
          />

          {/* Printers range (single grouped control) */}
          <div className="flex items-center gap-2 rounded-md border border-border px-2 h-10">
            <span className="text-xs text-muted-foreground">Printers</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={filters.number_of_printers_min}
              onChange={(e) => setFilters(prev => ({ ...prev, number_of_printers_min: e.target.value }))}
              className="h-8 w-20"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={filters.number_of_printers_max}
              onChange={(e) => setFilters(prev => ({ ...prev, number_of_printers_max: e.target.value }))}
              className="h-8 w-20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={filters.count_type} onValueChange={(value) => setFilters(prev => ({ ...prev, count_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Count Types</SelectItem>
                {['Exact','Estimated','Range','Minimum'].map(ct => (
                  <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Exact: reported counts. Minimum: lower bound. Range: range reported. Estimated: inferred/approximate.
              </TooltipContent>
            </Tooltip>
          </div>

          <Select value={filters.process} onValueChange={(value) => setFilters(prev => ({ ...prev, process: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Processes</SelectItem>
              {uniqueValues.processes.map(process => (
                <SelectItem key={process} value={process}>{process}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.material_type} onValueChange={(value) => setFilters(prev => ({ ...prev, material_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {uniqueValues.materialTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.material_format} onValueChange={(value) => setFilters(prev => ({ ...prev, material_format: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {uniqueValues.materialFormats.map(fmt => (
                <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SearchableDropdown
            label="Countries"
            options={uniqueValues.countries}
            value={filters.country}
            onChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
            className="h-10"
          />

          <Select value={filters.update_year} onValueChange={(value) => setFilters(prev => ({ ...prev, update_year: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {uniqueValues.updateYears.map((yr) => (
                <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="text-muted-foreground"
            disabled={activeFilterCount === 0}
          >
            Reset ({activeFilterCount})
          </Button>
        </div>

        {/* Active filter chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.company_name && (
            <Badge variant="secondary" className="text-xs pr-1">
              Company: {filters.company_name}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, company_name: '' }))}>×</button>
            </Badge>
          )}
          {filters.segment !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Segment: {filters.segment}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, segment: 'all' }))}>×</button>
            </Badge>
          )}
          {filters.printer_manufacturer !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Mfr: {filters.printer_manufacturer}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, printer_manufacturer: 'all' }))}>×</button>
            </Badge>
          )}
          {filters.printer_model !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Model: {filters.printer_model}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, printer_model: 'all' }))}>×</button>
            </Badge>
          )}
          {(filters.number_of_printers_min || filters.number_of_printers_max) && (
            <Badge variant="secondary" className="text-xs pr-1">
              Printers: {filters.number_of_printers_min || '0'}–{filters.number_of_printers_max || '∞'}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, number_of_printers_min: '', number_of_printers_max: '' }))}>×</button>
            </Badge>
          )}
          {filters.count_type !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Count: {filters.count_type}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, count_type: 'all' }))}>×</button>
            </Badge>
          )}
          {filters.process !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Process: {filters.process}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, process: 'all' }))}>×</button>
            </Badge>
          )}
          {filters.material_type !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Material: {filters.material_type}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, material_type: 'all' }))}>×</button>
            </Badge>
          )}
          {filters.material_format !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Format: {filters.material_format}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, material_format: 'all' }))}>×</button>
            </Badge>
          )}
          {filters.country !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Country: {filters.country}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, country: 'all' }))}>×</button>
            </Badge>
          )}
          {filters.update_year !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Year: {filters.update_year}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, update_year: 'all' }))}>×</button>
            </Badge>
          )}
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead onClick={() => toggleSort('company_name')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Company Name<SortIndicator column="company_name" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('segment')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Segment<SortIndicator column="segment" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('printer_manufacturer')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Printer Manufacturer<SortIndicator column="printer_manufacturer" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('printer_model')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Printer Model<SortIndicator column="printer_model" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('number_of_printers')} className="cursor-pointer select-none text-right">
                <div className="inline-flex items-center">Printers<SortIndicator column="number_of_printers" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('count_type')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Count Type<SortIndicator column="count_type" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('process')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Process<SortIndicator column="process" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('material_type')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Material Type<SortIndicator column="material_type" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('material_format')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Material Format<SortIndicator column="material_format" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('country')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Country<SortIndicator column="country" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('update_year')} className="cursor-pointer select-none text-center">
                <div className="inline-flex items-center">Update Year<SortIndicator column="update_year" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((provider) => (
              <TableRow key={provider.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {provider.website ? (
                      <a 
                        href={provider.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {provider.company_name}
                      </a>
                    ) : (
                      provider.company_name
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={provider.segment === 'Manufacturing' ? 'default' : 
                             provider.segment === 'Medical' ? 'secondary' : 'outline'}
                  >
                    {provider.segment}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{provider.printer_manufacturer}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{provider.printer_model}</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {provider.number_of_printers}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={provider.count_type === 'Exact' ? 'default' : 'outline'}
                    className={provider.count_type === 'Exact' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {provider.count_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    <button onClick={() => setFilters(prev => ({ ...prev, process: provider.process || 'all' }))}>
                      {provider.process}
                    </button>
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={provider.material_type === 'Metal' ? 'default' : 'secondary'}
                    className={provider.material_type === 'Metal' ? 'bg-blue-100 text-blue-800' : ''}
                  >
                    <button onClick={() => setFilters(prev => ({ ...prev, material_type: provider.material_type || 'all' }))}>
                      {provider.material_type}
                    </button>
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{provider.material_format}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <button className="hover:underline" onClick={() => setFilters(prev => ({ ...prev, country: provider.country || 'all' }))}>
                    {provider.country}
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{provider.update_year}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Factory className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No print services found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms to find print service providers.
            </p>
          </div>
        )}
      </div>

      {/* Mobile list view */}
      <div className="md:hidden flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {filteredData.map((provider) => (
            <div key={provider.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{provider.company_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{provider.printer_manufacturer} • {provider.printer_model || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{provider.number_of_printers}</div>
                  <div className="text-[10px] text-muted-foreground">Printers</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={provider.segment === 'Manufacturing' ? 'default' : provider.segment === 'Medical' ? 'secondary' : 'outline'}>
                    {provider.segment}
                  </Badge>
                  <Badge variant="outline" className="font-mono">{provider.process}</Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-3 w-3" /> {provider.country}
                </div>
              </div>
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">No print services found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
