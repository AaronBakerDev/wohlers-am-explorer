'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarRange, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const marketTotalsDemo = [
  { year: '2019', Systems: 2.8, Materials: 1.2, Services: 3.0 },
  { year: '2020', Systems: 2.5, Materials: 1.1, Services: 2.6 },
  { year: '2021', Systems: 3.1, Materials: 1.5, Services: 3.4 },
  { year: '2022', Systems: 3.6, Materials: 1.9, Services: 3.9 },
  { year: '2023', Systems: 4.1, Materials: 2.2, Services: 4.3 },
  { year: '2024', Systems: 4.8, Materials: 2.6, Services: 4.9 }
]

const marketComponents: Array<{
  title: string
  description: string
  badgeLabel: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  preview: ReactNode
}> = [
  {
    title: 'KpiCard',
    description: 'Key performance indicator tile with trend deltas and comparison periods.',
    badgeLabel: 'Metric',
    preview: (
      <div className="grid gap-4 sm:grid-cols-[220px,1fr]">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Revenue YoY</p>
          <div className="mt-4 text-4xl font-bold">$4.2B</div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <TrendingUp className="h-3.5 w-3.5" />
            +12.6%
          </div>
          <p className="mt-3 text-xs text-muted-foreground">vs. previous 12 months</p>
        </div>
        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Combine multiple KPIs to show unit volume, revenue, and growth momentum by segment.
        </div>
      </div>
    )
  },
  {
    title: 'MarketTotalsChart',
    description: 'Stacked chart displaying market totals with interactive tooltips.',
    badgeLabel: 'Chart',
    badgeVariant: 'secondary',
    preview: (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue by segment</p>
        <div className="h-64 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marketTotalsDemo}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `${value}B`} width={48} />
              <Tooltip formatter={(value: number | string) => [`$${Number(value).toFixed(1)}B`, 'Revenue']} />
              <Legend formatter={(value: string) => value} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Systems" stackId="a" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Materials" stackId="a" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Services" stackId="a" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  },
  {
    title: 'FilterCard',
    description: 'Filter controls for segment, region, and time range selections.',
    badgeLabel: 'Control',
    badgeVariant: 'outline',
    preview: (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="segment">Segment</Label>
          <Select defaultValue="systems">
            <SelectTrigger id="segment">
              <SelectValue placeholder="Select segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="systems">System Manufacturers</SelectItem>
              <SelectItem value="materials">Material Producers</SelectItem>
              <SelectItem value="services">Service Providers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select defaultValue="north-america">
            <SelectTrigger id="region">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="north-america">North America</SelectItem>
              <SelectItem value="emea">EMEA</SelectItem>
              <SelectItem value="apac">APAC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Button variant="outline" className="w-full justify-start gap-2 text-left text-sm">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            Jan 2020 – Dec 2024
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Include Benchmarks</Label>
          <Button variant="outline" className="w-full justify-start text-sm">
            Enabled for top 10 markets
          </Button>
        </div>
      </div>
    )
  },
  {
    title: 'MarketDataLayouts',
    description: 'Responsive grid layouts for assembling market dashboards.',
    badgeLabel: 'Layout',
    badgeVariant: 'outline',
    preview: (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Global Revenue</p>
          <div className="mt-3 h-20 rounded-md bg-gradient-to-br from-primary/20 to-primary/5" aria-hidden="true" />
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Technologies</p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Powder Bed Fusion</span>
              <span className="font-medium">38%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Material Jetting</span>
              <span className="font-medium">24%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Directed Energy</span>
              <span className="font-medium">18%</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm lg:col-span-1 lg:row-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Regional Split</p>
          <div className="mt-3 h-32 rounded-md bg-gradient-to-br from-emerald-200/40 to-emerald-500/10" aria-hidden="true" />
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forecast Notes</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
            <li>Systems growth driven by aerospace recovery</li>
            <li>Materials demand increasing in regulated industries</li>
            <li>Services revenue stabilizing post-2024 consolidation</li>
          </ul>
        </div>
      </div>
    )
  }
]

export default function MarketDataComponentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/components-test" className="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Component Test
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Market Data Components</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Charts and analytics visualization components for market intelligence data.
          </p>
        </div>

        <div className="space-y-6">
          {marketComponents.map((component) => (
            <Card key={component.title} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">{component.title}</CardTitle>
                  <Badge variant={component.badgeVariant}>{component.badgeLabel}</Badge>
                </div>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {component.preview}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          <div className="rounded-lg bg-muted/50 p-6">
            <h3 className="mb-4 text-lg font-semibold">Chart Technologies</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Recharts Integration</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Responsive charts powered by D3 primitives</li>
                  <li>Interactive tooltips, legends, and annotations</li>
                  <li>Theming aligned with Tailwind design tokens</li>
                  <li>Animation and transitions tuned for dashboards</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Data Processing</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Incremental aggregation for multi-year series</li>
                  <li>Server-side filtering and caching for large datasets</li>
                  <li>Export hooks for CSV, Excel, and PNG outputs</li>
                  <li>Graceful fallbacks for missing or sparse data</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">Market Data Snapshot</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$24.8B</div>
                <div className="text-sm text-muted-foreground">Total Market Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">156+</div>
                <div className="text-sm text-muted-foreground">Companies Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">42</div>
                <div className="text-sm text-muted-foreground">Countries Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
