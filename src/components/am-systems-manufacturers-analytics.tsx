"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts'
import { Building2, Globe, RefreshCw, BarChart3 } from 'lucide-react'

type Row = {
  id?: string
  company_name: string
  segment?: string
  process?: string
  material_format?: string
  material_type?: string
  country?: string
  headquarters_city?: string
  founded_year?: number | null
  primary_market?: string | null
}

export default function AMSystemsManufacturersAnalytics() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    segment: 'all',
    process: 'all',
    material_format: 'all',
    material_type: 'all',
    country: 'all',
  })

  // Export targets
  const chartGridRef = useRef<HTMLDivElement | null>(null)
  const refManufacturersByCountry = useRef<HTMLDivElement | null>(null)
  const refManufacturersByProcess = useRef<HTMLDivElement | null>(null)
  const refMaterialType = useRef<HTMLDivElement | null>(null)
  const refSegmentShare = useRef<HTMLDivElement | null>(null)
  const refMatrixProcMat = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use unified segment API
        const params = new URLSearchParams()
        params.set('segment', 'System manufacturer')
        params.set('limit', '5000')
        
        const res = await fetch(`/api/datasets/unified-segment?${params.toString()}`)
        if (!res.ok) throw new Error(`Failed to fetch data (${res.status})`)
        
        const json = await res.json()
        const data = (json?.data || []) as Row[]
        
        if (data.length) {
          setRows(data)
        }
      } catch (e) {
        console.error('ASM analytics load error:', e)
        setError(e instanceof Error ? e.message : 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const uniq = (arr: (string | number | null | undefined)[]) =>
    [...new Set(arr.map(v => (v ?? '').toString().trim()))].filter(Boolean).sort()

  const uniqueValues = useMemo(() => ({
    segments: uniq(rows.map(r => r.segment)),
    processes: uniq(rows.map(r => r.process)),
    materialFormats: uniq(rows.map(r => r.material_format)),
    materialTypes: uniq(rows.map(r => r.material_type)),
    countries: uniq(rows.map(r => r.country)),
  }), [rows])

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return rows.filter(r => {
      if (q) {
        const hit = [r.company_name, r.country, r.headquarters_city, r.primary_market]
          .map(v => (v || '').toString().toLowerCase())
          .some(v => v.includes(q))
        if (!hit) return false
      }
      if (filters.segment !== 'all' && (r.segment || '') !== filters.segment) return false
      if (filters.process !== 'all' && (r.process || '') !== filters.process) return false
      if (filters.material_format !== 'all' && (r.material_format || '') !== filters.material_format) return false
      if (filters.material_type !== 'all' && (r.material_type || '') !== filters.material_type) return false
      if (filters.country !== 'all' && (r.country || '') !== filters.country) return false
      return true
    })
  }, [rows, filters])

  const totals = useMemo(() => ({
    manufacturers: new Set(filteredRows.map(r => r.company_name).filter(Boolean)).size,
    countries: new Set(filteredRows.map(r => r.country).filter(Boolean)).size,
  }), [filteredRows])

  // Manufacturers by Country (Top 10)
  const manufacturersByCountry = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const r of filteredRows) {
      const c = (r.country || 'Unknown').trim()
      const name = (r.company_name || 'Unknown').trim()
      if (!map.has(c)) map.set(c, new Set())
      map.get(c)!.add(name)
    }
    const list = Array.from(map.entries()).map(([country, set]) => ({ country, manufacturers: set.size }))
    list.sort((a, b) => b.manufacturers - a.manufacturers)
    return list.slice(0, 10)
  }, [filteredRows])

  // Manufacturers by Process
  const manufacturersByProcess = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const r of filteredRows) {
      const p = (r.process || 'Unknown').trim()
      const name = (r.company_name || 'Unknown').trim()
      if (!map.has(p)) map.set(p, new Set())
      map.get(p)!.add(name)
    }
    const list = Array.from(map.entries()).map(([process, set]) => ({ process, manufacturers: set.size }))
    list.sort((a, b) => b.manufacturers - a.manufacturers)
    return list
  }, [filteredRows])

  // Material Type distribution (pie)
  const materialTypeDist = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of filteredRows) {
      const m = (r.material_type || 'Unknown').trim()
      map.set(m, (map.get(m) || 0) + 1)
    }
    return Array.from(map.entries()).map(([type, value]) => ({ type, value }))
  }, [filteredRows])

  // Segment share (pie)
  const segmentDist = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of filteredRows) {
      const s = (r.segment || 'Unknown').trim()
      map.set(s, (map.get(s) || 0) + 1)
    }
    return Array.from(map.entries()).map(([segment, value]) => ({ segment, value }))
  }, [filteredRows])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading AM Systems Manufacturers analytics…
        </div>
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => setFilters({ search: '', segment: 'all', process: 'all', material_format: 'all', material_type: 'all', country: 'all' })}>Clear Filters</Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-medium">AM Systems Manufacturers · Visualizations</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Globe className="h-3 w-3 mr-1" /> {totals.countries} countries
            </Badge>
            <Badge variant="outline" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" /> {totals.manufacturers} manufacturers
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            className="px-3 py-2 text-sm bg-background border border-border rounded"
            placeholder="Search companies…"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <Select value={filters.segment} onValueChange={(v) => setFilters(prev => ({ ...prev, segment: v }))}>
            <SelectTrigger><SelectValue placeholder="Segment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {uniqueValues.segments.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.process} onValueChange={(v) => setFilters(prev => ({ ...prev, process: v }))}>
            <SelectTrigger><SelectValue placeholder="Process" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Processes</SelectItem>
              {uniqueValues.processes.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.material_type} onValueChange={(v) => setFilters(prev => ({ ...prev, material_type: v }))}>
            <SelectTrigger><SelectValue placeholder="Material Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {uniqueValues.materialTypes.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.material_format} onValueChange={(v) => setFilters(prev => ({ ...prev, material_format: v }))}>
            <SelectTrigger><SelectValue placeholder="Material Format" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {uniqueValues.materialFormats.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.country} onValueChange={(v) => setFilters(prev => ({ ...prev, country: v }))}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {uniqueValues.countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Search kept minimal for analytics to reduce UI noise; can be added later */}
        </div>
      </div>

      {/* Charts Grid */}
      <div ref={chartGridRef} className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Manufacturers by Country */}
        <Card data-testid="asm-chart-mfrs-by-country">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Manufacturers by Country (Top 10)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={refManufacturersByCountry} className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={manufacturersByCountry} margin={{ top: 8, right: 12, left: 10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis dataKey="country" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                  <Bar dataKey="manufacturers" radius={[4,4,0,0]} fill="var(--chart-4)" onClick={(d: any) => {
                    const c = d?.payload?.country || d?.country
                    if (c) setFilters(prev => ({ ...prev, country: c }))
                  }} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Manufacturers by Process */}
        <Card data-testid="asm-chart-mfrs-by-process">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Manufacturers by Process</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={refManufacturersByProcess} className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={manufacturersByProcess} margin={{ top: 8, right: 12, left: 10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis dataKey="process" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                  <Bar dataKey="manufacturers" radius={[4,4,0,0]} fill="var(--chart-2)" onClick={(d: any) => {
                    const p = d?.payload?.process || d?.process
                    if (p) setFilters(prev => ({ ...prev, process: p }))
                  }} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Material Type Distribution */}
        <Card data-testid="asm-chart-material-type">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Material Type Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={refMaterialType} className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={materialTypeDist} dataKey="value" nameKey="type" innerRadius={60} outerRadius={90} startAngle={90} endAngle={-270}>
                    {materialTypeDist.map((entry, idx) => (
                      <Cell key={`mt-${entry.type}`} fill={`var(--chart-${(idx % 5) + 1})`} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v: number, n: string) => [v, n]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Segment Distribution */}
        <Card data-testid="asm-chart-segment-share">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Segment Share</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={refSegmentShare} className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={segmentDist} dataKey="value" nameKey="segment" innerRadius={60} outerRadius={90} startAngle={90} endAngle={-270}>
                    {segmentDist.map((entry, idx) => (
                      <Cell key={`seg-${entry.segment}`} fill={`var(--chart-${(idx % 5) + 1})`} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v: number, n: string) => [v, n]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Simple heatmap-like matrix: Process × Material Type */}
        <Card data-testid="asm-matrix-process-material" className="xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Process × Material Type</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={refMatrixProcMat} className="overflow-auto">
              <MatrixProcessMaterial rows={filteredRows} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MatrixProcessMaterial({ rows }: { rows: Array<{ process?: string | null; material_type?: string | null }> }) {
  const data = useMemo(() => {
    const procTotals = new Map<string, number>()
    const matTotals = new Map<string, number>()
    const cell = new Map<string, number>()
    for (const r of rows) {
      const p = (r.process || 'Unknown').trim()
      const m = (r.material_type || 'Unknown').trim()
      procTotals.set(p, (procTotals.get(p) || 0) + 1)
      matTotals.set(m, (matTotals.get(m) || 0) + 1)
      const k = `${p}__${m}`
      cell.set(k, (cell.get(k) || 0) + 1)
    }
    const mats = Array.from(matTotals.entries()).sort((a,b) => b[1] - a[1]).map(([m]) => m).slice(0, 6)
    const procs = Array.from(procTotals.entries()).sort((a,b) => b[1] - a[1]).map(([p]) => p).slice(0, 8)
    let max = 0
    for (const p of procs) for (const m of mats) max = Math.max(max, cell.get(`${p}__${m}`) || 0)
    return { procs, mats, cell, max: Math.max(max, 1) }
  }, [rows])

  return (
    <table className="min-w-full border border-border text-xs">
      <thead className="bg-muted/50">
        <tr>
          <th className="px-2 py-2 text-left">Process</th>
          {data.mats.map(m => (
            <th key={m} className="px-2 py-2 text-left">{m}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.procs.map(p => (
          <tr key={p} className="border-t border-border">
            <td className="px-2 py-2 font-medium">{p}</td>
            {data.mats.map(m => {
              const val = data.cell.get(`${p}__${m}`) || 0
              const pct = Math.max(0.06, Math.min(1, val / data.max))
              return (
                <td key={`${p}__${m}`} className="px-2 py-1">
                  <div className="relative h-6 bg-muted/40 rounded">
                    <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${pct * 100}%`, background: 'var(--chart-1)', opacity: 0.35 }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] text-foreground/80">{val}</div>
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
