import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCsvMode } from '@/lib/datasource/config'
import { getPricingCsv } from '@/lib/datasource/csv'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const process = searchParams.get('process');
    const material = searchParams.get('material');
    const quantity = searchParams.get('quantity');
    const country = searchParams.get('country');

    if (isCsvMode()) {
      const qty = quantity ? parseInt(quantity) : undefined
      const payload = getPricingCsv({ process, material, quantity: qty, country })
      return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' } })
    }

    // Supabase mode
    let pricingQuery = supabase
      .from('service_pricing')
      .select(`
        *,
        companies!inner(
          id,
          name,
          country,
          city,
          state
        )
      `)
      .order('price_usd', { ascending: true });

    if (process && process !== 'all') pricingQuery = pricingQuery.eq('process', process);
    if (material && material !== 'all') pricingQuery = pricingQuery.eq('material_category', material);
    if (quantity) pricingQuery = pricingQuery.eq('quantity', parseInt(quantity));
    if (country && country !== 'all') pricingQuery = pricingQuery.eq('companies.country', country);

    const { data: pricingData, error: pricingError } = await pricingQuery;
    if (pricingError) {
      console.error('Error fetching pricing data:', pricingError);
      return NextResponse.json({ error: 'Failed to fetch pricing data' }, { status: 500 });
    }

    // Benchmarks not computed in Supabase mode here (handled via stats below)
    const benchmarkData: any[] = []

    // Calculate statistics if we have data
    const prices = pricingData?.map(item => item.price_usd).filter(p => p !== null) || [];
    const leadTimes = pricingData?.map(item => item.lead_time_days).filter(l => l !== null) || [];

    const statistics = {
      price: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        median: prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0,
        count: prices.length
      },
      leadTime: {
        min: Math.min(...leadTimes),
        max: Math.max(...leadTimes),
        avg: leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0,
        median: leadTimes.length > 0 ? leadTimes.sort((a, b) => a - b)[Math.floor(leadTimes.length / 2)] : 0,
        count: leadTimes.length
      }
    };

    // Get available filter options
    const { data: filterOptions } = await supabase
      .from('service_pricing')
      .select('process, material_category, quantity')
      .not('process', 'is', null)
      .not('material_category', 'is', null);

    const uniqueProcesses = [...new Set(filterOptions?.map(item => item.process).filter(Boolean))];
    const uniqueMaterials = [...new Set(filterOptions?.map(item => item.material_category).filter(Boolean))];
    const uniqueQuantities = [...new Set(filterOptions?.map(item => item.quantity).filter(Boolean))].sort((a, b) => {
      const numA = parseInt(String(a), 10);
      const numB = parseInt(String(b), 10);
      return numA - numB;
    });

    // Get country options from companies
    const { data: companyCountries } = await supabase
      .from('companies')
      .select('country')
      .not('country', 'is', null);

    const uniqueCountries = [...new Set(companyCountries?.map(item => item.country).filter(Boolean))].sort();

    // Format pricing data for comparison table
    const comparisonData = pricingData?.map(item => ({
      id: item.id,
      company: item.companies?.name || 'Unknown',
      country: item.companies?.country || 'Unknown',
      location: item.companies?.city && item.companies?.state 
        ? `${item.companies.city}, ${item.companies.state}`
        : item.companies?.city || item.companies?.state || 'Unknown',
      process: item.process,
      material: item.material_category,
      specificMaterial: item.specific_material,
      quantity: item.quantity,
      price: item.price_usd,
      leadTime: item.lead_time_days,
      pricePerUnit: (item.quantity && item.quantity > 0 && item.price_usd) ? item.price_usd / item.quantity : (item.price_usd || 0),
      notes: item.notes
    })).sort((a, b) => (a.price || 0) - (b.price || 0));

    return NextResponse.json({
      data: comparisonData,
      benchmarks: benchmarkData,
      statistics,
      filters: {
        processes: uniqueProcesses.sort(),
        materials: uniqueMaterials.sort(),
        quantities: uniqueQuantities,
        countries: uniqueCountries
      },
      metadata: {
        totalProviders: new Set(pricingData?.map(item => item.company_id)).size,
        totalQuotes: pricingData?.length || 0,
        dataSource: 'vendor_import_2025'
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
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
