import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const eventType = searchParams.get('event_type');
    
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    let query = supabase
      .from('events')
      .select(`
        *,
        speakers:speakers(
          id,
          name,
          speaker_type,
          title,
          organizations:organization_id(
            name,
            type,
            country
          )
        )
      `)
      .order('year', { ascending: false });

    // Apply filters
    if (year) {
      query = query.eq('year', parseInt(year));
    }
    
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching Events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Events data' },
        { status: 500 }
      );
    }

    // Event analytics
    const analytics = {
      by_year: {},
      by_type: {},
      by_location: {},
      speaker_stats: {
        total_speakers: 0,
        invited_speakers: 0,
        regular_speakers: 0,
        organizations: new Set()
      }
    };

    data.forEach((event: any) => {
      // Year distribution
      const eventYear = event.year.toString();
      if (!analytics.by_year[eventYear]) {
        analytics.by_year[eventYear] = {
          count: 0,
          types: new Set(),
          total_speakers: 0
        };
      }
      analytics.by_year[eventYear].count++;
      analytics.by_year[eventYear].types.add(event.event_type);
      analytics.by_year[eventYear].total_speakers += event.speakers?.length || 0;

      // Type distribution
      if (!analytics.by_type[event.event_type]) {
        analytics.by_type[event.event_type] = {
          count: 0,
          years: new Set(),
          total_speakers: 0
        };
      }
      analytics.by_type[event.event_type].count++;
      analytics.by_type[event.event_type].years.add(event.year);
      analytics.by_type[event.event_type].total_speakers += event.speakers?.length || 0;

      // Location distribution (extract country from location)
      const location = event.location;
      let country = 'Unknown';
      if (location) {
        if (location.includes('USA') || location.includes('United States')) {
          country = 'United States';
        } else if (location.includes('Belgium')) {
          country = 'Belgium';
        } else if (location.includes('Netherlands')) {
          country = 'Netherlands';
        } else if (location.includes('Spain')) {
          country = 'Spain';
        }
        // Add more location parsing as needed
      }
      
      if (!analytics.by_location[country]) {
        analytics.by_location[country] = {
          count: 0,
          events: []
        };
      }
      analytics.by_location[country].count++;
      analytics.by_location[country].events.push({
        name: event.name,
        year: event.year,
        type: event.event_type
      });

      // Speaker statistics
      if (event.speakers) {
        event.speakers.forEach((speaker: any) => {
          analytics.speaker_stats.total_speakers++;
          if (speaker.speaker_type === 'Invited') {
            analytics.speaker_stats.invited_speakers++;
          } else {
            analytics.speaker_stats.regular_speakers++;
          }
          
          if (speaker.organizations?.name) {
            analytics.speaker_stats.organizations.add(speaker.organizations.name);
          }
        });
      }
    });

    // Convert Sets to arrays
    Object.keys(analytics.by_year).forEach(year => {
      analytics.by_year[year].types = Array.from(analytics.by_year[year].types);
    });

    Object.keys(analytics.by_type).forEach(type => {
      analytics.by_type[type].years = Array.from(analytics.by_type[type].years);
    });

    analytics.speaker_stats.unique_organizations = analytics.speaker_stats.organizations.size;
    analytics.speaker_stats.organizations = Array.from(analytics.speaker_stats.organizations);

    return NextResponse.json({
      data,
      analytics,
      total_events: data.length,
      filters: {
        years: [...new Set(data.map((e: any) => e.year))].sort().reverse(),
        event_types: [...new Set(data.map((e: any) => e.event_type))],
        locations: Object.keys(analytics.by_location)
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