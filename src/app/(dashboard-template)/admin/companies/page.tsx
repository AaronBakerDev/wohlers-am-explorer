'use client'
export const dynamic = 'force-dynamic'

// ADMIN COMPANIES TABLE - Data Source Management
// This table manages the primary data source for companies, combining elements from both
// printing services and systems manufacturing tables. Admins can enter new rows and manage
// the segment field which categorizes companies (e.g., "AM Systems Manufacturers", "Printing Services").
// The segment field is critical for proper categorization across the application.

import { useEffect, useMemo, useState } from 'react'
// import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash2, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ResponsiveAdminLayout } from '@/components/admin/responsive-admin-layout'
import type { Database, Company, CompanyInsert, CompanyUpdate } from '@/lib/supabase/types'

// Supabase error type
type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Extended company type with equipment and material data
type ExtendedCompany = Company & {
  vendor_id?: string | null
  printer_manufacturer?: string | null
  printer_model?: string | null
  number_of_printers?: number | null
  count_type?: string | null
  process?: string | null
  material_type?: string | null
  material_format?: string | null
  update_year?: number | null
}

// Use the proper Company type but maintain Row compatibility
type Row = ExtendedCompany
type CompaniesRow = Company
type CompaniesInsert = CompanyInsert
type CompaniesUpdate = CompanyUpdate

// Legacy type for minimal compatibility
type _LegacyRow = {
  id: string
  name: string
  company_type: string | null
  country: string | null
  state: string | null
  city: string | null
  website: string | null
  founded_year: number | null
  employee_count_range: string | null
  revenue_range: string | null
  is_public_company: boolean | null
  stock_ticker: string | null
  parent_company: string | null
}

const SEGMENT_OPTIONS = [
  'AM Systems Manufacturers',
  'Printing Services',
  'Material Suppliers',
  'Software Providers',
  'Research & Development',
  'Other'
] as const

const COUNT_TYPES = ['Exact', 'Estimated', 'Range', 'Minimum'] as const

export default function CompaniesAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  type ColumnKey =
    | 'company_type' | 'website' | 'country' | 'state' | 'city'
    | 'founded_year' | 'employee_count_range' | 'revenue_range' | 'is_public_company'
    | 'stock_ticker' | 'public_stock_ticker' | 'parent_company' | 'description'
    | 'subsidiary_info' | 'last_funding_date' | 'total_funding_usd' | 'latitude' | 'longitude'
    | 'created_at' | 'updated_at'
    | 'segment' | 'printer_manufacturer' | 'printer_model' | 'number_of_printers' | 'count_type' | 'process' | 'material_type' | 'material_format' | 'update_year'

  // Columns menu limited to the requested fields
  const companyColumnDefs: { key: ColumnKey; label: string }[] = [
    { key: 'segment', label: 'Segment' },
    { key: 'printer_manufacturer', label: 'Printer manufacturer' },
    { key: 'printer_model', label: 'Printer model' },
    { key: 'number_of_printers', label: 'Number of printers' },
    { key: 'count_type', label: 'Count type' },
    { key: 'process', label: 'Process' },
    { key: 'material_type', label: 'Material type' },
    { key: 'material_format', label: 'Material format' },
    { key: 'country', label: 'Country' },
    { key: 'update_year', label: 'Update year' },
  ]
  // We intentionally omit vendor merged columns from the menu: admin edits/view should
  // focus on the canonical `companies` table.

  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>({
    // Requested columns default to visible
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
    // All other columns default hidden
    company_type: false,
    website: false,
    state: false,
    city: false,
    founded_year: false,
    employee_count_range: false,
    revenue_range: false,
    is_public_company: false,
    stock_ticker: false,
    public_stock_ticker: false,
    parent_company: false,
    description: false,
    subsidiary_info: false,
    last_funding_date: false,
    total_funding_usd: false,
    latitude: false,
    longitude: false,
    created_at: false,
    updated_at: false,
  })

  // Supabase-only mode: CSV demo removed

  const loadRows = async () => {
    try {
      setLoading(true)
      setError(null)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // Get all vendor data
      const { data: mergedData, error: mergedError } = await supabase
        .from('vendor_companies_merged')
        .select('id, company_name, segment, printer_manufacturer, printer_model, number_of_printers, count_type, process, material_type, material_format, country, update_year')
        .order('company_name', { ascending: true })
        .limit(10000)
      if (mergedError) throw mergedError

      // Get companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          segment,
          company_type,
          country,
          state,
          city,
          website,
          founded_year,
          employee_count_range,
          revenue_range,
          is_public_company,
          stock_ticker,
          public_stock_ticker,
          parent_company,
          description,
          subsidiary_info,
          last_funding_date,
          total_funding_usd,
          latitude,
          longitude,
          created_at,
          updated_at
        `)
        .order('name', { ascending: true })
        .limit(10000)
      if (companiesError) throw companiesError

      // Map vendor by name
      const vendorMap = new Map<string, any>()
      mergedData?.forEach(item => {
        const key = item.company_name?.toLowerCase()
        if (key && !vendorMap.has(key)) {
          vendorMap.set(key, item)
        }
      })

      // Merge
      const mergedRows: ExtendedCompany[] = (companiesData ?? []).map(company => {
        const nameLower = company.name.toLowerCase()
        const vendorInfo = vendorMap.get(nameLower)
        return {
          ...company,
          vendor_id: vendorInfo?.id || null,
          segment: company.segment ?? vendorInfo?.segment ?? null,
          printer_manufacturer: vendorInfo?.printer_manufacturer || null,
          printer_model: vendorInfo?.printer_model || null,
          number_of_printers: vendorInfo?.number_of_printers || null,
          count_type: vendorInfo?.count_type || null,
          process: vendorInfo?.process || null,
          material_type: vendorInfo?.material_type || null,
          material_format: vendorInfo?.material_format || null,
          update_year: vendorInfo?.update_year || null,
        }
      })
      setRows(mergedRows)
    } catch (error) {
      const err = error as SupabaseError
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.country || '').toLowerCase().includes(q) ||
      (r.company_type || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])
  const endIndex = useMemo(() => Math.min(startIndex + pageSize, filtered.length), [startIndex, pageSize, filtered.length])
  const pageRows = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex])

  const onCreate = async (payload: CompaniesInsert) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('companies')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    if (data) {
      setRows(prev => [...prev, data as ExtendedCompany].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  const onUpdate = async (id: string, patch: CompaniesUpdate) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('companies')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    if (data) {
      setRows(prev => prev.map(r => (r.id === id ? data as ExtendedCompany : r)))
    }
  }

  const onDelete = async (id: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
    if (error) throw error
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">Columns</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Company Columns</DropdownMenuLabel>
          {companyColumnDefs.map(col => (
            <DropdownMenuCheckboxItem
              key={col.key}
              checked={visibleCols[col.key]}
              onCheckedChange={(v) => setVisibleCols(prev => ({ ...prev, [col.key]: !!v }))}
              className="capitalize"
            >
              {col.label}
            </DropdownMenuCheckboxItem>
          ))}
          {/* No vendor columns shown here */}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies…"
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
      title="Companies"
      description="Manage company records and details"
      actions={headerActions}
    >
      <div className="h-full flex flex-col bg-background">

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading companies...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                {error}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {search ? 'No companies match your search' : 'No companies found'}
                </div>
                {search && (
                  <Button variant="link" size="sm" onClick={() => setSearch('')} className="mt-1">
                    Clear search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <Table className="w-max min-w-[2000px]">
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead className="min-w-[240px] sticky left-0 z-20 bg-background">Company Name</TableHead>
                    {visibleCols.segment && <TableHead className="min-w-[200px]">Segment</TableHead>}
                    {visibleCols.printer_manufacturer && <TableHead className="min-w-[200px]">Printer manufacturer</TableHead>}
                    {visibleCols.printer_model && <TableHead className="min-w-[200px]">Printer model</TableHead>}
                    {visibleCols.number_of_printers && <TableHead className="min-w-[160px]">Number of printers</TableHead>}
                    {visibleCols.count_type && <TableHead className="min-w-[140px]">Count type</TableHead>}
                    {visibleCols.process && <TableHead className="min-w-[160px]">Process</TableHead>}
                    {visibleCols.material_type && <TableHead className="min-w-[180px]">Material type</TableHead>}
                    {visibleCols.material_format && <TableHead className="min-w-[180px]">Material format</TableHead>}
                    {visibleCols.country && <TableHead className="min-w-[140px]">Country</TableHead>}
                    {visibleCols.update_year && <TableHead className="min-w-[140px]">Update year</TableHead>}
                    <TableHead className="w-[1%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium sticky left-0 bg-background z-10">
                        <div className="min-w-0">
                          <div className="truncate">{r.name}</div>
                          <div className="sm:hidden text-xs text-muted-foreground mt-1">
                            {r.segment && <span>{r.segment}</span>}
                            {r.country && <span> • {r.country}</span>}
                          </div>
                        </div>
                      </TableCell>
                      {visibleCols.segment && <TableCell className="text-sm">
                        {r.segment ? (
                          <Badge variant="outline" className="font-normal">
                            {r.segment}
                          </Badge>
                        ) : '—'}
                      </TableCell>}
                      {visibleCols.printer_manufacturer && <TableCell className="text-sm">{r.printer_manufacturer ?? '—'}</TableCell>}
                      {visibleCols.printer_model && <TableCell className="text-sm">{r.printer_model ?? '—'}</TableCell>}
                      {visibleCols.number_of_printers && <TableCell className="text-sm">{r.number_of_printers ?? '—'}</TableCell>}
                      {visibleCols.count_type && <TableCell className="text-sm">{r.count_type ?? '—'}</TableCell>}
                      {visibleCols.process && <TableCell className="text-sm">{r.process ?? '—'}</TableCell>}
                      {visibleCols.material_type && <TableCell className="text-sm">{r.material_type ?? '—'}</TableCell>}
                      {visibleCols.material_format && <TableCell className="text-sm">{r.material_format ?? '—'}</TableCell>}
                      {visibleCols.country && <TableCell className="text-sm">{r.country ?? '—'}</TableCell>}
                      {visibleCols.update_year && <TableCell className="text-sm">{r.update_year ?? '—'}</TableCell>}
                      <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-primary hover:text-primary-foreground" 
                          title="Edit company" 
                          onClick={() => setEditing(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground" 
                          title="Delete company" 
                          onClick={() => setDeleting(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            
            {/* Pagination controls */}
            <div className="flex items-center justify-between px-2 py-3 border-t mt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}
                  >
                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[25, 50, 100, 200].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-muted-foreground">
                  {filtered.length === 0 ? '0' : `${startIndex + 1}-${endIndex}`} of {filtered.length}
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
            </>
          )}
        </div>

        {/* Create dialog */}
        <CompanyDialog
          open={creating}
          onOpenChange={setCreating}
          title="New Company"
          onSubmit={async (values) => {
            await onCreate(values)
            setCreating(false)
          }}
          onSaved={loadRows}
        />

        {/* Edit dialog */}
        {editing && (
          <CompanyDialog
            open={!!editing}
            onOpenChange={(v) => !v && setEditing(null)}
            title={`Edit — ${editing.name}`}
            initialValues={editing}
            onSubmit={async (values) => {
              await onUpdate(editing.id, values)
              setEditing(null)
            }}
            onSaved={loadRows}
          />
        )}

        {/* Delete confirm */}
        <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete company</DialogTitle>
            </DialogHeader>
            <div className="text-sm">
              Are you sure you want to delete <span className="font-medium">{deleting?.name}</span>?
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deleting) return
                  await onDelete(deleting.id)
                  setDeleting(null)
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsiveAdminLayout>
  )
}

function CompanyDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  initialValues,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  onSubmit: (values: CompaniesInsert) => Promise<void>
  initialValues?: Partial<ExtendedCompany>
  onSaved?: () => Promise<void> | void
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [segment, setSegment] = useState<string | null>(initialValues?.segment ?? null)
  const [country, setCountry] = useState(initialValues?.country ?? '')
  // Vendor/merged view fields (read-only in this dialog)
  const [printer_manufacturer, setPrinterManufacturer] = useState(initialValues?.printer_manufacturer ?? '')
  const [printer_model, setPrinterModel] = useState(initialValues?.printer_model ?? '')
  const [number_of_printers, setNumberOfPrinters] = useState<number | ''>(initialValues?.number_of_printers ?? '')
  const [count_type, setCountType] = useState<string>(initialValues?.count_type ?? '')
  const [process, setProcess] = useState(initialValues?.process ?? '')
  const [material_type, setMaterialType] = useState(initialValues?.material_type ?? '')
  const [material_format, setMaterialFormat] = useState(initialValues?.material_format ?? '')
  const [update_year, setUpdateYear] = useState<number | ''>(initialValues?.update_year ?? '')
  const vendor_id = initialValues?.vendor_id ?? null
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setName(initialValues?.name ?? '')
    setSegment(initialValues?.segment ?? null)
    setCountry(initialValues?.country ?? '')
    setPrinterManufacturer(initialValues?.printer_manufacturer ?? '')
    setPrinterModel(initialValues?.printer_model ?? '')
    setNumberOfPrinters(initialValues?.number_of_printers ?? '')
    setCountType(initialValues?.count_type ?? '')
    setProcess(initialValues?.process ?? '')
    setMaterialType(initialValues?.material_type ?? '')
    setMaterialFormat(initialValues?.material_format ?? '')
    setUpdateYear(initialValues?.update_year ?? '')
  }, [
    initialValues?.id,
    initialValues?.name,
    initialValues?.segment,
    initialValues?.country,
    initialValues?.printer_manufacturer,
    initialValues?.printer_model,
    initialValues?.number_of_printers,
    initialValues?.count_type,
    initialValues?.process,
    initialValues?.material_type,
    initialValues?.material_format,
    initialValues?.update_year,
  ])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (!name) throw new Error('Company name is required')
      await onSubmit({
        name,
        segment: segment ?? null,
        country: country || null,
      })
      // Persist vendor-related fields
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const vendorPayload: any = {
        company_name: name,
        // map to vendor segment only if obvious; otherwise leave as-is
        segment: segment?.toLowerCase().includes('manufacturer') ? 'System manufacturer' : 'Printing services',
        printer_manufacturer: printer_manufacturer || null,
        printer_model: printer_model || null,
        number_of_printers: number_of_printers === '' ? null : Number(number_of_printers),
        count_type: count_type || null,
        process: process || null,
        material_type: material_type || null,
        material_format: material_format || null,
        country: country || null,
        update_year: update_year === '' ? null : Number(update_year),
      }
      const hasVendorInput = (
        (vendorPayload.printer_manufacturer && vendorPayload.printer_manufacturer !== '') ||
        (vendorPayload.printer_model && vendorPayload.printer_model !== '') ||
        vendorPayload.number_of_printers !== null ||
        (vendorPayload.count_type && vendorPayload.count_type !== '') ||
        (vendorPayload.process && vendorPayload.process !== '') ||
        (vendorPayload.material_type && vendorPayload.material_type !== '') ||
        (vendorPayload.material_format && vendorPayload.material_format !== '') ||
        vendorPayload.update_year !== null
      )

      if (vendor_id || hasVendorInput) {
        if (vendor_id) {
          await supabase
            .from('vendor_companies_merged')
            .update(vendorPayload)
            .eq('id', vendor_id)
        } else {
          const { data: existing } = await supabase
            .from('vendor_companies_merged')
            .select('id')
            .eq('company_name', name)
            .limit(1)
          if (existing && existing.length > 0) {
            await supabase
              .from('vendor_companies_merged')
              .update(vendorPayload)
              .eq('id', existing[0].id)
          } else {
            await supabase
              .from('vendor_companies_merged')
              .insert(vendorPayload)
          }
        }
      }
      // trigger parent refresh
      await onSaved?.()
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., EOS GmbH" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Segment</label>
            <Select value={segment ?? ''} onValueChange={(v) => setSegment(v === '__clear__' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select segment…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__">None</SelectItem>
                {SEGMENT_OPTIONS.map(seg => (
                  <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Printer manufacturer</label>
            <Input value={printer_manufacturer ?? ''} onChange={(e) => setPrinterManufacturer(e.target.value)} placeholder="e.g., EOS" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Printer model</label>
            <Input value={printer_model ?? ''} onChange={(e) => setPrinterModel(e.target.value)} placeholder="e.g., M400" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Number of printers</label>
            <Input type="number" min={0} value={number_of_printers === '' ? '' : String(number_of_printers)} onChange={(e) => setNumberOfPrinters(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Count type</label>
            <Select value={count_type} onValueChange={(v) => setCountType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {COUNT_TYPES.map(ct => (
                  <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Process</label>
            <Input value={process ?? ''} onChange={(e) => setProcess(e.target.value)} placeholder="e.g., SLS" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material type</label>
            <Input value={material_type ?? ''} onChange={(e) => setMaterialType(e.target.value)} placeholder="e.g., Metal" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material format</label>
            <Input value={material_format ?? ''} onChange={(e) => setMaterialFormat(e.target.value)} placeholder="e.g., Powder" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Country</label>
            <Input value={country ?? ''} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Germany" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Update year</label>
            <Input type="number" value={update_year === '' ? '' : String(update_year)} onChange={(e) => setUpdateYear(e.target.value === '' ? '' : Number(e.target.value))} />
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
