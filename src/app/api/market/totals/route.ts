import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const year = searchParams.get('year');
    const segment = searchParams.get('segment');
    const startYear = searchParams.get('startYear');
    const endYear = searchParams.get('endYear');

    // Supabase mode
    interface MarketDataItem {
      year: number;
      segment: string;
      total_value?: number;
      value?: number;
    }
    let data: MarketDataItem[] = []
    let q = supabase.from('market_totals').select('year, segment, total_value')
    if (year) {
      q = q.eq('year', parseInt(year))
    } else if (startYear && endYear) {
      const s = parseInt(startYear)
      const e = parseInt(endYear)
      if (!Number.isNaN(s)) q = q.gte('year', s)
      if (!Number.isNaN(e)) q = q.lte('year', e)
    }
    if (segment && segment !== 'all') {
      q = q.eq('segment', segment)
    }
    const { data: rows, error } = await q.order('year', { ascending: true })
    if (error) {
      console.error('Error fetching market totals:', error)
      return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
    }
    data = (rows || []) as any

    // Fallback: if no rows in market_totals, try vendor_total_am_market_size
    if (!data || data.length === 0) {
      try {
        let vq = supabase
          .from('vendor_total_am_market_size')
          .select('year, segment, revenue_usd')
        if (year) {
          vq = vq.eq('year', parseInt(year))
        } else if (startYear && endYear) {
          const s = parseInt(startYear)
          const e = parseInt(endYear)
          if (!Number.isNaN(s)) vq = vq.gte('year', s)
          if (!Number.isNaN(e)) vq = vq.lte('year', e)
        }
        if (segment && segment !== 'all') vq = vq.eq('segment', segment)
        const { data: vrows, error: verr } = await vq.order('year', { ascending: true })
        if (!verr && vrows) {
          data = (vrows as any[]).map((r) => ({
            year: r.year,
            segment: r.segment,
            total_value: Number(r.revenue_usd) || 0,
          }))
        }
      } catch (e) {
        // ignore and continue with empty data
      }
    }

    // Group data by year for stacked chart
    // Note: mock data uses `value`; DB view uses `total_value`.
    // Support both, preferring `value` when present.
    const groupedData = data?.reduce((acc: Record<number, Record<string, number>>, item: MarketDataItem) => {
      const yearData = acc[item.year] || { year: item.year };
      const v = typeof item.value === 'number' ? item.value : (item.total_value || 0);
      const seg = item.segment || 'Other';
      yearData[seg] = v;
      yearData.total = (yearData.total || 0) + v;
      acc[item.year] = yearData;
      return acc;
    }, {});

    // Convert to array for chart consumption
    const chartData = Object.values(groupedData || {});

    // Get unique segments for chart legend
    const segments = [...new Set(data?.map(item => item.segment).filter(Boolean))];

    return NextResponse.json({
      data: chartData,
      segments,
      raw: data,
      metadata: {
        totalRecords: data?.length || 0,
        yearRange: {
          min: Math.min(...(data?.map(d => d.year) || [2024])),
          max: Math.max(...(data?.map(d => d.year) || [2024]))
        }
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
