import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const process = searchParams.get('process');
    const material = searchParams.get('material');
    const segment = searchParams.get('segment');
    const country = searchParams.get('country');
    const manufacturer = searchParams.get('manufacturer');

    // Use merged view with Printing services filter
    let pricingQuery = supabase
      .from('vendor_companies_merged')
      .select('*')
      .eq('segment', 'Printing services');

    if (process && process !== 'all') pricingQuery = pricingQuery.eq('process', process);
    if (material && material !== 'all') pricingQuery = pricingQuery.eq('material_type', material);
    // Segment filter already applied above for Printing services
    if (country && country !== 'all') pricingQuery = pricingQuery.eq('country', country);
    if (manufacturer && manufacturer !== 'all') pricingQuery = pricingQuery.eq('printer_manufacturer', manufacturer);

    // Apply ordering and limit after filters
    pricingQuery = pricingQuery.order('company_name', { ascending: true }).limit(3000);

    const { data: pricingData, error: pricingError } = await pricingQuery;
    if (pricingError) {
      console.error('Error fetching pricing data:', pricingError);
      return NextResponse.json({ error: 'Failed to fetch pricing data' }, { status: 500 });
    }
    
    console.log(`Fetched ${pricingData?.length || 0} records from vendor_companies_merged`);

    // Calculate statistics from equipment data
    const printerCounts = pricingData?.map(item => item.number_of_printers).filter(p => p !== null) || [];
    const updateYears = pricingData?.map(item => item.update_year).filter(y => y !== null) || [];

    const statistics = {
      printers: {
        min: Math.min(...printerCounts),
        max: Math.max(...printerCounts),
        avg: printerCounts.length > 0 ? printerCounts.reduce((a, b) => a + b, 0) / printerCounts.length : 0,
        median: printerCounts.length > 0 ? printerCounts.sort((a, b) => a - b)[Math.floor(printerCounts.length / 2)] : 0,
        count: printerCounts.length,
        total: printerCounts.reduce((a, b) => a + b, 0)
      },
      updateYear: {
        min: Math.min(...updateYears),
        max: Math.max(...updateYears),
        latest: Math.max(...updateYears),
        count: updateYears.length
      }
    };

    // Get all unique countries using a database function to avoid row limits
    const { data: countryData, error: countryError } = await supabase
      .rpc('get_distinct_countries');
    
    if (countryError) {
      console.error('Error fetching countries:', countryError);
    }
    
    const uniqueCountries = countryData?.map(item => item.country).filter(Boolean) || [];
    
    // Get filter options for other fields from the already fetched data
    const uniqueProcesses = [...new Set(pricingData?.map(item => item.process).filter(Boolean))];
    const uniqueMaterials = [...new Set(pricingData?.map(item => item.material_type).filter(Boolean))];
    const uniqueSegments = [...new Set(pricingData?.map(item => item.segment).filter(Boolean))];
    const uniqueManufacturers = [...new Set(pricingData?.map(item => item.printer_manufacturer).filter(Boolean))].sort();
    
    console.log(`Found ${uniqueCountries.length} unique countries`);

    // Format equipment data for display
    const comparisonData = pricingData?.map(item => ({
      id: item.id,
      company: item.company_name || 'Unknown',
      country: item.country || 'Unknown',
      segment: item.segment,
      printerManufacturer: item.printer_manufacturer,
      printerModel: item.printer_model,
      numberOfPrinters: item.number_of_printers,
      countType: item.count_type,
      process: item.process,
      materialType: item.material_type,
      materialFormat: item.material_format,
      updateYear: item.update_year,
      additionalInfo: item.additional_info
    })).sort((a, b) => (a.company || '').localeCompare(b.company || ''));

    return NextResponse.json({
      data: comparisonData,
      statistics,
      filters: {
        processes: uniqueProcesses.sort(),
        materials: uniqueMaterials.sort(),
        segments: uniqueSegments.sort(),
        countries: uniqueCountries,
        manufacturers: uniqueManufacturers
      },
      metadata: {
        totalCompanies: new Set(pricingData?.map(item => item.company_name)).size,
        totalRecords: pricingData?.length || 0,
        dataSource: 'vendor_print_services_global'
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
