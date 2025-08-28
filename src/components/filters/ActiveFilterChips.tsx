"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FilterState } from "@/lib/filters/types"
import { useEffect, useState } from "react"
import {
  getTechnologies,
  getMaterials,
} from "@/lib/supabase/client-queries"

type ActiveFilterChipsProps = {
  filters: FilterState
  onChange: (filters: FilterState) => void
  className?: string
}

export default function ActiveFilterChips({ filters, onChange, className = "" }: ActiveFilterChipsProps) {
  const [techMap, setTechMap] = useState<Map<string, string>>(new Map())
  const [materialMap, setMaterialMap] = useState<Map<string, string>>(new Map())

  // Load names for IDs
  useEffect(() => {
    const loadNames = async () => {
      const [techs, mats] = await Promise.all([
        getTechnologies(),
        getMaterials(),
      ])
      setTechMap(new Map(techs.map(t => [t.id, t.name])))
      setMaterialMap(new Map(mats.map(m => [m.id, m.name])))
    }
    loadNames()
  }, [])

  const removeTechnology = (id: string) => {
    onChange({
      ...filters,
      technologyIds: filters.technologyIds.filter(tid => tid !== id)
    })
  }

  const removeMaterial = (id: string) => {
    onChange({
      ...filters,
      materialIds: filters.materialIds.filter(mid => mid !== id)
    })
  }

  const removeProcessCategory = (cat: string) => {
    onChange({
      ...filters,
      processCategories: filters.processCategories.filter(c => c !== cat)
    })
  }

  const removeSizeRange = (range: string) => {
    onChange({
      ...filters,
      sizeRanges: filters.sizeRanges.filter(r => r !== range)
    })
  }

  const removeCountry = (country: string) => {
    onChange({
      ...filters,
      countries: filters.countries.filter(c => c !== country)
    })
  }

  const removeState = (state: string) => {
    onChange({
      ...filters,
      states: filters.states.filter(s => s !== state)
    })
  }

  const hasActiveFilters = 
    filters.technologyIds.length > 0 ||
    filters.materialIds.length > 0 ||
    filters.processCategories.length > 0 ||
    filters.sizeRanges.length > 0 ||
    filters.countries.length > 0 ||
    filters.states.length > 0

  if (!hasActiveFilters) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Technology Chips */}
      {filters.technologyIds.map(id => (
        <Badge
          key={`tech-${id}`}
          variant="secondary"
          className="text-xs pr-1 flex items-center gap-1 hover:bg-secondary/80"
        >
          <span className="text-[10px] opacity-60">Tech:</span>
          {techMap.get(id) || id}
          <button
            onClick={() => removeTechnology(id)}
            className="ml-1 hover:bg-background/20 rounded p-0.5"
            aria-label={`Remove ${techMap.get(id) || id} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Material Chips */}
      {filters.materialIds.map(id => (
        <Badge
          key={`mat-${id}`}
          variant="secondary"
          className="text-xs pr-1 flex items-center gap-1 hover:bg-secondary/80"
        >
          <span className="text-[10px] opacity-60">Material:</span>
          {materialMap.get(id) || id}
          <button
            onClick={() => removeMaterial(id)}
            className="ml-1 hover:bg-background/20 rounded p-0.5"
            aria-label={`Remove ${materialMap.get(id) || id} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Process Category Chips */}
      {filters.processCategories.map(cat => (
        <Badge
          key={`proc-${cat}`}
          variant="secondary"
          className="text-xs pr-1 flex items-center gap-1 hover:bg-secondary/80"
        >
          <span className="text-[10px] opacity-60">Process:</span>
          {cat}
          <button
            onClick={() => removeProcessCategory(cat)}
            className="ml-1 hover:bg-background/20 rounded p-0.5"
            aria-label={`Remove ${cat} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Size Range Chips */}
      {filters.sizeRanges.map(range => (
        <Badge
          key={`size-${range}`}
          variant="secondary"
          className="text-xs pr-1 flex items-center gap-1 hover:bg-secondary/80"
        >
          <span className="text-[10px] opacity-60">Size:</span>
          {range}
          <button
            onClick={() => removeSizeRange(range)}
            className="ml-1 hover:bg-background/20 rounded p-0.5"
            aria-label={`Remove ${range} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Country Chips */}
      {filters.countries.map(country => (
        <Badge
          key={`country-${country}`}
          variant="secondary"
          className="text-xs pr-1 flex items-center gap-1 hover:bg-secondary/80"
        >
          <span className="text-[10px] opacity-60">Country:</span>
          {country}
          <button
            onClick={() => removeCountry(country)}
            className="ml-1 hover:bg-background/20 rounded p-0.5"
            aria-label={`Remove ${country} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* State Chips */}
      {filters.states.map(state => (
        <Badge
          key={`state-${state}`}
          variant="secondary"
          className="text-xs pr-1 flex items-center gap-1 hover:bg-secondary/80"
        >
          <span className="text-[10px] opacity-60">State:</span>
          {state}
          <button
            onClick={() => removeState(state)}
            className="ml-1 hover:bg-background/20 rounded p-0.5"
            aria-label={`Remove ${state} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}