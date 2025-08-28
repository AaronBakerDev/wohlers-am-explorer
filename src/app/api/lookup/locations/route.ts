import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Locations Lookup API
 *
 * GET /api/lookup/locations
 *   - Returns distinct countries and states (optionally filtered by country)
 *
 * Query Parameters:
 *   - country (optional): when provided, states are filtered for this country only
 *
 * Response:
 * {
 *   data: {
 *     countries: string[],
 *     states: string[]
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const countryFilter = url.searchParams.get("country");

    // Fetch all countries (may include duplicates; dedupe client-side)
    const { data: countryRows, error: countryErr } = await supabase
      .from("companies")
      .select("country")
      .not("country", "is", null);

    if (countryErr) {
      return NextResponse.json(
        { error: `Failed to fetch countries: ${countryErr.message}` },
        { status: 500 }
      );
    }

    // Build distinct, non-empty, sorted list of countries
    const countries = Array.from(
      new Set(
        (countryRows || [])
          .map((r: { country: string | null }) => (r.country ?? "").trim())
          .filter((c) => c.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    // Fetch states; optionally filter by country
    let stateQuery = supabase
      .from("companies")
      .select("state")
      .not("state", "is", null);

    if (countryFilter && countryFilter.trim().length > 0) {
      stateQuery = stateQuery.eq("country", countryFilter.trim());
    }

    const { data: stateRows, error: stateErr } = await stateQuery;

    if (stateErr) {
      return NextResponse.json(
        { error: `Failed to fetch states: ${stateErr.message}` },
        { status: 500 }
      );
    }

    const states = Array.from(
      new Set(
        (stateRows || [])
          .map((r: { state: string | null }) => (r.state ?? "").trim())
          .filter((s) => s.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      data: {
        countries,
        states,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error in locations lookup" },
      { status: 500 }
    );
  }
}
