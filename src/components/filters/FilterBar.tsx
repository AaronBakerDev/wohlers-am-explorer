"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, Filter as FilterIcon } from "lucide-react"
import {
  getTechnologies,
  getMaterials,
  getTechnologyCategories,
  getEmployeeSizeRanges,
  getCountries,
} from "@/lib/supabase/client-queries"
import { FilterState, emptyFilters } from "@/lib/filters/types"

type Orientation = "horizontal" | "vertical"

type FilterBarProps = {
  value: FilterState
  onChange: (next: FilterState) => void
  orientation?: Orientation
  className?: string
}

export default function FilterBar({ value, onChange, orientation = "horizontal", className = "" }: FilterBarProps) {
  const [loading, setLoading] = useState(true)
  const [techOptions, setTechOptions] = useState<Array<{ id: string; name: string }>>([])
  const [materialOptions, setMaterialOptions] = useState<Array<{ id: string; name: string }>>([])
  const [processCategories, setProcessCategories] = useState<string[]>([])
  const [sizeRanges, setSizeRanges] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [vendorMaterialTypes, setVendorMaterialTypes] = useState<string[]>([])
  const [vendorMaterialFormats, setVendorMaterialFormats] = useState<string[]>([])
  const [vendorManufacturers, setVendorManufacturers] = useState<string[]>([])
  const [vendorModels, setVendorModels] = useState<string[]>([])
  
  // Check if we're on a vendor dataset page
  const isVendorDataset = typeof window !== 'undefined' && (() => {
    try {
      const url = new URL(window.location.href)
      const ds = (url.searchParams.get('dataset') || '').toLowerCase()
      return ds === 'am-systems-manufacturers' || ds === 'print-services-global'
    } catch {
      return false
    }
  })()

  // Load filter option lists
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        
        // For vendor datasets, fetch processes from the unified API
        if (isVendorDataset) {
          const url = new URL(window.location.href)
          const ds = (url.searchParams.get('dataset') || '').toLowerCase()
          const segment = ds === 'am-systems-manufacturers' ? 'System manufacturer' : 'Printing services'

          const [techs, mats, cntrs, vendorDataRes] = await Promise.all([
            getTechnologies(),
            getMaterials(),
            getCountries(),
            fetch(`/api/vendor/companies?segment=${encodeURIComponent(segment)}&limit=1`)
          ])
          
          if (!active) return
          
          // Get processes from vendor data aggregations
          let processes: string[] = []
          let vendorCountries: string[] = []
          let vMatTypes: string[] = []
          let vMatFormats: string[] = []
          let vManufacturers: string[] = []
          let vModels: string[] = []
          if (vendorDataRes.ok) {
            const vendorData = await vendorDataRes.json()
            const available = vendorData?.filters?.available || {}
            const availableTechs = available.technologies || []
            processes = Array.isArray(availableTechs) ? availableTechs.map((t: any) => t.name).filter(Boolean).sort() : []
            vendorCountries = Array.isArray(available.countries) ? available.countries : []
            vMatTypes = Array.isArray(available.materials) ? available.materials.map((m: any) => m.name).filter(Boolean).sort() : []
            vMatFormats = Array.isArray(available.materialFormats) ? available.materialFormats : []
            vManufacturers = Array.isArray(available.printerManufacturers) ? available.printerManufacturers : []
            vModels = Array.isArray(available.printerModels) ? available.printerModels : []
          }
          
          setTechOptions(techs.map(t => ({ id: t.id, name: t.name })))
          setMaterialOptions(mats.map(m => ({ id: m.id, name: m.name })))
          setProcessCategories(processes)
          setSizeRanges([]) // No size ranges for vendor data
          // Prefer countries from vendor dataset aggregations to ensure normalized labels
          setCountries(vendorCountries.length ? vendorCountries : cntrs)
          setVendorMaterialTypes(vMatTypes)
          setVendorMaterialFormats(vMatFormats)
          setVendorManufacturers(vManufacturers)
          setVendorModels(vModels)
        } else {
          // Regular data loading for non-vendor pages
          const [techs, mats, categories, sizes, cntrs] = await Promise.all([
            getTechnologies(),
            getMaterials(),
            getTechnologyCategories(),
            getEmployeeSizeRanges(),
            getCountries(),
          ])
          if (!active) return
          setTechOptions(techs.map(t => ({ id: t.id, name: t.name })))
          setMaterialOptions(mats.map(m => ({ id: m.id, name: m.name })))
          setProcessCategories(categories)
          setSizeRanges(sizes)
          setCountries(cntrs)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [isVendorDataset])

  const activeCount = useMemo(() => {
    const vendorCounts = (value.vendorMaterialTypes?.length || 0) + (value.vendorMaterialFormats?.length || 0) + (value.vendorPrinterManufacturers?.length || 0) + (value.vendorPrinterModels?.length || 0)
    return (
      value.technologyIds.length +
      value.materialIds.length +
      value.processCategories.length +
      value.sizeRanges.length +
      value.countries.length +
      vendorCounts
    )
  }, [value])

  const containerCls = orientation === "horizontal"
    ? "flex flex-wrap items-center gap-3 md:gap-4"
    : "flex flex-col gap-3"

  return (
    <div className={`${containerCls} ${className}`} data-testid="filter-bar">
      {/* Filter Label and Status */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeCount} active
          </Badge>
        )}
      </div>

      {/* Technologies */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={value.technologyIds.length > 0 ? "default" : "outline"} 
            size="sm" 
            className="h-8 text-xs" 
            data-testid="filter-tech"
          >
            <FilterIcon className="h-3 w-3 mr-1" />
            Technologies
            {value.technologyIds.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                {value.technologyIds.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by Technology</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : (
            <>
              {value.technologyIds.length > 0 && (
                <>
                  <DropdownMenuCheckboxItem
                    onClick={() => onChange({ ...value, technologyIds: [] })}
                    className="font-medium"
                  >
                    Clear All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {techOptions.map((tech) => (
                <DropdownMenuCheckboxItem
                  key={tech.id}
                  checked={value.technologyIds.includes(tech.id)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...value.technologyIds, tech.id]
                      : value.technologyIds.filter(id => id !== tech.id)
                    onChange({ ...value, technologyIds: next })
                  }}
                >
                  {tech.name}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Materials */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={value.materialIds.length > 0 ? "default" : "outline"} 
            size="sm" 
            className="h-8 text-xs" 
            data-testid="filter-material"
          >
            <FilterIcon className="h-3 w-3 mr-1" />
            Materials
            {value.materialIds.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                {value.materialIds.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by Material</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : (
            <>
              {value.materialIds.length > 0 && (
                <>
                  <DropdownMenuCheckboxItem
                    onClick={() => onChange({ ...value, materialIds: [] })}
                    className="font-medium"
                  >
                    Clear All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {materialOptions.map((m) => (
                <DropdownMenuCheckboxItem
                  key={m.id}
                  checked={value.materialIds.includes(m.id)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...value.materialIds, m.id]
                      : value.materialIds.filter(id => id !== m.id)
                    onChange({ ...value, materialIds: next })
                  }}
                >
                  {m.name}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Vendor: Material Type */}
      {isVendorDataset && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={(value.vendorMaterialTypes?.length || 0) > 0 ? "default" : "outline"} 
              size="sm" 
              className="h-8 text-xs" 
              data-testid="filter-vendor-material-type"
            >
              <FilterIcon className="h-3 w-3 mr-1" />
              Material Type
              {value.vendorMaterialTypes && value.vendorMaterialTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                  {value.vendorMaterialTypes.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Filter by Material Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : (
              <>
                {(value.vendorMaterialTypes?.length || 0) > 0 && (
                  <>
                    <DropdownMenuCheckboxItem
                      onClick={() => onChange({ ...value, vendorMaterialTypes: [] })}
                      className="font-medium"
                    >
                      Clear All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {vendorMaterialTypes.map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t}
                    checked={value.vendorMaterialTypes?.includes(t) || false}
                    onCheckedChange={(checked) => {
                      const current = value.vendorMaterialTypes || []
                      const next = checked
                        ? [...current, t]
                        : current.filter(v => v !== t)
                      onChange({ ...value, vendorMaterialTypes: next })
                    }}
                  >
                    {t}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Vendor: Material Format */}
      {isVendorDataset && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={(value.vendorMaterialFormats?.length || 0) > 0 ? "default" : "outline"} 
              size="sm" 
              className="h-8 text-xs" 
              data-testid="filter-vendor-material-format"
            >
              <FilterIcon className="h-3 w-3 mr-1" />
              Material Format
              {value.vendorMaterialFormats && value.vendorMaterialFormats.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                  {value.vendorMaterialFormats.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Filter by Material Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : (
              <>
                {(value.vendorMaterialFormats?.length || 0) > 0 && (
                  <>
                    <DropdownMenuCheckboxItem
                      onClick={() => onChange({ ...value, vendorMaterialFormats: [] })}
                      className="font-medium"
                    >
                      Clear All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {vendorMaterialFormats.map((fmt) => (
                  <DropdownMenuCheckboxItem
                    key={fmt}
                    checked={value.vendorMaterialFormats?.includes(fmt) || false}
                    onCheckedChange={(checked) => {
                      const current = value.vendorMaterialFormats || []
                      const next = checked
                        ? [...current, fmt]
                        : current.filter(v => v !== fmt)
                      onChange({ ...value, vendorMaterialFormats: next })
                    }}
                  >
                    {fmt}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Vendor: Printer Manufacturer */}
      {isVendorDataset && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={(value.vendorPrinterManufacturers?.length || 0) > 0 ? "default" : "outline"} 
              size="sm" 
              className="h-8 text-xs" 
              data-testid="filter-vendor-printer-manufacturer"
            >
              <FilterIcon className="h-3 w-3 mr-1" />
              Manufacturer
              {value.vendorPrinterManufacturers && value.vendorPrinterManufacturers.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                  {value.vendorPrinterManufacturers.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Filter by Manufacturer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : (
              <>
                {(value.vendorPrinterManufacturers?.length || 0) > 0 && (
                  <>
                    <DropdownMenuCheckboxItem
                      onClick={() => onChange({ ...value, vendorPrinterManufacturers: [] })}
                      className="font-medium"
                    >
                      Clear All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {vendorManufacturers.map((mfr) => (
                  <DropdownMenuCheckboxItem
                    key={mfr}
                    checked={value.vendorPrinterManufacturers?.includes(mfr) || false}
                    onCheckedChange={(checked) => {
                      const current = value.vendorPrinterManufacturers || []
                      const next = checked
                        ? [...current, mfr]
                        : current.filter(v => v !== mfr)
                      onChange({ ...value, vendorPrinterManufacturers: next })
                    }}
                  >
                    {mfr}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Vendor: Printer Model */}
      {isVendorDataset && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={(value.vendorPrinterModels?.length || 0) > 0 ? "default" : "outline"} 
              size="sm" 
              className="h-8 text-xs" 
              data-testid="filter-vendor-printer-model"
            >
              <FilterIcon className="h-3 w-3 mr-1" />
              Model
              {value.vendorPrinterModels && value.vendorPrinterModels.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                  {value.vendorPrinterModels.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Filter by Model</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : (
              <>
                {(value.vendorPrinterModels?.length || 0) > 0 && (
                  <>
                    <DropdownMenuCheckboxItem
                      onClick={() => onChange({ ...value, vendorPrinterModels: [] })}
                      className="font-medium"
                    >
                      Clear All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {vendorModels.map((mdl) => (
                  <DropdownMenuCheckboxItem
                    key={mdl}
                    checked={value.vendorPrinterModels?.includes(mdl) || false}
                    onCheckedChange={(checked) => {
                      const current = value.vendorPrinterModels || []
                      const next = checked
                        ? [...current, mdl]
                        : current.filter(v => v !== mdl)
                      onChange({ ...value, vendorPrinterModels: next })
                    }}
                  >
                    {mdl}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Process Types */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={value.processCategories.length > 0 ? "default" : "outline"} 
            size="sm" 
            className="h-8 text-xs" 
            data-testid="filter-process"
          >
            <FilterIcon className="h-3 w-3 mr-1" />
            Process Types
            {value.processCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                {value.processCategories.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by Process Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : (
            <>
              {value.processCategories.length > 0 && (
                <>
                  <DropdownMenuCheckboxItem
                    onClick={() => onChange({ ...value, processCategories: [] })}
                    className="font-medium"
                  >
                    Clear All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {processCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={value.processCategories.includes(category)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...value.processCategories, category]
                      : value.processCategories.filter(c => c !== category)
                    onChange({ ...value, processCategories: next })
                  }}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Geography: Countries */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={value.countries.length > 0 ? "default" : "outline"} 
            size="sm" 
            className="h-8 text-xs" 
            data-testid="filter-country"
          >
            <FilterIcon className="h-3 w-3 mr-1" />
            Countries
            {value.countries.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                {value.countries.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by Country</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : (
            <>
              {value.countries.length > 0 && (
                <>
                  <DropdownMenuCheckboxItem
                    onClick={() => onChange({ ...value, countries: [] })}
                    className="font-medium"
                  >
                    Clear All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {countries.map((country) => (
                <DropdownMenuCheckboxItem
                  key={country}
                  checked={value.countries.includes(country)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...value.countries, country]
                      : value.countries.filter(c => c !== country)
                    onChange({ ...value, countries: next })
                  }}
                >
                  {country}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>


      {/* Clear all filters */}
      {activeCount > 0 && (
        <div className="ml-2 pl-2 border-l border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onChange(emptyFilters)}
            data-testid="filter-clear-all"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
