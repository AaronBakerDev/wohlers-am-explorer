import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data, error } = await supabase
      .from('coes_associations')
      .select(`
        *,
        country
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching COEs and Associations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch COEs and Associations data' },
        { status: 500 }
      );
    }

    // Aggregate by type for summary statistics
    const summary = data.reduce((acc: any, item: any) => {
      const type = item.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          countries: new Set(),
          items: []
        };
      }
      acc[type].count++;
      acc[type].countries.add(item.country);
      acc[type].items.push(item);
      return acc;
    }, {});

    // Convert Sets to arrays for JSON serialization
    Object.keys(summary).forEach(type => {
      summary[type].countries = Array.from(summary[type].countries);
      summary[type].country_count = summary[type].countries.length;
    });

    return NextResponse.json({
      data,
      summary,
      total_count: data.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}