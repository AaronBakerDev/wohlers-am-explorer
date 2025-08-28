import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialType = searchParams.get('material_type');
    const country = searchParams.get('country');
    
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Get material producers from the view and raw data
    const { data: summaryData, error: summaryError } = await supabase
      .from('material_producers_summary')
      .select('*');
    
    if (summaryError) {
      console.error('Error fetching material producers summary:', summaryError);
    }

    // Get detailed company data for material producers
    let query = supabase
      .from('companies')
      .select(`
        *,
        company_categories!inner(
          category
        ),
        equipment(
          id,
          manufacturer,
          model,
          materials(
            name,
            category,
            properties
          ),
          technologies(
            name,
            category,
            description
          )
        )
      `)
      .or('category.ilike.%material%,category.ilike.%producer%', { foreignTable: 'company_categories' });

    if (country) {
      query = query.eq('country', country);
    }

    const { data: companyData, error: companyError } = await query;
    
    if (companyError) {
      console.error('Error fetching company data:', companyError);
      return NextResponse.json(
        { error: 'Failed to fetch material producers data' },
        { status: 500 }
      );
    }

    // Process companies to categorize by material types
    const materialTypeDistribution = companyData.reduce((acc: any, company: any) => {
      // Determine material types from equipment
      const materialTypes = new Set();
      
      company.equipment?.forEach((eq: any) => {
        if (eq.materials) {
          eq.materials.forEach((material: any) => {
            if (material.category === 'Metal' || material.name?.toLowerCase().includes('metal')) {
              materialTypes.add('Metal');
            } else if (material.category && material.category !== 'Metal') {
              materialTypes.add('Non-Metal');
            }
          });
        }
      });

      // If no materials found, categorize as 'Both' or check company categories
      if (materialTypes.size === 0) {
        const categories = company.company_categories?.map((cc: any) => cc.category) || [];
        if (categories.some((cat: string) => cat.toLowerCase().includes('metal'))) {
          materialTypes.add('Metal');
        }
        if (categories.some((cat: string) => cat.toLowerCase().includes('polymer') || cat.toLowerCase().includes('plastic'))) {
          materialTypes.add('Non-Metal');
        }
        if (materialTypes.size === 0) {
          materialTypes.add('Both');
        }
      }

      // Handle companies with both metal and non-metal
      if (materialTypes.size > 1) {
        materialTypes.clear();
        materialTypes.add('Both');
      }

      const primaryType = Array.from(materialTypes)[0] as string;
      
      if (!acc[primaryType]) {
        acc[primaryType] = {
          count: 0,
          companies: [],
          countries: new Set(),
          technologies: new Set()
        };
      }
      
      acc[primaryType].count++;
      acc[primaryType].companies.push({
        id: company.id,
        name: company.name,
        country: company.country,
        website: company.website,
        employee_count: company.employee_count,
        categories: company.company_categories?.map((cc: any) => cc.category) || []
      });
      acc[primaryType].countries.add(company.country);
      
      // Add technologies
      company.equipment?.forEach((eq: any) => {
        if (eq.technologies) {
          eq.technologies.forEach((tech: any) => {
            acc[primaryType].technologies.add(tech.name);
          });
        }
      });
      
      return acc;
    }, {});

    // Convert Sets to arrays and calculate percentages
    const totalCompanies = companyData.length;
    Object.keys(materialTypeDistribution).forEach(type => {
      const data = materialTypeDistribution[type];
      data.countries = Array.from(data.countries);
      data.technologies = Array.from(data.technologies);
      data.percentage = totalCompanies > 0 ? parseFloat(((data.count / totalCompanies) * 100).toFixed(2)) : 0;
      data.country_count = data.countries.length;
      data.technology_count = data.technologies.length;
    });

    // Country distribution
    const countryDistribution = companyData.reduce((acc: any, company: any) => {
      const country = company.country || 'Unknown';
      if (!acc[country]) {
        acc[country] = {
          count: 0,
          companies: [],
          material_types: new Set()
        };
      }
      acc[country].count++;
      acc[country].companies.push(company.name);
      
      // Determine material type for this company
      const hasMetalEquipment = company.equipment?.some((eq: any) => 
        eq.materials?.some((m: any) => m.category === 'Metal')
      );
      const hasNonMetalEquipment = company.equipment?.some((eq: any) => 
        eq.materials?.some((m: any) => m.category && m.category !== 'Metal')
      );
      
      if (hasMetalEquipment && hasNonMetalEquipment) {
        acc[country].material_types.add('Both');
      } else if (hasMetalEquipment) {
        acc[country].material_types.add('Metal');
      } else if (hasNonMetalEquipment) {
        acc[country].material_types.add('Non-Metal');
      } else {
        acc[country].material_types.add('Unknown');
      }
      
      return acc;
    }, {});

    // Convert Sets to arrays
    Object.keys(countryDistribution).forEach(country => {
      countryDistribution[country].material_types = Array.from(countryDistribution[country].material_types);
    });

    return NextResponse.json({
      data: companyData,
      material_type_distribution: materialTypeDistribution,
      country_distribution: countryDistribution,
      summary: summaryData || [],
      total_companies: totalCompanies,
      filters: {
        material_types: Object.keys(materialTypeDistribution),
        countries: Object.keys(countryDistribution).sort(),
        technologies: [...new Set(companyData.flatMap((c: any) => 
          c.equipment?.flatMap((eq: any) => 
            eq.technologies?.map((t: any) => t.name) || []
          ) || []
        ))].sort()
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}