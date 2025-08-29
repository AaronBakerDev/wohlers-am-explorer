'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Database, Pencil, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LEGACY_DATASET_CONFIGS } from '@/lib/config/datasets'

type Row = Record<string, any> & { id?: string }

type ColumnDef = {
  key: string
  label: string
  type: 'text' | 'number' | 'date'
}

const inferType = (key: string): ColumnDef['type'] => {
  const k = key.toLowerCase()
  if (
    k.includes('year') ||
    k.includes('amount') ||
    k.includes('revenue') ||
    k.includes('lead_time') ||
    k.includes('number') ||
    k.includes('percent') ||
    k.includes('share') ||
    k.includes('value') ||
    k.includes('size_millions')
  ) return 'number'
  if (k.includes('date') || k === 'day_ordered' || k === 'delivery_date') return 'date'
  return 'text'
}

export default function VendorDatasetAdminPage() {
  const params = useParams<{ dataset: string }>()
  const router = useRouter()
  const dataset = params?.dataset as keyof typeof LEGACY_DATASET_CONFIGS | undefined
  const config = dataset ? LEGACY_DATASET_CONFIGS[dataset] : undefined

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)

  // Supabase-only mode: CSV demo removed

  const visibleColumns = useMemo(() => {
    if (!config) return [] as ColumnDef[]
    return config.columns
      .filter(c => c !== 'id' && c !== 'created_at')
      .map((key) => ({ key, label: key.replaceAll('_', ' '), type: inferType(key) }))
  }, [config])

  const defaultSort = useMemo(() => {
    if (!config) return { key: 'created_at', asc: false }
    const cols = config.columns
    if (cols.includes('year')) return { key: 'year', asc: false }
    if (cols.includes('deal_date')) return { key: 'deal_date', asc: false }
    if (cols.includes('company_name')) return { key: 'company_name', asc: true }
    if (cols.includes('created_at')) return { key: 'created_at', asc: false }
    return { key: cols[0], asc: true }
  }, [config])

  useEffect(() => {
    if (!dataset || !config) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        let q = supabase.from(config.table as any).select('*')
        q = q.order(defaultSort.key, { ascending: defaultSort.asc })
        const { data, error } = await q.limit(10000)
        if (error) throw error
        setRows(data as Row[])
      } catch (e: any) {
        setError(e?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
  }, [dataset, config, defaultSort.key, defaultSort.asc])

  const invalidDataset = !dataset || !config

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)))
  }, [rows, search])

  function coerce(values: Record<string, any>) {
    const coerced: Record<string, any> = {}
    for (const col of visibleColumns) {
      const raw = values[col.key]
      if (raw === undefined || raw === '') { coerced[col.key] = null; continue }
      if (col.type === 'number') {
        const n = Number(raw)
        coerced[col.key] = Number.isFinite(n) ? n : null
      } else {
        coerced[col.key] = String(raw)
      }
    }
    return coerced
  }

  const onCreate = async (payload: Record<string, any>) => {
    const values = coerce(payload)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase.from(config.table as any).insert(values as any).select('*').single()
    if (error) throw error
    setRows((prev) => [data as Row, ...prev])
  }

  const onUpdate = async (id: string, patch: Record<string, any>) => {
    const values = coerce(patch)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from(config.table as any)
      .update(values as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    setRows((prev) => prev.map((r) => (r.id === id ? (data as Row) : r)))
  }

  const onDelete = async (id: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.from(config.table as any).delete().eq('id', id)
    if (error) throw error
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Admin · {config?.name ?? 'Unknown Dataset'}</h2>
              <Badge variant="secondary">{rows.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>{(process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase').toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Admin
                  </Button>
                </Link>
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-56"
                />
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/admin/market-data/vendor')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Datasets
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{config?.description ?? ''}</p>
        </div>

        <div className="flex-1 overflow-auto">
          {invalidDataset ? (
            <div className="p-6 text-sm text-red-600">Invalid dataset.</div>
          ) : loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {visibleColumns.map((c) => (
                    <TableHead key={c.key}>{c.label}</TableHead>
                  ))}
                  <TableHead className="w-[1%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id ?? JSON.stringify(r)}>
                    {visibleColumns.map((c) => (
                      <TableCell key={c.key} className={c.type === 'number' ? 'text-right font-mono' : ''}>
                        {r[c.key] ?? ''}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="icon" variant="outline" className="h-8 w-8" title="Edit" onClick={() => setEditing(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {r.id && (
                          <Button size="icon" variant="outline" className="h-8 w-8" title="Delete" onClick={() => setDeleting(r)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create dialog */}
        {!invalidDataset && (
        <RowDialog
          open={creating}
          onOpenChange={setCreating}
          title={`New — ${config?.name ?? ''}`}
          columns={visibleColumns}
          onSubmit={async (values) => {
            await onCreate(values)
            setCreating(false)
          }}
        />)}

        {/* Edit dialog */}
        {editing && !invalidDataset && (
          <RowDialog
            open={!!editing}
            onOpenChange={(v) => !v && setEditing(null)}
            title={`Edit — ${config?.name ?? ''}`}
            columns={visibleColumns}
            initialValues={editing}
            onSubmit={async (values) => {
              if (!editing?.id) return
              await onUpdate(editing.id as string, values)
              setEditing(null)
            }}
          />
        )}

        {/* Delete confirm */}
        <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete row</DialogTitle>
            </DialogHeader>
            <div className="text-sm">
              Are you sure you want to delete this row?
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deleting?.id) return
                  await onDelete(deleting.id as string)
                  setDeleting(null)
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}

function RowDialog({
  open,
  onOpenChange,
  title,
  columns,
  onSubmit,
  initialValues,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  columns: ColumnDef[]
  onSubmit: (values: Record<string, any>) => Promise<void>
  initialValues?: Row
}) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const v: Record<string, any> = {}
    for (const c of columns) v[c.key] = initialValues?.[c.key] ?? ''
    setValues(v)
  }, [initialValues?.id, columns.map(c => c.key).join('|')])

  const handleChange = (key: string, next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit(values)
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
          {columns.map((c) => (
            <div key={c.key} className="space-y-2">
              <label className="text-xs text-muted-foreground">{c.label}</label>
              <Input
                type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                value={values[c.key] ?? ''}
                onChange={(e) => handleChange(c.key, e.target.value)}
              />
            </div>
          ))}
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
