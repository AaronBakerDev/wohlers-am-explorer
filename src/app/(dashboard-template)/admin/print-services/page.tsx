'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '@/components/admin/AdminGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PrinterIcon, Plus, Pencil, Trash2, Database } from 'lucide-react'

type Row = {
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
  website?: string | null
  headquarters_city?: string | null
}

const COUNT_TYPES: Row['count_type'][] = ['Exact', 'Estimated', 'Range', 'Minimum']

export default function PrintServicesAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)

  // Demo-mode detection: when running in CSV mode we don't have a database.
  // For demo purposes we still allow full UI interactions and "persist" new rows
  // to localStorage so the experience looks real. This is intentionally scoped
  // for demos and is not production persistence.
  const isCsvMode = (process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase') === 'csv'

  // LocalStorage keys for demo persistence. Heavy comments here by request:
  // - New rows created while in CSV mode are stored under LS_KEY.
  // - Edits and deletes apply to those demo rows. Base dataset items are not
  //   persisted across reloads if edited/deleted in CSV mode (demo only).
  const LS_KEY = 'demo_admin_print_services'

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        if (isCsvMode) {
          const res = await fetch('/api/datasets/print-services-global')
          if (!res.ok) throw new Error(`Failed to fetch dataset (${res.status})`)
          const json = await res.json()
          const norm = (v: any): Row['count_type'] => {
            const s = String(v || '').toLowerCase()
            if (s === 'actual' || s === 'exact') return 'Exact'
            if (s === 'minimum' || s === 'min') return 'Minimum'
            if (s === 'range') return 'Range'
            return 'Estimated'
          }
          const items = (json?.data || []).map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            company_name: r.company_name,
            segment: r.segment,
            printer_manufacturer: r.printer_manufacturer,
            printer_model: r.printer_model,
            number_of_printers: Number(r.number_of_printers) || 0,
            count_type: norm(r.count_type),
            process: r.process,
            material_type: r.material_type,
            material_format: r.material_format,
            country: r.country,
            update_year: Number(r.update_year) || new Date().getFullYear(),
            website: r.website || null,
            headquarters_city: r.headquarters_city || null,
          })) as Row[]
          // Merge demo-created rows from localStorage so they appear alongside
          // the base dataset in demo/CSV mode.
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
            .from('print_services_global' as any)
            .select('id, company_name, segment, printer_manufacturer, printer_model, number_of_printers, count_type, process, material_type, material_format, country, update_year, website, headquarters_city')
            .order('company_name', { ascending: true })
            .limit(5000)
          if (error) throw error
          const norm = (v: any): Row['count_type'] => {
            const s = String(v || '').toLowerCase()
            if (s === 'actual' || s === 'exact') return 'Exact'
            if (s === 'minimum' || s === 'min') return 'Minimum'
            if (s === 'range') return 'Range'
            return 'Estimated'
          }
          setRows((data ?? []).map(r => ({ ...r, count_type: norm((r as any).count_type) })) as Row[])
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
      r.printer_manufacturer.toLowerCase().includes(q) ||
      r.printer_model.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q)
    )
  }, [rows, search])

  const onCreate = async (payload: Omit<Row, 'id'>) => {
    // DEMO FALLBACK: In CSV mode, simulate persistence by writing to localStorage.
    if (isCsvMode) {
      const demoRow: Row = {
        id: `demo:${crypto.randomUUID()}`,
        ...payload,
      }
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

    // REAL PERSISTENCE: Supabase write path used when in supabase mode.
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('print_services_global' as any)
      .insert(payload as any)
      .select('*')
      .single()
    if (error) throw error
    const newRow = data as Row
    setRows(prev => [...prev, newRow].sort((a, b) => a.company_name.localeCompare(b.company_name)))
  }

  const onUpdate = async (id: string, patch: Partial<Row>) => {
    if (isCsvMode) {
      // DEMO UPDATE: Update in-memory rows and persist only if it's a demo row.
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
      .from('print_services_global' as any)
      .update(patch as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    const updated = data as Row
    setRows(prev => prev.map(r => (r.id === id ? updated : r)))
  }

  const onDelete = async (id: string) => {
    if (isCsvMode) {
      // DEMO DELETE: Remove from in-memory, and from localStorage if it was a demo row.
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
      .from('print_services_global' as any)
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
              <PrinterIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Admin · Print Services Global</h2>
              <Badge variant="secondary">{rows.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>{(process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase').toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search providers…"
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
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead>Count Type</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="w-[1%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.company_name}</TableCell>
                    <TableCell>{r.segment}</TableCell>
                    <TableCell>{r.printer_manufacturer}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.printer_model}</TableCell>
                    <TableCell className="text-right font-mono">{r.number_of_printers}</TableCell>
                    <TableCell>{r.count_type}</TableCell>
                    <TableCell>{r.process}</TableCell>
                    <TableCell>{r.material_type}</TableCell>
                    <TableCell>{r.material_format}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>{r.update_year}</TableCell>
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
          title="New Print Service"
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
              <DialogTitle>Delete provider</DialogTitle>
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
  const [printer_manufacturer, setPrinterManufacturer] = useState(initialValues?.printer_manufacturer ?? '')
  const [printer_model, setPrinterModel] = useState(initialValues?.printer_model ?? '')
  const [number_of_printers, setNumberOfPrinters] = useState<number>(initialValues?.number_of_printers ?? 1)
  const [count_type, setCountType] = useState<Row['count_type']>((initialValues?.count_type as any) ?? 'Estimated')
  const [process, setProcess] = useState(initialValues?.process ?? '')
  const [material_type, setMaterialType] = useState(initialValues?.material_type ?? '')
  const [material_format, setMaterialFormat] = useState(initialValues?.material_format ?? '')
  const [country, setCountry] = useState(initialValues?.country ?? '')
  const [update_year, setUpdateYear] = useState<number>(initialValues?.update_year ?? new Date().getFullYear())
  const [website, setWebsite] = useState(initialValues?.website ?? '')
  const [headquarters_city, setHeadquartersCity] = useState(initialValues?.headquarters_city ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // sync when editing changes
    setCompanyName(initialValues?.company_name ?? '')
    setSegment(initialValues?.segment ?? '')
    setPrinterManufacturer(initialValues?.printer_manufacturer ?? '')
    setPrinterModel(initialValues?.printer_model ?? '')
    setNumberOfPrinters(initialValues?.number_of_printers ?? 1)
    setCountType((initialValues?.count_type as any) ?? 'Estimated')
    setProcess(initialValues?.process ?? '')
    setMaterialType(initialValues?.material_type ?? '')
    setMaterialFormat(initialValues?.material_format ?? '')
    setCountry(initialValues?.country ?? '')
    setUpdateYear(initialValues?.update_year ?? new Date().getFullYear())
    setWebsite(initialValues?.website ?? '')
    setHeadquartersCity(initialValues?.headquarters_city ?? '')
  }, [initialValues?.id])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // basic validation
      if (!company_name || !segment || !printer_manufacturer || !printer_model || !process || !material_type || !material_format || !country) {
        throw new Error('Please fill all required fields')
      }
      if (number_of_printers <= 0) throw new Error('Number of printers must be > 0')
      if (update_year < 2020 || update_year > new Date().getFullYear() + 1) throw new Error('Invalid update year')
      await onSubmit({
        company_name,
        segment,
        printer_manufacturer,
        printer_model,
        number_of_printers,
        count_type,
        process,
        material_type,
        material_format,
        country,
        update_year,
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
            <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="e.g., Service Bureau" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Printer Manufacturer</label>
            <Input value={printer_manufacturer} onChange={(e) => setPrinterManufacturer(e.target.value)} placeholder="e.g., EOS" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Printer Model</label>
            <Input value={printer_model} onChange={(e) => setPrinterModel(e.target.value)} placeholder="e.g., M400" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Number of Printers</label>
            <Input type="number" min={1} value={number_of_printers} onChange={(e) => setNumberOfPrinters(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Count Type</label>
            <Select value={count_type} onValueChange={(v: Row['count_type']) => setCountType(v)}>
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
            <Input value={process} onChange={(e) => setProcess(e.target.value)} placeholder="e.g., SLS" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Type</label>
            <Input value={material_type} onChange={(e) => setMaterialType(e.target.value)} placeholder="e.g., Metal" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Format</label>
            <Input value={material_format} onChange={(e) => setMaterialFormat(e.target.value)} placeholder="e.g., Powder" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Country</label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., United States" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Update Year</label>
            <Input type="number" value={update_year} onChange={(e) => setUpdateYear(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Website (optional)</label>
            <Input value={website ?? ''} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Headquarters City (optional)</label>
            <Input value={headquarters_city ?? ''} onChange={(e) => setHeadquartersCity(e.target.value)} placeholder="e.g., Leuven" />
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
