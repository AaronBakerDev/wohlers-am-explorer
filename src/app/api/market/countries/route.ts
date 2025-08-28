import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCsvMode } from '@/lib/datasource/config'
import { getMarketCountriesCsv } from '@/lib/datasource/csv'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const segment = searchParams.get('segment');
    const country = searchParams.get('country');
    const limit = searchParams.get('limit');

    if (isCsvMode()) {
      const payload = getMarketCountriesCsv({ year: parseInt(year), segment, country, limit: limit ? parseInt(limit) : undefined })
      return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } })
    }

    // Supabase mode
    let data: Array<{ country: string; segment: string; value: number; year: number }> = []
    let q = supabase
      .from('market_by_country_segment')
      .select('year,country,segment,value')
      .eq('year', parseInt(year))

    if (segment && segment !== 'all') q = q.eq('segment', segment)
    if (country && country !== 'all') q = q.eq('country', country)

    const { data: rows, error } = await q
    if (error) {
      console.error('Error fetching country data:', error)
      return NextResponse.json({ error: 'Failed to fetch country data' }, { status: 500 })
    }
    data = rows || []

    // Get summary statistics
    const totalValue = data?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    const countries = [...new Set(data?.map(item => item.country).filter(Boolean))];
    const segments = [...new Set(data?.map(item => item.segment).filter(Boolean))];

    // Top countries by value
    const limitedData = limit ? data.slice(0, parseInt(limit)) : data
    const topCountries = limitedData
      ?.reduce((acc: Array<{country: string; value: number; percentage: number}>, item: {country: string; value: number}) => {
        const existing = acc.find(c => c.country === item.country);
        if (existing) {
          existing.value += item.value || 0;
        } else {
          acc.push({ 
            country: item.country, 
            value: item.value || 0,
            percentage: 0 
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map(item => ({
        ...item,
        percentage: ((item.value / totalValue) * 100).toFixed(2)
      }));

    // Data by segment
    const bySegment = segments.map(seg => ({
      segment: seg,
      value: data
        ?.filter(item => item.segment === seg)
        .reduce((sum, item) => sum + (item.value || 0), 0) || 0,
      countries: data
        ?.filter(item => item.segment === seg)
        .length || 0
    }));

    return NextResponse.json({
      data,
      summary: {
        year: parseInt(year),
        totalValue,
        totalCountries: countries.length,
        totalSegments: segments.length,
        topCountries,
        bySegment
      },
      filters: {
        availableCountries: countries.sort(),
        availableSegments: segments.sort()
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
