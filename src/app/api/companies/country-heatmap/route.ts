import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyType = searchParams.get('type') // 'equipment' or 'service'
    
    const supabase = await createClient()
    
    if (companyType === 'equipment') {
      // Use merged view for equipment manufacturers
      const { data: rows, error } = await supabase
        .from('vendor_companies_merged')
        .select('country')
        .eq('segment', 'System manufacturer')
      
      if (error) throw error
      
      // Aggregate by country
      const countryMap = new Map<string, { country: string; company_count: number; total_machines: number }>()
      
      for (const row of rows || []) {
        const country = row.country
        if (!country) continue
        
        const existing = countryMap.get(country) || { 
          country, 
          company_count: 0, 
          total_machines: 0 
        }
        existing.company_count += 1
        // For equipment manufacturers, we'll use company count as the intensity value
        existing.total_machines = existing.company_count
        countryMap.set(country, existing)
      }
      
      const data = Array.from(countryMap.values())
      return NextResponse.json({ data })
      
    } else if (companyType === 'service') {
      // Use merged view for service providers
      const { data: rows, error } = await supabase
        .from('vendor_companies_merged')
        .select('country')
        .eq('segment', 'Printing services')
      
      if (error) throw error
      
      // Aggregate by country
      const countryMap = new Map<string, { country: string; company_count: number; total_machines: number }>()
      
      for (const row of rows || []) {
        const country = row.country
        if (!country) continue
        
        const existing = countryMap.get(country) || { 
          country, 
          company_count: 0, 
          total_machines: 0 
        }
        existing.company_count += 1
        // For service providers, we'll use company count as the intensity value
        existing.total_machines = existing.company_count
        countryMap.set(country, existing)
      }
      
      const data = Array.from(countryMap.values())
      return NextResponse.json({ data })
      
    } else {
      // Default behavior: use regular companies data aggregated by country
      const { data: rows, error } = await supabase
        .from('company_summaries')
        .select('country, id')
        .not('country', 'is', null)
      
      if (error) throw error
      
      const countryMap = new Map<string, { country: string; company_count: number; total_machines: number }>()
      
      for (const row of rows || []) {
        const country = row.country
        if (!country) continue
        
        const existing = countryMap.get(country) || { 
          country, 
          company_count: 0, 
          total_machines: 0 
        }
        existing.company_count += 1
        countryMap.set(country, existing)
      }
      
      const data = Array.from(countryMap.values())
      return NextResponse.json({ data })
    }
    
  } catch (e: unknown) {
    console.error('Country heatmap API error:', e)
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Unexpected error' 
    }, { status: 500 })
  }
}