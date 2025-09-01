'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Loader2
} from "lucide-react"
import { getCompaniesWithFilters, getCompanyEquipmentBreakdown } from '@/lib/supabase/client-queries'
import { CompanySummary } from '@/lib/supabase/types'
import FilterBar from '@/components/filters/FilterBar'
import ActiveFilterChips from '@/components/filters/ActiveFilterChips'
import { FilterState, emptyFilters } from '@/lib/filters/types'
import ExportButton from '@/components/ExportButton'
import type { ColumnDef } from '@/lib/export'

type SortField = 'name' | 'city' | 'state' | 'type' | 'total_machines' | 'unique_processes' | 'unique_materials' | 'unique_manufacturers'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

function SupabaseDataTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([])
  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null)
  
  // Shared filters
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  // Clean up - removed deprecated local filters
  
  // Equipment breakdown data
  const [equipmentBreakdown, setEquipmentBreakdown] = useState<{
    technologies: Array<{ name: string; count: number; category: string }>
    materials: Array<{ name: string; count: number; category: string }>
    totalEquipment: number
    totalMachines: number
  } | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    city: true,
    state: true,
    type: true,
    total_machines: true,
    unique_processes: true,
    unique_materials: true,
    unique_manufacturers: true,
    website: false
  })

  // (Filter options are loaded within FilterBar)

  // Fetch company data with filters
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        const data = await getCompaniesWithFilters({
          technologyIds: filters.technologyIds,
          materialIds: filters.materialIds,
          processCategories: filters.processCategories,
          sizeRanges: filters.sizeRanges,
          countries: filters.countries,
          states: filters.states,
        })
        setCompanies(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching companies:', err)
        setError('Failed to load company data')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [filters])

  // Fetch equipment breakdown when company is selected
  useEffect(() => {
    const fetchEquipmentBreakdown = async () => {
      if (!selectedCompany?.id) {
        setEquipmentBreakdown(null)
        return
      }

      try {
        setBreakdownLoading(true)
        const breakdown = await getCompanyEquipmentBreakdown(selectedCompany.id)
        setEquipmentBreakdown(breakdown)
      } catch (err) {
        console.error('Error fetching equipment breakdown:', err)
        setEquipmentBreakdown(null)
      } finally {
        setBreakdownLoading(false)
      }
    }

    fetchEquipmentBreakdown()
  }, [selectedCompany])

  // Filtering and sorting
  const filteredAndSortedData = useMemo(() => {
    let filtered = companies

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(company =>
        company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.company_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.website?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    if (sortConfig.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of sortConfig) {
          // Map 'type' to 'company_type' for proper sorting
          const fieldKey = sort.field === 'type' ? 'company_type' : sort.field
          const aValue = a[fieldKey as keyof CompanySummary]
          const bValue = b[fieldKey as keyof CompanySummary]
          
          let comparison = 0
          
          // Handle null values
          if (aValue === null && bValue === null) {
            comparison = 0
          } else if (aValue === null) {
            comparison = 1
          } else if (bValue === null) {
            comparison = -1
          } else {
            // Both values are non-null, safe to compare
            if (aValue < bValue) comparison = -1
            if (aValue > bValue) comparison = 1
          }
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison
          }
        }
        return 0
      })
    }

    return filtered
  }, [companies, searchQuery, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = filteredAndSortedData.slice(startIndex, endIndex)

  const handleSort = (field: SortField) => {
    setSortConfig(prevSort => {
      const existingSort = prevSort.find(sort => sort.field === field)
      
      if (existingSort) {
        if (existingSort.direction === 'asc') {
          // Change to desc
          return prevSort.map(sort =>
            sort.field === field ? { ...sort, direction: 'desc' as SortDirection } : sort
          )
        } else {
          // Remove this sort
          return prevSort.filter(sort => sort.field !== field)
        }
      } else {
        // Add new sort (asc)
        return [...prevSort, { field, direction: 'asc' as SortDirection }]
      }
    })
  }

  const getSortIcon = (field: SortField) => {
    const sort = sortConfig.find(s => s.field === field)
    if (!sort) return <ArrowUpDown className="h-3 w-3" />
    return sort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const toggleAllRows = () => {
    setSelectedRows(
      selectedRows.length === currentPageData.length
        ? []
        : currentPageData.map(row => row.id || '').filter(id => id !== '')
    )
  }

  // Export columns (include all core columns regardless of visibility)
  const exportColumns: ColumnDef<CompanySummary & { processes?: string[]; materials?: string[] }>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Company Name' },
    { key: 'company_type', header: 'Type' },
    { key: 'website', header: 'Website' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'country', header: 'Country' },
    { key: 'total_machines', header: 'Total Machines' },
    { key: 'unique_processes', header: 'Unique Processes' },
    { key: 'unique_materials', header: 'Unique Materials' },
    { key: 'unique_manufacturers', header: 'Unique Manufacturers' },
    { key: 'founded_year', header: 'Founded' },
    { key: 'employee_count_range', header: 'Employees' },
    { key: 'is_public_company', header: 'Public Company' },
    { key: 'stock_ticker', header: 'Stock Ticker' },
    { key: 'latitude', header: 'Latitude' },
    { key: 'longitude', header: 'Longitude' },
    { key: 'processes', header: 'Processes', map: (r) => (r.processes || []).join('; ') },
    { key: 'materials', header: 'Materials', map: (r) => (r.materials || []).join('; ') },
  ]

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading company data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
          <div className="text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Controls Header */}
      <div className="border-b border-border bg-card">
        {/* Search and Filters Row */}
        <div className="p-4">
          <div className="flex flex-col gap-3">
            {/* Search Bar and Status */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies, locations, technologies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                
                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredAndSortedData.length} companies
                  </Badge>
                  {selectedRows.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {selectedRows.length} selected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Column Visibility and Export */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(visibleColumns).map(([column, visible]) => (
                      <DropdownMenuCheckboxItem
                        key={column}
                        checked={visible}
                        onCheckedChange={(checked) =>
                          setVisibleColumns(prev => ({ ...prev, [column]: checked }))
                        }
                        className="capitalize"
                      >
                        {column === 'total_machines' ? 'Total Machines' :
                         column === 'unique_processes' ? 'Unique Processes' :
                         column === 'unique_materials' ? 'Unique Materials' :
                         column === 'unique_manufacturers' ? 'Unique Manufacturers' :
                         column.charAt(0).toUpperCase() + column.slice(1)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <ExportButton 
                  data={filteredAndSortedData as CompanySummary[]}
                  columns={exportColumns}
                  filenameBase="wohlers-am-companies"
                  filters={filters}
                  selectedOnlyIds={selectedRows}
                  idKey="id"
                  size="sm"
                  align="end"
                />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center">
              <FilterBar 
                value={filters} 
                onChange={(next) => { 
                  setFilters(next); 
                  setCurrentPage(1) 
                }} 
                orientation="horizontal"
                className="flex-1"
              />
            </div>
            
            {/* Active Filter Chips */}
            <ActiveFilterChips 
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setCurrentPage(1);
              }}
              className="px-1"
            />
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    currentPageData.length > 0 && selectedRows.length === currentPageData.length
                  }
                  onCheckedChange={toggleAllRows}
                />
              </TableHead>
              
              {visibleColumns.name && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Company Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.city && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center gap-1">
                    City
                    {getSortIcon('city')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.state && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('state')}
                >
                  <div className="flex items-center gap-1">
                    State
                    {getSortIcon('state')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.type && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {getSortIcon('type')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.total_machines && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('total_machines')}
                >
                  <div className="flex items-center gap-1">
                    Total Machines
                    {getSortIcon('total_machines')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.unique_processes && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('unique_processes')}
                >
                  <div className="flex items-center gap-1">
                    Processes
                    {getSortIcon('unique_processes')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.unique_materials && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('unique_materials')}
                >
                  <div className="flex items-center gap-1">
                    Materials
                    {getSortIcon('unique_materials')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.unique_manufacturers && (
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('unique_manufacturers')}
                >
                  <div className="flex items-center gap-1">
                    Manufacturers
                    {getSortIcon('unique_manufacturers')}
                  </div>
                </TableHead>
              )}
              
              {visibleColumns.website && (
                <TableHead>Website</TableHead>
              )}
              
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageData.map((company) => (
              <TableRow 
                key={company.id || ''}
                className={`border-border cursor-pointer hover:bg-muted/50 ${
                  company.id && selectedRows.includes(company.id) ? 'bg-muted/30' : ''
                }`}
                onClick={() => setSelectedCompany(company)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={company.id ? selectedRows.includes(company.id) : false}
                    onCheckedChange={() => company.id && toggleRowSelection(company.id)}
                  />
                </TableCell>
                
                {visibleColumns.name && (
                  <TableCell className="font-medium">{company.name}</TableCell>
                )}
                
                {visibleColumns.city && (
                  <TableCell>{company.city}</TableCell>
                )}
                
                {visibleColumns.state && (
                  <TableCell>{company.state}</TableCell>
                )}
                
                {visibleColumns.type && (
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {company.company_type}
                    </Badge>
                  </TableCell>
                )}
                
                {visibleColumns.total_machines && (
                  <TableCell className="font-medium">
                    {company.total_machines}
                  </TableCell>
                )}
                
                {visibleColumns.unique_processes && (
                  <TableCell>{company.unique_processes}</TableCell>
                )}
                
                {visibleColumns.unique_materials && (
                  <TableCell>{company.unique_materials}</TableCell>
                )}
                
                {visibleColumns.unique_manufacturers && (
                  <TableCell>{company.unique_manufacturers}</TableCell>
                )}
                
                {visibleColumns.website && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (company.website) {
                          window.open(company.website, '_blank')
                        }
                      }}
                      className="h-6 text-xs p-1"
                      aria-label={company.website ? `Open ${company.name} website` : 'No website available'}
                      title={company.website ? `Open ${company.name} website` : 'No website available'}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TableCell>
                )}
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-6 p-0"
                      aria-label="More actions"
                      title="More actions"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>View Details</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>View on Map</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>Export</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {currentPageData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No companies found matching your search.</p>
            <p className="text-sm">Try adjusting your search terms.</p>
          </div>
        )}
      </div>

      {/* Mobile list view */}
      <div className="md:hidden flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {currentPageData.map((company) => (
            <button
              key={company.id || company.name}
              onClick={() => setSelectedCompany(company)}
              className="w-full text-left rounded-lg border border-border bg-card p-3 shadow-xs active:bg-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{company.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {(company.city || '—')}, {(company.state || '—')}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {company.company_type && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {company.company_type}
                    </Badge>
                  )}
                  {company.website && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      aria-label={`Open ${company.name} website`}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(company.website!, '_blank')
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded bg-muted/30 p-2 text-center">
                  <div className="text-sm font-semibold">{company.total_machines}</div>
                  <div className="text-[10px] text-muted-foreground">Machines</div>
                </div>
                <div className="rounded bg-muted/30 p-2 text-center">
                  <div className="text-sm font-semibold">{company.unique_processes}</div>
                  <div className="text-[10px] text-muted-foreground">Processes</div>
                </div>
                <div className="rounded bg-muted/30 p-2 text-center">
                  <div className="text-sm font-semibold">{company.unique_materials}</div>
                  <div className="text-[10px] text-muted-foreground">Materials</div>
                </div>
              </div>
            </button>
          ))}
          {currentPageData.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">No companies found.</div>
          )}
        </div>
        {/* Pagination controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 p-0"><ChevronsLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0"><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="h-8 w-8 p-0"><ChevronRight className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="h-8 w-8 p-0"><ChevronsRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>

      {/* Company Detail Modal */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              Detailed information about this additive manufacturing company
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Location</h3>
                    <div className="space-y-1">
                      <p className="text-sm">{selectedCompany.city}, {selectedCompany.state}</p>
                      <p className="text-sm text-muted-foreground">{selectedCompany.country}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Company Type</h3>
                    <Badge variant="outline" className="capitalize">
                      {selectedCompany.company_type}
                    </Badge>
                  </div>

                  {selectedCompany.website && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Website</h3>
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:opacity-90 underline flex items-center gap-1"
                      >
                        {selectedCompany.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Manufacturing Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-primary">{selectedCompany.total_machines}</div>
                      <div className="text-xs text-muted-foreground">Total Machines</div>
                    </div>
                    <div className="bg-chart-2/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-chart-2">{selectedCompany.unique_processes}</div>
                      <div className="text-xs text-muted-foreground">Processes</div>
                    </div>
                    <div className="bg-chart-5/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-chart-5">{selectedCompany.unique_materials}</div>
                      <div className="text-xs text-muted-foreground">Materials</div>
                    </div>
                    <div className="bg-chart-3/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-chart-3">{selectedCompany.unique_manufacturers}</div>
                      <div className="text-xs text-muted-foreground">Manufacturers</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technologies */}
              {selectedCompany.processes && selectedCompany.processes.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Technologies & Processes</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.processes.map((process, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {process}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {selectedCompany.materials && selectedCompany.materials.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Materials</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.materials.map((material, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedCompany.description && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedCompany.description}
                  </p>
                </div>
              )}

              {/* Equipment Breakdown */}
              <div className="pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground mb-4">Equipment Breakdown</h3>
                
                {breakdownLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading equipment data...</span>
                  </div>
                ) : equipmentBreakdown ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Technology Breakdown */}
                    <div>
                      <h4 className="font-medium text-sm mb-3">By Technology ({equipmentBreakdown.technologies.reduce((sum, tech) => sum + tech.count, 0)} machines)</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {equipmentBreakdown.technologies.slice(0, 10).map((tech, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                            <div className="flex-1">
                              <div className="font-medium text-xs">{tech.name}</div>
                              <div className="text-xs text-muted-foreground">{tech.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{tech.count}</div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round((tech.count / equipmentBreakdown.technologies.reduce((sum, t) => sum + t.count, 0)) * 100)}%
                              </div>
                            </div>
                          </div>
                        ))}
                        {equipmentBreakdown.technologies.length > 10 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            +{equipmentBreakdown.technologies.length - 10} more technologies
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Material Breakdown */}
                    <div>
                      <h4 className="font-medium text-sm mb-3">By Material ({equipmentBreakdown.materials.reduce((sum, mat) => sum + mat.count, 0)} machines)</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {equipmentBreakdown.materials.slice(0, 10).map((material, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                            <div className="flex-1">
                              <div className="font-medium text-xs">{material.name}</div>
                              <div className="text-xs text-muted-foreground">{material.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{material.count}</div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round((material.count / equipmentBreakdown.materials.reduce((sum, m) => sum + m.count, 0)) * 100)}%
                              </div>
                            </div>
                          </div>
                        ))}
                        {equipmentBreakdown.materials.length > 10 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            +{equipmentBreakdown.materials.length - 10} more materials
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No detailed equipment data available for this company</p>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {selectedCompany.founded_year && (
                  <div>
                    <span className="text-sm font-medium">Founded:</span>
                    <span className="text-sm text-muted-foreground ml-2">{selectedCompany.founded_year}</span>
                  </div>
                )}
                {selectedCompany.employee_count_range && (
                  <div>
                    <span className="text-sm font-medium">Employees:</span>
                    <span className="text-sm text-muted-foreground ml-2">{selectedCompany.employee_count_range}</span>
                  </div>
                )}
                {selectedCompany.is_public_company !== null && (
                  <div>
                    <span className="text-sm font-medium">Public Company:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {selectedCompany.is_public_company ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {selectedCompany.stock_ticker && (
                  <div>
                    <span className="text-sm font-medium">Stock Ticker:</span>
                    <span className="text-sm text-muted-foreground ml-2">{selectedCompany.stock_ticker}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CsvDataTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [type, setType] = useState<string>('all')
  const [country, setCountry] = useState<string>('all')
  const [hasFunding, setHasFunding] = useState<boolean>(false)
  const [minFunding, setMinFunding] = useState<string>('0')

  const [types, setTypes] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])

  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [total, setTotal] = useState(0)

  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [_error] = useState<string | null>(null)

  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch('/api/companies/filters')
        if (!res.ok) throw new Error(`Failed filters (${res.status})`)
        const json = await res.json()
        setTypes(['all', ...json.types])
        setCountries(['all', ...json.countries])
      } catch (_e) {
        // default to All
        setTypes(['all'])
        setCountries(['all'])
      }
    }
    loadFilters()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (searchQuery.trim()) params.set('q', searchQuery.trim())
        if (type !== 'all') params.set('type', type)
        if (country !== 'all') params.set('country', country)
        if (hasFunding) params.set('hasFunding', 'true')
        if (minFunding && Number(minFunding) > 0) params.set('minFunding', String(Number(minFunding)))
        params.set('page', String(page))
        params.set('perPage', String(perPage))
        const res = await fetch(`/api/companies/search?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Failed table (${res.status})`)
        const json = await res.json()
        setItems(json?.data?.items || [])
        setTotal(json?.data?.total || 0)
      } catch (_e: unknown) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [searchQuery, type, country, hasFunding, minFunding, page, perPage])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const exportColumns: ColumnDef<Record<string, unknown>>[] = [
    { key: 'name', header: 'Company' },
    { key: 'country', header: 'Country' },
    { key: 'company_type', header: 'Type' },
    { key: 'funding.totalMillions', header: 'Funding ($M)', map: (r) => r.funding?.totalMillions ?? 0 },
    { key: 'funding.rounds', header: 'Funding Rounds', map: (r) => r.funding?.rounds ?? 0 },
    { key: 'funding.lastYear', header: 'Last Funding', map: (r) => r.funding?.lastYear ?? '' },
    { key: 'categories', header: 'Categories', map: (r) => (r.categories || []).join('; ') },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'website', header: 'Website' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies, locations..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{total} companies</Badge>
              </div>
            </div>

            <ExportButton 
              data={items}
              columns={exportColumns}
              filenameBase="wohlers-am-companies"
              filters={{ q: searchQuery, type, country, hasFunding, minFunding }}
              size="sm"
              align="end"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1) }}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="minFunding">Min Funding ($M)</Label>
              <Input id="minFunding" type="number" min={0} className="h-8" value={minFunding} onChange={(e) => { setMinFunding(e.target.value); setPage(1) }} />
            </div>
            <div className="space-y-1">
              <Label className="invisible block">Has Funding</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="hasFunding" checked={hasFunding} onCheckedChange={(v) => { setHasFunding(Boolean(v)); setPage(1) }} />
                <Label htmlFor="hasFunding" className="text-sm">Has funding</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead>Rounds</TableHead>
                <TableHead>Last</TableHead>
                <TableHead>Categories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="font-medium">
                    {item.website ? (
                      <a className="hover:underline" href={item.website} target="_blank" rel="noreferrer">{item.name}</a>
                    ) : item.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{item.city ?? '—'}, {item.state ?? '—'}</div>
                  </TableCell>
                  <TableCell>{item.country ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{item.company_type ?? '—'}</Badge></TableCell>
                  <TableCell>${item.funding?.totalMillions ?? 0}M</TableCell>
                  <TableCell>{item.funding?.rounds ?? 0}</TableCell>
                  <TableCell>{item.funding?.lastYear ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.categories || []).slice(0, 5).map((c: string) => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                      ))}
                      {(item.categories || []).length > 5 && (
                        <span className="text-[10px] text-muted-foreground">+{(item.categories || []).length - 5} more</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">No results</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-8 w-8 p-0"><ChevronsLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0"><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 w-8 p-0"><ChevronRight className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="h-8 w-8 p-0"><ChevronsRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DataTableContent() {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'csv') {
    return <CsvDataTable />
  }
  return <SupabaseDataTable />
}
