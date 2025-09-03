'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search,
  Building2,
  Globe,
  Package,
  Code,
  Settings,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from "lucide-react"
import { getDatasetById } from '@/lib/config/datasets'
import { 
  CompanyFilterRequest,
  CompanyFilterResponse,
  CompanyFilterResult,
  filtersToSearchParams
} from '@/lib/filters/company-filters'
import ExportButton from '@/components/ExportButton'
import type { ColumnDef } from '@/lib/export'

// Icon mapping for different dataset types
const DATASET_ICONS = {
  equipment: Building2,
  service: Globe,
  material: Package,
  software: Code
} as const

// Type for column sorting
type SortKey = keyof CompanyFilterResult
type SortState = { key: SortKey, direction: 'asc' | 'desc' }

// Props for the unified component
interface UnifiedDatasetViewProps {
  datasetId: string
  className?: string
}

/**
 * Unified Dataset View Component
 * 
 * This component replaces all individual dataset-specific components (AMSystemsManufacturersContent, 
 * PrintServicesGlobalContent, etc.) with a single configurable component that adapts its behavior
 * and display based on dataset configuration.
 * 
 * Features:
 * - Configuration-driven display and filtering
 * - Dynamic column visibility based on dataset config
 * - Unified API integration with proper caching
 * - Consistent UI patterns across all datasets
 * - Type-safe filtering and sorting
 */
export default function UnifiedDatasetView({ datasetId, className }: UnifiedDatasetViewProps) {
  // Get dataset configuration
  const dataset = getDatasetById(datasetId)
  
  // Component state
  const [data, setData] = useState<CompanyFilterResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state - start with dataset's base filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [technologyFilter, setTechnologyFilter] = useState('')
  const [materialTypeFilter, setMaterialTypeFilter] = useState('')
  const [materialFormatFilter, setMaterialFormatFilter] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [countTypeFilter, setCountTypeFilter] = useState('')
  const [printersMin, setPrintersMin] = useState<string>('')
  const [printersMax, setPrintersMax] = useState<string>('')

  // Debounced inputs to avoid refetching per keystroke
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 450)
  const debouncedPrintersMin = useDebouncedValue(printersMin, 350)
  const debouncedPrintersMax = useDebouncedValue(printersMax, 350)
  // Multi-select variants for vendor datasets
  const [processesSelected, setProcessesSelected] = useState<string[]>([])
  const [materialTypesSelected, setMaterialTypesSelected] = useState<string[]>([])
  const [materialFormatsSelected, setMaterialFormatsSelected] = useState<string[]>([])
  const [manufacturersSelected, setManufacturersSelected] = useState<string[]>([])
  const [modelsSelected, setModelsSelected] = useState<string[]>([])
  const [countTypesSelected, setCountTypesSelected] = useState<string[]>([])
  
  // Sorting state
  const [sort, setSort] = useState<SortState>({ 
    key: (dataset?.defaultSort?.field as SortKey) || 'name', 
    direction: (dataset?.defaultSort?.order as 'asc' | 'desc') || 'asc' 
  })
  // Column layout preferences
  const [columnLayout, setColumnLayout] = useState<'fit' | 'even'>('fit')
  
  // Available filter options (populated from API response)
  const [filterOptions, setFilterOptions] = useState<{
    countries: string[]
    segments: string[]
    technologies: Array<{ id: string; name: string; category: string }>
    materials: Array<{ id: string; name: string; materialType: string; materialFormat: string }>
    materialFormats: string[]
    printerManufacturers: string[]
    printerModels: string[]
    countTypes: string[]
  }>({
    countries: [],
    segments: [],
    technologies: [],
    materials: [],
    materialFormats: [],
    printerManufacturers: [],
    printerModels: [],
    countTypes: []
  })

  const datasetMissing = !dataset

  // Get appropriate icon for dataset
  const IconComponent = DATASET_ICONS[(dataset?.mapType as keyof typeof DATASET_ICONS) || 'equipment'] || Building2

  // Vendor dataset detection and mapping
  const isVendorDataset = datasetId === 'am-systems-manufacturers' || datasetId === 'print-services-global'
  const vendorSegment = datasetId === 'am-systems-manufacturers'
    ? 'System manufacturer'
    : datasetId === 'print-services-global'
      ? 'Printing services'
      : null

  // Load data with filters
  useEffect(() => {
    if (!dataset) {
      setError('Dataset not found')
      setLoading(false)
      setData([])
      setFilterOptions({ 
        countries: [], 
        segments: [], 
        technologies: [], 
        materials: [], 
        materialFormats: [],
        printerManufacturers: [],
        printerModels: [],
        countTypes: []
      })
      return
    }
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        if (isVendorDataset && vendorSegment) {
          // Build vendor endpoint params
          const params = new URLSearchParams()
          params.set('segment', vendorSegment)
          params.set('limit', '1000')
          // Sorting and search are applied client-side to avoid flicker
          // Do NOT send search in the request to prevent refetch while typing
          if (countryFilter) params.set('country', countryFilter)
          if (segmentFilter) params.set('segment', segmentFilter)
          if (processesSelected.length) params.set('process', processesSelected.join(','))
          else if (technologyFilter) params.set('process', technologyFilter)
          if (materialTypesSelected.length) params.set('material_type', materialTypesSelected.join(','))
          else if (materialTypeFilter) params.set('material_type', materialTypeFilter)
          if (materialFormatsSelected.length) params.set('material_format', materialFormatsSelected.join(','))
          else if (materialFormatFilter) params.set('material_format', materialFormatFilter)
          if (manufacturersSelected.length) params.set('printer_manufacturer', manufacturersSelected.join(','))
          else if (manufacturerFilter) params.set('printer_manufacturer', manufacturerFilter)
          if (modelsSelected.length) params.set('printer_model', modelsSelected.join(','))
          else if (modelFilter) params.set('printer_model', modelFilter)
          if (countTypesSelected.length) params.set('count_type', countTypesSelected.join(','))
          else if (countTypeFilter) params.set('count_type', countTypeFilter)
          if (debouncedPrintersMin) params.set('min_printers', String(debouncedPrintersMin))
          if (debouncedPrintersMax) params.set('max_printers', String(debouncedPrintersMax))

          const response = await fetch(`/api/vendor/companies?${params.toString()}`)
          if (!response.ok) {
            throw new Error(`Vendor API request failed: ${response.status}`)
          }
          const result: CompanyFilterResponse = await response.json()
          setData(result.data)
          // Normalize available filters, supporting vendor-specific fields
          setFilterOptions({
            countries: result.filters.available.countries || [],
            segments: result.filters.available.segments || [],
            technologies: result.filters.available.technologies || [],
            materials: result.filters.available.materials || [],
            materialFormats: (result.filters.available as any).materialFormats || [],
            printerManufacturers: (result.filters.available as any).printerManufacturers || [],
            printerModels: (result.filters.available as any).printerModels || [],
            countTypes: (result.filters.available as any).countTypes || [],
          })
        } else {
          // Build filter request combining dataset base filters with user selections
          const filterRequest: CompanyFilterRequest = {
            ...dataset.filters, // Base filters from dataset config
            page: 1,
            limit: 1000, // Load all for client-side filtering
            // Sorting and search are applied client-side to avoid refetch flicker
            // Do not include 'search' so queries don't rerun while typing
            country: countryFilter ? [countryFilter] : dataset.filters.country,
            segment: segmentFilter ? [segmentFilter] : dataset.filters.segment,
            technologies: technologyFilter ? [technologyFilter] : dataset.filters.technologies,
          }

          // Call unified API endpoint
          const params = filtersToSearchParams(filterRequest)
          const response = await fetch(`/api/companies?${params.toString()}`)
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`)
          }

          const result: CompanyFilterResponse = await response.json()
          
          // Update state
          setData(result.data)
          setFilterOptions({
            countries: result.filters.available.countries || [],
            segments: result.filters.available.segments || [],
            technologies: result.filters.available.technologies || [],
            materials: result.filters.available.materials || [],
            materialFormats: [],
            printerManufacturers: [],
            printerModels: [],
            countTypes: []
          })
        }
        
      } catch (err) {
        console.error(`Error loading ${dataset.name} data:`, err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [
    dataset,
    datasetId,
    isVendorDataset,
    vendorSegment,
    countryFilter,
    segmentFilter,
    technologyFilter,
    materialTypeFilter,
    materialFormatFilter,
    manufacturerFilter,
    modelFilter,
    countTypeFilter,
    processesSelected,
    materialTypesSelected,
    materialFormatsSelected,
    manufacturersSelected,
    modelsSelected,
    countTypesSelected,
    debouncedPrintersMin,
    debouncedPrintersMax,
    // Do not refetch on sort change; sort is client-side
  ])

  // Client-side filtering for immediate feedback
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply client-side search filter for immediate feedback
    if (debouncedSearchQuery) {
      const searchLower = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchLower) ||
        item.country?.toLowerCase().includes(searchLower) ||
        item.primaryMarket?.toLowerCase().includes(searchLower) ||
        item.technologies?.some(tech => tech.toLowerCase().includes(searchLower)) ||
        item.materials?.some(mat => mat.toLowerCase().includes(searchLower))
      )
    }

    // Apply client-side sorting
    const asc = sort.direction === 'asc'
    const key = sort.key
    const sorted = filtered.sort((a: any, b: any) => {
      const av = (a?.[key] ?? '')
      const bv = (b?.[key] ?? '')
      // Numeric compare when both are numbers
      if (typeof av === 'number' && typeof bv === 'number') {
        return asc ? av - bv : bv - av
      }
      const as = String(av).toLowerCase()
      const bs = String(bv).toLowerCase()
      if (as < bs) return asc ? -1 : 1
      if (as > bs) return asc ? 1 : -1
      return 0
    })

    return sorted
  }, [data, debouncedSearchQuery, sort])

  // Sorting functions
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

  // Export handled by shared ExportButton

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSearchDraft('')
    setCountryFilter('')
    setSegmentFilter('')
    setTechnologyFilter('')
    setMaterialTypeFilter('')
    setMaterialFormatFilter('')
    setManufacturerFilter('')
    setModelFilter('')
    setCountTypeFilter('')
    setPrintersMin('')
    setPrintersMax('')
    setProcessesSelected([])
    setMaterialTypesSelected([])
    setMaterialFormatsSelected([])
    setManufacturersSelected([])
    setModelsSelected([])
    setCountTypesSelected([])
  }

  // Build export column definitions based on dataset display columns
  const exportColumns: ColumnDef<CompanyFilterResult>[] = (dataset?.displayColumns || []).map((col) => {
    switch (col) {
      case 'name':
        return { key: 'name', header: 'Company Name' }
      case 'country':
        return { key: 'country', header: 'Country' }
      case 'segment':
        return { key: 'segment', header: 'Segment' }
      case 'technologies':
        return { key: 'technologies', header: 'Technologies', map: (r) => (r.technologies || []).join('; ') }
      case 'materials':
        return { key: 'materials', header: 'Materials', map: (r) => (r.materials || []).join('; ') }
      case 'serviceTypes':
        return { key: 'serviceTypes', header: 'Service Types', map: (r) => (r.serviceTypes || []).join('; ') }
      case 'website':
        return { key: 'website', header: 'Website' }
      case 'process':
        return { key: 'process', header: 'Process' }
      case 'materialType':
        return { key: 'materialType', header: 'Material Type' }
      case 'materialFormat':
        return { key: 'materialFormat', header: 'Material Format' }
      case 'printerManufacturer':
        return { key: 'printerManufacturer', header: 'Printer Manufacturer' }
      case 'printerModel':
        return { key: 'printerModel', header: 'Printer Model' }
      case 'numberOfPrinters':
        return { key: 'numberOfPrinters', header: 'Number of Printers' }
      case 'countType':
        return { key: 'countType', header: 'Count Type' }
      default:
        return { key: col, header: col.charAt(0).toUpperCase() + col.slice(1) }
    }
  })

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading {(dataset?.name) || 'dataset'} data...
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Error loading data</p>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: dataset?.color || undefined }}
            />
            <h2 className="text-lg font-semibold">{dataset?.name || 'Dataset not found'}</h2>
          </div>
          
          <div className="flex gap-2">
            {dataset?.enableExport && (
              <ExportButton 
                data={filteredData}
                columns={exportColumns}
                filenameBase={(dataset?.id) || datasetId}
                size="sm"
                align="end"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnLayout(prev => prev === 'fit' ? 'even' : 'fit')}
              title={columnLayout === 'fit' ? 'Switch to even column widths' : 'Switch to fit-to-content widths'}
            >
              {columnLayout === 'fit' ? 'Layout: Fit' : 'Layout: Even'}
            </Button>
          </div>
        </div>

        {/* Description */}
        {dataset?.description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            {dataset?.description}
          </p>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchDraft}
              onChange={(e) => {
                const v = e.target.value
                setSearchDraft(v)
                // Keep API requests and filtering debounced via debouncedSearchQuery
                setSearchQuery(v)
              }}
              // Enter is no longer required; search applies after debounce
              className="pl-10"
            />
          </div>

          {/* Country filter */}
          {dataset?.displayColumns.includes('country') && filterOptions.countries.length > 0 && (
            <Select value={countryFilter} onValueChange={(v) => setCountryFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Countries</SelectItem>
                {filterOptions.countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Segment filter */}
          {dataset?.displayColumns.includes('segment') && filterOptions.segments.length > 0 && (
            <Select value={segmentFilter} onValueChange={(v) => setSegmentFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Segments</SelectItem>
                {filterOptions.segments.map(segment => (
                  <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Process filter (multi for vendor) or Technology for others */}
          {isVendorDataset ? (
            filterOptions.technologies.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {processesSelected.length > 0 ? `${processesSelected.length} Processes` : 'Process'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-80 overflow-auto">
                  <DropdownMenuLabel>Select Processes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filterOptions.technologies.map(tech => {
                    const name = tech.name
                    const checked = processesSelected.includes(name)
                    return (
                      <DropdownMenuCheckboxItem
                        key={name}
                        checked={checked}
                        onCheckedChange={(on) => {
                          setProcessesSelected(prev => on ? [...prev, name] : prev.filter(v => v !== name))
                        }}
                      >
                        {name}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            dataset?.displayColumns.includes('technologies') && filterOptions.technologies.length > 0 && (
              <Select value={technologyFilter} onValueChange={(v) => setTechnologyFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Technologies</SelectItem>
                  {filterOptions.technologies.map(tech => (
                    <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          )}

          {/* Material Type filter (vendor datasets) - multi */}
          {isVendorDataset && filterOptions.materials.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  {materialTypesSelected.length > 0 ? `${materialTypesSelected.length} Material Types` : 'Material Type'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-auto">
                <DropdownMenuLabel>Select Material Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.materials.map(mat => {
                  const name = mat.name
                  const checked = materialTypesSelected.includes(name)
                  return (
                    <DropdownMenuCheckboxItem
                      key={mat.id}
                      checked={checked}
                      onCheckedChange={(on) => {
                        setMaterialTypesSelected(prev => on ? [...prev, name] : prev.filter(v => v !== name))
                      }}
                    >
                      {name}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Material Format filter (vendor datasets) - multi */}
          {isVendorDataset && filterOptions.materialFormats.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  {materialFormatsSelected.length > 0 ? `${materialFormatsSelected.length} Formats` : 'Material Format'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-auto">
                <DropdownMenuLabel>Select Material Formats</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.materialFormats.map(fmt => {
                  const checked = materialFormatsSelected.includes(fmt)
                  return (
                    <DropdownMenuCheckboxItem
                      key={fmt}
                      checked={checked}
                      onCheckedChange={(on) => {
                        setMaterialFormatsSelected(prev => on ? [...prev, fmt] : prev.filter(v => v !== fmt))
                      }}
                    >
                      {fmt}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Printer Manufacturer (vendor) - multi */}
          {datasetId === 'print-services-global' && filterOptions.printerManufacturers.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  {manufacturersSelected.length > 0 ? `${manufacturersSelected.length} Manufacturers` : 'Printer Manufacturer'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-auto">
                <DropdownMenuLabel>Select Manufacturers</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.printerManufacturers.map(m => {
                  const checked = manufacturersSelected.includes(m)
                  return (
                    <DropdownMenuCheckboxItem
                      key={m}
                      checked={checked}
                      onCheckedChange={(on) => {
                        setManufacturersSelected(prev => on ? [...prev, m] : prev.filter(v => v !== m))
                      }}
                    >
                      {m}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Printer Model (vendor) - multi */}
          {datasetId === 'print-services-global' && filterOptions.printerModels.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  {modelsSelected.length > 0 ? `${modelsSelected.length} Models` : 'Printer Model'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-auto">
                <DropdownMenuLabel>Select Models</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.printerModels.map(m => {
                  const checked = modelsSelected.includes(m)
                  return (
                    <DropdownMenuCheckboxItem
                      key={m}
                      checked={checked}
                      onCheckedChange={(on) => {
                        setModelsSelected(prev => on ? [...prev, m] : prev.filter(v => v !== m))
                      }}
                    >
                      {m}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Count Type (vendor) - multi */}
          {datasetId === 'print-services-global' && filterOptions.countTypes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  {countTypesSelected.length > 0 ? `${countTypesSelected.length} Count Types` : 'Count Type'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-auto">
                <DropdownMenuLabel>Select Count Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.countTypes.map(ct => {
                  const checked = countTypesSelected.includes(ct)
                  return (
                    <DropdownMenuCheckboxItem
                      key={ct}
                      checked={checked}
                      onCheckedChange={(on) => {
                        setCountTypesSelected(prev => on ? [...prev, ct] : prev.filter(v => v !== ct))
                      }}
                    >
                      {ct}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Number of Printers range (vendor) */}
          {datasetId === 'print-services-global' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Min Printers"
                value={printersMin}
                onChange={(e) => setPrintersMin(e.target.value)}
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Max Printers"
                value={printersMax}
                onChange={(e) => setPrintersMax(e.target.value)}
              />
            </div>
          )}

          {/* Clear filters */}
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table className={columnLayout === 'even' ? 'table-fixed' : 'table-auto'}>
          {Array.isArray(dataset?.displayColumns) && dataset.displayColumns.length > 0 && (
            <colgroup>
              {dataset.displayColumns.map((col) => {
                const widthClass = columnLayout === 'even' ? 'w-auto' : (
                  col === 'name' ? 'w-[200px]' :
                  col === 'country' ? 'w-[140px]' :
                  col === 'segment' ? 'w-[140px]' :
                  (col === 'technologies' || col === 'materials') ? 'w-[220px]' :
                  col === 'serviceTypes' ? 'w-[200px]' :
                  col === 'process' ? 'w-[180px]' :
                  col === 'materialType' ? 'w-[180px]' :
                  col === 'materialFormat' ? 'w-[160px]' :
                  (col === 'printerManufacturer' || col === 'printerModel') ? 'w-[220px]' :
                  (col === 'numberOfPrinters' || col === 'countType') ? 'w-[140px]' :
                  col === 'website' ? 'w-[80px]' : 'w-auto'
                )
                return <col key={col} className={widthClass} />
              })}
            </colgroup>
          )}
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {(dataset?.displayColumns ?? []).map((column) => {
                const _isSortable = ['name', 'country', 'segment', 'process', 'materialType', 'materialFormat', 'printerManufacturer', 'printerModel', 'numberOfPrinters', 'countType'].includes(column)
                const headerText = {
                  name: 'Company Name',
                  country: 'Country',
                  segment: 'Segment',
                  technologies: 'Technologies',
                  materials: 'Materials',
                  serviceTypes: 'Service Types',
                  website: 'Website',
                  process: 'Process',
                  materialType: 'Material Type',
                  materialFormat: 'Material Format',
                  printerManufacturer: 'Printer Manufacturer',
                  printerModel: 'Printer Model',
                  numberOfPrinters: 'Number of Printers',
                  countType: 'Count Type'
                }[column] || column.charAt(0).toUpperCase() + column.slice(1)

                const numeric = column === 'numberOfPrinters'
                return (
                  <TableHead 
                    key={column}
                    onClick={_isSortable ? () => toggleSort(column as SortKey) : undefined}
                    className={`${_isSortable ? 'cursor-pointer select-none' : ''} whitespace-nowrap ${numeric ? 'text-right' : ''}`}
                  >
                    <div className="inline-flex items-center whitespace-nowrap">
                      {headerText}
                      {_isSortable && <SortIndicator column={column as SortKey} />}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/50">
                {(dataset?.displayColumns ?? []).map((column) => (
                  <TableCell key={column} className={`whitespace-nowrap ${column === 'numberOfPrinters' ? 'text-right' : ''}`}>
                    {column === 'name' && (
                      <div className="flex items-center gap-2 min-w-0">
                        {company.website ? (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium truncate inline-block max-w-[200px]"
                            title={company.name || ''}
                          >
                            {company.name}
                          </a>
                        ) : (
                          <span className="font-medium truncate inline-block max-w-[200px]" title={company.name || ''}>{company.name}</span>
                        )}
                      </div>
                    )}
                    
                    {column === 'country' && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        {company.country}
                      </div>
                    )}
                    
                    {column === 'segment' && (
                      <Badge 
                        variant={company.segment === 'Industrial' ? 'default' : 
                                 company.segment === 'Professional' ? 'secondary' : 'outline'}
                      >
                        {company.segment}
                      </Badge>
                    )}
                    
                    {column === 'technologies' && (
                      <div className="flex gap-1 items-center overflow-hidden">
                        {company.technologies?.slice(0, 3).map((tech, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {company.technologies && company.technologies.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{company.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {column === 'process' && (
                      <span className="text-sm truncate inline-block max-w-[180px]" title={company.process || ''}>{company.process || ''}</span>
                    )}

                    {column === 'materials' && (
                      <div className="flex gap-1 items-center overflow-hidden">
                        {company.materials?.slice(0, 2).map((material, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                        {company.materials && company.materials.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{company.materials.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {column === 'materialType' && (
                      <span className="text-sm truncate inline-block max-w-[180px]" title={company.materialType || ''}>{company.materialType || ''}</span>
                    )}

                    {column === 'materialFormat' && (
                      <span className="text-sm truncate inline-block max-w-[160px]" title={company.materialFormat || ''}>{company.materialFormat || ''}</span>
                    )}

                    {column === 'printerManufacturer' && (
                      <span className="text-sm truncate inline-block max-w-[220px]" title={company.printerManufacturer || ''}>{company.printerManufacturer || ''}</span>
                    )}

                    {column === 'printerModel' && (
                      <span className="text-sm truncate inline-block max-w-[220px]" title={company.printerModel || ''}>{company.printerModel || ''}</span>
                    )}

                    {column === 'numberOfPrinters' && (
                      <span className="text-sm tabular-nums">{company.numberOfPrinters != null ? company.numberOfPrinters.toLocaleString() : ''}</span>
                    )}

                    {column === 'countType' && (
                      <span className="text-sm truncate inline-block max-w-[140px]" title={company.countType || ''}>{company.countType || ''}</span>
                    )}
                    
                    {column === 'serviceTypes' && (
                      <div className="flex flex-wrap gap-1">
                        {company.serviceTypes?.slice(0, 2).map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {company.serviceTypes && company.serviceTypes.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{company.serviceTypes.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {column === 'website' && company.website && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(company.website!, '_blank')}
                          className="h-6 w-6 p-0"
                          title={company.website || ''}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Fallback for other columns */}
                    {!['name', 'country', 'segment', 'technologies', 'materials', 'serviceTypes', 'website', 'process', 'materialType', 'materialFormat', 'printerManufacturer', 'printerModel', 'numberOfPrinters', 'countType'].includes(column) && (
                      <span className="text-sm truncate inline-block max-w-[220px]" title={String(company[column as keyof CompanyFilterResult] || '')}>
                        {String(company[column as keyof CompanyFilterResult] || '')}
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms to find companies in this dataset.
            </p>
            <Button onClick={clearFilters} variant="outline" className="mt-4">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
