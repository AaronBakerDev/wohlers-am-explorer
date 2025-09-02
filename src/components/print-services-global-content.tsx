'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CompanyWithCapabilities } from '@/lib/types/unified'
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
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  ChevronDown
} from "lucide-react"
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ExportButton from '@/components/ExportButton'
import type { ColumnDef } from '@/lib/export'

// Type definitions
type PrintServiceProvider = CompanyWithCapabilities & {
  // Vendor row-level fields used for filtering and display
  printer_manufacturer?: string | null
  printer_model?: string | null
  number_of_printers?: number | null
  count_type?: string | null
  process?: string | null
  material_type?: string | null
  material_format?: string | null
  update_year?: number | null
}

type FilterState = {
  company_name: string
  country: string
  segment: string
  technologies: string[]
  materials: string[]
  services: string[]
  // New filters for vendor-specific fields
  printer_manufacturer: string
  printer_model: string
  process: string
  material_type: string
  count_type: string
  min_printers: string
  max_printers: string
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
    country: (searchParams?.get('country') || 'all').toString(),
    segment: (searchParams?.get('segment') || 'all').toString(),
    technologies: searchParams?.get('technologies')?.split(',').filter(Boolean) || [],
    materials: searchParams?.get('materials')?.split(',').filter(Boolean) || [],
    services: searchParams?.get('services')?.split(',').filter(Boolean) || [],
    printer_manufacturer: (searchParams?.get('printer_manufacturer') || 'all').toString(),
    printer_model: (searchParams?.get('printer_model') || 'all').toString(),
    process: (searchParams?.get('process') || 'all').toString(),
    material_type: (searchParams?.get('material_type') || 'all').toString(),
    count_type: (searchParams?.get('count_type') || 'all').toString(),
    min_printers: (searchParams?.get('min_printers') || '').toString(),
    max_printers: (searchParams?.get('max_printers') || '').toString(),
  }), [searchParams])
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const debouncedCompany = useDebouncedValue(filters.company_name, 300)

  type SortKey = 'name' | 'segment' | 'country' | 'founded_year' | 'company_type'
  type SortState = { key: SortKey, direction: 'asc' | 'desc' }
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })


  // Sample data for development (fallback only)
  const sampleData: CompanyWithCapabilities[] = [
    {
      id: '1',
      name: 'Protolabs Inc.',
      website: 'https://protolabs.com',
      description: 'On-demand manufacturing services including 3D printing',
      country: 'United States',
      state: 'Minnesota',
      city: 'Maple Plain',
      company_type: 'service',
      company_role: 'provider',
      segment: 'professional',
      primary_market: 'services',
      founded_year: 1999,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      services: [
        {
          id: 'svc-1',
          company_id: '1',
          service_type: 'printing',
          service_name: '3D Printing Service',
          description: 'On-demand 3D printing with multiple materials',
          pricing_model: 'per_part',
          lead_time_days: 3,
          capabilities: ['SLA', 'SLS', 'FDM', 'Metal printing'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      technologies: [
        { id: 'tech-1', name: 'SLA', category: 'Vat Photopolymerization', description: 'Stereolithography', process_type: 'SLA', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 'tech-2', name: 'SLS', category: 'Powder Bed Fusion', description: 'Selective Laser Sintering', process_type: 'SLS', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      ],
      materials: [
        { id: 'mat-1', name: 'Nylon PA12', material_type: 'Thermoplastic', material_format: 'Powder', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 'mat-2', name: 'Standard Resin', material_type: 'Thermoset', material_format: 'Resin', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      ]
    },
    {
      id: '2',
      name: 'Sculpteo',
      website: 'https://sculpteo.com',
      description: 'Online 3D printing and digital manufacturing service',
      country: 'France',
      state: 'Île-de-France',
      city: 'Paris',
      company_type: 'service',
      company_role: 'provider',
      segment: 'professional',
      primary_market: 'services',
      founded_year: 2009,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      services: [
        {
          id: 'svc-2',
          company_id: '2',
          service_type: 'printing',
          service_name: 'Online Manufacturing',
          description: 'Digital manufacturing platform with instant quoting',
          pricing_model: 'per_part',
          lead_time_days: 5,
          capabilities: ['SLA', 'SLS', 'MJF'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      technologies: [
        { id: 'tech-3', name: 'MJF', category: 'Powder Bed Fusion', description: 'Multi Jet Fusion', process_type: 'MJF', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 'tech-4', name: 'SLS', category: 'Powder Bed Fusion', description: 'Selective Laser Sintering', process_type: 'SLS', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      ],
      materials: [
        { id: 'mat-3', name: 'Nylon PA11', material_type: 'Thermoplastic', material_format: 'Powder', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      ]
    },
    {
      id: '3',
      name: 'Materialise Manufacturing',
      website: 'https://materialise.com',
      description: 'Medical devices, automotive parts, and aerospace components',
      country: 'Belgium',
      state: 'Flanders',
      city: 'Leuven',
      company_type: 'service',
      company_role: 'provider',
      segment: 'industrial',
      primary_market: 'services',
      founded_year: 1990,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      services: [
        {
          id: 'svc-3',
          company_id: '3',
          service_type: 'printing',
          service_name: 'Industrial 3D Printing',
          description: 'High-end manufacturing for medical and aerospace',
          pricing_model: 'per_project',
          lead_time_days: 7,
          capabilities: ['SLS', 'DMLS', 'SLA'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      technologies: [
        { id: 'tech-5', name: 'DMLS', category: 'Metal Printing', description: 'Direct Metal Laser Sintering', process_type: 'DMLS', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 'tech-6', name: 'SLS', category: 'Powder Bed Fusion', description: 'Selective Laser Sintering', process_type: 'SLS', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      ],
      materials: [
        { id: 'mat-4', name: 'Titanium Ti6Al4V', material_type: 'Metal', material_format: 'Powder', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 'mat-5', name: 'Nylon PA12', material_type: 'Thermoplastic', material_format: 'Powder', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      ]
    }
  ]

  // Load data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        // Use unified segment API
        const params = new URLSearchParams()
        params.set('segment', 'Printing services')
        params.set('limit', '1000')
        
        const response = await fetch(`/api/datasets/unified-segment?${params.toString()}`)
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
        const result = await response.json()

        if (result.data?.length) {
          // Transform the data to match expected format
          const transformed = result.data.map((item: any) => ({
            id: item.id,
            name: item.company_name,
            website: item.website,
            description: item.additional_info || '',
            country: item.country,
            state: null,
            city: item.headquarters_city,
            company_type: 'service',
            company_role: 'provider',
            segment: item.segment,
            primary_market: 'services',
            founded_year: item.founded_year,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Vendor row fields for table filters
            printer_manufacturer: item.printer_manufacturer || null,
            printer_model: item.printer_model || null,
            number_of_printers: typeof item.number_of_printers === 'number' ? item.number_of_printers : (item.number_of_printers ? Number(item.number_of_printers) : null),
            count_type: item.count_type || null,
            process: item.process || null,
            material_type: item.material_type || null,
            material_format: item.material_format || null,
            update_year: item.update_year || null,
            services: item.printer_model ? [{
              id: `svc-${item.id}`,
              company_id: item.id,
              service_type: 'printing',
              service_name: item.printer_model,
              description: `${item.printer_manufacturer || 'Unknown'} ${item.printer_model || 'Unknown Model'}`,
              pricing_model: 'per_part',
              lead_time_days: 5,
              capabilities: item.process ? [item.process] : [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }] : [],
            technologies: item.process ? [{ 
              id: `tech-${item.id}`, 
              name: item.process, 
              category: 'Process', 
              description: item.process,
              process_type: item.process,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }] : [],
            materials: item.material_type ? [{ 
              id: `mat-${item.id}`, 
              name: item.material_type, 
              material_type: item.material_type,
              material_format: item.material_format || 'Unknown',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }] : []
          }))
          
          setData(transformed)
          setFilteredData(transformed)
        } else {
          // Keep existing fallback to sample data
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
    const setOrDelete = (key: string, val: string | string[]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) url.searchParams.set(key, val.join(','))
        else url.searchParams.delete(key)
      } else {
        const v = (val || '').trim()
        if (!v || v === 'all') url.searchParams.delete(key)
        else url.searchParams.set(key, v)
      }
    }
    setOrDelete('company_name', filters.company_name)
    setOrDelete('segment', filters.segment)
    setOrDelete('country', filters.country)
    setOrDelete('technologies', filters.technologies)
    setOrDelete('materials', filters.materials)
    setOrDelete('services', filters.services)
    setOrDelete('printer_manufacturer', filters.printer_manufacturer)
    setOrDelete('printer_model', filters.printer_model)
    setOrDelete('process', filters.process)
    setOrDelete('material_type', filters.material_type)
    setOrDelete('count_type', filters.count_type)
    setOrDelete('min_printers', filters.min_printers)
    setOrDelete('max_printers', filters.max_printers)
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
      filtered = filtered.filter(item => item.name.toLowerCase().includes(nameLower))
    }

    // Dropdown filters
    if (filters.country && filters.country !== 'all') {
      filtered = filtered.filter(item => item.country === filters.country)
    }

    // Vendor-specific dropdowns
    if (filters.printer_manufacturer && filters.printer_manufacturer !== 'all') {
      filtered = filtered.filter(item => (item as PrintServiceProvider).printer_manufacturer === filters.printer_manufacturer)
    }
    if (filters.printer_model && filters.printer_model !== 'all') {
      filtered = filtered.filter(item => (item as PrintServiceProvider).printer_model === filters.printer_model)
    }
    if (filters.process && filters.process !== 'all') {
      filtered = filtered.filter(item => ((item as PrintServiceProvider).process || '').toString() === filters.process)
    }
    if (filters.material_type && filters.material_type !== 'all') {
      filtered = filtered.filter(item => ((item as PrintServiceProvider).material_type || '').toString() === filters.material_type)
    }
    if (filters.count_type && filters.count_type !== 'all') {
      const normalize = (v: string | null | undefined) => {
        const x = (v || '').toLowerCase().trim()
        if (x === 'actual' || x === 'exact') return 'Exact'
        if (x === 'minimum' || x === 'min') return 'Minimum'
        if (x === 'range') return 'Range'
        return x ? x[0].toUpperCase() + x.slice(1) : 'Estimated'
      }
      filtered = filtered.filter(item => normalize((item as PrintServiceProvider).count_type) === filters.count_type)
    }

    // Numeric range: number of printers
    const min = filters.min_printers ? Number(filters.min_printers) : undefined
    const max = filters.max_printers ? Number(filters.max_printers) : undefined
    if (min !== undefined || max !== undefined) {
      filtered = filtered.filter(item => {
        const n = (item as PrintServiceProvider).number_of_printers ?? 0
        if (min !== undefined && n < min) return false
        if (max !== undefined && n > max) return false
        return true
      })
    }

    // Array filters
    if (filters.technologies?.length) {
      filtered = filtered.filter(item => 
        item.technologies?.some(tech => 
          filters.technologies!.includes(tech.name)
        )
      )
    }
    if (filters.materials?.length) {
      filtered = filtered.filter(item => 
        item.materials?.some(material => 
          filters.materials!.includes(material.name)
        )
      )
    }
    if (filters.services?.length) {
      filtered = filtered.filter(item => 
        item.services?.some(service => 
          filters.services!.includes(service.service_type)
        )
      )
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      const key = sort.key
      if (key === 'founded_year') {
        const av = a.founded_year ?? 0
        const bv = b.founded_year ?? 0
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
    countries: uniq(data.map(item => item.country)),
    technologies: uniq(data.flatMap(item => item.technologies?.map(t => t.name) || [])),
    materials: uniq(data.flatMap(item => item.materials?.map(m => m.name) || [])),
    serviceTypes: uniq(data.flatMap(item => item.services?.map(s => s.service_type) || [])),
    // Vendor-specific uniques
    processes: uniq((data as PrintServiceProvider[]).map(item => item.process)),
    materialTypes: uniq((data as PrintServiceProvider[]).map(item => item.material_type)),
    manufacturers: uniq((data as PrintServiceProvider[]).map(item => item.printer_manufacturer)),
    models: uniq((data as PrintServiceProvider[]).map(item => item.printer_model)),
    countTypes: uniq((data as PrintServiceProvider[]).map(item => {
      const v = ((item.count_type || '') as string).toLowerCase().trim()
      if (v === 'actual' || v === 'exact') return 'Exact'
      if (v === 'minimum' || v === 'min') return 'Minimum'
      if (v === 'range') return 'Range'
      return v ? v[0].toUpperCase() + v.slice(1) : 'Estimated'
    })),
  }


  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.company_name) count++
    if (filters.country !== 'all') count++
    if (filters.printer_manufacturer !== 'all') count++
    if (filters.printer_model !== 'all') count++
    if (filters.process !== 'all') count++
    if (filters.material_type !== 'all') count++
    if (filters.count_type !== 'all') count++
    if (filters.min_printers) count++
    if (filters.max_printers) count++
    if (filters.technologies.length > 0) count++
    if (filters.materials.length > 0) count++
    if (filters.services.length > 0) count++
    return count
  }, [filters])

  const clearFilters = () => {
    setFilters({
      company_name: '',
      segment: 'all',
      country: 'all',
      technologies: [],
      materials: [],
      services: [],
      printer_manufacturer: 'all',
      printer_model: 'all',
      process: 'all',
      material_type: 'all',
      count_type: 'all',
      min_printers: '',
      max_printers: ''
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
  const totalServices = filteredData.reduce((sum, item) => sum + (item.services?.length || 0), 0)
  const avgServicesPerProvider = filteredData.length > 0 ? (totalServices / filteredData.length).toFixed(1) : '0'
  const totalTechnologies = new Set(filteredData.flatMap(item => item.technologies?.map(t => t.name) || [])).size

  const exportColumns: ColumnDef<PrintServiceProvider>[] = [
    { key: 'name', header: 'Company Name' },
    { key: 'country', header: 'Country' },
    { key: 'segment', header: 'Segment' },
    { key: 'technologies', header: 'Technologies', map: (r) => (r.technologies || []).map(t => t.name).join('; ') },
    { key: 'services', header: 'Services', map: (r) => (r.services || []).map(s => s.service_name).join('; ') },
    { key: 'materials', header: 'Materials', map: (r) => (r.materials || []).map(m => m.name).join('; ') },
    { key: 'website', header: 'Website' },
    { key: 'founded_year', header: 'Founded Year' },
  ]

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
            <Badge variant="outline">{totalServices} services</Badge>
            <Badge variant="outline">Avg: {avgServicesPerProvider} per provider</Badge>
            <Badge variant="outline">{totalTechnologies} technologies</Badge>
          </div>
          <ExportButton
            data={filteredData}
            columns={exportColumns}
            filenameBase="print-services-global"
            size="sm"
            align="end"
          />
        </div>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Company name"
              value={filters.company_name}
              onChange={(e) => setFilters(prev => ({ ...prev, company_name: e.target.value }))}
              className="pl-10"
            />
          </div>

          <SearchableDropdown
            label="Countries"
            options={uniqueValues.countries}
            value={filters.country}
            onChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
            className="h-9"
          />

          <SearchableDropdown
            label="Printer Mfr."
            options={uniqueValues.manufacturers}
            value={filters.printer_manufacturer}
            onChange={(value) => setFilters(prev => ({ ...prev, printer_manufacturer: value }))}
            className="h-9"
          />

          <SearchableDropdown
            label="Printer Model"
            options={uniqueValues.models}
            value={filters.printer_model}
            onChange={(value) => setFilters(prev => ({ ...prev, printer_model: value }))}
            className="h-9"
          />

          <SearchableDropdown
            label="Process"
            options={uniqueValues.processes}
            value={filters.process}
            onChange={(value) => setFilters(prev => ({ ...prev, process: value }))}
            className="h-9"
          />

          <SearchableDropdown
            label="Material Type"
            options={uniqueValues.materialTypes}
            value={filters.material_type}
            onChange={(value) => setFilters(prev => ({ ...prev, material_type: value }))}
            className="h-9"
          />

          <SearchableDropdown
            label="Count Type"
            options={uniqueValues.countTypes}
            value={filters.count_type}
            onChange={(value) => setFilters(prev => ({ ...prev, count_type: value }))}
            className="h-9"
          />

          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min printers"
              value={filters.min_printers}
              onChange={(e) => setFilters(prev => ({ ...prev, min_printers: e.target.value }))}
              className="h-9"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              value={filters.max_printers}
              onChange={(e) => setFilters(prev => ({ ...prev, max_printers: e.target.value }))}
              className="h-9"
            />
          </div>

          <Select value={filters.technologies.join(',')} onValueChange={(value) => setFilters(prev => ({ ...prev, technologies: value === 'all' ? [] : [value] }))}>
            <SelectTrigger>
              <SelectValue placeholder="Technologies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technologies</SelectItem>
              {uniqueValues.technologies.map(tech => (
                <SelectItem key={tech} value={tech}>{tech}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.services.join(',')} onValueChange={(value) => setFilters(prev => ({ ...prev, services: value === 'all' ? [] : [value] }))}>
            <SelectTrigger>
              <SelectValue placeholder="Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="printing">3D Printing</SelectItem>
              <SelectItem value="design">Design Services</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
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
          {filters.country !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Country: {filters.country}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, country: 'all' }))}>×</button>
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
          {filters.count_type !== 'all' && (
            <Badge variant="secondary" className="text-xs pr-1">
              Count Type: {filters.count_type}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, count_type: 'all' }))}>×</button>
            </Badge>
          )}
          {(filters.min_printers || filters.max_printers) && (
            <Badge variant="secondary" className="text-xs pr-1">
              Printers: {filters.min_printers || '0'}–{filters.max_printers || '∞'}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, min_printers: '', max_printers: '' }))}>×</button>
            </Badge>
          )}
          {filters.technologies.length > 0 && (
            <Badge variant="secondary" className="text-xs pr-1">
              Tech: {filters.technologies.join(', ')}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, technologies: [] }))}>×</button>
            </Badge>
          )}
          {filters.services.length > 0 && (
            <Badge variant="secondary" className="text-xs pr-1">
              Services: {filters.services.join(', ')}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, services: [] }))}>×</button>
            </Badge>
          )}
          {filters.materials.length > 0 && (
            <Badge variant="secondary" className="text-xs pr-1">
              Materials: {filters.materials.join(', ')}
              <button className="ml-2" onClick={() => setFilters(prev => ({ ...prev, materials: [] }))}>×</button>
            </Badge>
          )}
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead onClick={() => toggleSort('name')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Company Name<SortIndicator column="name" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('segment')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Segment<SortIndicator column="segment" /></div>
              </TableHead>
              <TableHead>Technologies</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Materials</TableHead>
              <TableHead onClick={() => toggleSort('country')} className="cursor-pointer select-none">
                <div className="inline-flex items-center">Country<SortIndicator column="country" /></div>
              </TableHead>
              <TableHead onClick={() => toggleSort('founded_year')} className="cursor-pointer select-none text-center">
                <div className="inline-flex items-center">Founded<SortIndicator column="founded_year" /></div>
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
                        {provider.name}
                      </a>
                    ) : (
                      provider.name
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={provider.segment === 'industrial' ? 'default' : 
                             provider.segment === 'professional' ? 'secondary' : 'outline'}
                  >
                    {provider.segment}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {provider.technologies?.slice(0, 3).map(tech => (
                      <Badge key={tech.id} variant="outline" className="text-xs">
                        {tech.name}
                      </Badge>
                    ))}
                    {(provider.technologies?.length || 0) > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{(provider.technologies?.length || 0) - 3} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {provider.services?.slice(0, 2).map(service => (
                      <Badge key={service.id} variant="secondary" className="text-xs">
                        {service.service_name}
                      </Badge>
                    ))}
                    {(provider.services?.length || 0) > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{(provider.services?.length || 0) - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {provider.materials?.slice(0, 2).map(material => (
                      <Badge key={material.id} variant="outline" className="text-xs">
                        {material.name}
                      </Badge>
                    ))}
                    {(provider.materials?.length || 0) > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{(provider.materials?.length || 0) - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <button className="hover:underline" onClick={() => setFilters(prev => ({ ...prev, country: provider.country || 'all' }))}>
                    {provider.country}
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{provider.founded_year || '—'}</span>
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
                  <div className="font-medium truncate">{provider.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {provider.technologies?.slice(0, 2).map(t => t.name).join(', ') || 'No technologies listed'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{provider.services?.length || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Services</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={provider.segment === 'industrial' ? 'default' : provider.segment === 'professional' ? 'secondary' : 'outline'}>
                    {provider.segment}
                  </Badge>
                  {provider.services?.[0] && (
                    <Badge variant="outline" className="font-mono">{provider.services[0].service_type}</Badge>
                  )}
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
