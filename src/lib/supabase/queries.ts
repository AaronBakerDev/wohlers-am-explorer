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
