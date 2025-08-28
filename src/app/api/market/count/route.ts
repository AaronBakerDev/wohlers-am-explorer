import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get total count of market data records (fallback to companies if market_totals doesn't exist)
    const { count: totalRecords, error: countError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching market count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch market count' },
        { status: 500 }
      );
    }

    // Get year range (mock data for preview)
    const yearData = [{ year: 2020 }, { year: 2021 }, { year: 2022 }, { year: 2023 }, { year: 2024 }];
    const yearError = null;

    if (yearError) {
      console.error('Error fetching year range:', yearError);
    }

    const years = yearData?.map(d => d.year) || [];
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Get unique segments (mock data for preview)
    const segmentData = [
      { segment: 'Additive Manufacturing Equipment' },
      { segment: 'Materials' },
      { segment: 'Software' },
      { segment: 'Services' }
    ];
    const segmentError = null;

    if (segmentError) {
      console.error('Error fetching segments:', segmentError);
    }

    const uniqueSegments = [...new Set(segmentData?.map(item => item.segment).filter(Boolean))];

    // Get unique countries count (mock for preview)
    const uniqueCountries = 15;

    return NextResponse.json({
      totalRecords: totalRecords || 0,
      yearRange: {
        min: minYear,
        max: maxYear,
        totalYears: years.length
      },
      totalSegments: uniqueSegments.length,
      segments: uniqueSegments,
      totalCountries: uniqueCountries,
      metadata: {
        lastUpdated: new Date().toISOString()
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