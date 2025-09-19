'use client'

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpDown, BarChart3, Globe2, Search, SlidersHorizontal } from 'lucide-react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer as LeafletMapContainer,
  Popup,
  TileLayer,
  Tooltip
} from 'react-leaflet'
import type { MapContainerProps } from 'react-leaflet'
import type { Feature } from 'geojson'
import L, { type Map as LeafletMap, type PathOptions } from 'leaflet'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  demoCountryPolygons,
  demoCompanyLocations,
  countryRegionMap,
  type DemoCompanyLocation
} from '@/lib/demo/map-data'

import 'leaflet/dist/leaflet.css'

type LeafletContainerElement = HTMLElement & { _leaflet_id?: string | number }

function resetLeafletContainer(container: HTMLElement | null | undefined) {
  if (!container) return
  const target = container as LeafletContainerElement
  if (target._leaflet_id !== undefined) {
    delete target._leaflet_id
  }
}

type SafeMapContainerProps = MapContainerProps & {
  onDestroy?: () => void
}

const SafeMapContainer = forwardRef<LeafletMap | null, SafeMapContainerProps>(
  ({ onDestroy, ...props }, forwardedRef) => {
    const mapInstanceRef = useRef<LeafletMap | null>(null)
    const containerRef = useRef<HTMLElement | null>(null)

    const setRefs = useCallback(
      (map: LeafletMap | null) => {
        if (map) {
          mapInstanceRef.current = map
          containerRef.current = map.getContainer?.() ?? null
        }
        if (typeof forwardedRef === 'function') {
          forwardedRef(map)
        } else if (forwardedRef) {
          forwardedRef.current = map
        }
      },
      [forwardedRef]
    )

    useEffect(() => {
      return () => {
        const map = mapInstanceRef.current
        const container = map?.getContainer?.() ?? containerRef.current
        if (map) {
          try {
            map.off()
            map.remove()
          } catch (_) {
            // Ignore teardown errors during hot reload or strict mode replays.
          }
        }
        if (container) {
          resetLeafletContainer(container)
        }
        mapInstanceRef.current = null
        containerRef.current = null
        onDestroy?.()
      }
    }, [onDestroy])

    return <LeafletMapContainer {...props} ref={setRefs} />
  }
)

SafeMapContainer.displayName = 'SafeMapContainer'

type MetricKey = 'companies' | 'revenue'
type CompanyTypeFilter = 'all' | DemoCompanyLocation['type']
type RegionFilter = 'All Regions' | 'North America' | 'Europe' | 'Asia-Pacific'
type SortKey = 'name' | 'revenue' | 'employees'

const technologyFilters = ['FDM', 'SLA', 'DMLS', 'Binder Jetting', 'Material Jetting'] as const
const typeFilters: ReadonlyArray<{ value: CompanyTypeFilter; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'System Manufacturer', label: 'System manufacturers' },
  { value: 'Service Provider', label: 'Service providers' },
  { value: 'Material Producer', label: 'Material producers' }
]
const regionFilters: RegionFilter[] = ['All Regions', 'North America', 'Europe', 'Asia-Pacific']

const metricColors = ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1']

const typeColors: Record<DemoCompanyLocation['type'], string> = {
  'System Manufacturer': '#2563eb',
  'Service Provider': '#22c55e',
  'Material Producer': '#d97706'
}

if (typeof window !== 'undefined') {
  const iconProto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: () => string
    _getIconUrlPatched?: boolean
  }
  if (!iconProto._getIconUrlPatched) {
    delete iconProto._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    })
    iconProto._getIconUrlPatched = true
  }
}

type CountryStats = {
  iso: string
  name: string
  region: string
  count: number
  revenue: number
}

function getFillColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return '#e2e8f0'
  const ratio = value / max
  const bucket = Math.min(metricColors.length - 1, Math.floor(ratio * metricColors.length))
  return metricColors[bucket]
}

function formatMetric(value: number, metric: MetricKey): string {
  return metric === 'companies'
    ? `${value} companies`
    : `$${value.toLocaleString()}M revenue`
}

function metricLabel(metric: MetricKey): string {
  return metric === 'companies' ? 'Companies' : 'Revenue ($M)'
}

export default function MapComponentsClient() {
  const mapRef = useRef<LeafletMap | null>(null)

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  const [companyType, setCompanyType] = useState<CompanyTypeFilter>('all')
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All Regions')
  const [viewMetric, setViewMetric] = useState<MetricKey>('companies')
  const [showPolygons, setShowPolygons] = useState(true)
  const [showMarkers, setShowMarkers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const featureByIso = useMemo(() => {
    return new Map(
      demoCountryPolygons.features
        .map((feature) => {
          const iso = (feature.properties as { iso_a2?: string })?.iso_a2
          return iso ? ([iso, feature] as const) : null
        })
        .filter(Boolean) as Array<[string, Feature]>
    )
  }, [])

  const boundsByCountry = useMemo(() => {
    const map = new Map<string, L.LatLngBounds>()
    featureByIso.forEach((feature, iso) => {
      const layer = L.geoJSON(feature as any)
      map.set(iso, layer.getBounds())
    })
    return map
  }, [featureByIso])

  const filteredCompanies = useMemo(() => {
    return demoCompanyLocations.filter((company) => {
      const matchesTechnology =
        selectedTechnologies.length === 0 || selectedTechnologies.includes(company.technology)
      const region = countryRegionMap[company.countryCode] as RegionFilter | undefined
      const matchesRegion = selectedRegion === 'All Regions' || region === selectedRegion
      const matchesType = companyType === 'all' || company.type === companyType
      return matchesTechnology && matchesRegion && matchesType
    })
  }, [companyType, selectedRegion, selectedTechnologies])

  const tableCompanies = useMemo(() => {
    const byCountry = filteredCompanies.filter((company) =>
      selectedCountry ? company.countryCode === selectedCountry : true
    )
    const query = searchQuery.trim().toLowerCase()
    const bySearch = query.length
      ? byCountry.filter((company) =>
          [company.name, company.city, company.technology, company.type]
            .join(' ')
            .toLowerCase()
            .includes(query)
        )
      : byCountry
    const sorted = bySearch.slice().sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      if (sortKey === 'name') {
        return multiplier * a.name.localeCompare(b.name)
      }
      if (sortKey === 'revenue') {
        return multiplier * (a.revenue - b.revenue)
      }
      return multiplier * (a.employees - b.employees)
    })
    return sorted
  }, [filteredCompanies, searchQuery, selectedCountry, sortKey, sortOrder])

  const countryStats = useMemo(() => {
    const base = new Map<string, { count: number; revenue: number }>()
    featureByIso.forEach((_feature, iso) => {
      base.set(iso, { count: 0, revenue: 0 })
    })
    filteredCompanies.forEach((company) => {
      const entry = base.get(company.countryCode) ?? { count: 0, revenue: 0 }
      entry.count += 1
      entry.revenue += company.revenue
      base.set(company.countryCode, entry)
    })
    return base
  }, [featureByIso, filteredCompanies])

  const countryStatsList: CountryStats[] = useMemo(() => {
    return demoCountryPolygons.features
      .map((feature) => {
        const props = feature.properties as { iso_a2?: string; name?: string; region?: string }
        if (!props?.iso_a2 || !props?.name) return null
        const stats = countryStats.get(props.iso_a2) ?? { count: 0, revenue: 0 }
        return {
          iso: props.iso_a2,
          name: props.name,
          region: props.region ?? 'Unknown',
          count: stats.count,
          revenue: stats.revenue
        }
      })
      .filter(Boolean) as CountryStats[]
  }, [countryStats])

  const maxMetric = useMemo(() => {
    const values = countryStatsList.map((item) =>
      viewMetric === 'companies' ? item.count : item.revenue
    )
    if (!values.length) return 0
    return Math.max(...values)
  }, [countryStatsList, viewMetric])

  const legendStops = useMemo(() => {
    if (maxMetric <= 0) {
      return [
        {
          color: metricColors[0],
          label: viewMetric === 'companies' ? '0 companies' : '$0M revenue'
        }
      ]
    }
    const steps = metricColors.length
    return metricColors.map((color, index) => {
      const start = Math.round((maxMetric / steps) * index)
      const end = Math.round((maxMetric / steps) * (index + 1))
      if (viewMetric === 'companies') {
        return {
          color,
          label: index === steps - 1 ? `${start}+ companies` : `${start} – ${end} companies`
        }
      }
      return {
        color,
        label: index === steps - 1 ? `$${start}M+` : `$${start}M – $${end}M`
      }
    })
  }, [maxMetric, viewMetric])

  const handleSelectCountry = useCallback(
    (iso: string | null) => {
      setSelectedCountry((current) => {
        const next = current === iso ? null : iso
        if (next && mapRef.current) {
          const bounds = boundsByCountry.get(next)
          if (bounds) {
            mapRef.current.fitBounds(bounds, { padding: [32, 32] })
          }
        }
        return next
      })
    },
    [boundsByCountry]
  )

  const getCountryStyle = useCallback(
    (feature: Feature): PathOptions => {
      const iso = (feature.properties as { iso_a2?: string })?.iso_a2
      const stats = iso ? countryStats.get(iso) : undefined
      const metricValue = stats ? (viewMetric === 'companies' ? stats.count : stats.revenue) : 0
      const isSelected = iso === selectedCountry
      return {
        weight: isSelected ? 2.5 : 1,
        color: isSelected ? 'hsl(var(--primary))' : '#64748b',
        dashArray: isSelected ? '4' : undefined,
        fillColor: showPolygons ? getFillColor(metricValue, maxMetric) : 'transparent',
        fillOpacity: showPolygons ? (isSelected ? 0.55 : 0.35) : 0,
        opacity: showPolygons ? 1 : 0.4
      }
    },
    [countryStats, maxMetric, selectedCountry, showPolygons, viewMetric]
  )

  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const iso = (feature.properties as { iso_a2?: string; name?: string })?.iso_a2
      if (!iso) return
      const stats = countryStats.get(iso) ?? { count: 0, revenue: 0 }
      const metricValue = viewMetric === 'companies' ? stats.count : stats.revenue

      layer.on({
        click: () => handleSelectCountry(iso),
        mouseover: (event) => {
          const target = event.target as L.Path
          target.setStyle({ weight: 2.5, fillOpacity: 0.55 })
        },
        mouseout: (event) => {
          const target = event.target as L.Path
          target.setStyle(getCountryStyle(feature))
        }
      })

      ;(layer as L.Layer).bindTooltip(
        `${(feature.properties as { name?: string }).name ?? 'Unknown'}\n${formatMetric(
          metricValue,
          viewMetric
        )}`,
        { sticky: true }
      )
    },
    [countryStats, getCountryStyle, handleSelectCountry, viewMetric]
  )

  const legendTitle = viewMetric === 'companies' ? 'Company density' : 'Revenue (USD millions)'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link
            href="/components-test"
            className="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Component Test
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Map Components</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Live Leaflet showcase for the Wohlers AM Explorer map stack, complete with interactive
            polygons, company markers, and shared controls.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">TopToolbar</CardTitle>
                  <Badge variant="outline">Control</Badge>
                </div>
                <CardDescription>
                  Primary toolbar used across the map experience for view toggles, filters, and exports.
                  Updates below feed directly into the live map preview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={viewMetric === 'companies' ? 'default' : 'outline'}
                    className="h-8"
                    onClick={() => setViewMetric('companies')}
                  >
                    <BarChart3 className="mr-2 h-3.5 w-3.5" /> Companies
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMetric === 'revenue' ? 'default' : 'outline'}
                    className="h-8"
                    onClick={() => setViewMetric('revenue')}
                  >
                    <Globe2 className="mr-2 h-3.5 w-3.5" /> Revenue
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  {typeFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      size="sm"
                      variant={companyType === filter.value ? 'default' : 'outline'}
                      className="h-8"
                      onClick={() => setCompanyType(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Technology</span>
                  {technologyFilters.map((tech) => {
                    const isActive =
                      selectedTechnologies.length === 0 || selectedTechnologies.includes(tech)
                    return (
                      <Button
                        key={tech}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          setSelectedTechnologies((current) => {
                            if (current.includes(tech)) {
                              return current.filter((item) => item !== tech)
                            }
                            return [...current, tech]
                          })
                        }}
                      >
                        {tech}
                      </Button>
                    )
                  })}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => setSelectedTechnologies([])}
                  >
                    Reset
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Region</span>
                  {regionFilters.map((region) => (
                    <Button
                      key={region}
                      size="sm"
                      variant={selectedRegion === region ? 'default' : 'outline'}
                      className="h-8"
                      onClick={() => setSelectedRegion(region)}
                    >
                      {region}
                    </Button>
                  ))}
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    size="sm"
                    variant={showPolygons ? 'default' : 'outline'}
                    className="h-8"
                    onClick={() => setShowPolygons((value) => !value)}
                  >
                    Choropleth
                  </Button>
                  <Button
                    size="sm"
                    variant={showMarkers ? 'default' : 'outline'}
                    className="h-8"
                    onClick={() => setShowMarkers((value) => !value)}
                  >
                    Company markers
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">LeafletMap</CardTitle>
                  <Badge>Core</Badge>
                </div>
                <CardDescription>
                  Fully interactive Leaflet map with polygons, company points, tooltips, and leaflet-fit
                  bounds behaviour.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[420px] w-full overflow-hidden rounded-lg border">
                  <SafeMapContainer
                    center={[35, 10]}
                    zoom={2}
                    minZoom={2}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    onDestroy={() => {
                      mapRef.current = null
                    }}
                    whenCreated={(map) => {
                      mapRef.current = map
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                      key={`choropleth-${selectedCountry}-${viewMetric}-${selectedRegion}-${selectedTechnologies.join('-')}-${companyType}-${showPolygons}`}
                      data={demoCountryPolygons as any}
                      style={getCountryStyle}
                      onEachFeature={onEachFeature}
                    />
                    {showMarkers &&
                      filteredCompanies.map((company) => {
                        const isSelectedCountry =
                          !selectedCountry || company.countryCode === selectedCountry
                        const radius = Math.max(
                          6,
                          Math.min(14, viewMetric === 'revenue' ? company.revenue / 60 : 6 + company.employees / 600)
                        )
                        return (
                          <CircleMarker
                            key={company.id}
                            center={[company.lat, company.lng]}
                            radius={radius}
                            pathOptions={{
                              color: typeColors[company.type],
                              weight: 1,
                              fillOpacity: isSelectedCountry ? 0.85 : 0.35,
                              opacity: isSelectedCountry ? 1 : 0.4
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -radius]} opacity={0.9}>
                              <div className="text-xs font-medium">{company.name}</div>
                            </Tooltip>
                            <Popup>
                              <div className="space-y-1">
                                <p className="font-semibold">{company.name}</p>
                                <p className="text-xs text-muted-foreground">{company.city}</p>
                                <Separator className="my-1" />
                                <p className="text-xs">Technology: {company.technology}</p>
                                <p className="text-xs">Type: {company.type}</p>
                                <p className="text-xs">
                                  Revenue: ${company.revenue.toLocaleString()}M · Employees:{' '}
                                  {company.employees.toLocaleString()}
                                </p>
                              </div>
                            </Popup>
                          </CircleMarker>
                        )
                      })}
                  </SafeMapContainer>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{legendTitle}</p>
                    <div className="mt-2 flex items-center gap-3">
                      {legendStops.map((stop) => (
                        <div key={stop.color} className="flex items-center gap-2">
                          <span
                            className="block size-4 rounded-full border"
                            style={{ backgroundColor: stop.color }}
                          />
                          <span className="text-xs text-muted-foreground">{stop.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-xs text-muted-foreground">
                    Click a country polygon or company marker to focus the dataset. Use the toolbar above
                    to pivot by technology, company type, or revenue metric.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">CompanyListSidebar</CardTitle>
                  <Badge variant="secondary">Panel</Badge>
                </div>
                <CardDescription>
                  Synced company list reflecting the current filters and any selected polygon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Companies</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {tableCompanies.length}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search companies, cities, technologies"
                      className="h-9 pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Sort:</span>
                    <Button
                      size="sm"
                      variant={sortKey === 'revenue' ? 'default' : 'outline'}
                      className="h-7"
                      onClick={() => setSortKey('revenue')}
                    >
                      Revenue
                    </Button>
                    <Button
                      size="sm"
                      variant={sortKey === 'employees' ? 'default' : 'outline'}
                      className="h-7"
                      onClick={() => setSortKey('employees')}
                    >
                      Employees
                    </Button>
                    <Button
                      size="sm"
                      variant={sortKey === 'name' ? 'default' : 'outline'}
                      className="h-7"
                      onClick={() => setSortKey('name')}
                    >
                      Name
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))}
                    >
                      <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                      {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                    </Button>
                  </div>
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {tableCompanies.length === 0 && (
                    <li className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No companies match the current filters.
                    </li>
                  )}
                  {tableCompanies.map((company) => (
                    <li
                      key={company.id}
                      className={`rounded-md border p-3 transition-colors ${
                        selectedCountry && company.countryCode === selectedCountry
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-xs text-muted-foreground">{company.city}</div>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap text-xs">
                          {company.technology}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{company.type}</span>
                        <span>
                          ${company.revenue.toLocaleString()}M · {company.employees.toLocaleString()} staff
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">CountrySidebar</CardTitle>
                  <Badge variant="secondary">Panel</Badge>
                </div>
                <CardDescription>
                  Select a country to focus the map and derived views. Metrics update with the active
                  technology and type filters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {countryStatsList
                  .slice()
                  .sort((a, b) =>
                    viewMetric === 'companies' ? b.count - a.count : b.revenue - a.revenue
                  )
                  .map((country) => {
                    const metricValue = viewMetric === 'companies' ? country.count : country.revenue
                    const isActive = selectedCountry === country.iso
                    return (
                      <button
                        key={country.iso}
                        type="button"
                        onClick={() => handleSelectCountry(country.iso)}
                        className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                          isActive ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{country.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatMetric(metricValue, viewMetric)}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{country.region}</div>
                      </button>
                    )
                  })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">BottomDrawer</CardTitle>
                  <Badge variant="outline">Mobile</Badge>
                </div>
                <CardDescription>
                  Mobile sheet preview showing key filters and actions summarised from the shared state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto w-full max-w-sm">
                  <div className="rounded-t-xl border bg-card shadow-lg">
                    <div className="flex items-center justify-center py-2">
                      <div className="h-1 w-12 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                    </div>
                    <div className="space-y-3 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Current metric</span>
                        <Badge variant="secondary" className="text-xs">
                          {metricLabel(viewMetric)}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-xs">
                        <div className="rounded-md border px-3 py-2">
                          <div className="font-medium">Technologies</div>
                          <div className="text-muted-foreground">
                            {selectedTechnologies.length === 0
                              ? 'All technologies'
                              : selectedTechnologies.join(', ')}
                          </div>
                        </div>
                        <div className="rounded-md border px-3 py-2">
                          <div className="font-medium">Company type</div>
                          <div className="text-muted-foreground">
                            {
                              typeFilters.find((filter) => filter.value === companyType)?.label ??
                              'All types'
                            }
                          </div>
                        </div>
                        <div className="rounded-md border px-3 py-2">
                          <div className="font-medium">Region</div>
                          <div className="text-muted-foreground">{selectedRegion}</div>
                        </div>
                      </div>
                      <Button size="sm" className="w-full">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Show companies ({filteredCompanies.length})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 rounded-lg bg-muted/50 p-6">
          <h3 className="mb-4 text-lg font-semibold">Map Component Architecture</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium">Core Technologies</h4>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Leaflet.js + React-Leaflet for map rendering and declarative overlays.</li>
                <li>GeoJSON polygons styled as a choropleth with hover/selection state.</li>
                <li>Company markers rendered as circle markers with tooltips and popups.</li>
                <li>Fit-bounds behaviour to focus the viewport on selected polygons.</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Shared State</h4>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Toolbar filters drive map, list, and mobile drawer in sync.</li>
                <li>Country selection filters the sidebar list and highlights polygons.</li>
                <li>Metric toggle switches choropleth scale between company count and revenue.</li>
                <li>Legend and tooltips update dynamically with the active metric.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
