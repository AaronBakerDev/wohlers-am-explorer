'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { ResponsiveAdminLayout } from '@/components/admin/responsive-admin-layout'

type Row = {
  id: string
  company_name: string
  segment: string
  process: string
  material_format: string
  material_type: string
  country: string
  created_at: string
}

export default function AMSystemsAdminPage() {
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
          .from('vendor_am_systems_manufacturers' as any)
          .select('id, company_name, segment, process, material_format, material_type, country, created_at')
          .order('company_name', { ascending: true })
          .limit(5000)
        if (error) throw error
        setRows((data ?? []) as Row[])
      } catch (e: any) {
        setError(e?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vendor_am_systems_manufacturers' as any)
      .insert(payload as any)
      .select('*')
      .single()
    if (error) throw error
    setRows(prev => [...prev, data as Row].sort((a, b) => a.company_name.localeCompare(b.company_name)))
  }

  const onUpdate = async (id: string, patch: Partial<Row>) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vendor_am_systems_manufacturers' as any)
      .update(patch as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    setRows(prev => prev.map(r => (r.id === id ? (data as Row) : r)))
  }

  const onDelete = async (id: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase
      .from('vendor_am_systems_manufacturers' as any)
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
          placeholder="Search manufacturers…"
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
    <>
      <ResponsiveAdminLayout 
        title="AM Systems Manufacturers"
        description="Manage manufacturers, processes, and materials database"
        actions={headerActions}
      >
        <div className="h-full flex flex-col bg-background">
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
                    <TableHead className="w-[1%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.company_name}</TableCell>
                      <TableCell>{r.segment}</TableCell>
                      <TableCell>{r.process}</TableCell>
                      <TableCell>{r.material_format}</TableCell>
                      <TableCell>{r.material_type}</TableCell>
                      <TableCell>{r.country}</TableCell>
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
        </div>
      </ResponsiveAdminLayout>

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
    </>
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
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCompanyName(initialValues?.company_name ?? '')
    setSegment(initialValues?.segment ?? '')
    setProcess(initialValues?.process ?? '')
    setMaterialFormat(initialValues?.material_format ?? '')
    setMaterialType(initialValues?.material_type ?? '')
    setCountry(initialValues?.country ?? '')
  }, [
    initialValues?.id,
    initialValues?.company_name,
    initialValues?.segment,
    initialValues?.process,
    initialValues?.material_format,
    initialValues?.material_type,
    initialValues?.country
  ])

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
        created_at: new Date().toISOString(),
      } as any)
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
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Company Name</label>
            <Input value={company_name} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Stratasys" />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Segment</label>
            <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="e.g., System manufacturer" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Process</label>
            <Input value={process} onChange={(e) => setProcess(e.target.value)} placeholder="e.g., FDM, SLA" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Format</label>
            <Input value={material_format} onChange={(e) => setMaterialFormat(e.target.value)} placeholder="e.g., filament, resin" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Material Type</label>
            <Input value={material_type} onChange={(e) => setMaterialType(e.target.value)} placeholder="e.g., polymer, metal" />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Country</label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., United States" />
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