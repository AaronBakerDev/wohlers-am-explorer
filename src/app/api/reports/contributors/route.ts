import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const expertiseArea = searchParams.get('expertise_area');
    
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    let query = supabase
      .from('contributors')
      .select(`
        *,
        companies:company_id (
          name,
          country,
          website
        )
      `)
      .order('name');

    // Apply filters
    if (country) {
      query = query.eq('country', country);
    }
    
    if (expertiseArea) {
      query = query.ilike('expertise_area', `%${expertiseArea}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching Contributors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Contributors data' },
        { status: 500 }
      );
    }

    // Country-wise distribution for map visualization
    const countryDistribution = data.reduce((acc: any, contributor: any) => {
      const country = contributor.country;
      if (!acc[country]) {
        acc[country] = {
          count: 0,
          expertise_areas: new Set(),
          contributors: []
        };
      }
      acc[country].count++;
      acc[country].expertise_areas.add(contributor.expertise_area);
      acc[country].contributors.push({
        name: contributor.name,
        role: contributor.role,
        expertise_area: contributor.expertise_area
      });
      return acc;
    }, {});

    // Convert Sets to arrays
    Object.keys(countryDistribution).forEach(country => {
      countryDistribution[country].expertise_areas = Array.from(countryDistribution[country].expertise_areas);
    });

    // Expertise area distribution
    const expertiseDistribution = data.reduce((acc: any, contributor: any) => {
      const area = contributor.expertise_area || 'Other';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      data,
      country_distribution: countryDistribution,
      expertise_distribution: expertiseDistribution,
      total_count: data.length,
      unique_countries: Object.keys(countryDistribution).length,
      filters: {
        countries: Object.keys(countryDistribution),
        expertise_areas: Object.keys(expertiseDistribution)
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