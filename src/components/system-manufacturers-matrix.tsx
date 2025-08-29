'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { ColumnDef } from '@/lib/export'

type Row = {
  company: string
  country: string
  processes: string[]
  materials: string[]
  website?: string | null
}

type SortField = 'company' | 'country' | 'processes' | 'materials'
type SortDirection = 'asc' | 'desc'

export default function SystemManufacturersMatrix() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])

  const [visibleColumns, setVisibleColumns] = useState({
    country: true,
    company: true,
    processes: true,
    materials: true,
    website: true,
  })

  const [sortField, setSortField] = useState<SortField>('company')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/system-manufacturers')
        const json = await res.json()
        setRows(json.data || [])
        setError(null)
      } catch (_e) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const countries = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.country).filter(Boolean))).sort()
  }, [rows])

  const processes = useMemo(() => {
    const s = new Set<string>()
    rows.forEach((r) => (r.processes || []).forEach((p) => s.add(p)))
    return Array.from(s).sort()
  }, [rows])

  const materials = useMemo(() => {
    const s = new Set<string>()
    rows.forEach((r) => (r.materials || []).forEach((m) => s.add(m)))
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(() => {
    let list = rows
    if (q) {
      const qq = q.toLowerCase()
      list = list.filter((r) => `${r.company} ${r.country}`.toLowerCase().includes(qq))
    }
    if (selectedCountries.length > 0) {
      const set = new Set(selectedCountries)
      list = list.filter((r) => set.has(r.country))
    }
    if (selectedProcesses.length > 0) {
      const set = new Set(selectedProcesses)
      list = list.filter((r) => r.processes?.some((p) => set.has(p)))
    }
    if (selectedMaterials.length > 0) {
      const set = new Set(selectedMaterials)
      list = list.filter((r) => r.materials?.some((m) => set.has(m)))
    }
    return [...list]
  }, [rows, q, selectedCountries, selectedProcesses, selectedMaterials])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      switch (sortField) {
        case 'company':
          av = a.company
          bv = b.company
          break
        case 'country':
          av = a.country
          bv = b.country
          break
        case 'processes':
          av = a.processes?.length || 0
          bv = b.processes?.length || 0
          break
        case 'materials':
          av = a.materials?.length || 0
          bv = b.materials?.length || 0
          break
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return list
  }, [filtered, sortField, sortDir])

  const totalManufacturers = rows.length
  const totalCountries = useMemo(() => new Set(rows.map((r) => r.country)).size, [rows])
  const totalProcesses = useMemo(() => {
    const s = new Set<string>()
    rows.forEach((r) => r.processes?.forEach((p) => s.add(p)))
    return s.size
  }, [rows])
  const totalMaterials = useMemo(() => {
    const s = new Set<string>()
    rows.forEach((r) => r.materials?.forEach((m) => s.add(m)))
    return s.size
  }, [rows])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const exportColumns: ColumnDef<Row & { processesText?: string; materialsText?: string }>[] = [
    { key: 'company', header: 'Company' },
    { key: 'country', header: 'Country' },
    { key: 'processesText', header: 'Processes', map: (r) => (r.processes || []).join('; ') },
    { key: 'materialsText', header: 'Materials', map: (r) => (r.materials || []).join('; ') },
    { key: 'website', header: 'Website' },
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading system manufacturers…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-destructive">{error}</div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Controls Header */}
      <div className="border-b border-border bg-card">
        <div className="p-4">
          <div className="flex flex-col gap-3">
            {/* Search + Status */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies or countries…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {sorted.length} companies
                  </Badge>
                </div>
              </div>

              {/* Column visibility + Export */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Columns
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
                          setVisibleColumns((prev) => ({ ...prev, [column]: checked }))
                        }
                        className="capitalize"
                      >
                        {column}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <ExportButton
                  data={sorted}
                  columns={exportColumns}
                  filenameBase="system-manufacturers-matrix"
                  size="sm"
                  align="end"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Country filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Country ({selectedCountries.length || 'All'})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-72 overflow-auto w-56">
                  <DropdownMenuLabel>Countries</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {countries.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c}
                      checked={selectedCountries.includes(c)}
                      onCheckedChange={(checked) =>
                        setSelectedCountries((prev) =>
                          checked ? [...prev, c] : prev.filter((x) => x !== c)
                        )
                      }
                    >
                      {c}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Process filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Process ({selectedProcesses.length || 'All'})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-72 overflow-auto w-56">
                  <DropdownMenuLabel>Processes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {processes.map((p) => (
                    <DropdownMenuCheckboxItem
                      key={p}
                      checked={selectedProcesses.includes(p)}
                      onCheckedChange={(checked) =>
                        setSelectedProcesses((prev) =>
                          checked ? [...prev, p] : prev.filter((x) => x !== p)
                        )
                      }
                    >
                      {p}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Material filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Material ({selectedMaterials.length || 'All'})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-72 overflow-auto w-56">
                  <DropdownMenuLabel>Materials</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {materials.map((m) => (
                    <DropdownMenuCheckboxItem
                      key={m}
                      checked={selectedMaterials.includes(m)}
                      onCheckedChange={(checked) =>
                        setSelectedMaterials((prev) =>
                          checked ? [...prev, m] : prev.filter((x) => x !== m)
                        )
                      }
                    >
                      {m}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {(selectedCountries.length > 0 || selectedProcesses.length > 0 || selectedMaterials.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setSelectedCountries([])
                    setSelectedProcesses([])
                    setSelectedMaterials([])
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/30 border border-border p-3 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground">MANUFACTURERS</div>
                <div className="text-xl font-semibold">{totalManufacturers.toLocaleString()}</div>
              </div>
              <div className="bg-muted/30 border border-border p-3 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground">COUNTRIES</div>
                <div className="text-xl font-semibold">{totalCountries.toLocaleString()}</div>
              </div>
              <div className="bg-muted/30 border border-border p-3 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground">PROCESS TYPES</div>
                <div className="text-xl font-semibold">{totalProcesses.toLocaleString()}</div>
              </div>
              <div className="bg-muted/30 border border-border p-3 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground">MATERIAL CATEGORIES</div>
                <div className="text-xl font-semibold">{totalMaterials.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              {visibleColumns.country && (
                <TableHead onClick={() => toggleSort('country')} className="cursor-pointer">
                  <div className="inline-flex items-center gap-1">
                    Country {sortIcon('country')}
                  </div>
                </TableHead>
              )}
              {visibleColumns.company && (
                <TableHead onClick={() => toggleSort('company')} className="cursor-pointer">
                  <div className="inline-flex items-center gap-1">
                    Company {sortIcon('company')}
                  </div>
                </TableHead>
              )}
              {visibleColumns.processes && <TableHead>Types of AM Processes</TableHead>}
              {visibleColumns.materials && <TableHead>Material</TableHead>}
              {visibleColumns.website && <TableHead className="w-16 text-right">Link</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r, idx) => (
              <TableRow key={`${r.company}-${idx}`} className="border-border">
                {visibleColumns.country && <TableCell className="whitespace-nowrap">{r.country}</TableCell>}
                {visibleColumns.company && <TableCell className="font-medium">{r.company}</TableCell>}
                {visibleColumns.processes && (
                  <TableCell className="max-w-[420px]">
                    <div className="flex flex-wrap gap-1.5">
                      {(r.processes || []).map((p, i) => (
                        <Badge key={`${p}-${i}`} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {(!r.processes || r.processes.length === 0) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.materials && (
                  <TableCell className="max-w-[420px]">
                    <div className="flex flex-wrap gap-1.5">
                      {(r.materials || []).map((m, i) => (
                        <Badge key={`${m}-${i}`} variant="outline" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                      {(!r.materials || r.materials.length === 0) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.website && (
                  <TableCell className="text-right">
                    {r.website ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 p-1"
                        onClick={() => window.open(r.website!, '_blank')}
                        title="Open website"
                        aria-label={`Open ${r.company} website`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  No results. Adjust filters or search query.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
