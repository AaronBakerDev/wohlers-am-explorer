'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart3,
  PieChart,
  Map,
  TrendingUp,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info,
  Loader2
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { getDashboardAnalytics } from '@/lib/supabase/client-queries'
import { getTechnologies, getMaterials } from '@/lib/supabase/client-queries'
import FilterBar from '@/components/filters/FilterBar'
import { FilterState, emptyFilters } from '@/lib/filters/types'
import ExportButton from '@/components/ExportButton'
import type { ColumnDef } from '@/lib/export'

// Color schemes for charts (theme-aware via CSS variables)
const CHART_COLORS = {
  primary: [
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--destructive)',
    'var(--primary)',
    'var(--chart-1)',
    'var(--accent)'
  ],
  state: 'var(--chart-4)',
  technology: 'var(--chart-5)',
  material: 'var(--chart-2)',
  companyType: 'var(--chart-3)'
}

// Analytics data types
interface AnalyticsData {
  summary: {
    totalCompanies: number
    totalStates: number
    totalTechnologies: number
    totalMachines: number
  }
  companyTypes: Array<{
    type: string
    companies: number
    percentage: number
  }>
  stateDistribution: Array<{
    state: string
    companies: number
    percentage: number
  }>
  technologyDistribution: Array<{
    tech: string
    companies: number
    percentage: number
  }>
  materialDistribution: Array<{
    material: string
    companies: number
    percentage: number
  }>
  topCities: Array<{
    city: string
    companies: number
  }>
  machineDistribution: Array<{
    state: string
    totalMachines: number
    companies: number
    avgMachinesPerCompany: number
  }>
  sizeDistribution?: Array<{
    range: string
    companies: number
    percentage: number
  }>
  timeSeries?: Array<{
    month: string
    newCompanies: number
    newMachines: number
  }>
  competitiveSegments?: Array<Record<string, number | string>>
  marketConcentration?: {
    technologyHHI: number
    materialHHI: number
    topTechShare: number
    topMaterialShare: number
  }
}

interface ChartCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  exportElement?: React.ReactNode
}

function ChartCard({ title, icon, children, fullscreen = false, onToggleFullscreen, exportElement }: ChartCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg ${fullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium text-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            className="h-6 w-6 p-0"
          >
            {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          {exportElement}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

export default function AnalyticsContent() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('all-time')
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [techNameToId, setTechNameToId] = useState<Record<string, string>>({})
  const [matNameToId, setMatNameToId] = useState<Record<string, string>>({})

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getDashboardAnalytics({
          technologyIds: filters.technologyIds,
          materialIds: filters.materialIds,
          processCategories: filters.processCategories,
          sizeRanges: filters.sizeRanges,
          states: filters.states,
          countries: filters.countries,
        })
        setAnalyticsData(data)
      } catch (_err) {
        console.error('Error loading analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [filters])

  // Lookup maps for drill-down filters
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [techs, mats] = await Promise.all([getTechnologies(), getMaterials()])
        if (!active) return
        const tmap = Object.fromEntries(techs.map(t => [t.name.toLowerCase(), t.id]))
        const mmap = Object.fromEntries(mats.map(m => [m.name.toLowerCase(), m.id]))
        setTechNameToId(tmap)
        setMatNameToId(mmap)
      } catch (_e) {
        // noop
      }
    })()
    return () => { active = false }
  }, [])

  const toggleFullscreen = (chartId: string) => {
    setFullscreenChart(fullscreenChart === chartId ? null : chartId)
  }

  const refreshData = async () => {
    try {
      setLoading(true)
      const data = await getDashboardAnalytics({
        technologyIds: filters.technologyIds,
        materialIds: filters.materialIds,
        processCategories: filters.processCategories,
        sizeRanges: filters.sizeRanges,
        states: filters.states,
        countries: filters.countries,
      })
      setAnalyticsData(data)
    } catch (_err) {
      setError('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  // Simple linear forecast for next 6 months based on newCompanies
  const forecast = useMemo(() => {
    if (!analyticsData?.timeSeries || analyticsData.timeSeries.length < 6) return [] as Array<{ month: string; predictedCompanies: number }>
    const series = analyticsData.timeSeries
    // x: 0..N-1, y: newCompanies
    const N = series.length
    const xs = series.map((_, i) => i)
    const ys = series.map(p => p.newCompanies)
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const xm = mean(xs), ym = mean(ys)
    const num = xs.reduce((acc, x, i) => acc + (x - xm) * (ys[i] - ym), 0)
    const den = xs.reduce((acc, x) => acc + (x - xm) * (x - xm), 0) || 1
    const slope = num / den
    const intercept = ym - slope * xm
    const results: Array<{ month: string; predictedCompanies: number }> = []
    const last = series[series.length - 1]
    const [lastYear, lastMonth] = last.month.split('-').map(Number)
    for (let h = 1; h <= 6; h++) {
      const x = N - 1 + h
      const y = Math.max(0, Math.round(intercept + slope * x))
      const date = new Date(lastYear, (lastMonth - 1) + h, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      results.push({ month: key, predictedCompanies: y })
    }
    return results
  }, [analyticsData?.timeSeries])

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !analyticsData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-4">⚠️</div>
          <p className="text-sm text-muted-foreground mb-4">Failed to load analytics</p>
          <p className="text-xs text-destructive mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Controls Header - Mobile Responsive */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <h2 className="text-lg font-medium text-foreground">Analytics Dashboard</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {analyticsData.summary.totalCompanies} companies analyzed
              </Badge>
              <Badge variant="outline" className="text-xs">
                {analyticsData.summary.totalStates} states
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterBar value={filters} onChange={setFilters} />
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Trend Analysis */}
        <div className="mb-4 md:mb-6">
          <ChartCard
            title="Trend Analysis"
            icon={<TrendingUp className="h-4 w-4 text-chart-4" />}
            fullscreen={fullscreenChart === 'trend'}
            onToggleFullscreen={() => toggleFullscreen('trend')}
            exportElement={analyticsData?.timeSeries && (
              <ExportButton
                data={analyticsData.timeSeries}
                columns={[
                  { key: 'month', header: 'Month' },
                  { key: 'newCompanies', header: 'New Companies' },
                  { key: 'newMachines', header: 'New Machines' },
                ] as ColumnDef<(typeof analyticsData.timeSeries)[number]>[]}
                filenameBase="analytics_trends"
                filters={filters}
                size="sm"
                align="end"
              />
            )}
          >
            {analyticsData?.timeSeries && analyticsData.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analyticsData.timeSeries} margin={{ top: 12, right: 20, left: 10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                  <Bar dataKey="newCompanies" name="New Companies" fill={CHART_COLORS.state} radius={[4,4,0,0]} />
                  <Bar dataKey="newMachines" name="New Machines" fill={CHART_COLORS.material} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">No trend data available</div>
            )}
            {forecast.length > 0 && (
              <div className="text-xs text-muted-foreground mt-3">
                Forecast next 6 months: {forecast.map(f => `${f.month} (+${f.predictedCompanies})`).join(', ')}
              </div>
            )}
          </ChartCard>
        </div>
        {/* Key Metrics - Mobile Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-xs font-medium text-muted-foreground">COMPANIES</span>
              </div>
              <TrendingUp className="h-3 w-3 text-chart-2" />
            </div>
            <div className="text-xl md:text-2xl font-semibold text-foreground mb-1">{analyticsData.summary.totalCompanies}</div>
            <div className="text-xs text-muted-foreground">North America</div>
          </div>

          <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                <span className="text-xs font-medium text-muted-foreground">STATES</span>
              </div>
              <Map className="h-3 w-3 text-chart-2" />
            </div>
            <div className="text-xl md:text-2xl font-semibold text-foreground mb-1">{analyticsData.summary.totalStates}</div>
            <div className="text-xs text-muted-foreground">Coverage</div>
          </div>

          <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                <span className="text-xs font-medium text-muted-foreground">TECH</span>
              </div>
              <BarChart3 className="h-3 w-3 text-chart-3" />
            </div>
            <div className="text-xl md:text-2xl font-semibold text-foreground mb-1">{analyticsData.summary.totalTechnologies}</div>
            <div className="text-xs text-muted-foreground">Processes</div>
          </div>

          <div className="bg-card border border-border p-3 md:p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                <span className="text-xs font-medium text-muted-foreground">MACHINES</span>
              </div>
              <TrendingUp className="h-3 w-3 text-chart-4" />
            </div>
            <div className="text-xl md:text-2xl font-semibold text-foreground mb-1">{analyticsData.summary.totalMachines}</div>
            <div className="text-xs text-muted-foreground">Tracked</div>
          </div>
        </div>

        {/* Geographic Distribution - Full Width */}
        <div className="mb-4 md:mb-6">
          <ChartCard
            title="Geographic Distribution"
            icon={<Map className="h-4 w-4 text-primary" />}
            fullscreen={fullscreenChart === 'geo'}
            onToggleFullscreen={() => toggleFullscreen('geo')}
            exportElement={(
              <ExportButton
                data={analyticsData.stateDistribution}
                columns={[
                  { key: 'state', header: 'State' },
                  { key: 'companies', header: 'Companies' },
                  { key: 'percentage', header: 'Percentage' },
                ] as ColumnDef<(typeof analyticsData.stateDistribution)[number]>[]}
                filenameBase="analytics_state_distribution"
                filters={filters}
                size="sm"
                align="end"
              />
            )}
          >
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Companies by State (Top 10)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analyticsData.stateDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis 
                    dataKey="state" 
                    fontSize={11}
                    tick={{ fill: 'var(--muted-foreground)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    fontSize={11}
                    tick={{ fill: 'var(--muted-foreground)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      color: '#1e293b',
                      opacity: '1 !important'
                    }}
                    labelStyle={{ 
                      color: '#1e293b',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}
                    formatter={(_value: unknown, _name: string) => [
                      `${value} companies (${analyticsData.stateDistribution.find(s => s.companies === value)?.percentage}%)`,
                      'Companies'
                    ]}
                  />
                  <defs>
                    <linearGradient id="stateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.state} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={CHART_COLORS.state} stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <Bar 
                    dataKey="companies" 
                    fill="url(#stateGradient)"
                    name="Companies"
                    radius={[4, 4, 0, 0]}
                    onClick={(d) => {
                      const st = (d && (d as { state?: string }).state) as string | undefined
                      if (!st) return
                      setFilters(prev => ({ ...prev, states: prev.states.includes(st) ? prev.states : [...prev.states, st] }))
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Charts Grid - Technology and Materials - Mobile Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Technology Distribution - Pie Chart */}
          <ChartCard
            title="Technology Adoption"
            icon={<PieChart className="h-4 w-4 text-chart-2" />}
            fullscreen={fullscreenChart === 'tech'}
            onToggleFullscreen={() => toggleFullscreen('tech')}
            exportElement={(
              <ExportButton
                data={analyticsData.technologyDistribution}
                columns={[
                  { key: 'tech', header: 'Technology' },
                  { key: 'companies', header: 'Companies' },
                  { key: 'percentage', header: 'Percentage' },
                ] as ColumnDef<(typeof analyticsData.technologyDistribution)[number]>[]}
                filenameBase="analytics_technology_adoption"
                filters={filters}
                size="sm"
                align="end"
              />
            )}
          >
            <div className="space-y-4">
              {analyticsData.technologyDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        color: '#1e293b',
                        opacity: '1 !important'
                      }}
                      formatter={(_value: unknown, _name: string) => [
                        `${name}: ${analyticsData.technologyDistribution.find(t => t.tech === name)?.companies || 0} companies`,
                        ''
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{
                        color: 'var(--muted-foreground)',
                        fontSize: '12px'
                      }}
                    />
                    <Pie
                      data={analyticsData.technologyDistribution.slice(0, 6)}
                      dataKey="companies"
                      nameKey="tech"
                      cx="50%"
                      cy="42%"
                      outerRadius={85}
                      innerRadius={35}
                      paddingAngle={2}
                      label={false}
                      onClick={(data) => {
                        const name = (data && (data as { name?: string }).name) as string | undefined
                        if (!name) return
                        const id = techNameToId[name.toLowerCase()]
                        if (id) {
                          setFilters(prev => ({ ...prev, technologyIds: prev.technologyIds.includes(id) ? prev.technologyIds : [...prev.technologyIds, id] }))
                        }
                      }}
                    >
                      {analyticsData.technologyDistribution.slice(0, 6).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
                          stroke="var(--background)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No technology data available
                </div>
              )}
            </div>
          </ChartCard>

          {/* Material Distribution */}
          <ChartCard
            title="Material Types"
            icon={<PieChart className="h-4 w-4 text-chart-3" />}
            fullscreen={fullscreenChart === 'materials'}
            onToggleFullscreen={() => toggleFullscreen('materials')}
            exportElement={(
              <ExportButton
                data={analyticsData.materialDistribution}
                columns={[
                  { key: 'material', header: 'Material' },
                  { key: 'companies', header: 'Companies' },
                  { key: 'totalMachines', header: 'Total Machines' },
                  { key: 'percentage', header: 'Percentage' },
                ] as ColumnDef<(typeof analyticsData.materialDistribution)[number]>[]}
                filenameBase="analytics_material_types"
                filters={filters}
                size="sm"
                align="end"
              />
            )}
          >
            <div className="space-y-4">
              {analyticsData.materialDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        color: '#1e293b',
                        opacity: '1 !important'
                      }}
                      formatter={(_value: unknown, _name: string) => [
                        `${name}: ${analyticsData.materialDistribution.find(m => m.material === name)?.companies || 0} companies`,
                        ''
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{
                        color: 'var(--muted-foreground)',
                        fontSize: '12px'
                      }}
                    />
                    <Pie
                      data={analyticsData.materialDistribution.slice(0, 5)}
                      dataKey="companies"
                      nameKey="material"
                      cx="50%"
                      cy="42%"
                      outerRadius={85}
                      innerRadius={35}
                      paddingAngle={2}
                      label={false}
                      onClick={(data) => {
                        const name = (data && (data as { name?: string }).name) as string | undefined
                        if (!name) return
                        const id = matNameToId[name.toLowerCase()]
                        if (id) {
                          setFilters(prev => ({ ...prev, materialIds: prev.materialIds.includes(id) ? prev.materialIds : [...prev.materialIds, id] }))
                        }
                      }}
                    >
                      {analyticsData.materialDistribution.slice(0, 5).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
                          stroke="var(--background)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No material data available
                </div>
              )}
            </div>
          </ChartCard>

        </div>

        {/* Competitive Landscape & Company Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
          <ChartCard
            title="Competitive Landscape (Tech × Material)"
            icon={<BarChart3 className="h-4 w-4 text-chart-2" />}
            fullscreen={fullscreenChart === 'segments'}
            onToggleFullscreen={() => toggleFullscreen('segments')}
            exportElement={analyticsData?.competitiveSegments && (
              <ExportButton
                data={analyticsData.competitiveSegments}
                columns={Object.keys(analyticsData.competitiveSegments[0] || {}).map((k) => ({ key: k as keyof Record<string, unknown>, header: k })) as ColumnDef<Record<string, unknown>>[]}
                filenameBase="analytics_competitive_segments"
                filters={filters}
                size="sm"
                align="end"
              />
            )}
          >
            {analyticsData?.competitiveSegments && analyticsData.competitiveSegments.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analyticsData.competitiveSegments as Array<Record<string, unknown>>} margin={{ top: 12, right: 20, left: 10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis dataKey="tech" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  {
                    // Determine material category keys dynamically (exclude 'technology')
                    Object.keys(analyticsData.competitiveSegments.reduce((keys, row) => {
                      Object.keys(row).forEach(k => { if (k !== 'technology') (keys as Record<string, boolean>)[k] = true })
                      return keys
                    }, {} as Record<string, boolean>)).map((key, idx) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={CHART_COLORS.primary[idx % CHART_COLORS.primary.length]} onClick={(data) => {
                        const tech = (data && (data as { technology?: string }).technology) as string | undefined
                        if (!tech) return
                        const id = techNameToId[tech.toLowerCase()]
                        if (id) setFilters(prev => ({ ...prev, technologyIds: prev.technologyIds.includes(id) ? prev.technologyIds : [...prev.technologyIds, id] }))
                      }} />
                    ))
                  }
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">No segment data available</div>
            )}
          </ChartCard>

          <ChartCard
            title="Company Size Distribution"
            icon={<BarChart3 className="h-4 w-4 text-chart-3" />}
            fullscreen={fullscreenChart === 'size'}
            onToggleFullscreen={() => toggleFullscreen('size')}
            exportElement={analyticsData?.sizeDistribution && (
              <ExportButton
                data={analyticsData.sizeDistribution}
                columns={[
                  { key: 'range', header: 'Size Range' },
                  { key: 'companies', header: 'Companies' },
                  { key: 'percentage', header: 'Percentage' },
                ] as ColumnDef<(typeof analyticsData.sizeDistribution)[number]>[]}
                filenameBase="analytics_company_size_distribution"
                filters={filters}
                size="sm"
                align="end"
              />
            )}
          >
            {analyticsData?.sizeDistribution && analyticsData.sizeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analyticsData.sizeDistribution} margin={{ top: 12, right: 20, left: 10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis dataKey="range" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="companies" name="Companies" fill={CHART_COLORS.technology} radius={[4,4,0,0]} onClick={(d) => {
                    const range = (d && (d as { range?: string }).range) as string | undefined
                    if (!range) return
                    setFilters(prev => ({ ...prev, sizeRanges: prev.sizeRanges.includes(range) ? prev.sizeRanges : [...prev.sizeRanges, range] }))
                  }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">No size data available</div>
            )}
          </ChartCard>
        </div>

        {/* Bottom Section - Top Cities & Insights - Mobile Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
          {/* Top Cities */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-foreground">Top Cities by Concentration</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {analyticsData.topCities.map((item, index) => (
                  <div key={item.city} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <span className="text-sm">{item.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.companies} companies
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-foreground">Key Insights</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Technology Leadership
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {analyticsData.technologyDistribution[0]?.tech} dominates with {analyticsData.technologyDistribution[0]?.percentage}% adoption, followed by {analyticsData.technologyDistribution[1]?.tech} ({analyticsData.technologyDistribution[1]?.percentage}%)
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                    Geographic Concentration
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Top 5 states ({analyticsData.stateDistribution.slice(0, 5).map(s => s.state).join(', ')}) account for {analyticsData.stateDistribution.slice(0, 5).reduce((sum, s) => sum + s.percentage, 0)}% of all companies
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                    Equipment Scale
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    {analyticsData.summary.totalMachines} total machines tracked across {analyticsData.summary.totalCompanies} companies (avg {Math.round(analyticsData.summary.totalMachines / analyticsData.summary.totalCompanies)} per company)
                  </div>
                </div>

                {/* Market Concentration */}
                {analyticsData.marketConcentration && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Market Concentration</div>
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      Technology HHI: {analyticsData.marketConcentration.technologyHHI} | Materials HHI: {analyticsData.marketConcentration.materialHHI}. Top 3 techs cover {analyticsData.marketConcentration.topTechShare}% of companies.
                    </div>
                  </div>
                )}

                {/* Market Opportunities */}
                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                  <div className="text-sm font-medium text-teal-900 dark:text-teal-100 mb-1">Market Opportunities</div>
                  <div className="text-sm text-teal-700 dark:text-teal-300 space-y-1">
                    <div>
                      Underserved states: {analyticsData.stateDistribution.slice(-3).map(s => s.state).join(', ')}
                    </div>
                    {analyticsData.technologyDistribution.length > 3 && (
                      <div>
                        Emerging tech: {analyticsData.technologyDistribution
                          .filter(t => t.percentage <= Math.round(analyticsData.technologyDistribution.reduce((a,c)=>a+c.percentage,0)/analyticsData.technologyDistribution.length))
                          .sort((a,b) => b.companies - a.companies)
                          .slice(0,2)
                          .map(t => t.tech)
                          .join(', ')}
                      </div>
                    )}
                    {forecast.length > 0 && (
                      <div>
                        Projected net new companies next 6 months: ~{forecast.reduce((s,f)=>s+f.predictedCompanies,0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
