import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns companies categorized as material producers, with flags for metal/non-metal
// and a derived classification of Metal | Non-Metal | Both
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1) Identify material producer companies via company_categories
    const { data: catRows, error: catErr } = await supabase
      .from('company_categories' as any)
      .select('company_id, category, companies(id, name, country)')
      .or('category.ilike.%material%,category.ilike.%producer%')

    if (catErr) {
      console.error('Error fetching company_categories:', catErr)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    const companies = (catRows || [])
      .map((r: any) => r.companies)
      .filter(Boolean)

    const uniqueCompanies = Array.from(
      new Map(companies.map((c: any) => [c.id, c])).values()
    ) as Array<{ id: string; name: string; country: string | null }>

    if (uniqueCompanies.length === 0) {
      return NextResponse.json({ companies: [] })
    }

    const companyIds = uniqueCompanies.map(c => c.id)

    // 2) Fetch equipment→materials for those companies to determine metal/non-metal
    const { data: equipRows, error: equipErr } = await supabase
      .from('equipment' as any)
      .select('company_id, material_id, materials(category)')
      .in('company_id', companyIds)

    if (equipErr) {
      console.error('Error fetching equipment/materials:', equipErr)
      return NextResponse.json({ error: 'Failed to fetch equipment/materials' }, { status: 500 })
    }

    const byCompany: Record<string, { hasMetal: boolean; hasNonMetal: boolean }> = {}
    for (const row of equipRows || []) {
      const cid = row.company_id as string
      const cat = row.materials?.category as string | null
      if (!byCompany[cid]) byCompany[cid] = { hasMetal: false, hasNonMetal: false }
      if (cat?.toLowerCase() === 'metal') byCompany[cid].hasMetal = true
      if (cat && cat.toLowerCase() !== 'metal') byCompany[cid].hasNonMetal = true
    }

    const enriched = uniqueCompanies.map(c => {
      const flags = byCompany[c.id] || { hasMetal: false, hasNonMetal: false }
      let classification: 'Metal' | 'Non-Metal' | 'Both' = 'Non-Metal'
      if (flags.hasMetal && flags.hasNonMetal) classification = 'Both'
      else if (flags.hasMetal) classification = 'Metal'
      else classification = 'Non-Metal'
      return {
        id: c.id,
        name: c.name,
        country: c.country,
        has_metal: flags.hasMetal,
        has_non_metal: flags.hasNonMetal,
        classification,
      }
    })

    return NextResponse.json({ companies: enriched })
  } catch (err) {
    console.error('Unhandled error (companies):', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

