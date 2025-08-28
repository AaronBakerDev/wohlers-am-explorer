"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, PieChart, Factory, Globe, Loader2 } from 'lucide-react'
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import ExportButton from '@/components/ExportButton'
import type { ColumnDef } from '@/lib/export'

type SummaryRow = { material_type: 'Metal' | 'Non-Metal' | 'Both'; company_count: number; percentage: number }
type CompanyRow = { id: string; name: string; country: string | null; has_metal: boolean; has_non_metal: boolean; classification: 'Metal' | 'Non-Metal' | 'Both' }

const COLORS = {
  Metal: 'var(--chart-2)',
  'Non-Metal': 'var(--chart-3)',
  Both: 'var(--chart-4)'
} as const

export default function MaterialProducersContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryRow[]>([])
  const [companies, setCompanies] = useState<CompanyRow[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const [s, c] = await Promise.all([
          fetch('/api/reports/material-producers/summary').then(r => r.json()),
          fetch('/api/reports/material-producers/companies').then(r => r.json()),
        ])
        if (s?.error) throw new Error(s.error)
        if (c?.error) throw new Error(c.error)
        setSummary((s?.summary ?? []) as SummaryRow[])
        setCompanies((c?.companies ?? []) as CompanyRow[])
      } catch (e) {
        console.error('Failed to load report:', e)
        setError(e instanceof Error ? e.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const totals = useMemo(() => summary.reduce((a, r) => a + (r.company_count || 0), 0), [summary])

  const exportColumns: ColumnDef<CompanyRow>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Company' },
    { key: 'country', header: 'Country' },
    { key: 'has_metal', header: 'Has Metal' },
    { key: 'has_non_metal', header: 'Has Non-Metal' },
    { key: 'classification', header: 'Classification' },
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading AM Material Producers…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-2">⚠️</div>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" variant="outline" onClick={() => location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const barData = summary.map(s => ({ type: s.material_type, count: s.company_count }))
  const pieData = summary.map(s => ({ name: s.material_type, value: s.company_count, percentage: s.percentage }))

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-medium">AM Material Producers</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Globe className="h-3 w-3 mr-1" /> {totals} companies
            </Badge>
            <ExportButton
              data={companies}
              columns={exportColumns}
              filenameBase="am_material_producers"
              size="sm"
              align="end"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-chart-2" />Company Count by Material Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={barData} margin={{ top: 8, right: 12, left: 10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis dataKey="type" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-chart-3" />Distribution of Material Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                    {pieData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v: number, n: string, p: any) => [`${v} (${p.payload.percentage}%)`, n]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="p-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Material Producers Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>Non-Metal</TableHead>
                    <TableHead>Classification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.country || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={c.has_metal ? 'default' : 'outline'} className="text-xs">{c.has_metal ? 'Yes' : 'No'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.has_non_metal ? 'default' : 'outline'} className="text-xs">{c.has_non_metal ? 'Yes' : 'No'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs" style={{ color: COLORS[c.classification] }}>{c.classification}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
