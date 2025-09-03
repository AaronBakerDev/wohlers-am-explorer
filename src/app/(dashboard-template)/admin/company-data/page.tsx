'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Pencil, Trash2, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { ResponsiveAdminLayout } from '@/components/admin/responsive-admin-layout'

type CountType = 'Exact' | 'Estimated' | 'Range' | 'Minimum'

type VendorRow = {
  id: string
  company_name: string
  segment: 'Printing services' | 'System manufacturer'
  printer_manufacturer: string | null
  printer_model: string | null
  number_of_printers: number | null
  count_type: CountType | null
  process: string | null
  material_type: string | null
  material_format: string | null
  country: string | null
  update_year: number | null
  website?: string | null
  headquarters_city?: string | null
}

type VendorInsert = Omit<VendorRow, 'id'>
type VendorUpdate = Partial<Omit<VendorRow, 'id'>>

const COUNT_TYPES: CountType[] = ['Exact', 'Estimated', 'Range', 'Minimum']
const SEGMENTS = ['Printing services', 'System manufacturer'] as const

export default function CompanyDataAdminPage() {
  const [rows, setRows] = useState<VendorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<'all' | VendorRow['segment']>('all')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<VendorRow | null>(null)
  const [deleting, setDeleting] = useState<VendorRow | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  // Column layout preference: fit content vs even distribution
  const [columnLayout, setColumnLayout] = useState<'fit' | 'even'>('fit')

  type ColumnKey = keyof Pick<VendorRow,
    'segment' | 'printer_manufacturer' | 'printer_model' | 'number_of_printers' |
    'count_type' | 'process' | 'material_type' | 'material_format' | 'country' |
    'update_year' | 'website' | 'headquarters_city'
  >
  const columnDefs: { key: ColumnKey; label: string }[] = [
    { key: 'segment', label: 'Segment' },
    { key: 'printer_manufacturer', label: 'Manufacturer' },
    { key: 'printer_model', label: 'Model' },
    { key: 'number_of_printers', label: '# Printers' },
    { key: 'count_type', label: 'Count Type' },
    { key: 'process', label: 'Process' },
    { key: 'material_type', label: 'Material' },
    { key: 'material_format', label: 'Format' },
    { key: 'country', label: 'Country' },
    { key: 'update_year', label: 'Year' },
    { key: 'website', label: 'Website' },
    { key: 'headquarters_city', label: 'HQ City' },
  ]
  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>({
    segment: true,
    printer_manufacturer: true,
    printer_model: true,
    number_of_printers: true,
    count_type: true,
    process: true,
    material_type: true,
    material_format: true,
    country: true,
    update_year: true,
    website: false,
    headquarters_city: false,
  })

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
          .from('vendor_companies_merged')
          .select('id, company_name, segment, printer_manufacturer, printer_model, number_of_printers, count_type, process, material_type, material_format, country, update_year, website, headquarters_city')
          .in('segment', SEGMENTS as unknown as string[])
          .order('company_name', { ascending: true })
          .limit(10000)
        if (error) throw error

        const normCount = (v: any): CountType | null => {
          if (v == null) return null
          const s = String(v || '').toLowerCase()
          if (s === 'actual' || s === 'exact') return 'Exact'
          if (s === 'minimum' || s === 'min') return 'Minimum'
          if (s === 'range') return 'Range'
          return 'Estimated'
        }

        setRows(((data ?? []) as any[]).map(r => ({
          ...r,
          count_type: normCount(r.count_type)
        })) as VendorRow[])
      } catch (e: any) {
        setError(e?.message || 'Failed to load company data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    let res = rows
    if (segmentFilter !== 'all') {
      res = res.filter(r => r.segment === segmentFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      res = res.filter(r =>
        r.company_name.toLowerCase().includes(q) ||
        (r.printer_manufacturer || '').toLowerCase().includes(q) ||
        (r.printer_model || '').toLowerCase().includes(q) ||
        (r.process || '').toLowerCase().includes(q) ||
        (r.material_type || '').toLowerCase().includes(q) ||
        (r.material_format || '').toLowerCase().includes(q) ||
        (r.country || '').toLowerCase().includes(q)
      )
    }
    return res
  }, [rows, segmentFilter, search])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])
  const endIndex = useMemo(() => Math.min(startIndex + pageSize, filtered.length), [startIndex, pageSize, filtered.length])
  const pageRows = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex])

  const onCreate = async (payload: VendorInsert) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vendor_companies_merged')
      .insert(payload as any)
      .select('*')
      .single()
    if (error) throw error
    setRows(prev => [...prev, data as VendorRow].sort((a, b) => a.company_name.localeCompare(b.company_name)))
  }

  const onUpdate = async (id: string, patch: VendorUpdate) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vendor_companies_merged')
      .update(patch as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    setRows(prev => prev.map(r => (r.id === id ? (data as VendorRow) : r)))
  }

  const onDelete = async (id: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase
      .from('vendor_companies_merged')
      .delete()
      .eq('id', id)
    if (error) throw error
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="hidden sm:inline-flex">{filtered.length} records</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">Columns</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
          {columnDefs.map(col => (
            <DropdownMenuCheckboxItem
              key={col.key}
              checked={visibleCols[col.key]}
              onCheckedChange={(v) => setVisibleCols(prev => ({ ...prev, [col.key]: !!v }))}
            >
              {col.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setColumnLayout(prev => (prev === 'fit' ? 'even' : 'fit'))}
        title={columnLayout === 'fit' ? 'Switch to even column widths' : 'Switch to fit-to-content widths'}
      >
        {columnLayout === 'fit' ? 'Layout: Fit' : 'Layout: Even'}
      </Button>
      <Select value={segmentFilter} onValueChange={(v: any) => { setSegmentFilter(v); setCurrentPage(1) }}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Segment" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Segments</SelectItem>
          {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="pl-9 w-44 md:w-56"
        />
      </div>
      <Button size="sm" onClick={() => setCreating(true)} className="shrink-0">
        <Plus className="h-4 w-4 mr-1" /> New
      </Button>
    </div>
  )

  return (
    <ResponsiveAdminLayout
      title="Company Data (Printing Services + Manufacturers)"
      description="Manage vendor company data across both segments"
      actions={headerActions}
    >
      <div className="h-full flex flex-col bg-background">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading company data…</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">{error}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {search || segmentFilter !== 'all' ? 'No results match your filters' : 'No data found'}
                </div>
                {(search || segmentFilter !== 'all') && (
                  <Button variant="link" size="sm" onClick={() => { setSearch(''); setSegmentFilter('all') }} className="mt-1">
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className={columnLayout === 'even' ? 'table-fixed w-full' : 'table-auto w-max min-w-[1600px]'}>
                  {/* Optional: keep widths sensible in fit mode using colgroup */}
                  {columnLayout === 'fit' && (
                    <colgroup>
                      <col className="w-[200px]" />
                      {visibleCols.segment && <col className="w-[160px]" />}
                      {visibleCols.printer_manufacturer && <col className="w-[220px]" />}
                      {visibleCols.printer_model && <col className="w-[220px]" />}
                      {visibleCols.number_of_printers && <col className="w-[120px]" />}
                      {visibleCols.count_type && <col className="w-[140px]" />}
                      {visibleCols.process && <col className="w-[180px]" />}
                      {visibleCols.material_type && <col className="w-[180px]" />}
                      {visibleCols.material_format && <col className="w-[160px]" />}
                      {visibleCols.country && <col className="w-[140px]" />}
                      {visibleCols.update_year && <col className="w-[120px]" />}
                      {visibleCols.website && <col className="w-[80px]" />}
                      {visibleCols.headquarters_city && <col className="w-[180px]" />}
                      <col className="w-[1%]" />
                    </colgroup>
                  )}
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="sticky left-0 z-20 bg-background whitespace-nowrap">Company</TableHead>
                      {visibleCols.segment && <TableHead className="whitespace-nowrap">Segment</TableHead>}
                      {visibleCols.printer_manufacturer && <TableHead className="whitespace-nowrap">Manufacturer</TableHead>}
                      {visibleCols.printer_model && <TableHead className="whitespace-nowrap">Model</TableHead>}
                      {visibleCols.number_of_printers && <TableHead className="text-right whitespace-nowrap">#</TableHead>}
                      {visibleCols.count_type && <TableHead className="whitespace-nowrap">Count Type</TableHead>}
                      {visibleCols.process && <TableHead className="whitespace-nowrap">Process</TableHead>}
                      {visibleCols.material_type && <TableHead className="whitespace-nowrap">Material</TableHead>}
                      {visibleCols.material_format && <TableHead className="whitespace-nowrap">Format</TableHead>}
                      {visibleCols.country && <TableHead className="whitespace-nowrap">Country</TableHead>}
                      {visibleCols.update_year && <TableHead className="whitespace-nowrap">Year</TableHead>}
                      {visibleCols.website && <TableHead className="whitespace-nowrap text-center">Website</TableHead>}
                      {visibleCols.headquarters_city && <TableHead className="whitespace-nowrap">HQ City</TableHead>}
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">
                          <div className="min-w-0">
                            <div className="truncate max-w-[200px]" title={r.company_name}>{r.company_name}</div>
                            <div className="md:hidden text-xs text-muted-foreground mt-1">
                              {r.segment}
                            </div>
                          </div>
                        </TableCell>
                        {visibleCols.segment && <TableCell className="whitespace-nowrap">{r.segment}</TableCell>}
                        {visibleCols.printer_manufacturer && (
                          <TableCell className="whitespace-nowrap">
                            <span className="truncate inline-block max-w-[220px]" title={r.printer_manufacturer ?? ''}>{r.printer_manufacturer ?? '—'}</span>
                          </TableCell>
                        )}
                        {visibleCols.printer_model && (
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            <span className="truncate inline-block max-w-[220px]" title={r.printer_model ?? ''}>{r.printer_model ?? '—'}</span>
                          </TableCell>
                        )}
                        {visibleCols.number_of_printers && <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">{r.number_of_printers ?? '—'}</TableCell>}
                        {visibleCols.count_type && (
                          <TableCell className="whitespace-nowrap">
                            <span className="truncate inline-block max-w-[140px]" title={r.count_type ?? ''}>{r.count_type ?? '—'}</span>
                          </TableCell>
                        )}
                        {visibleCols.process && (
                          <TableCell className="whitespace-nowrap">
                            <span className="truncate inline-block max-w-[180px]" title={r.process ?? ''}>{r.process ?? '—'}</span>
                          </TableCell>
                        )}
                        {visibleCols.material_type && (
                          <TableCell className="whitespace-nowrap">
                            <span className="truncate inline-block max-w-[180px]" title={r.material_type ?? ''}>{r.material_type ?? '—'}</span>
                          </TableCell>
                        )}
                        {visibleCols.material_format && (
                          <TableCell className="whitespace-nowrap">
                            <span className="truncate inline-block max-w-[160px]" title={r.material_format ?? ''}>{r.material_format ?? '—'}</span>
                          </TableCell>
                        )}
                        {visibleCols.country && (
                          <TableCell className="whitespace-nowrap">
                            <span className="truncate inline-block max-w-[140px]" title={r.country ?? ''}>{r.country ?? '—'}</span>
                          </TableCell>
                        )}
                        {visibleCols.update_year && <TableCell className="whitespace-nowrap">{r.update_year ?? '—'}</TableCell>}
                        {visibleCols.website && (
                          <TableCell className="whitespace-nowrap">
                            {r.website ? (
                              <a
                                href={r.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted"
                                title={r.website}
                                aria-label="Open website"
                              >
                                {/* simple external link glyph */}
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
                              </a>
                            ) : '—'}
                          </TableCell>
                        )}
                        {visibleCols.headquarters_city && (
                          <TableCell className="whitespace-nowrap">
                            <span className="truncate inline-block max-w-[180px]" title={r.headquarters_city ?? ''}>{r.headquarters_city ?? '—'}</span>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary hover:text-primary-foreground" title="Edit" onClick={() => setEditing(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground" title="Delete" onClick={() => setDeleting(r)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-2 py-3 border-t mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}>
                      <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[25, 50, 100, 200].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-sm text-muted-foreground">{filtered.length === 0 ? '0' : `${startIndex + 1}-${endIndex}`} of {filtered.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
                    <ChevronsLeft className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[100px] text-center">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                    <ChevronsRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Create/Edit Dialogs */}
        <EntityDialog
          open={creating}
          onOpenChange={setCreating}
          title="New Company Data"
          onSubmit={async (values) => { await onCreate(values); setCreating(false) }}
        />

        {editing && (
          <EntityDialog
            open={!!editing}
            onOpenChange={(v) => !v && setEditing(null)}
            title={`Edit — ${editing.company_name}`}
            initialValues={editing}
            onSubmit={async (values) => { await onUpdate(editing.id, values); setEditing(null) }}
          />
        )}

        <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete row</DialogTitle>
            </DialogHeader>
            <div className="text-sm">Are you sure you want to delete <span className="font-medium">{deleting?.company_name}</span>?</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => { if (!deleting) return; await onDelete(deleting.id); setDeleting(null) }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsiveAdminLayout>
  )
}

function EntityDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  initialValues,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  onSubmit: (values: VendorInsert) => Promise<void>
  initialValues?: Partial<VendorRow>
}) {
  const [company_name, setCompanyName] = useState(initialValues?.company_name ?? '')
  const [segment, setSegment] = useState<VendorRow['segment']>((initialValues?.segment as any) ?? 'Printing services')
  const [printer_manufacturer, setPrinterManufacturer] = useState(initialValues?.printer_manufacturer ?? '')
  const [printer_model, setPrinterModel] = useState(initialValues?.printer_model ?? '')
  const [number_of_printers, setNumberOfPrinters] = useState<number | ''>(initialValues?.number_of_printers ?? '')
  const [count_type, setCountType] = useState<CountType | ''>((initialValues?.count_type as any) ?? '')
  const [process, setProcess] = useState(initialValues?.process ?? '')
  const [material_type, setMaterialType] = useState(initialValues?.material_type ?? '')
  const [material_format, setMaterialFormat] = useState(initialValues?.material_format ?? '')
  const [country, setCountry] = useState(initialValues?.country ?? '')
  const [update_year, setUpdateYear] = useState<number | ''>(initialValues?.update_year ?? '')
  const [website, setWebsite] = useState(initialValues?.website ?? '')
  const [headquarters_city, setHqCity] = useState(initialValues?.headquarters_city ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCompanyName(initialValues?.company_name ?? '')
    setSegment((initialValues?.segment as any) ?? 'Printing services')
    setPrinterManufacturer(initialValues?.printer_manufacturer ?? '')
    setPrinterModel(initialValues?.printer_model ?? '')
    setNumberOfPrinters(initialValues?.number_of_printers ?? '')
    setCountType((initialValues?.count_type as any) ?? '')
    setProcess(initialValues?.process ?? '')
    setMaterialType(initialValues?.material_type ?? '')
    setMaterialFormat(initialValues?.material_format ?? '')
    setCountry(initialValues?.country ?? '')
    setUpdateYear(initialValues?.update_year ?? '')
    setWebsite(initialValues?.website ?? '')
    setHqCity(initialValues?.headquarters_city ?? '')
  }, [
    initialValues?.id,
    initialValues?.company_name,
    initialValues?.segment,
    initialValues?.printer_manufacturer,
    initialValues?.printer_model,
    initialValues?.number_of_printers,
    initialValues?.count_type,
    initialValues?.process,
    initialValues?.material_type,
    initialValues?.material_format,
    initialValues?.country,
    initialValues?.update_year,
    initialValues?.website,
    initialValues?.headquarters_city,
  ])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (!company_name) throw new Error('Company name is required')
      if (!segment) throw new Error('Segment is required')
      await onSubmit({
        company_name,
        segment,
        printer_manufacturer: printer_manufacturer || null,
        printer_model: printer_model || null,
        number_of_printers: number_of_printers === '' ? null : Number(number_of_printers),
        count_type: (count_type || null) as CountType | null,
        process: process || null,
        material_type: material_type || null,
        material_format: material_format || null,
        country: country || null,
        update_year: update_year === '' ? null : Number(update_year),
        website: website || null,
        headquarters_city: headquarters_city || null,
      })
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-auto max-w-3xl sm:max-w-4xl max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Company Name</label>
            <Input value={company_name} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Segment</label>
            <Select value={segment} onValueChange={(v: VendorRow['segment']) => setSegment(v)}>
              <SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
              <SelectContent>
                {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Manufacturer</label>
            <Input value={printer_manufacturer ?? ''} onChange={(e) => setPrinterManufacturer(e.target.value)} placeholder="e.g., EOS" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Model</label>
            <Input value={printer_model ?? ''} onChange={(e) => setPrinterModel(e.target.value)} placeholder="e.g., M400" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground"># Printers</label>
            <Input type="number" min={0} value={number_of_printers === '' ? '' : String(number_of_printers)} onChange={(e) => setNumberOfPrinters(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Count Type</label>
            <Select value={count_type || ''} onValueChange={(v: CountType | '') => setCountType(v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {COUNT_TYPES.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Process</label>
            <Input value={process ?? ''} onChange={(e) => setProcess(e.target.value)} placeholder="e.g., SLS" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Type</label>
            <Input value={material_type ?? ''} onChange={(e) => setMaterialType(e.target.value)} placeholder="e.g., Metal" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Format</label>
            <Input value={material_format ?? ''} onChange={(e) => setMaterialFormat(e.target.value)} placeholder="e.g., Powder" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Country</label>
            <Input value={country ?? ''} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., United States" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Update Year</label>
            <Input type="number" value={update_year === '' ? '' : String(update_year)} onChange={(e) => setUpdateYear(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Website (optional)</label>
            <Input value={website ?? ''} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Headquarters City (optional)</label>
            <Input value={headquarters_city ?? ''} onChange={(e) => setHqCity(e.target.value)} placeholder="e.g., Leuven" />
          </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Separator className="my-2" />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
