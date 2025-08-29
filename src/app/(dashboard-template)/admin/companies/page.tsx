'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Building2, Plus, Pencil, Trash2, ExternalLink, Search } from 'lucide-react'
import { ResponsiveAdminLayout } from '@/components/admin/responsive-admin-layout'
import type { Database, Company, CompanyInsert, CompanyUpdate } from '@/lib/supabase/types'

// Supabase error type
type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Use the proper Company type but maintain Row compatibility
type Row = Company
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

const COMPANY_TYPES = ['equipment', 'service', 'material', 'software'] as const

export default function CompaniesAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)

  // Supabase-only mode: CSV demo removed

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, company_type, country, state, city, website, founded_year, employee_count_range, revenue_range, is_public_company, stock_ticker, parent_company')
          .order('name', { ascending: true })
          .limit(5000)
        if (error) throw error
        setRows(data as Company[] || [])
      } catch (error) {
        const err = error as SupabaseError
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
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
      setRows(prev => [...prev, data as Company].sort((a, b) => a.name.localeCompare(b.name)))
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
      setRows(prev => prev.map(r => (r.id === id ? data as Company : r)))
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
      <Badge variant="secondary" className="hidden sm:inline-flex">{rows.length} records</Badge>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Country</TableHead>
                    <TableHead className="hidden lg:table-cell">City</TableHead>
                    <TableHead className="hidden xl:table-cell">Founded</TableHead>
                    <TableHead className="hidden md:table-cell">Website</TableHead>
                    <TableHead className="w-[1%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="min-w-0">
                          <div className="truncate">{r.name}</div>
                          <div className="sm:hidden text-xs text-muted-foreground mt-1">
                            {r.company_type && <span>{r.company_type}</span>}
                            {r.country && <span> • {r.country}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{r.company_type ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{r.country ?? '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{r.city ?? '—'}</TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{r.founded_year ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.website ? (
                          <Link href={r.website} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <span className="truncate max-w-[150px] text-sm">{r.website}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                      ) : ''}
                    </TableCell>
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
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  onSubmit: (values: CompaniesInsert) => Promise<void>
  initialValues?: Partial<Company>
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [company_type, setCompanyType] = useState<string | null>(initialValues?.company_type ?? null)
  const [country, setCountry] = useState(initialValues?.country ?? '')
  const [state, setStateVal] = useState(initialValues?.state ?? '')
  const [city, setCity] = useState(initialValues?.city ?? '')
  const [website, setWebsite] = useState(initialValues?.website ?? '')
  const [founded_year, setFounded] = useState<number | undefined>(initialValues?.founded_year ?? undefined)
  const [employee_count_range, setEmployees] = useState(initialValues?.employee_count_range ?? '')
  const [revenue_range, setRevenue] = useState(initialValues?.revenue_range ?? '')
  const [is_public_company, setIsPublic] = useState<boolean>(!!initialValues?.is_public_company)
  const [stock_ticker, setTicker] = useState(initialValues?.stock_ticker ?? '')
  const [parent_company, setParent] = useState(initialValues?.parent_company ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setName(initialValues?.name ?? '')
    setCompanyType(initialValues?.company_type ?? null)
    setCountry(initialValues?.country ?? '')
    setStateVal(initialValues?.state ?? '')
    setCity(initialValues?.city ?? '')
    setWebsite(initialValues?.website ?? '')
    setFounded(initialValues?.founded_year ?? undefined)
    setEmployees(initialValues?.employee_count_range ?? '')
    setRevenue(initialValues?.revenue_range ?? '')
    setIsPublic(!!initialValues?.is_public_company)
    setTicker(initialValues?.stock_ticker ?? '')
    setParent(initialValues?.parent_company ?? '')
  }, [
    initialValues?.id,
    initialValues?.name,
    initialValues?.company_type,
    initialValues?.country,
    initialValues?.state,
    initialValues?.city,
    initialValues?.website,
    initialValues?.founded_year,
    initialValues?.employee_count_range,
    initialValues?.revenue_range,
    initialValues?.is_public_company,
    initialValues?.stock_ticker,
    initialValues?.parent_company
  ])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (!name) throw new Error('Company name is required')
      await onSubmit({
        name,
        company_type: company_type ?? null,
        country: country || null,
        state: state || null,
        city: city || null,
        website: website || null,
        founded_year: founded_year ?? null,
        employee_count_range: employee_count_range || null,
        revenue_range: revenue_range || null,
        is_public_company: is_public_company || null,
        stock_ticker: stock_ticker || null,
        parent_company: parent_company || null,
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Company Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., EOS GmbH" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Company Type</label>
            <Select value={company_type ?? ''} onValueChange={(v) => setCompanyType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPES.map(ct => (
                  <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Country</label>
            <Input value={country ?? ''} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Germany" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">State/Province</label>
            <Input value={state ?? ''} onChange={(e) => setStateVal(e.target.value)} placeholder="e.g., Bavaria" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">City</label>
            <Input value={city ?? ''} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Krailling" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Website</label>
            <Input value={website ?? ''} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Founded Year</label>
            <Input type="number" value={founded_year ?? ''} onChange={(e) => setFounded(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Employee Count Range</label>
            <Input value={employee_count_range ?? ''} onChange={(e) => setEmployees(e.target.value)} placeholder="e.g., 201-500" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Revenue Range</label>
            <Input value={revenue_range ?? ''} onChange={(e) => setRevenue(e.target.value)} placeholder="e.g., $10M-$50M" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Public Company</label>
            <div className="flex items-center gap-2 py-2">
              <Checkbox id="is_public_company" checked={!!is_public_company} onCheckedChange={(v) => setIsPublic(!!v)} />
              <label htmlFor="is_public_company" className="text-sm">Is public</label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Stock Ticker</label>
            <Input value={stock_ticker ?? ''} onChange={(e) => setTicker(e.target.value)} placeholder="e.g., EOS.DE" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Parent Company</label>
            <Input value={parent_company ?? ''} onChange={(e) => setParent(e.target.value)} placeholder="e.g., XYZ Group" />
          </div>
        </div>

        <Separator className="my-2" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
