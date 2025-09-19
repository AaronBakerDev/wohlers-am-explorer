'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Code2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ExportButton from '@/components/ExportButton'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ComponentShowcase = ({ title, children, code }: { title: string, children: React.ReactNode, code?: string }) => {
  const [showCode, setShowCode] = useState(false)

  const toggleLabel = showCode ? 'View example' : 'View code'
  const toggleIcon = showCode ? <Eye className="h-4 w-4" /> : <Code2 className="h-4 w-4" />

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-pressed={showCode}
              aria-label={`${toggleLabel} for ${title}`}
              onClick={() => setShowCode((prev) => !prev)}
            >
              {toggleIcon}
              {toggleLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showCode && code ? (
          <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
            <code>{code}</code>
          </pre>
        ) : (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type DemoCompany = {
  id: number
  name: string
  location: string
  type: 'System Manufacturer' | 'Service Provider' | 'Material Producer'
  technology: 'FDM' | 'SLA' | 'DMLS' | 'Binder Jetting' | 'Material Jetting'
  region: 'North America' | 'Europe' | 'Asia-Pacific'
  revenue: number // USD millions
  employees: number
}

// Mock data for demos (summaries based on public filings + Wohlers Report trends)
const mockCompanies: DemoCompany[] = [
  { id: 1, name: 'Stratasys', location: 'Eden Prairie, MN', type: 'System Manufacturer', technology: 'FDM', region: 'North America', revenue: 620, employees: 2300 },
  { id: 2, name: '3D Systems', location: 'Rock Hill, SC', type: 'System Manufacturer', technology: 'SLA', region: 'North America', revenue: 510, employees: 2500 },
  { id: 3, name: 'Proto Labs', location: 'Maple Plain, MN', type: 'Service Provider', technology: 'Material Jetting', region: 'North America', revenue: 445, employees: 2400 },
  { id: 4, name: 'EOS', location: 'Krailling, Germany', type: 'System Manufacturer', technology: 'DMLS', region: 'Europe', revenue: 430, employees: 1500 },
  { id: 5, name: 'Desktop Metal', location: 'Burlington, MA', type: 'System Manufacturer', technology: 'Binder Jetting', region: 'North America', revenue: 210, employees: 1200 },
  { id: 6, name: 'Materialise', location: 'Leuven, Belgium', type: 'Service Provider', technology: 'Material Jetting', region: 'Europe', revenue: 280, employees: 2300 },
  { id: 7, name: 'Farsoon', location: 'Hunan, China', type: 'System Manufacturer', technology: 'DMLS', region: 'Asia-Pacific', revenue: 130, employees: 900 },
  { id: 8, name: 'Shapeways', location: 'Eindhoven, Netherlands', type: 'Service Provider', technology: 'SLA', region: 'Europe', revenue: 35, employees: 300 }
]

const technologyFilters = ['FDM', 'SLA', 'DMLS', 'Binder Jetting', 'Material Jetting'] as const
const regionFilters = ['All Regions', 'North America', 'Europe', 'Asia-Pacific'] as const

const activeFilters = [
  { value: 'tech:fdm', label: 'FDM Technology' },
  { value: 'region:north-america', label: 'North America' },
  { value: 'type:service', label: 'Service Providers' }
]

export default function FeatureComponentsPage() {
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState<(typeof regionFilters)[number]>('All Regions')

  const toggleTechnology = (tech: string) => {
    setSelectedTechnologies((prev) => {
      if (prev.includes(tech)) {
        return prev.filter((t) => t !== tech)
      }
      return [...prev, tech]
    })
  }

  const filteredCompanies = useMemo(() => {
    return mockCompanies.filter((company) => {
      const matchesTechnology = selectedTechnologies.length === 0 || selectedTechnologies.includes(company.technology)
      const matchesRegion = selectedRegion === 'All Regions' || company.region === selectedRegion
      return matchesTechnology && matchesRegion
    })
  }, [selectedRegion, selectedTechnologies])

  const revenueByTechnology = useMemo(() => {
    const totals = new Map<string, number>()
    filteredCompanies.forEach((company) => {
      totals.set(company.technology, (totals.get(company.technology) ?? 0) + company.revenue)
    })
    return Array.from(totals.entries())
      .map(([tech, revenue]) => ({ technology: tech, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [filteredCompanies])

  const dashboardSummary = useMemo(() => {
    const totalRevenue = filteredCompanies.reduce((sum, company) => sum + company.revenue, 0)
    const avgEmployees = filteredCompanies.length
      ? Math.round(filteredCompanies.reduce((sum, company) => sum + company.employees, 0) / filteredCompanies.length)
      : 0
    return {
      companies: filteredCompanies.length,
      revenue: totalRevenue,
      avgEmployees
    }
  }, [filteredCompanies])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/components-test" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Component Test
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Feature Components</h1>
          <p className="text-xl text-muted-foreground">
            Custom application-specific components used throughout the Wohlers AM Explorer.
          </p>
        </div>

        <div className="space-y-8">
          <ComponentShowcase
            title="Export Button"
            code={`<ExportButton
  data={companies}
  filename="am-companies"
  formats={['csv', 'json', 'excel']}
/>`}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Multi-format data export component supporting CSV, JSON, and Excel formats.
              </p>
              <ExportButton
                data={mockCompanies}
                filename="test-companies"
                formats={['csv', 'json', 'excel']}
              />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Theme Switcher"
            code={`<ThemeSwitcher />`}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dark/light mode toggle component with system preference detection.
              </p>
              <ThemeSwitcher />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Filter Chips (Mock)"
            code={`const filters = [
  { value: 'fdm', label: 'FDM Technology' },
  { value: 'pla', label: 'PLA Material' },
  { value: 'usa', label: 'United States' }
]

<div className="flex flex-wrap gap-2">
  {filters.map((filter) => (
    <Badge
      key={filter.value}
      variant="secondary"
      className="px-3 py-1 flex items-center gap-2"
    >
      {filter.label}
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 hover:bg-transparent"
        aria-label={'Remove ' + filter.label}
      >
        <span aria-hidden="true">&times;</span>
      </Button>
    </Badge>
  ))}
</div>`}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Active filter display with remove functionality (similar to ActiveFilterChips component).
              </p>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge
                    key={filter.value}
                    variant="secondary"
                    className="px-3 py-1 flex items-center gap-2"
                  >
                    {filter.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      aria-label={`Remove ${filter.label}`}
                    >
                      <span aria-hidden="true">&times;</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Filters + Table + Chart"
            code={`// Manage filters in state
const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
const [selectedRegion, setSelectedRegion] = useState<'All Regions' | 'North America' | 'Europe' | 'Asia-Pacific'>('All Regions')

const filteredCompanies = useMemo(() =>
  companies.filter((item) =>
    (selectedTechnologies.length === 0 || selectedTechnologies.includes(item.technology)) &&
    (selectedRegion === 'All Regions' || item.region === selectedRegion)
  ),
  [companies, selectedTechnologies, selectedRegion]
)

const revenueByTechnology = useMemo(() =>
  filteredCompanies.reduce((acc, company) => {
    acc[company.technology] = (acc[company.technology] ?? 0) + company.revenue
    return acc
  }, {} as Record<string, number>),
  [filteredCompanies]
)`}
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium text-muted-foreground">Technology</div>
                {technologyFilters.map((tech) => {
                  const isActive = selectedTechnologies.length === 0 || selectedTechnologies.includes(tech)
                  return (
                    <Button
                      key={tech}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="h-8"
                      onClick={() => toggleTechnology(tech)}
                    >
                      {tech}
                    </Button>
                  )
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setSelectedTechnologies([])}
                >
                  Reset
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium text-muted-foreground">Region</div>
                <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as (typeof regionFilters)[number])}>
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionFilters.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Companies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{dashboardSummary.companies}</p>
                    <p className="text-xs text-muted-foreground">Matched to current filters</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Annual Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">${dashboardSummary.revenue.toLocaleString()}M</p>
                    <p className="text-xs text-muted-foreground">Aggregated 2024 estimates</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Avg. Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{dashboardSummary.avgEmployees.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Headcount across cohort</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Technology</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">Revenue ($M)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.technology}</TableCell>
                          <TableCell>{company.region}</TableCell>
                          <TableCell className="text-right">{company.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {filteredCompanies.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                            No companies match the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Revenue by technology (USD millions)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByTechnology}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="technology" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                        <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                        <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Data Health Widget (Mock)"
            code={`<Card>
  <CardHeader>
    <CardTitle className="text-lg">Data Health</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid gap-4 md:grid-cols-3">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">98%</div>
        <div className="text-sm text-muted-foreground">Complete</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">2,847</div>
        <div className="text-sm text-muted-foreground">Records</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">12</div>
        <div className="text-sm text-muted-foreground">Issues</div>
      </div>
    </div>
  </CardContent>
</Card>`}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Data quality and health monitoring widget showing completion rates and issues.
              </p>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">98%</div>
                      <div className="text-sm text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">2,847</div>
                      <div className="text-sm text-muted-foreground">Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">12</div>
                      <div className="text-sm text-muted-foreground">Issues</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Company Data Table (Mock)"
            code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Company</TableHead>
      <TableHead>Location</TableHead>
      <TableHead>Type</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {companies.map((company) => (
      <TableRow key={company.id}>
        <TableCell className="font-medium">{company.name}</TableCell>
        <TableCell>{company.location}</TableCell>
        <TableCell>
          <Badge variant="outline">{company.type}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">View</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Company data table with filtering and actions (similar to DataTableContent component).
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.location}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ComponentShowcase>

          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Component Development Notes</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Feature components extend base UI components with domain-specific logic</li>
              <li>All components follow the established design system patterns</li>
              <li>Components are designed to be reusable across different pages</li>
              <li>Interactive state is managed through React hooks and context where appropriate</li>
              <li>Each component includes proper TypeScript types and error handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
