import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCsvMode } from "@/lib/datasource/config";
import { getCatalogCsv } from "@/lib/datasource/csv";

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
    // CSV mode: serve from JSON files
    if (isCsvMode()) {
      const catalog = getCatalogCsv();
      return NextResponse.json({
        data: {
          technologies: catalog.technologies,
          materials: catalog.materials,
        },
      });
    }

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
