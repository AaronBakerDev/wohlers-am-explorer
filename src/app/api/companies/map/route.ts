import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface EquipmentRow {
  company_id: string
  technology_id: string
  material_id: string
}

interface TechnologyRow {
  id: string
  category: string
}

interface CompanySummaryRow {
  id: string
  name: string
  city: string | null
  state: string | null
  country: string | null
  latitude: number
  longitude: number
  company_type: string | null
  website: string | null
  total_machines: number
  unique_processes: number
  unique_materials: number
  unique_manufacturers: number
  processes: string[]
  materials: string[]
  description: string | null
  employee_count_range: string | null
}

type Marker = {
  id: string
  name: string
  city: string | null
  state: string | null
  country: string | null
  lat: number
  lng: number
  type: string | null
  website: string | null
  technologies: string[]
  materials: string[]
  totalMachines: number
  uniqueProcesses: number
  uniqueMaterials: number
  uniqueManufacturers: number
}

function parseCsvParam(v: string | null): string[] | null {
  if (!v) return null
  const list = v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  return list.length ? list : null
}

function parseBbox(bbox: string | null): [number, number, number, number] | null {
  if (!bbox) return null
  const parts = bbox.split(",").map((p) => Number(p.trim()))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null
  const [minLng, minLat, maxLng, maxLat] = parts
  if (minLat > maxLat || minLng > maxLng) return null
  return [minLng, minLat, maxLng, maxLat]
}

async function fetchCompanyIdsByEquipment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  processIds: string[] | null,
  materialIds: string[] | null
): Promise<string[]> {
  if (!processIds && !materialIds) return []

  let eq = supabase.from("equipment").select("company_id, technology_id, material_id")
  if (processIds && processIds.length) {
    eq = eq.in("technology_id", processIds)
  }
  if (materialIds && materialIds.length) {
    eq = eq.in("material_id", materialIds)
  }

  const { data, error } = await eq
  if (error) {
    throw new Error(`Failed to fetch equipment filters: ${error.message}`)
  }

  const ids = new Set<string>()
  for (const row of data || []) {
    const cid = (row as EquipmentRow)?.company_id
    if (cid) ids.add(cid)
  }
  return Array.from(ids)
}

async function fetchCompaniesChunked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
  filters: {
    q?: string | null
    type?: string | null
    countries?: string[] | null
    states?: string[] | null
    sizeRanges?: string[] | null
    bbox?: [number, number, number, number] | null
  },
  limit: number
): Promise<Marker[]> {
  // If no specific id restriction, perform a single filtered query
  if (!ids.length) {
    let q = supabase
      .from("company_summaries")
      .select(
        "id,name,city,state,country,latitude,longitude,company_type,website,total_machines,unique_processes,unique_materials,unique_manufacturers,processes,materials,description,employee_count_range",
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("name", { ascending: true })
      .limit(limit)

    if (filters.q && filters.q.trim()) {
      const term = filters.q.trim()
      q = q.or(
        `name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,country.ilike.%${term}%,description.ilike.%${term}%`,
      )
    }
    if (filters.type && filters.type.trim() && filters.type !== "all") {
      q = q.eq("company_type", filters.type.trim())
    }
    if (filters.countries && filters.countries.length) {
      q = q.in("country", filters.countries)
    }
    if (filters.states && filters.states.length) {
      q = q.in("state", filters.states)
    }
    if (filters.sizeRanges && filters.sizeRanges.length) {
      q = q.in("employee_count_range", filters.sizeRanges)
    }
    if (filters.bbox) {
      const [minLng, minLat, maxLng, maxLat] = filters.bbox
      q = q
        .gte("latitude", minLat)
        .lte("latitude", maxLat)
        .gte("longitude", minLng)
        .lte("longitude", maxLng)
    }

    const { data, error } = await q
    if (error) throw new Error(`Failed to fetch companies: ${error.message}`)
    return (data || []).map((c: CompanySummaryRow) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
      country: c.country,
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      type: c.company_type,
      website: c.website ?? null,
      technologies: c.processes ?? [],
      materials: c.materials ?? [],
      totalMachines: Number(c.total_machines) || 0,
      uniqueProcesses: Number(c.unique_processes) || 0,
      uniqueMaterials: Number(c.unique_materials) || 0,
      uniqueManufacturers: Number(c.unique_manufacturers) || 0,
    }))
  }

  // With specific IDs, chunk the .in() calls to avoid URL length limits
  const CHUNK = 800
  const items: Marker[] = []
  for (let i = 0; i < ids.length && items.length < limit; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK)
    let q = supabase
      .from("company_summaries")
      .select(
        "id,name,city,state,country,latitude,longitude,company_type,website,total_machines,unique_processes,unique_materials,unique_manufacturers,processes,materials,description,employee_count_range",
      )
      .in("id", slice)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("name", { ascending: true })
      .limit(limit - items.length)

    if (filters.q && filters.q.trim()) {
      const term = filters.q.trim()
      q = q.or(
        `name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,country.ilike.%${term}%,description.ilike.%${term}%`,
      )
    }
    if (filters.type && filters.type.trim() && filters.type !== "all") {
      q = q.eq("company_type", filters.type.trim())
    }
    if (filters.countries && filters.countries.length) {
      q = q.in("country", filters.countries)
    }
    if (filters.states && filters.states.length) {
      q = q.in("state", filters.states)
    }
    if (filters.sizeRanges && filters.sizeRanges.length) {
      q = q.in("employee_count_range", filters.sizeRanges)
    }
    if (filters.bbox) {
      const [minLng, minLat, maxLng, maxLat] = filters.bbox
      q = q
        .gte("latitude", minLat)
        .lte("latitude", maxLat)
        .gte("longitude", minLng)
        .lte("longitude", maxLng)
    }

    const { data, error } = await q
    if (error) throw new Error(`Failed to fetch companies (chunk): ${error.message}`)

    for (const c of data || []) {
      const company = c as CompanySummaryRow
      items.push({
        id: company.id,
        name: company.name,
        city: company.city,
        state: company.state,
        country: company.country,
        lat: Number(company.latitude),
        lng: Number(company.longitude),
        type: company.company_type,
        website: company.website ?? null,
        technologies: company.processes ?? [],
        materials: company.materials ?? [],
        totalMachines: Number(company.total_machines) || 0,
        uniqueProcesses: Number(company.unique_processes) || 0,
        uniqueMaterials: Number(company.unique_materials) || 0,
        uniqueManufacturers: Number(company.unique_manufacturers) || 0,
      })
      if (items.length >= limit) break
    }
  }
  return items
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(req.url)

    const q = url.searchParams.get("q")
    const type = url.searchParams.get("type")
    const countries = parseCsvParam(url.searchParams.get("countries"))
    const states = parseCsvParam(url.searchParams.get("states"))
    const sizeRanges = parseCsvParam(url.searchParams.get("sizeRanges"))
    const processIds = parseCsvParam(url.searchParams.get("processIds"))
    const processCategories = parseCsvParam(url.searchParams.get("processCategories"))
    const materialIds = parseCsvParam(url.searchParams.get("materialIds"))
    const bbox = parseBbox(url.searchParams.get("bbox"))
    const limitParam = url.searchParams.get("limit")
    const limit = Math.min(5000, Math.max(1, Number(limitParam) || 1000))

    // Resolve equipment filters to a set of company IDs (if provided)
    let restrictedIds: string[] = []
    let resolvedProcessIds = processIds || []
    if (processCategories && processCategories.length) {
      const { data: techRows, error: techErr } = await supabase
        .from("technologies")
        .select("id,category")
        .in("category", processCategories)
      if (techErr) throw new Error(`Failed to resolve process categories: ${techErr.message}`)
      const categoryIds = (techRows || []).map((r: TechnologyRow) => r.id).filter(Boolean)
      resolvedProcessIds = Array.from(new Set([...(resolvedProcessIds || []), ...categoryIds]))
    }

    if ((resolvedProcessIds && resolvedProcessIds.length) || (materialIds && materialIds.length)) {
      restrictedIds = await fetchCompanyIdsByEquipment(supabase, resolvedProcessIds, materialIds)
      if (!restrictedIds.length) {
        return NextResponse.json({ data: { items: [], total: 0 } })
      }
    }

    const markers = await fetchCompaniesChunked(
      supabase,
      restrictedIds,
      { q, type, countries, states, sizeRanges, bbox },
      limit
    )

    return NextResponse.json({
      data: {
        items: markers,
        total: markers.length,
      },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error in map companies endpoint" },
      { status: 500 }
    )
  }
}
