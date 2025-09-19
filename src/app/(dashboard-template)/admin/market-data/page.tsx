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
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react'
import { ResponsiveAdminLayout } from '@/components/admin/responsive-admin-layout'
import type { MarketData, TablesInsert, TablesUpdate } from '@/lib/supabase/types'

// Supabase error type
type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Use the proper MarketData type but maintain Row compatibility
type Row = MarketData
type MarketDataInsert = TablesInsert<'market_data'>
type MarketDataUpdate = TablesUpdate<'market_data'>

// Legacy type for minimal compatibility
type _LegacyRow = {
  id: string
  data_type: string
  year: number
  segment: string | null
  region: string | null
  country: string | null
  industry: string | null
  value_usd: number | null
  percentage: number | null
  unit: string | null
  data_source: string | null
}

export default function MarketDataAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')

  // Supabase-only mode: CSV demo removed

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
          .from('market_data')
          .select('id, data_type, year, segment, region, country, industry, value_usd, percentage, unit, data_source')
          .order('year', { ascending: false })
          .limit(10000)
        if (error) throw error
        setRows(data as MarketData[] || [])
      } catch (error) {
        const err = error as SupabaseError
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const typeOptions = useMemo(() => Array.from(new Set(rows.map(r => r.data_type))).sort(), [rows])
  const yearOptions = useMemo(() => Array.from(new Set(rows.map(r => r.year))).sort((a, b) => b - a), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      if (typeFilter && typeFilter !== 'all' && r.data_type !== typeFilter) return false
      if (yearFilter && yearFilter !== 'all' && String(r.year) !== yearFilter) return false
      if (!q) return true
      return (
        r.data_type.toLowerCase().includes(q) ||
        String(r.year).includes(q) ||
        (r.segment || '').toLowerCase().includes(q) ||
        (r.region || '').toLowerCase().includes(q) ||
        (r.country || '').toLowerCase().includes(q) ||
        (r.industry || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search, typeFilter, yearFilter])

  const onCreate = async (payload: MarketDataInsert) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('market_data')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    if (data) {
      setRows(prev => [data as MarketData, ...prev])
    }
  }

  const onUpdate = async (id: string, patch: MarketDataUpdate) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('market_data')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    if (data) {
      setRows(prev => prev.map(r => (r.id === id ? data as MarketData : r)))
    }
  }

  const onDelete = async (id: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase
      .from('market_data')
      .delete()
      .eq('id', id)
    if (error) throw error
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className="hidden lg:inline-flex">{rows.length} records</Badge>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-36 md:w-44"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 md:w-44 h-9">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {typeOptions.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-20 md:w-28 h-9">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {yearOptions.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setCreating(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
    </div>
  )

  return (
    <ResponsiveAdminLayout 
      title="Market Data"
      description="Manage market metrics by type, year, and region"
      actions={headerActions}
    >
      <div className="h-full flex flex-col bg-background">

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading market data...</div>
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
                  {search || typeFilter !== 'all' || yearFilter !== 'all' 
                    ? 'No market data matches your filters' 
                    : 'No market data found'
                  }
                </div>
                {(search || typeFilter !== 'all' || yearFilter !== 'all') && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setSearch('')
                      setTypeFilter('all')
                      setYearFilter('all')
                    }} 
                    className="mt-1"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="min-w-[160px]">Type</TableHead>
                  <TableHead className="w-16">Year</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead className="hidden lg:table-cell">Region</TableHead>
                  <TableHead className="hidden md:table-cell">Segment</TableHead>
                  <TableHead className="hidden xl:table-cell">Industry</TableHead>
                  <TableHead className="text-right min-w-[100px]">Value (USD)</TableHead>
                  <TableHead className="text-right w-16">%</TableHead>
                  <TableHead className="hidden lg:table-cell">Unit</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[120px]">Source</TableHead>
                  <TableHead className="w-[1%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="min-w-0">
                        <div className="truncate text-sm">{r.data_type}</div>
                        <div className="md:hidden text-xs text-muted-foreground mt-1 space-y-1">
                          {r.country && <div>📍 {r.country}</div>}
                          {r.segment && <div>🏭 {r.segment}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{r.year}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{r.country ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.region ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{r.segment ?? '—'}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">{r.industry ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {typeof r.value_usd === 'number' ? (
                        <div className="flex flex-col">
                          <span>${r.value_usd.toLocaleString()}</span>
                          {r.unit && (
                            <span className="lg:hidden text-xs text-muted-foreground">{r.unit}</span>
                          )}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {typeof r.percentage === 'number' ? `${r.percentage}%` : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.unit ?? '—'}</TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[120px]">
                      <div className="truncate">{r.data_source ?? '—'}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-primary hover:text-primary-foreground" 
                          title="Edit record" 
                          onClick={() => setEditing(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground" 
                          title="Delete record" 
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
        <MarketDataDialog
          open={creating}
          onOpenChange={setCreating}
          title="New Market Data"
          onSubmit={async (values) => {
            await onCreate(values)
            setCreating(false)
          }}
        />

        {/* Edit dialog */}
        {editing && (
          <MarketDataDialog
            open={!!editing}
            onOpenChange={(v) => !v && setEditing(null)}
            title={`Edit — ${editing.data_type} (${editing.year})`}
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
              <DialogTitle>Delete market data row</DialogTitle>
            </DialogHeader>
            <div className="text-sm">
              Are you sure you want to delete this row?
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

function MarketDataDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  initialValues,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  onSubmit: (values: MarketDataInsert) => Promise<void>
  initialValues?: Partial<MarketData>
}) {
  const [data_type, setDataType] = useState(initialValues?.data_type ?? '')
  const [year, setYear] = useState<number | undefined>(initialValues?.year ?? undefined)
  const [segment, setSegment] = useState(initialValues?.segment ?? '')
  const [region, setRegion] = useState(initialValues?.region ?? '')
  const [country, setCountry] = useState(initialValues?.country ?? '')
  const [industry, setIndustry] = useState(initialValues?.industry ?? '')
  const [value_usd, setValueUsd] = useState<number | undefined>(initialValues?.value_usd ?? undefined)
  const [percentage, setPercentage] = useState<number | undefined>(initialValues?.percentage ?? undefined)
  const [unit, setUnit] = useState(initialValues?.unit ?? '')
  const [data_source, setDataSource] = useState(initialValues?.data_source ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setDataType(initialValues?.data_type ?? '')
    setYear(initialValues?.year ?? undefined)
    setSegment(initialValues?.segment ?? '')
    setRegion(initialValues?.region ?? '')
    setCountry(initialValues?.country ?? '')
    setIndustry(initialValues?.industry ?? '')
    setValueUsd(initialValues?.value_usd ?? undefined)
    setPercentage(initialValues?.percentage ?? undefined)
    setUnit(initialValues?.unit ?? '')
    setDataSource(initialValues?.data_source ?? '')
  }, [
    initialValues?.id,
    initialValues?.data_type,
    initialValues?.year,
    initialValues?.segment,
    initialValues?.region,
    initialValues?.country,
    initialValues?.industry,
    initialValues?.value_usd,
    initialValues?.percentage,
    initialValues?.unit,
    initialValues?.data_source
  ])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (!data_type) throw new Error('Data type is required')
      if (!year || year < 1900 || year > new Date().getFullYear() + 5) throw new Error('Invalid year')
      if (percentage !== undefined && percentage !== null) {
        if (isNaN(Number(percentage)) || percentage < 0 || percentage > 100) {
          throw new Error('Percentage must be 0-100')
        }
      }
      await onSubmit({
        data_type,
        year: year as number,
        segment: segment || null,
        region: region || null,
        country: country || null,
        industry: industry || null,
        value_usd: value_usd ?? null,
        percentage: percentage ?? null,
        unit: unit || null,
        data_source: data_source || null,
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Data Type</label>
            <Input value={data_type} onChange={(e) => setDataType(e.target.value)} placeholder="e.g., am-market-revenue-2024" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Year</label>
            <Input type="number" value={year ?? ''} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Country</label>
            <Input value={country ?? ''} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., United States" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Region</label>
            <Input value={region ?? ''} onChange={(e) => setRegion(e.target.value)} placeholder="e.g., North America" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Segment</label>
            <Input value={segment ?? ''} onChange={(e) => setSegment(e.target.value)} placeholder="e.g., Industrial" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Industry</label>
            <Input value={industry ?? ''} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Aerospace" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Value (USD)</label>
            <Input type="number" value={value_usd ?? ''} onChange={(e) => setValueUsd(e.target.value ? Number(e.target.value) : undefined)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Percentage</label>
            <Input type="number" value={percentage ?? ''} onChange={(e) => setPercentage(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Unit</label>
            <Input value={unit ?? ''} onChange={(e) => setUnit(e.target.value)} placeholder="e.g., USD, %, Units" />
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-xs text-muted-foreground">Data Source</label>
            <Input value={data_source ?? ''} onChange={(e) => setDataSource(e.target.value)} placeholder="e.g., Wohlers Report 2024" />
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
