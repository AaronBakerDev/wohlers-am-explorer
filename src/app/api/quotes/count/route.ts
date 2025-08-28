import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get total count of quotes - use count query instead of fetching all data
    const { count: totalQuotes, error: countError } = await supabase
      .from('service_pricing')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching quotes count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch quotes count' },
        { status: 500 }
      );
    }

    // Get distinct counts for filtering options
    const { data: distinctData, error: distinctError } = await supabase
      .from('service_pricing')
      .select('company_id, process, material_category')
      .not('company_id', 'is', null);

    if (distinctError) {
      console.error('Error fetching distinct values:', distinctError);
    }

    // Calculate unique counts
    const uniqueProviders = new Set(distinctData?.map(item => item.company_id)).size;
    const uniqueProcesses = new Set(distinctData?.map(item => item.process).filter(Boolean)).size;
    const uniqueMaterials = new Set(distinctData?.map(item => item.material_category).filter(Boolean)).size;

    return NextResponse.json({
      totalQuotes: totalQuotes || 0,
      totalProviders: uniqueProviders,
      totalProcesses: uniqueProcesses,
      totalMaterials: uniqueMaterials,
      metadata: {
        dataSource: 'vendor_import_2025',
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