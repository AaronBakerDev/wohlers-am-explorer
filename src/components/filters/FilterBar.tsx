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
  getStates,
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
  const [states, setStates] = useState<string[]>([])

  // Load filter option lists
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const [techs, mats, categories, sizes, cntrs, sts] = await Promise.all([
          getTechnologies(),
          getMaterials(),
          getTechnologyCategories(),
          getEmployeeSizeRanges(),
          getCountries(),
          getStates(),
        ])
        if (!active) return
        setTechOptions(techs.map(t => ({ id: t.id, name: t.name })))
        setMaterialOptions(mats.map(m => ({ id: m.id, name: m.name })))
        setProcessCategories(categories)
        setSizeRanges(sizes)
        setCountries(cntrs)
        setStates(sts)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const activeCount = useMemo(() => {
    return (
      value.technologyIds.length +
      value.materialIds.length +
      value.processCategories.length +
      value.sizeRanges.length +
      value.countries.length +
      value.states.length
    )
  }, [value])

  const containerCls = orientation === "horizontal"
    ? "flex flex-wrap items-center gap-2"
    : "flex flex-col gap-2"

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
              {processCategories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat}
                  checked={value.processCategories.includes(cat)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...value.processCategories, cat]
                      : value.processCategories.filter(c => c !== cat)
                    onChange({ ...value, processCategories: next })
                  }}
                >
                  {cat}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Company Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={value.sizeRanges.length > 0 ? "default" : "outline"} 
            size="sm" 
            className="h-8 text-xs" 
            data-testid="filter-size"
          >
            <FilterIcon className="h-3 w-3 mr-1" />
            Company Size
            {value.sizeRanges.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                {value.sizeRanges.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by Size</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : (
            <>
              {value.sizeRanges.length > 0 && (
                <>
                  <DropdownMenuCheckboxItem
                    onClick={() => onChange({ ...value, sizeRanges: [] })}
                    className="font-medium"
                  >
                    Clear All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {sizeRanges.map((range) => (
                <DropdownMenuCheckboxItem
                  key={range}
                  checked={value.sizeRanges.includes(range)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...value.sizeRanges, range]
                      : value.sizeRanges.filter(r => r !== range)
                    onChange({ ...value, sizeRanges: next })
                  }}
                >
                  {range}
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

      {/* Geography: States */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={value.states.length > 0 ? "default" : "outline"} 
            size="sm" 
            className="h-8 text-xs" 
            data-testid="filter-state"
          >
            <FilterIcon className="h-3 w-3 mr-1" />
            States/Regions
            {value.states.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 bg-background/20">
                {value.states.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by State/Region</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : (
            <>
              {value.states.length > 0 && (
                <>
                  <DropdownMenuCheckboxItem
                    onClick={() => onChange({ ...value, states: [] })}
                    className="font-medium"
                  >
                    Clear All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {states.map((state) => (
                <DropdownMenuCheckboxItem
                  key={state}
                  checked={value.states.includes(state)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...value.states, state]
                      : value.states.filter(s => s !== state)
                    onChange({ ...value, states: next })
                  }}
                >
                  {state}
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
