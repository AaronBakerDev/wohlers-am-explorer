import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCsvMode } from "@/lib/datasource/config";
import { getDirectoryCompaniesCsv } from "@/lib/datasource/csv";

// very small, in-memory cache (per process) — TTL based
type CacheEntry = { ts: number; payload: unknown };
const SEARCH_CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60_000; // 60 seconds

function cacheKeyFromRequest(req: NextRequest) {
  const u = new URL(req.url);
  // include all supported query params that affect the result
  const q = u.searchParams.get("q") ?? "";
  const type = u.searchParams.get("type") ?? "";
  const country = u.searchParams.get("country") ?? "";
  const hasFunding = u.searchParams.get("hasFunding") ?? "";
  const minFunding =
    u.searchParams.get("minFunding") ?? u.searchParams.get("minRevenue") ?? "";
  const page = u.searchParams.get("page") ?? "1";
  const perPage = u.searchParams.get("perPage") ?? "20";
  return JSON.stringify({
    q,
    type,
    country,
    hasFunding,
    minFunding,
    page,
    perPage,
  });
}

/**
 * Companies search endpoint
 *
 * Query parameters:
 * - q: string (case-insensitive search on name/city/state/description)
 * - type: string (company_type: equipment | service | software | material | other)
 * - country: string (exact match)
 * - hasFunding: "true" | "false" (filter companies with any investments)
 * - minFunding: number (minimum total funding in millions USD)
 *   - if "minRevenue" is provided instead (from older UI), it is treated as minFunding for compatibility
 * - page: number (1-based, default 1)
 * - perPage: number (default 20, max 100)
 *
 * Response:
 * {
 *   data: {
 *     items: Array<{
 *       id: string
 *       name: string
 *       website: string | null
 *       city: string | null
 *       state: string | null
 *       country: string | null
 *       company_type: string | null
 *       description: string | null
 *       created_at: string | null
 *       funding: {
 *         rounds: number
 *         totalMillions: number
 *         lastYear: number | null
 *       }
 *       categories: string[]
 *     }>
 *     page: number
 *     perPage: number
 *     total: number
 *   }
 * }
 */

const MAX_SCAN = 5000; // cap to avoid scanning too many rows server-side
const MAX_PER_PAGE = 100;

function parseBool(v: string | null): boolean | null {
  if (v == null) return null;
  const s = v.trim().toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return null;
}

export async function GET(req: NextRequest) {
  // CSV mode: serve from normalized CSV adapter
  if (isCsvMode()) {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const type = (url.searchParams.get("type") || "").trim().toLowerCase();
    const country = (url.searchParams.get("country") || "").trim();
    const hasFundingParam = url.searchParams.get("hasFunding");
    const minFundingRaw = url.searchParams.get("minFunding") ?? url.searchParams.get("minRevenue");
    const hasFunding = hasFundingParam != null ? hasFundingParam.trim().toLowerCase() === 'true' : null;
    const minFunding = minFundingRaw != null && minFundingRaw.trim() !== '' ? Number(minFundingRaw) : null;

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("perPage") || 20)));

    const all = getDirectoryCompaniesCsv();

    let filtered = all;
    if (q) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q) ||
        (c.country || '').toLowerCase().includes(q) ||
        (c.company_type || '').toLowerCase().includes(q)
      );
    }
    if (type) {
      filtered = filtered.filter((c) => (c.company_type || '').toLowerCase() === type);
    }
    if (country) {
      filtered = filtered.filter((c) => (c.country || '') === country);
    }
    if (hasFunding != null) {
      filtered = filtered.filter((c) => {
        const has = (c.funding?.rounds || 0) > 0;
        return hasFunding ? has : !has;
      });
    }
    if (minFunding != null && !Number.isNaN(minFunding)) {
      filtered = filtered.filter((c) => (c.funding?.totalMillions || 0) >= (minFunding as number));
    }

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return NextResponse.json({
      data: {
        items,
        page,
        perPage,
        total,
      },
    });
  }

  // serve from cache if fresh
  const key = cacheKeyFromRequest(req);
  const hit = SEARCH_CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return NextResponse.json(hit.payload);
  }

  const supabase = await createClient();
  const url = new URL(req.url);

  const q = url.searchParams.get("q");
  const type = url.searchParams.get("type");
  const country = url.searchParams.get("country");
  const hasFundingParam = url.searchParams.get("hasFunding");
  // Back-compat: accept minRevenue as alias for minFunding
  const minFundingRaw =
    url.searchParams.get("minFunding") ?? url.searchParams.get("minRevenue");

  const hasFunding = parseBool(hasFundingParam);
  const minFunding =
    minFundingRaw != null && minFundingRaw.trim() !== ""
      ? Number(minFundingRaw)
      : null;

  // Pagination
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(url.searchParams.get("perPage") || 20)),
  );

  try {
    // Step 1: Fetch base candidate companies (IDs + core fields), applying cheap DB-side filters
    // We fetch up to MAX_SCAN to keep the server-side aggregation bounded.
    let baseQuery = supabase
      .from("companies")
      .select(
        "id,name,website,city,state,country,company_type,description,created_at",
        { count: "exact" },
      );

    if (q && q.trim()) {
      const term = q.trim();
      baseQuery = baseQuery.or(
        `name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,description.ilike.%${term}%`,
      );
    }

    if (type && type.trim()) {
      baseQuery = baseQuery.eq("company_type", type.trim());
    }

    if (country && country.trim()) {
      baseQuery = baseQuery.eq("country", country.trim());
    }

    // We intentionally do not paginate here yet because funding filters must be applied first.
    // Cap the scan size to avoid large responses.
    baseQuery = baseQuery.limit(MAX_SCAN);

    const { data: baseCompanies, error: baseErr } = await baseQuery;

    if (baseErr) {
      return NextResponse.json(
        { error: `Failed to fetch companies: ${baseErr.message}` },
        { status: 500 },
      );
    }

    const baseIds = (baseCompanies || []).map((c) => c.id) as string[];

    // Early exit if no candidates
    if (baseIds.length === 0) {
      return NextResponse.json({
        data: { items: [], page, perPage, total: 0 },
      });
    }

    // Step 2: Funding aggregation (client-side), only if funding filters or aggregates needed.
    // We always compute aggregates because the UI expects them in the response.
    // Fetch investments for candidate IDs and aggregate rounds, total, lastYear.
    const fundingAgg = new Map<
      string,
      { rounds: number; totalMillions: number; lastYear: number | null }
    >();

    // Fetch in chunks to avoid URL length/response size issues
    // Reduced chunk size to avoid 414 Request-URI Too Large errors
    const CHUNK = 100;
    for (let i = 0; i < baseIds.length; i += CHUNK) {
      const chunkIds = baseIds.slice(i, i + CHUNK);

      const { data: invRows, error: invErr } = await supabase
        .from("investments")
        .select("company_id, amount_millions, investment_year")
        .in("company_id", chunkIds);

      if (invErr) {
        return NextResponse.json(
          { error: `Failed to fetch investments: ${invErr.message}` },
          { status: 500 },
        );
      }

      for (const row of invRows || []) {
        const cid = row.company_id as string | null;
        if (!cid) continue;
        const amount = Number(row.amount_millions ?? 0);
        const year =
          row.investment_year != null ? Number(row.investment_year) : null;

        const agg = fundingAgg.get(cid) || {
          rounds: 0,
          totalMillions: 0,
          lastYear: null as number | null,
        };
        agg.rounds += 1;
        if (!Number.isNaN(amount)) {
          agg.totalMillions += amount;
        }
        if (year != null && (agg.lastYear == null || year > agg.lastYear)) {
          agg.lastYear = year;
        }
        fundingAgg.set(cid, agg);
      }
    }

    // Step 3: Apply funding-based filters in-memory
    let filtered = baseCompanies || [];

    if (hasFunding != null) {
      filtered = filtered.filter((c) => {
        const agg = fundingAgg.get(c.id);
        const has = agg && agg.rounds > 0;
        return hasFunding ? !!has : !has;
      });
    }

    if (minFunding != null && !Number.isNaN(minFunding)) {
      filtered = filtered.filter((c) => {
        const agg = fundingAgg.get(c.id);
        const total = agg ? agg.totalMillions : 0;
        return total >= minFunding;
      });
    }

    const total = filtered.length;

    // Step 4: Pagination (after all filters)
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, total);
    const pageItems = filtered.slice(start, end);

    const pageIds = pageItems.map((c) => c.id);

    // Step 5: Attach categories (primary categories) for the paginated set
    const categoriesByCompany = new Map<string, string[]>();
    if (pageIds.length > 0) {
      const { data: catsRows, error: catsErr } = await supabase
        .from("company_categories")
        .select("company_id, category")
        .in("company_id", pageIds);

      if (!catsErr) {
        for (const row of catsRows || []) {
          const cid = row.company_id as string;
          const arr = categoriesByCompany.get(cid) || [];
          if (row.category) arr.push(row.category);
          categoriesByCompany.set(cid, arr);
        }
      }
    }

    // Step 6: Build response items
    const items = pageItems.map((c) => {
      const f = fundingAgg.get(c.id) || {
        rounds: 0,
        totalMillions: 0,
        lastYear: null as number | null,
      };
      return {
        id: c.id,
        name: c.name,
        website: c.website,
        city: c.city,
        state: c.state,
        country: c.country,
        company_type: c.company_type,
        description: c.description,
        created_at: c.created_at,
        funding: {
          rounds: f.rounds,
          totalMillions: Number(f.totalMillions.toFixed(2)),
          lastYear: f.lastYear,
        },
        categories: categoriesByCompany.get(c.id) || [],
      };
    });

    const payload = {
      data: {
        items,
        page,
        perPage,
        total,
      },
    };
    // cache the response
    SEARCH_CACHE.set(key, { ts: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
