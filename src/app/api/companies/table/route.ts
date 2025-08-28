import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// In-memory cache for table endpoint (per server process)
type CacheEntry = { ts: number; payload: unknown };
const TABLE_CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60_000;

function cacheKeyFromUrl(url: URL) {
  const q = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const country = url.searchParams.get("country") ?? "";
  const sortBy = (url.searchParams.get("sortBy") ?? "name").toLowerCase();
  const sortDir = (url.searchParams.get("sortDir") ?? "asc").toLowerCase();
  const page = url.searchParams.get("page") ?? "1";
  const perPage = url.searchParams.get("perPage") ?? "20";
  return JSON.stringify({
    q,
    type,
    state,
    country,
    sortBy,
    sortDir,
    page,
    perPage,
  });
}

type SortableField =
  | "name"
  | "city"
  | "state"
  | "country"
  | "company_type"
  | "created_at";

const ALLOWED_SORT_FIELDS: Record<string, SortableField> = {
  name: "name",
  city: "city",
  state: "state",
  country: "country",
  company_type: "company_type",
  created_at: "created_at",
};

const MAX_PER_PAGE = 100;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Cache hit?
    const key = cacheKeyFromUrl(url);
    const hit = TABLE_CACHE.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      return NextResponse.json(hit.payload);
    }

    const supabase = await createClient();

    // Pagination
    const pageParam = url.searchParams.get("page");
    const perPageParam = url.searchParams.get("perPage");

    const page = Math.max(
      1,
      Number.isFinite(Number(pageParam)) ? Number(pageParam) : 1,
    );
    const perPageRaw = Number.isFinite(Number(perPageParam))
      ? Number(perPageParam)
      : 20;
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, perPageRaw));
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Sorting
    const sortByParam = (
      url.searchParams.get("sortBy") || "name"
    ).toLowerCase();
    const sortDirParam = (
      url.searchParams.get("sortDir") || "asc"
    ).toLowerCase();
    const sortBy: SortableField = ALLOWED_SORT_FIELDS[sortByParam] ?? "name";
    const sortAsc = sortDirParam !== "desc";

    // Filters/search
    const q = url.searchParams.get("q");
    const type = url.searchParams.get("type");
    const state = url.searchParams.get("state");
    const country = url.searchParams.get("country");

    let query = supabase
      .from("companies")
      .select("id,name,city,state,country,website,company_type,created_at", {
        count: "exact",
      });

    if (q && q.trim() !== "") {
      const term = q.trim();
      // OR across common text fields
      query = query.or(
        `name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,country.ilike.%${term}%,description.ilike.%${term}%`,
      );
    }

    if (type && type.trim() !== "" && type !== "all") {
      query = query.eq("company_type", type.trim());
    }

    if (state && state.trim() !== "" && state !== "all") {
      query = query.eq("state", state.trim());
    }

    if (country && country.trim() !== "" && country !== "all") {
      query = query.eq("country", country.trim());
    }

    query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch companies: ${error.message}` },
        { status: 500 },
      );
    }

    const payload = {
      data: {
        items: data ?? [],
        page,
        perPage,
        total: count ?? 0,
        sortBy,
        sortDir: sortAsc ? "asc" : "desc",
        q: q ?? null,
        filters: {
          type: type ?? null,
          state: state ?? null,
          country: country ?? null,
        },
      },
    };
    TABLE_CACHE.set(key, { ts: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error in data-table endpoint" },
      { status: 500 },
    );
  }
}
