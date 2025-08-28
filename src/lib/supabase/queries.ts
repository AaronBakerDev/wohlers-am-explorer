import { createClient } from "./client";
import { createClient as createServerClient } from "./server";
import {
  Company,
  Technology,
  Material,
  CompanyInsert,
  TechnologyInsert,
  MaterialInsert,
  CompanyWithDetails,
} from "./types";
import {
  CompanyFilters,
  CompanyFilterRequest,
  CompanyFilterResult,
  CompanyFilterResponse,
  GeographicBounds
} from "@/lib/filters/company-filters";

// ========================================
// AM COMPANIES QUERIES (Updated for Equipment-based Schema)
// ========================================

// Company queries
export async function getCompanies(): Promise<Company[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return data;
}

export async function getCompaniesWithDetails(): Promise<CompanyWithDetails[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      equipment (
        id,
        manufacturer,
        model,
        count,
        count_type,
        process,
        material
      )
    `,
    )
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch companies with details: ${error.message}`);
  }

  return data as CompanyWithDetails[];
}

// New query using the company_summaries view for optimized performance
export async function getCompanySummaries() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("company_summaries")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch company summaries: ${error.message}`);
  }

  return data;
}

export async function getCompany(
  id: string,
): Promise<CompanyWithDetails | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      equipment (
        id,
        manufacturer,
        model,
        count,
        count_type,
        process,
        material
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch company: ${error.message}`);
  }

  return data as CompanyWithDetails;
}

// New filtering queries for map functionality
export async function getCompaniesWithFilters(options: {
  technologyIds?: string[];
  materialIds?: string[];
}) {
  const supabase = await createServerClient();

  // Base query - get company summaries with filtering
  let query = supabase.from("company_summaries").select("*");

  // If filters are provided, we need to join with equipment table for filtering
  if (options.technologyIds?.length || options.materialIds?.length) {
    // Get filtered company IDs first
    let equipmentQuery = supabase.from("equipment").select("company_id");

    if (options.technologyIds?.length) {
      equipmentQuery = equipmentQuery.in(
        "technology_id",
        options.technologyIds,
      );
    }

    if (options.materialIds?.length) {
      equipmentQuery = equipmentQuery.in("material_id", options.materialIds);
    }

    const { data: filteredCompanyIds, error: filterError } =
      await equipmentQuery;

    if (filterError) {
      throw new Error(`Failed to filter companies: ${filterError.message}`);
    }

    const uniqueCompanyIds = [
      ...new Set(
        filteredCompanyIds.map((item) => item.company_id).filter(Boolean),
      ),
    ];

    if (uniqueCompanyIds.length === 0) {
      return [];
    }

    query = query.in("id", uniqueCompanyIds);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch filtered companies: ${error.message}`);
  }

  return data;
}

// State-level aggregations for heatmap
export async function getStateStatistics(options: {
  technologyIds?: string[];
  materialIds?: string[];
}) {
  const supabase = await createServerClient();

  // Fallback to simpler query without RPC
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("company_summaries")
    .select("state, country, total_machines")
    .not("state", "is", null);

  if (fallbackError) {
    throw new Error(
      `Failed to fetch state statistics: ${fallbackError.message}`,
    );
  }

  // Aggregate manually
  const stateStats = fallbackData.reduce(
    (acc, company) => {
      const key = `${company.state}-${company.country}`;
      if (!acc[key]) {
        acc[key] = {
          state: company.state || "",
          country: company.country || "",
          company_count: 0,
          total_machines: 0,
        };
      }
      acc[key].company_count += 1;
      acc[key].total_machines += company.total_machines || 0;
      return acc;
    },
    {} as Record<
      string,
      {
        state: string;
        country: string;
        company_count: number;
        total_machines: number;
      }
    >,
  );

  return Object.values(stateStats);
}

export async function getCompaniesByState(state: string): Promise<Company[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("state", state)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch companies by state: ${error.message}`);
  }

  return data;
}

export async function getCompaniesByType(
  companyType: string,
): Promise<Company[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("company_type", companyType)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch companies by type: ${error.message}`);
  }

  return data;
}

export async function searchCompanies(searchTerm: string): Promise<Company[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .or(
      `name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
    )
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to search companies: ${error.message}`);
  }

  return data;
}

export async function createCompany(company: CompanyInsert): Promise<Company> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("companies")
    .insert([company])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return data;
}

export async function updateCompany(
  id: string,
  updates: Partial<CompanyInsert>,
): Promise<Company> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update company: ${error.message}`);
  }

  return data;
}

export async function deleteCompany(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete company: ${error.message}`);
  }
}

// Technology queries
export async function getTechnologies(): Promise<Technology[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("technologies")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch technologies: ${error.message}`);
  }

  return data;
}

export async function getTechnologyCategories(): Promise<string[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("technologies")
    .select("category")
    .not("category", "is", null);

  if (error) {
    throw new Error(`Failed to fetch technology categories: ${error.message}`);
  }

  // Get unique categories
  const uniqueCategories = [
    ...new Set(data.map((item) => item.category).filter(Boolean)),
  ] as string[];
  return uniqueCategories.sort();
}

export async function createTechnology(
  technology: TechnologyInsert,
): Promise<Technology> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("technologies")
    .insert([technology])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create technology: ${error.message}`);
  }

  return data;
}

// Material queries
export async function getMaterials(): Promise<Material[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`);
  }

  return data;
}

export async function getMaterialCategories(): Promise<string[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("materials")
    .select("category")
    .not("category", "is", null);

  if (error) {
    throw new Error(`Failed to fetch material categories: ${error.message}`);
  }

  // Get unique categories
  const uniqueCategories = [
    ...new Set(data.map((item) => item.category).filter(Boolean)),
  ] as string[];
  return uniqueCategories.sort();
}

export async function createMaterial(
  material: MaterialInsert,
): Promise<Material> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("materials")
    .insert([material])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create material: ${error.message}`);
  }

  return data;
}

// Analytics queries for dashboard insights
export async function getCompanyStatistics() {
  const supabase = await createServerClient();

  // Get total companies
  const { count: totalCompanies, error: countError } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to get company count: ${countError.message}`);
  }

  // Get companies by type
  const { data: companyTypes, error: typesError } = await supabase
    .from("companies")
    .select("company_type")
    .not("company_type", "is", null);

  if (typesError) {
    throw new Error(`Failed to get company types: ${typesError.message}`);
  }

  // Get companies by state
  const { data: companyStates, error: statesError } = await supabase
    .from("companies")
    .select("state")
    .not("state", "is", null);

  if (statesError) {
    throw new Error(`Failed to get company states: ${statesError.message}`);
  }

  // Count by type
  const typeStats = companyTypes.reduce(
    (acc, company) => {
      const type = company.company_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Count by state
  const stateStats = companyStates.reduce(
    (acc, company) => {
      const state = company.state || "Unknown";
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalCompanies: totalCompanies || 0,
    companyTypeStats: typeStats,
    companyStateStats: stateStats,
  };
}

export async function getInvestmentsByCompany(companyId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("investments")
    .select(
      "id, company_id, investment_year, investment_month, amount_millions, funding_round, lead_investor, country, notes, created_at, updated_at",
    )
    .eq("company_id", companyId)
    .order("investment_year", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch investments: ${error.message}`);
  }

  return data || [];
}

export async function getMergersAcquisitionsByCompany(companyId: string) {
  const supabase = await createServerClient();

  // Fetch deals where this company is either the acquirer or the acquired
  const { data, error } = await supabase
    .from("mergers_acquisitions")
    .select(
      "id, acquired_company_name, acquiring_company_name, acquired_company_id, acquiring_company_id, announcement_date, deal_size_millions, deal_status, notes, created_at, updated_at",
    )
    .or(
      `acquired_company_id.eq.${companyId},acquiring_company_id.eq.${companyId}`,
    )
    .order("announcement_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch M&A records: ${error.message}`);
  }

  return data || [];
}

export async function getServicePricingByCompany(companyId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("service_pricing")
    .select(
      "id, company_id, material_category, specific_material, process, quantity, price_usd, lead_time_days, notes, data_source, created_at, updated_at",
    )
    .eq("company_id", companyId)
    .order("price_usd", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch service pricing: ${error.message}`);
  }

  return data || [];
}

// ========================================
// UNIFIED COMPANIES QUERIES (New Architecture)
// ========================================

/**
 * Main query function for the unified company filtering system
 * Supports all CompanyFilters options and returns paginated results
 * 
 * @param filters - CompanyFilterRequest with all filter criteria
 * @returns Promise<CompanyFilterResponse> - Filtered companies with pagination
 */
export async function getCompaniesWithFilters(filters: CompanyFilterRequest): Promise<CompanyFilterResponse> {
  const startTime = Date.now()
  const supabase = await createServerClient()
  
  // Set defaults
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(1000, Math.max(1, filters.limit || 100))
  
  try {
    // Build base query from the unified summary view
    let query = supabase
      .from('company_summaries_unified')
      .select(`
        id,
        name,
        country,
        state,
        city,  
        lat,
        lng,
        company_type,
        company_role,
        segment,
        primary_market,
        website,
        is_active,
        technology_count,
        material_count,
        equipment_count,
        service_count,
        technologies,
        materials,
        service_types
      `, { count: 'exact' })
    
    // Apply all filters
    query = applyUnifiedFilters(query, filters)
    
    // Apply sorting
    if (filters.sortBy && filters.sortOrder) {
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })
    } else {
      // Default sort by name
      query = query.order('name', { ascending: true })
    }
    
    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Execute query
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`)
    }
    
    // Transform data to expected format
    const transformedData: CompanyFilterResult[] = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      country: row.country,
      state: row.state,
      city: row.city,
      lat: row.lat,
      lng: row.lng,
      companyType: row.company_type as any,
      companyRole: row.company_role as any,
      segment: row.segment,
      website: row.website,
      description: null, // Not available in summary view
      employeeCountRange: null,
      annualRevenueRange: null,
      foundedYear: null,
      primaryMarket: row.primary_market,
      secondaryMarkets: null,
      technologyCount: row.technology_count || 0,
      materialCount: row.material_count || 0,
      equipmentCount: row.equipment_count || 0,
      serviceCount: row.service_count || 0,
      technologies: row.technologies,
      materials: row.materials,
      serviceTypes: row.service_types,
      isActive: row.is_active,
      dataSource: null,
      lastVerified: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    // Get additional data if requested
    if (filters.includeEquipment || filters.includeServices) {
      await enrichWithCapabilityData(supabase, transformedData, filters)
    }
    
    // Calculate pagination
    const total = count || 0
    const pages = Math.ceil(total / limit)
    
    // Get filter options for UI
    const filterOptions = await getFilterOptions(supabase)
    
    const response: CompanyFilterResponse = {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      },
      filters: {
        applied: filters,
        available: filterOptions
      },
      metadata: {
        query: 'company_summaries_unified',
        executionTime: Date.now() - startTime,
        dataSource: 'supabase',
        timestamp: new Date().toISOString()
      }
    }
    
    return response
    
  } catch (error) {
    console.error('getCompaniesWithFilters error:', error)
    throw error
  }
}

/**
 * Applies all CompanyFilters to a Supabase query
 */
function applyUnifiedFilters(query: any, filters: CompanyFilters) {
  // Company classification filters
  if (filters.companyType?.length) {
    query = query.in('company_type', filters.companyType)
  }
  
  if (filters.companyRole?.length) {
    query = query.in('company_role', filters.companyRole)  
  }
  
  if (filters.segment?.length) {
    query = query.in('segment', filters.segment)
  }
  
  // Geographic filters
  if (filters.country?.length) {
    query = query.in('country', filters.country)
  }
  
  if (filters.state?.length) {
    query = query.in('state', filters.state)
  }
  
  if (filters.city?.length) {
    query = query.in('city', filters.city)
  }
  
  // Geographic bounds (for map filtering)
  if (filters.bounds) {
    const { north, south, east, west } = filters.bounds
    query = query
      .gte('lat', south)
      .lte('lat', north)
      .gte('lng', west)
      .lte('lng', east)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
  }
  
  // Market filters
  if (filters.primaryMarket?.length) {
    query = query.in('primary_market', filters.primaryMarket)
  }
  
  // Technology/capability filters (using array overlap)
  if (filters.technologies?.length) {
    query = query.overlaps('technologies', filters.technologies)
  }
  
  if (filters.materials?.length) {
    query = query.overlaps('materials', filters.materials)
  }
  
  if (filters.serviceTypes?.length) {
    query = query.overlaps('service_types', filters.serviceTypes)
  }
  
  // Text search
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  
  // Status filters  
  if (typeof filters.isActive === 'boolean') {
    query = query.eq('is_active', filters.isActive)
  }
  
  // Existence filters
  if (filters.hasWebsite) {
    query = query.not('website', 'is', null)
  }
  
  if (filters.hasCoordinates) {
    query = query.not('lat', 'is', null).not('lng', 'is', null)
  }
  
  if (filters.hasEquipment) {
    query = query.gt('equipment_count', 0)
  }
  
  if (filters.hasServices) {
    query = query.gt('service_count', 0)
  }
  
  return query
}

/**
 * Enriches company data with detailed equipment/service information
 */
async function enrichWithCapabilityData(
  supabase: any, 
  companies: CompanyFilterResult[], 
  filters: CompanyFilterRequest
) {
  const companyIds = companies.map(c => c.id)
  
  if (filters.includeEquipment) {
    // Fetch equipment data
    const { data: equipment } = await supabase
      .from('equipment_systems')
      .select(`
        id,
        company_id,
        system_name,
        model_number,
        system_type,
        build_volume,
        resolution,
        materials_supported,
        processes_supported,
        price_range,
        target_market,
        availability_status
      `)
      .in('company_id', companyIds)
    
    // Group by company
    const equipmentByCompany = new Map()
    equipment?.forEach(eq => {
      if (!equipmentByCompany.has(eq.company_id)) {
        equipmentByCompany.set(eq.company_id, [])
      }
      equipmentByCompany.get(eq.company_id).push({
        id: eq.id,
        systemName: eq.system_name,
        modelNumber: eq.model_number,
        systemType: eq.system_type,
        buildVolume: eq.build_volume,
        resolution: eq.resolution,
        materialsSupported: eq.materials_supported,
        processesSupported: eq.processes_supported,
        priceRange: eq.price_range,
        targetMarket: eq.target_market,
        availabilityStatus: eq.availability_status
      })
    })
    
    // Add to companies
    companies.forEach(company => {
      company.equipment = equipmentByCompany.get(company.id) || []
    })
  }
  
  if (filters.includeServices) {
    // Fetch service data
    const { data: services } = await supabase
      .from('company_services')
      .select(`
        id,
        company_id,
        service_type,
        service_name,
        description,
        processes_offered,
        materials_offered,
        industries_served,
        lead_time_days_min,
        lead_time_days_max,
        quality_certifications,
        pricing_model,
        price_range,
        is_active
      `)
      .in('company_id', companyIds)
      .eq('is_active', true)
    
    // Group by company
    const servicesByCompany = new Map()
    services?.forEach(svc => {
      if (!servicesByCompany.has(svc.company_id)) {
        servicesByCompany.set(svc.company_id, [])
      }
      servicesByCompany.get(svc.company_id).push({
        id: svc.id,
        serviceType: svc.service_type,
        serviceName: svc.service_name,
        description: svc.description,
        processesOffered: svc.processes_offered,
        materialsOffered: svc.materials_offered,
        industriesServed: svc.industries_served,
        leadTimeDaysMin: svc.lead_time_days_min,
        leadTimeDaysMax: svc.lead_time_days_max,
        qualityCertifications: svc.quality_certifications,
        pricingModel: svc.pricing_model,
        priceRange: svc.price_range,
        isActive: svc.is_active
      })
    })
    
    // Add to companies
    companies.forEach(company => {
      company.services = servicesByCompany.get(company.id) || []
    })
  }
}

/**
 * Gets available filter options for building dynamic UIs
 */
async function getFilterOptions(supabase: any) {
  try {
    // Get unique values from the database
    const [
      countriesResult,
      statesResult, 
      typesResult,
      segmentsResult,
      marketsResult,
      technologiesResult,
      materialsResult
    ] = await Promise.all([
      supabase.from('company_summaries_unified').select('country').not('country', 'is', null),
      supabase.from('company_summaries_unified').select('state').not('state', 'is', null),
      supabase.from('company_summaries_unified').select('company_type').not('company_type', 'is', null),
      supabase.from('company_summaries_unified').select('segment').not('segment', 'is', null),
      supabase.from('company_summaries_unified').select('primary_market').not('primary_market', 'is', null),
      supabase.from('technologies_unified').select('id, name, category'),
      supabase.from('materials_unified').select('id, name, material_type, material_format')
    ])
    
    return {
      countries: [...new Set((countriesResult.data || []).map((r: any) => r.country))].sort(),
      states: [...new Set((statesResult.data || []).map((r: any) => r.state).filter(Boolean))].sort(),
      companyTypes: [...new Set((typesResult.data || []).map((r: any) => r.company_type))].sort(),
      companyRoles: ['manufacturer', 'provider', 'supplier', 'developer', 'researcher'],
      segments: [...new Set((segmentsResult.data || []).map((r: any) => r.segment).filter(Boolean))].sort(),
      technologies: technologiesResult.data || [],
      materials: materialsResult.data || [],
      primaryMarkets: [...new Set((marketsResult.data || []).map((r: any) => r.primary_market).filter(Boolean))].sort(),
      employeeCountRanges: ['1-10', '11-50', '51-200', '201-500', '500+'],
      revenueRanges: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+'],
      serviceTypes: [], // Would need additional query
      systemTypes: []   // Would need additional query
    }
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return {
      countries: [],
      states: [],
      companyTypes: [],
      companyRoles: [],
      segments: [],
      technologies: [],
      materials: [],
      primaryMarkets: [],
      employeeCountRanges: [],
      revenueRanges: [],
      serviceTypes: [],
      systemTypes: []
    }
  }
}

/**
 * Gets companies for a specific dataset (backward compatibility)
 */
export async function getCompaniesByDataset(
  datasetId: string, 
  additionalFilters: Partial<CompanyFilters> = {}
): Promise<CompanyFilterResult[]> {
  // Import dataset filters
  const { DATASET_FILTERS } = await import('@/lib/filters/company-filters')
  
  const datasetFilters = DATASET_FILTERS[datasetId]
  if (!datasetFilters) {
    throw new Error(`Unknown dataset: ${datasetId}`)
  }
  
  // Merge dataset filters with additional filters
  const combinedFilters: CompanyFilterRequest = {
    ...datasetFilters,
    ...additionalFilters,
    limit: additionalFilters.limit || 1000 // Default high limit for dataset queries
  }
  
  const result = await getCompaniesWithFilters(combinedFilters)
  return result.data
}

/**
 * Gets companies for map display with geographic optimization
 */
export async function getCompaniesForMap(
  filters: CompanyFilters & { bounds?: GeographicBounds } = {}
): Promise<CompanyFilterResult[]> {
  const mapFilters: CompanyFilterRequest = {
    ...filters,
    hasCoordinates: true, // Only companies with valid coordinates
    limit: 2000, // Higher limit for map markers
    sortBy: 'name',
    sortOrder: 'asc'
  }
  
  const result = await getCompaniesWithFilters(mapFilters)
  return result.data
}
