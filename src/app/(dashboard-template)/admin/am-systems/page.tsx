'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '@/components/admin/AdminGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Factory, Plus, Pencil, Trash2, Database } from 'lucide-react'

type Row = {
  id: string
  company_name: string
  segment: string
  process: string
  material_format: string
  material_type: string
  country: string
  website?: string | null
  headquarters_city?: string | null
  founded_year?: number | null
  employee_count_range?: string | null
  annual_revenue_range?: string | null
  primary_market?: string | null
}

export default function AMSystemsAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)

  // Demo-mode keys and flags (see print-services admin for more details)
  const isCsvMode = (process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase') === 'csv'
  const LS_KEY = 'demo_admin_am_systems'

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        if (isCsvMode) {
          const res = await fetch('/api/datasets/am-systems-manufacturers')
          if (!res.ok) throw new Error(`Failed to fetch dataset (${res.status})`)
          const json = await res.json()
          const items = (json?.data || []) as Row[]
          try {
            const saved = localStorage.getItem(LS_KEY)
            if (saved) {
              const demoRows = JSON.parse(saved) as Row[]
              setRows([...items, ...demoRows])
            } else {
              setRows(items)
            }
          } catch {
            setRows(items)
          }
        } else {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data, error } = await supabase
            .from('am_systems_manufacturers' as any)
            .select('id, company_name, segment, process, material_format, material_type, country, website, headquarters_city, founded_year, employee_count_range, annual_revenue_range, primary_market')
            .order('company_name', { ascending: true })
            .limit(5000)
          if (error) throw error
          setRows((data ?? []) as Row[])
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
  }, [isCsvMode])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.company_name.toLowerCase().includes(q) ||
      r.process.toLowerCase().includes(q) ||
      r.material_type.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q)
    )
  }, [rows, search])

  const onCreate = async (payload: Omit<Row, 'id'>) => {
    if (isCsvMode) {
      const demoRow: Row = { id: `demo:${crypto.randomUUID()}`, ...payload }
      setRows(prev => {
        const next = [...prev, demoRow].sort((a, b) => a.company_name.localeCompare(b.company_name))
        try {
          const saved = localStorage.getItem(LS_KEY)
          const arr = saved ? (JSON.parse(saved) as Row[]) : []
          localStorage.setItem(LS_KEY, JSON.stringify([...arr, demoRow]))
        } catch {}
        return next
      })
      return
    }
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('am_systems_manufacturers' as any)
      .insert(payload as any)
      .select('*')
      .single()
    if (error) throw error
    setRows(prev => [...prev, data as Row].sort((a, b) => a.company_name.localeCompare(b.company_name)))
  }

  const onUpdate = async (id: string, patch: Partial<Row>) => {
    if (isCsvMode) {
      setRows(prev => {
        const next = prev.map(r => (r.id === id ? { ...r, ...patch } as Row : r))
        try {
          if (id.startsWith('demo:')) {
            const saved = localStorage.getItem(LS_KEY)
            const arr = saved ? (JSON.parse(saved) as Row[]) : []
            const updated = arr.map(r => (r.id === id ? { ...r, ...patch } as Row : r))
            localStorage.setItem(LS_KEY, JSON.stringify(updated))
          }
        } catch {}
        return next
      })
      return
    }
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('am_systems_manufacturers' as any)
      .update(patch as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    setRows(prev => prev.map(r => (r.id === id ? (data as Row) : r)))
  }

  const onDelete = async (id: string) => {
    if (isCsvMode) {
      setRows(prev => prev.filter(r => r.id !== id))
      try {
        if (id.startsWith('demo:')) {
          const saved = localStorage.getItem(LS_KEY)
          const arr = saved ? (JSON.parse(saved) as Row[]) : []
          const next = arr.filter(r => r.id !== id)
          localStorage.setItem(LS_KEY, JSON.stringify(next))
        }
      } catch {}
      return
    }
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase
      .from('am_systems_manufacturers' as any)
      .delete()
      .eq('id', id)
    if (error) throw error
    setRows(prev => prev.filter(r => r.id !== id))
  }

  return (
    <AdminGuard>
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Admin · AM Systems Manufacturers</h2>
              <Badge variant="secondary">{rows.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>{(process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase').toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search manufacturers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-48"
                />
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New
                </Button>
              </div>
            </div>
          </div>
          {/* No CSV mode warning in UI (per request). */}
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Material Format</TableHead>
                  <TableHead>Material Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Founded</TableHead>
                  <TableHead>Primary Market</TableHead>
                  <TableHead className="w-[1%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.company_name}</TableCell>
                    <TableCell>{r.segment}</TableCell>
                    <TableCell>{r.process}</TableCell>
                    <TableCell>{r.material_format}</TableCell>
                    <TableCell>{r.material_type}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell className="text-muted-foreground">{r.headquarters_city}</TableCell>
                    <TableCell className="text-muted-foreground">{r.founded_year ?? ''}</TableCell>
                    <TableCell>{r.primary_market}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="icon" variant="outline" className="h-8 w-8" title="Edit" onClick={() => setEditing(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8" title="Delete" onClick={() => setDeleting(r)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create dialog */}
        <EntityDialog
          open={creating}
          onOpenChange={setCreating}
          title="New Manufacturer"
          onSubmit={async (values) => {
            await onCreate(values)
            setCreating(false)
          }}
        />

        {/* Edit dialog */}
        {editing && (
          <EntityDialog
            open={!!editing}
            onOpenChange={(v) => !v && setEditing(null)}
            title={`Edit — ${editing.company_name}`}
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
              <DialogTitle>Delete manufacturer</DialogTitle>
            </DialogHeader>
            <div className="text-sm">
              Are you sure you want to delete <span className="font-medium">{deleting?.company_name}</span>?
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
    </AdminGuard>
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
  onSubmit: (values: Omit<Row, 'id'>) => Promise<void>
  initialValues?: Partial<Row>
}) {
  const [company_name, setCompanyName] = useState(initialValues?.company_name ?? '')
  const [segment, setSegment] = useState(initialValues?.segment ?? '')
  const [process, setProcess] = useState(initialValues?.process ?? '')
  const [material_format, setMaterialFormat] = useState(initialValues?.material_format ?? '')
  const [material_type, setMaterialType] = useState(initialValues?.material_type ?? '')
  const [country, setCountry] = useState(initialValues?.country ?? '')
  const [website, setWebsite] = useState(initialValues?.website ?? '')
  const [headquarters_city, setHeadquartersCity] = useState(initialValues?.headquarters_city ?? '')
  const [founded_year, setFoundedYear] = useState<number | undefined>((initialValues?.founded_year as any) ?? undefined)
  const [employee_count_range, setEmployeeCountRange] = useState(initialValues?.employee_count_range ?? '')
  const [annual_revenue_range, setAnnualRevenueRange] = useState(initialValues?.annual_revenue_range ?? '')
  const [primary_market, setPrimaryMarket] = useState(initialValues?.primary_market ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCompanyName(initialValues?.company_name ?? '')
    setSegment(initialValues?.segment ?? '')
    setProcess(initialValues?.process ?? '')
    setMaterialFormat(initialValues?.material_format ?? '')
    setMaterialType(initialValues?.material_type ?? '')
    setCountry(initialValues?.country ?? '')
    setWebsite(initialValues?.website ?? '')
    setHeadquartersCity(initialValues?.headquarters_city ?? '')
    setFoundedYear((initialValues?.founded_year as any) ?? undefined)
    setEmployeeCountRange(initialValues?.employee_count_range ?? '')
    setAnnualRevenueRange(initialValues?.annual_revenue_range ?? '')
    setPrimaryMarket(initialValues?.primary_market ?? '')
  }, [initialValues?.id])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (!company_name || !segment || !process || !material_format || !material_type || !country) {
        throw new Error('Please fill all required fields')
      }
      await onSubmit({
        company_name,
        segment,
        process,
        material_format,
        material_type,
        country,
        website: website || null,
        headquarters_city: headquarters_city || null,
        founded_year: founded_year ?? null,
        employee_count_range: employee_count_range || null,
        annual_revenue_range: annual_revenue_range || null,
        primary_market: primary_market || null,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Company Name</label>
            <Input value={company_name} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Segment</label>
            <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="e.g., Industrial" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Process</label>
            <Input value={process} onChange={(e) => setProcess(e.target.value)} placeholder="e.g., DMLS" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Format</label>
            <Input value={material_format} onChange={(e) => setMaterialFormat(e.target.value)} placeholder="e.g., Powder" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Type</label>
            <Input value={material_type} onChange={(e) => setMaterialType(e.target.value)} placeholder="e.g., Metal" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Country</label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Germany" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Website (optional)</label>
            <Input value={website ?? ''} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Headquarters City (optional)</label>
            <Input value={headquarters_city ?? ''} onChange={(e) => setHeadquartersCity(e.target.value)} placeholder="e.g., Krailling" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Founded Year (optional)</label>
            <Input type="number" value={founded_year ?? ''} onChange={(e) => setFoundedYear(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Employee Count Range (optional)</label>
            <Input value={employee_count_range ?? ''} onChange={(e) => setEmployeeCountRange(e.target.value)} placeholder="e.g., 201-500" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Annual Revenue Range (optional)</label>
            <Input value={annual_revenue_range ?? ''} onChange={(e) => setAnnualRevenueRange(e.target.value)} placeholder="e.g., $10M-$50M" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Primary Market (optional)</label>
            <Input value={primary_market ?? ''} onChange={(e) => setPrimaryMarket(e.target.value)} placeholder="e.g., Aerospace" />
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
