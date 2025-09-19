import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AnalyticsData {
  totalCompanies: number;
  totalStates: number;
  totalTechnologies: number;
  stateDistribution: { state: string; count: number }[];
  technologyDistribution: { name: string; count: number }[];
  materialDistribution: { name: string; count: number }[];
  companyTypes: { type: string; count: number }[];
  topCities: { city: string; count: number }[];
}

let cache: { data: AnalyticsData; ts: number } | null = null;
const TTL_MS = 60_000;

/**
 * Analytics Summary API
 *
 * Computes high-level metrics and distributions from Supabase:
 * - totalCompanies
 * - totalStates
 * - totalTechnologies
 * - stateDistribution (Top 10)
 * - technologyDistribution (by companies that have equipment with that technology)
 * - materialDistribution (by companies that have equipment with that material)
 * - companyTypes distribution
 * - topCities (Top 8)
 */
export async function GET() {
  try {
    // Serve cached response if fresh
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data);
    }
    const supabase = await createClient();

    // 1) Load core datasets (minimal columns) - get total count first
    const { count: totalCompaniesCount } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    const [
      { data: companies, error: companiesError },
      { data: technologies, error: techError },
      { data: materials, error: matError },
      { data: equipment, error: equipError },
    ] = await Promise.all([
      supabase
        .from("companies")
        .select("id, city, state, country, company_type")
        .range(0, 9999), // Get up to 10k companies for analytics
      supabase.from("technologies").select("id, name"),
      supabase.from("materials").select("id, name"),
      supabase
        .from("equipment")
        .select("company_id, technology_id, material_id")
        .range(0, 49999), // Get up to 50k equipment records
    ]);

    if (companiesError) {
      return NextResponse.json(
        { error: `Failed to fetch companies: ${companiesError.message}` },
        { status: 500 },
      );
    }
    if (techError) {
      return NextResponse.json(
        { error: `Failed to fetch technologies: ${techError.message}` },
        { status: 500 },
      );
    }
    if (matError) {
      return NextResponse.json(
        { error: `Failed to fetch materials: ${matError.message}` },
        { status: 500 },
      );
    }
    if (equipError) {
      return NextResponse.json(
        { error: `Failed to fetch equipment: ${equipError.message}` },
        { status: 500 },
      );
    }

    const totalCompanies = totalCompaniesCount || 0;
    const totalStates = new Set(
      (companies || [])
        .map((c) => (c.state || "").trim())
        .filter((s) => s.length > 0),
    ).size;
    const totalTechnologies = (technologies || []).length;

    // Maps for lookup
    const techNameById = new Map<string, string>();
    for (const t of technologies || []) {
      if (t?.id && t?.name) techNameById.set(t.id, t.name);
    }
    const matNameById = new Map<string, string>();
    for (const m of materials || []) {
      if (m?.id && m?.name) matNameById.set(m.id, m.name);
    }

    // Helper to compute percentages (guard against divide-by-zero)
    const pct = (num: number, denom: number) =>
      denom > 0 ? Math.round((num / denom) * 100) : 0;

    // 2) State distribution (Top 10)
    type CountMap = Record<string, number>;
    const stateCounts: CountMap = {};
    for (const c of companies || []) {
      const state = (c.state || "").trim();
      if (!state) continue;
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    }
    const stateDistribution = Object.entries(stateCounts)
      .map(([state, count]) => ({
        state,
        companies: count,
        percentage: pct(count, totalCompanies),
      }))
      .sort((a, b) => b.companies - a.companies)
      .slice(0, 10);

    // 3) Technology distribution (count distinct companies per technology)
    const techCompanies = new Map<string, Set<string>>(); // tech_id -> Set(company_id)
    for (const e of equipment || []) {
      const techId = e?.technology_id || undefined;
      const companyId = e?.company_id || undefined;
      if (!techId || !companyId) continue;
      if (!techCompanies.has(techId)) techCompanies.set(techId, new Set());
      techCompanies.get(techId)!.add(companyId);
    }
    const technologyDistribution = Array.from(techCompanies.entries())
      .map(([techId, companySet]) => {
        const name = techNameById.get(techId) || "Other";
        const count = companySet.size;
        return {
          tech: name,
          companies: count,
          percentage: pct(count, totalCompanies),
        };
      })
      .sort((a, b) => b.companies - a.companies);

    // 4) Material distribution (count distinct companies per material)
    const matCompanies = new Map<string, Set<string>>(); // material_id -> Set(company_id)
    for (const e of equipment || []) {
      const matId = e?.material_id || undefined;
      const companyId = e?.company_id || undefined;
      if (!matId || !companyId) continue;
      if (!matCompanies.has(matId)) matCompanies.set(matId, new Set());
      matCompanies.get(matId)!.add(companyId);
    }
    const materialDistribution = Array.from(matCompanies.entries())
      .map(([matId, companySet]) => {
        const name = matNameById.get(matId) || "Other";
        const count = companySet.size;
        return {
          material: name,
          companies: count,
          percentage: pct(count, totalCompanies),
        };
      })
      .sort((a, b) => b.companies - a.companies);

    // 5) Company types distribution
    const typeCounts: CountMap = {};
    for (const c of companies || []) {
      const type = (c.company_type || "other").toLowerCase();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    const companyTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        companies: count,
        percentage: pct(count, totalCompanies),
      }))
      .sort((a, b) => b.companies - a.companies);

    // 6) Top cities by concentration (Top 8)
    const cityCounts: CountMap = {};
    for (const c of companies || []) {
      const city = (c.city || "").trim();
      const state = (c.state || "").trim();
      if (!city) continue;
      const label = state ? `${city}, ${state}` : city;
      cityCounts[label] = (cityCounts[label] || 0) + 1;
    }
    const topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, companies: count }))
      .sort((a, b) => b.companies - a.companies)
      .slice(0, 8);

    const payload = {
      data: {
        totalCompanies,
        totalStates,
        totalTechnologies,
        stateDistribution,
        technologyDistribution,
        materialDistribution,
        companyTypes,
        topCities,
      },
    };

    // assign to cache
    cache = { data: payload.data, ts: Date.now() };

    return NextResponse.json(payload);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected analytics error" },
      { status: 500 },
    );
  }
}
