import { createClient } from './client'
import { 
  Company,
  Technology,
  Material,
  CompanyInsert,
  TechnologyInsert,
  MaterialInsert,
  CompanyWithDetails,
  DashboardAnalytics
} from './types'

// Client-side queries (for use in 'use client' components)




// ========================================
// AM COMPANIES CLIENT QUERIES
// ========================================

// Company queries (client-side)
export async function getCompanies(): Promise<Company[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`)
  }

  return data
}

export async function getCompaniesWithDetails(): Promise<CompanyWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_technologies (
        id,
        is_primary,
        technologies (
          id,
          name,
          category,
          description
        )
      ),
      company_materials (
        id,
        is_primary,
        materials (
          id,
          name,
          category,
          description
        )
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch companies with details: ${error.message}`)
  }

  return data as CompanyWithDetails[]
}

export async function getCompany(id: string): Promise<CompanyWithDetails | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_technologies (
        id,
        is_primary,
        technologies (
          id,
          name,
          category,
          description
        )
      ),
      company_materials (
        id,
        is_primary,
        materials (
          id,
          name,
          category,
          description
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch company: ${error.message}`)
  }

  return data as CompanyWithDetails
}

export async function searchCompanies(searchTerm: string): Promise<Company[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to search companies: ${error.message}`)
  }

  return data
}

// Technology queries (client-side)
export async function getTechnologies(): Promise<Technology[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('technologies')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch technologies: ${error.message}`)
  }

  return data
}

export async function getTechnologyCategories(): Promise<string[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('technologies')
    .select('category')
    .not('category', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch technology categories: ${error.message}`)
  }

  // Get unique categories
  const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))]
  return uniqueCategories.sort()
}

// Material queries (client-side)
export async function getMaterials(): Promise<Material[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`)
  }

  return data
}

export async function getMaterialCategories(): Promise<string[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('materials')
    .select('category')
    .not('category', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch material categories: ${error.message}`)
  }

  // Get unique categories
  const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))]
  return uniqueCategories.sort()
}

// Distinct employee size ranges (for company size filter)
export async function getEmployeeSizeRanges(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('employee_count_range')
    .not('employee_count_range', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch employee size ranges: ${error.message}`)
  }

  const unique = [...new Set(
    data
      .map((r: any) => r.employee_count_range as string | null)
      .filter(Boolean) as string[]
  )]
  return unique.sort()
}

// Distinct countries and states (for geography filters)
export async function getCountries(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('country')
    .not('country', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch countries: ${error.message}`)
  }

  const unique = [...new Set(
    data
      .map((r: any) => r.country as string | null)
      .filter(Boolean) as string[]
  )]
  return unique.sort()
}

export async function getStates(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('companies')
    .select('state')
    .not('state', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch states: ${error.message}`)
  }

  const unique = [...new Set(
    data
      .map((r: any) => r.state as string | null)
      .filter(Boolean) as string[]
  )]
  return unique.sort()
}

// Map Explorer specific queries (client-side)
export async function getCompanySummaries() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('company_summaries')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch company summaries: ${error.message}`)
  }

  return data
}

export async function getCompaniesWithFilters(options: {
  technologyIds?: string[]
  materialIds?: string[]
  processCategories?: string[]
  sizeRanges?: string[]
  states?: string[]
  countries?: string[]
}) {
  const supabase = createClient()
  
  // Base query - get company summaries with filtering
  let query = supabase.from('company_summaries').select('*')
  // Apply company-level filters
  if (options.sizeRanges?.length) query = query.in('employee_count_range', options.sizeRanges)
  if (options.states?.length) query = query.in('state', options.states)
  if (options.countries?.length) query = query.in('country', options.countries)
  
  const { data, error } = await query.order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch filtered companies: ${error.message}`)
  }

  return data
}

export async function getStateStatistics(options: {
  technologyIds?: string[]
  materialIds?: string[]
  processCategories?: string[]
  sizeRanges?: string[]
  states?: string[]
  countries?: string[]
}) {
  const supabase = createClient()
  // Use simplified flow against company_summaries; equipment FKs removed in new schema
  let base = supabase
    .from('company_summaries')
    .select('state, country, total_machines, id, employee_count_range')
    .not('state', 'is', null)

  if (options.sizeRanges?.length) base = base.in('employee_count_range', options.sizeRanges)
  if (options.states?.length) base = base.in('state', options.states)
  if (options.countries?.length) base = base.in('country', options.countries)

  const { data: companies, error } = await base
  
  if (error) {
    throw new Error(`Failed to fetch state statistics: ${error.message}`)
  }
  
  const stateStats = (companies || []).reduce((acc, company) => {
    const key = `${company.state}-${company.country}`
    if (!acc[key]) {
      acc[key] = {
        state: company.state,
        country: company.country,
        company_count: 0,
        total_machines: 0,
      }
    }
    acc[key].company_count += 1
    acc[key].total_machines += company.total_machines || 0
    return acc
  }, {} as Record<string, { state: string; country: string; company_count: number; total_machines: number }>)
  
  return Object.values(stateStats)
}

// Analytics queries for dashboard insights (client-side)
export async function getCompanyStatistics(filters?: {
  sizeRanges?: string[]
  states?: string[]
  countries?: string[]
}) {
  const supabase = createClient()
  
  // Get total companies
  let baseForCount = supabase.from('companies')
  if (filters?.sizeRanges?.length) baseForCount = baseForCount.in('employee_count_range', filters.sizeRanges)
  if (filters?.states?.length) baseForCount = baseForCount.in('state', filters.states)
  if (filters?.countries?.length) baseForCount = baseForCount.in('country', filters.countries)
  const { count: totalCompanies, error: countError } = await baseForCount.select('*', { count: 'exact', head: true })

  if (countError) {
    throw new Error(`Failed to get company count: ${countError.message}`)
  }

  // Get companies by type
  let baseTypes = supabase.from('companies').select('company_type').not('company_type', 'is', null)
  if (filters?.sizeRanges?.length) baseTypes = baseTypes.in('employee_count_range', filters.sizeRanges)
  if (filters?.states?.length) baseTypes = baseTypes.in('state', filters.states)
  if (filters?.countries?.length) baseTypes = baseTypes.in('country', filters.countries)
  const { data: companyTypes, error: typesError } = await baseTypes

  if (typesError) {
    throw new Error(`Failed to get company types: ${typesError.message}`)
  }

  // Get companies by state
  let baseStates = supabase.from('companies').select('state').not('state', 'is', null)
  if (filters?.sizeRanges?.length) baseStates = baseStates.in('employee_count_range', filters.sizeRanges)
  if (filters?.states?.length) baseStates = baseStates.in('state', filters.states)
  if (filters?.countries?.length) baseStates = baseStates.in('country', filters.countries)
  const { data: companyStates, error: statesError } = await baseStates

  if (statesError) {
    throw new Error(`Failed to get company states: ${statesError.message}`)
  }

  // Count by type
  const typeStats = companyTypes.reduce((acc, company) => {
    const type = company.company_type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Count by state
  const stateStats = companyStates.reduce((acc, company) => {
    const state = company.state
    acc[state] = (acc[state] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalCompanies: totalCompanies || 0,
    companyTypeStats: typeStats,
    companyStateStats: stateStats
  }
}

// Lightweight total company count (client-side)
export async function getCompanyCount(): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw new Error(`Failed to get company count: ${error.message}`)
  }

  return count || 0
}

// Get technology adoption analytics
export async function getTechnologyAnalytics(filters?: {
  sizeRanges?: string[]
  states?: string[]
  countries?: string[]
  technologyIds?: string[]
  processCategories?: string[]
}) {
  const supabase = createClient()
  
  // Get all companies with their processes
  let base = supabase
    .from('company_summaries')
    .select('id, processes, total_machines, state, country, employee_count_range')
    .not('processes', 'is', null)

  if (filters?.sizeRanges?.length) base = base.in('employee_count_range', filters.sizeRanges)
  if (filters?.states?.length) base = base.in('state', filters.states)
  if (filters?.countries?.length) base = base.in('country', filters.countries)
  const { data: companies, error } = await base

  if (error) {
    throw new Error(`Failed to get technology analytics: ${error.message}`)
  }

  // Count technology usage
  const technologyStats: Record<string, { companies: number; totalMachines: number }> = {}
  
  companies.forEach(company => {
    if (company.processes) {
      company.processes.forEach((process: string) => {
        if (!technologyStats[process]) {
          technologyStats[process] = { companies: 0, totalMachines: 0 }
        }
        technologyStats[process].companies += 1
        technologyStats[process].totalMachines += company.total_machines || 0
      })
    }
  })

  // Convert to sorted array
  const technologyArray = Object.entries(technologyStats)
    .map(([name, stats]) => ({
      technology: name,
      companies: stats.companies,
      totalMachines: stats.totalMachines,
      percentage: Math.round((stats.companies / companies.length) * 100)
    }))
    .sort((a, b) => b.companies - a.companies)

  return technologyArray
}

// Get material usage analytics
export async function getMaterialAnalytics(filters?: {
  sizeRanges?: string[]
  states?: string[]
  countries?: string[]
  materialIds?: string[]
}) {
  const supabase = createClient()
  
  // Get all companies with their materials
  let base = supabase
    .from('company_summaries')
    .select('id, materials, total_machines, state, country, employee_count_range')
    .not('materials', 'is', null)

  if (filters?.sizeRanges?.length) base = base.in('employee_count_range', filters.sizeRanges)
  if (filters?.states?.length) base = base.in('state', filters.states)
  if (filters?.countries?.length) base = base.in('country', filters.countries)
  const { data: companies, error } = await base

  if (error) {
    throw new Error(`Failed to get material analytics: ${error.message}`)
  }

  // Count material usage
  const materialStats: Record<string, { companies: number; totalMachines: number }> = {}
  
  companies.forEach(company => {
    if (company.materials) {
      company.materials.forEach((material: string) => {
        if (!materialStats[material]) {
          materialStats[material] = { companies: 0, totalMachines: 0 }
        }
        materialStats[material].companies += 1
        materialStats[material].totalMachines += company.total_machines || 0
      })
    }
  })

  // Convert to sorted array
  const materialArray = Object.entries(materialStats)
    .map(([name, stats]) => ({
      material: name,
      companies: stats.companies,
      totalMachines: stats.totalMachines,
      percentage: Math.round((stats.companies / companies.length) * 100)
    }))
    .sort((a, b) => b.companies - a.companies)

  return materialArray
}

// Get comprehensive analytics for dashboard
export async function getDashboardAnalytics(filters?: {
  technologyIds?: string[]
  materialIds?: string[]
  processCategories?: string[]
  sizeRanges?: string[]
  states?: string[]
  countries?: string[]
}): Promise<DashboardAnalytics> {
  const supabase = createClient()
  
  try {
    // Helper: month key formatter YYYY-MM
    const fmtMonth = (iso: string | null | undefined) => {
      if (!iso) return null
      const d = new Date(iso)
      if (isNaN(d.getTime())) return null
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    // With the updated schema, equipment no longer references technologies/materials by ID.
    // Skip narrowing analytics by those FK-based filters for now.
    const filteredCompanyIdsForEquipFilters: string[] | null = null

    // Run all analytics queries in parallel
    const [
      companyStats,
      technologyStats,
      materialStats,
      stateStats
    ] = await Promise.all([
      getCompanyStatistics({
        sizeRanges: filters?.sizeRanges,
        states: filters?.states,
        countries: filters?.countries,
      }),
      getTechnologyAnalytics({
        sizeRanges: filters?.sizeRanges,
        states: filters?.states,
        countries: filters?.countries,
        technologyIds: filters?.technologyIds,
        processCategories: filters?.processCategories,
      }),
      getMaterialAnalytics({
        sizeRanges: filters?.sizeRanges,
        states: filters?.states,
        countries: filters?.countries,
        materialIds: filters?.materialIds,
      }),
      getStateStatistics({
        technologyIds: filters?.technologyIds,
        materialIds: filters?.materialIds,
        processCategories: filters?.processCategories,
        sizeRanges: filters?.sizeRanges,
        states: filters?.states,
        countries: filters?.countries,
      })
    ])

    // Get top cities
    let citiesBase = supabase
      .from('company_summaries')
      .select('city, state, country, total_machines, employee_count_range')
      .not('city', 'is', null)
      .not('state', 'is', null)

    if (filters?.sizeRanges?.length) citiesBase = citiesBase.in('employee_count_range', filters.sizeRanges)
    if (filters?.states?.length) citiesBase = citiesBase.in('state', filters.states)
    if (filters?.countries?.length) citiesBase = citiesBase.in('country', filters.countries)

    const { data: topCities, error: citiesError } = await citiesBase

    if (citiesError) {
      throw new Error(`Failed to get top cities: ${citiesError.message}`)
    }

    // Count by city
    const cityStats: Record<string, { companies: number; totalMachines: number }> = {}
    topCities.forEach(company => {
      const cityKey = `${company.city}, ${company.state}`
      if (!cityStats[cityKey]) {
        cityStats[cityKey] = { companies: 0, totalMachines: 0 }
      }
      cityStats[cityKey].companies += 1
      cityStats[cityKey].totalMachines += company.total_machines || 0
    })

    const topCitiesArray = Object.entries(cityStats)
      .map(([city, stats]) => ({
        city,
        companies: stats.companies,
        totalMachines: stats.totalMachines
      }))
      .sort((a, b) => b.companies - a.companies)
      .slice(0, 10)

    // Calculate summary metrics
    const totalStates = Object.keys(companyStats.companyStateStats).length
    const totalTechnologies = technologyStats.length
    const totalMachines = stateStats.reduce((sum, state) => sum + state.total_machines, 0)

    // Company size distribution
    let sizeQ = supabase
      .from('companies')
      .select('id, employee_count_range, state, country')
      .not('employee_count_range', 'is', null)
    if (filters?.sizeRanges?.length) sizeQ = sizeQ.in('employee_count_range', filters.sizeRanges)
    if (filters?.states?.length) sizeQ = sizeQ.in('state', filters.states)
    if (filters?.countries?.length) sizeQ = sizeQ.in('country', filters.countries)

    // If tech/material filters exist, restrict to matching companies
    if (filteredCompanyIdsForEquipFilters && filteredCompanyIdsForEquipFilters.length > 0) {
      sizeQ = sizeQ.in('id', filteredCompanyIdsForEquipFilters)
    } else if (filteredCompanyIdsForEquipFilters && filteredCompanyIdsForEquipFilters.length === 0) {
      // No companies match
      // Build empty analytics payload below
    }

    const { data: sizeRows } = await sizeQ
    const sizeDist = (sizeRows ?? []).reduce((acc, r: any) => {
      const key = r.employee_count_range as string
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const sizeDistribution = Object.entries(sizeDist)
      .map(([range, count]) => ({ range, companies: count as number, percentage: Math.round(((count as number) / (sizeRows?.length || 1)) * 100) }))
      .sort((a, b) => b.companies - a.companies)

    // Time series: companies created and machines added by month (last 24 months)
    // Companies
    let createdQ = supabase.from('companies').select('id, created_at, state, country')
    if (filters?.sizeRanges?.length) createdQ = createdQ.in('employee_count_range', filters.sizeRanges)
    if (filters?.states?.length) createdQ = createdQ.in('state', filters.states)
    if (filters?.countries?.length) createdQ = createdQ.in('country', filters.countries)
    if (filteredCompanyIdsForEquipFilters && filteredCompanyIdsForEquipFilters.length > 0) createdQ = createdQ.in('id', filteredCompanyIdsForEquipFilters)
    const { data: createdRows } = await createdQ

    const companyByMonth: Record<string, number> = {}
    ;(createdRows ?? []).forEach(r => {
      const m = fmtMonth(r.created_at)
      if (!m) return
      companyByMonth[m] = (companyByMonth[m] || 0) + 1
    })

    // Equipment machines added by month (use created_at on equipment, sum counts)
    let equipTimeQ = supabase.from('equipment').select('count, created_at, company_id, technology_id, material_id')
    if (filteredCompanyIdsForEquipFilters && filteredCompanyIdsForEquipFilters.length > 0) equipTimeQ = equipTimeQ.in('company_id', filteredCompanyIdsForEquipFilters)
    if (filters?.technologyIds?.length) equipTimeQ = equipTimeQ.in('technology_id', filters.technologyIds)
    if (filters?.materialIds?.length) equipTimeQ = equipTimeQ.in('material_id', filters.materialIds)
    const { data: equipTimeRows } = await equipTimeQ
    const machinesByMonth: Record<string, number> = {}
    ;(equipTimeRows ?? []).forEach(r => {
      const m = fmtMonth(r.created_at)
      if (!m) return
      machinesByMonth[m] = (machinesByMonth[m] || 0) + (r.count ?? 1)
    })

    // Build continuous last 24 months timeline
    const now = new Date()
    const series: { month: string; newCompanies: number; newMachines: number }[] = []
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      series.push({
        month: key,
        newCompanies: companyByMonth[key] || 0,
        newMachines: machinesByMonth[key] || 0,
      })
    }

    // Competitive landscape: Technology x Material Category segments (machines count)
    const { data: segRows } = await supabase
      .from('equipment')
      .select('count, process, material')
    const segMap: Record<string, Record<string, number>> = {}
    ;(segRows ?? []).forEach((r: any) => {
      const techName = r.process || 'Unknown'
      const matCat = r.material || 'Unknown'
      if (!segMap[techName]) segMap[techName] = {}
      segMap[techName][matCat] = (segMap[techName][matCat] || 0) + (r.count ?? 1)
    })
    const competitiveSegments = Object.entries(segMap).map(([technology, mats]) => ({
      technology,
      ...mats,
    }))

    // Market concentration metrics (HHI) for technologies and materials by companies share
    const hhi = (shares: number[]) => {
      // shares are proportions that sum to 1
      const pct = shares.map(s => s * 100)
      const score = pct.reduce((acc, s) => acc + (s * s), 0)
      return Math.round(score)
    }
    const techShares = technologyStats.map(t => t.companies / Math.max(companyStats.totalCompanies, 1))
    const matShares = materialStats.map(m => m.companies / Math.max(companyStats.totalCompanies, 1))
    const marketConcentration = {
      technologyHHI: hhi(techShares),
      materialHHI: hhi(matShares),
      topTechShare: Math.round((technologyStats.slice(0, 3).reduce((s, t) => s + t.companies, 0) / Math.max(companyStats.totalCompanies, 1)) * 100),
      topMaterialShare: Math.round((materialStats.slice(0, 3).reduce((s, m) => s + m.companies, 0) / Math.max(companyStats.totalCompanies, 1)) * 100),
    }

    return {
      summary: {
        totalCompanies: companyStats.totalCompanies,
        totalStates,
        totalTechnologies,
        totalMachines
      },
      companyTypes: Object.entries(companyStats.companyTypeStats)
        .map(([type, count]) => ({
          type: type || 'Unknown',
          companies: count,
          percentage: Math.round((count / companyStats.totalCompanies) * 100)
        }))
        .sort((a, b) => b.companies - a.companies),
      stateDistribution: Object.entries(companyStats.companyStateStats)
        .map(([state, count]) => ({
          state,
          companies: count,
          percentage: Math.round((count / companyStats.totalCompanies) * 100)
        }))
        .sort((a, b) => b.companies - a.companies)
        .slice(0, 10),
      technologyDistribution: technologyStats.slice(0, 10),
      materialDistribution: materialStats.slice(0, 10),
      topCities: topCitiesArray,
      machineDistribution: stateStats
        .sort((a, b) => b.total_machines - a.total_machines)
        .slice(0, 10)
        .map(state => ({
          state: state.state,
          totalMachines: state.total_machines,
          companies: state.company_count,
          avgMachinesPerCompany: Math.round(state.total_machines / state.company_count)
        })),
      sizeDistribution,
      timeSeries: series,
      competitiveSegments,
      marketConcentration,
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    throw error
  }
}

// Get equipment breakdown for a specific company
export async function getCompanyEquipmentBreakdown(companyId: string) {
  const supabase = createClient()
  
  try {
    // Get equipment using the updated schema (process/material as text fields)
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select('id, count, manufacturer, model, process, material')
      .eq('company_id', companyId)

    if (error) {
      throw new Error(`Failed to get company equipment breakdown: ${error.message}`)
    }

    // Process technology breakdown
    const technologyBreakdown: Record<string, { name: string; count: number; category: string }> = {}
    const materialBreakdown: Record<string, { name: string; count: number; category: string }> = {}

    equipment.forEach(item => {
      const count = item.count || 1

      const proc = (item as any).process || 'Unknown'
      if (!technologyBreakdown[proc]) {
        technologyBreakdown[proc] = { name: proc, count: 0, category: 'Process' }
      }
      technologyBreakdown[proc].count += count

      const mat = (item as any).material || 'Unknown'
      if (!materialBreakdown[mat]) {
        materialBreakdown[mat] = { name: mat, count: 0, category: 'Material' }
      }
      materialBreakdown[mat].count += count
    })

    // Convert to arrays and sort
    const technologyArray = Object.values(technologyBreakdown)
      .sort((a, b) => b.count - a.count)

    const materialArray = Object.values(materialBreakdown)
      .sort((a, b) => b.count - a.count)

    return {
      technologies: technologyArray,
      materials: materialArray,
      totalEquipment: equipment.length,
      totalMachines: equipment.reduce((sum, item) => sum + (item.count || 1), 0)
    }
  } catch (error) {
    console.error('Error fetching company equipment breakdown:', error)
    throw error
  }
}
