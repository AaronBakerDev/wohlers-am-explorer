import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Lookup Catalog API
 *
 * Returns lightweight lists for filter pickers:
 * - technologies: [{ id, name, category }]
 * - materials: [{ id, name, category }]
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const [{ data: technologies, error: techError }, { data: materials, error: matError }] =
      await Promise.all([
        supabase.from("technologies").select("id, name, category").order("name", { ascending: true }),
        supabase.from("materials").select("id, name, category").order("name", { ascending: true }),
      ]);

    if (techError) {
      return NextResponse.json(
        { error: `Failed to fetch technologies: ${techError.message}` },
        { status: 500 }
      );
    }

    if (matError) {
      return NextResponse.json(
        { error: `Failed to fetch materials: ${matError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        technologies: (technologies ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category ?? null,
        })),
        materials: (materials ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          category: m.category ?? null,
        })),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error in lookup catalog endpoint" },
      { status: 500 }
    );
  }
}
