'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Package,
  Code,
  Settings,
  RefreshCw,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from "lucide-react"
import { getDatasetById, type DatasetConfig } from '@/lib/config/datasets'
import { 
  CompanyFilterRequest,
  CompanyFilterResponse,
  CompanyFilterResult,
  filtersToSearchParams
} from '@/lib/filters/company-filters'

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
  const [countryFilter, setCountryFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [technologyFilter, setTechnologyFilter] = useState('')
  
  // Sorting state
  const [sort, setSort] = useState<SortState>({ 
    key: (dataset?.defaultSort?.field as SortKey) || 'name', 
    direction: (dataset?.defaultSort?.order as 'asc' | 'desc') || 'asc' 
  })
  
  // Available filter options (populated from API response)
  const [filterOptions, setFilterOptions] = useState<{
    countries: string[]
    segments: string[]
    technologies: Array<{ id: string; name: string; category: string }>
    materials: Array<{ id: string; name: string; materialType: string; materialFormat: string }>
  }>({
    countries: [],
    segments: [],
    technologies: [],
    materials: []
  })

  // Error handling for missing dataset
  if (!dataset) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Dataset not found</p>
          <p className="text-sm">Dataset ID "{datasetId}" is not configured</p>
        </div>
      </div>
    )
  }

  // Get appropriate icon for dataset
  const IconComponent = DATASET_ICONS[dataset.mapType] || Building2

  // Load data with filters
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Build filter request combining dataset base filters with user selections
        const filterRequest: CompanyFilterRequest = {
          ...dataset.filters, // Base filters from dataset config
          page: 1,
          limit: 1000, // Load all for client-side filtering
          sortBy: sort.key,
          sortOrder: sort.direction,
          // Override with user filters
          search: searchQuery || undefined,
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
        setFilterOptions(result.filters.available)
        
      } catch (err) {
        console.error(`Error loading ${dataset.name} data:`, err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dataset, searchQuery, countryFilter, segmentFilter, technologyFilter, sort])

  // Client-side filtering for immediate feedback
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply client-side search filter for immediate feedback
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchLower) ||
        item.country?.toLowerCase().includes(searchLower) ||
        item.primaryMarket?.toLowerCase().includes(searchLower) ||
        item.technologies?.some(tech => tech.toLowerCase().includes(searchLower)) ||
        item.materials?.some(mat => mat.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [data, searchQuery])

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

  // Export functionality
  const handleExport = () => {
    const headers = dataset.displayColumns.map(col => {
      switch (col) {
        case 'name': return 'Company Name'
        case 'country': return 'Country'
        case 'segment': return 'Segment'
        case 'technologies': return 'Technologies'
        case 'materials': return 'Materials'
        case 'serviceTypes': return 'Service Types'
        case 'website': return 'Website'
        default: return col.charAt(0).toUpperCase() + col.slice(1)
      }
    })
    
    const csvData = [
      headers,
      ...filteredData.map(item => 
        dataset.displayColumns.map(col => {
          const value = item[col as keyof CompanyFilterResult]
          if (Array.isArray(value)) return value.join('; ')
          return String(value || '')
        })
      )
    ]
    
    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dataset.id}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setCountryFilter('')
    setSegmentFilter('')
    setTechnologyFilter('')
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading {dataset.name} data...
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
              style={{ color: dataset.color }}
            />
            <h2 className="text-lg font-semibold">{dataset.name}</h2>
            <Badge variant="secondary">{filteredData.length} companies</Badge>
          </div>
          
          <div className="flex gap-2">
            {dataset.enableExport && (
              <Button onClick={handleExport} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {dataset.description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            {dataset.description}
          </p>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Country filter */}
          {dataset.displayColumns.includes('country') && filterOptions.countries.length > 0 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {filterOptions.countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Segment filter */}
          {dataset.displayColumns.includes('segment') && filterOptions.segments.length > 0 && (
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Segments</SelectItem>
                {filterOptions.segments.map(segment => (
                  <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Technology filter */}
          {dataset.displayColumns.includes('technologies') && filterOptions.technologies.length > 0 && (
            <Select value={technologyFilter} onValueChange={setTechnologyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Technology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Technologies</SelectItem>
                {filterOptions.technologies.map(tech => (
                  <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {dataset.displayColumns.map((column) => {
                const issortable = ['name', 'country', 'segment'].includes(column)
                const headerText = {
                  name: 'Company Name',
                  country: 'Country',
                  segment: 'Segment',
                  technologies: 'Technologies',
                  materials: 'Materials',
                  serviceTypes: 'Service Types',
                  website: 'Website'
                }[column] || column.charAt(0).toUpperCase() + column.slice(1)

                return (
                  <TableHead 
                    key={column}
                    onClick={isortable ? () => toggleSort(column as SortKey) : undefined}
                    className={isortable ? "cursor-pointer select-none" : ""}
                  >
                    <div className="inline-flex items-center">
                      {headerText}
                      {isortable && <SortIndicator column={column as SortKey} />}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/50">
                {dataset.displayColumns.map((column) => (
                  <TableCell key={column}>
                    {column === 'name' && (
                      <div className="flex items-center gap-2">
                        {company.website ? (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {company.name}
                          </a>
                        ) : (
                          <span className="font-medium">{company.name}</span>
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
                      <div className="flex flex-wrap gap-1">
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
                    
                    {column === 'materials' && (
                      <div className="flex flex-wrap gap-1">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(company.website!, '_blank')}
                        className="h-6 w-6 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {/* Fallback for other columns */}
                    {!['name', 'country', 'segment', 'technologies', 'materials', 'serviceTypes', 'website'].includes(column) && (
                      <span className="text-sm">
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