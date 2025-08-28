import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberStatus = searchParams.get('member_status');
    const state = searchParams.get('state');
    
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    let query = supabase
      .from('america_makes_members')
      .select(`
        *,
        companies:company_id (
          name,
          website,
          employee_count,
          description
        ),
        us_states!inner (
          name,
          code,
          latitude,
          longitude
        )
      `)
      .order('state');

    // Apply filters
    if (memberStatus) {
      query = query.eq('member_status', memberStatus);
    }
    
    if (state) {
      query = query.eq('state', state);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching America Makes Members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch America Makes Members data' },
        { status: 500 }
      );
    }

    // State-wise distribution for US map visualization
    const stateDistribution = data.reduce((acc: any, member: any) => {
      const stateName = member.state;
      if (!acc[stateName]) {
        acc[stateName] = {
          total_members: 0,
          by_status: {
            Platinum: 0,
            Gold: 0,
            Silver: 0,
            Public: 0
          },
          coordinates: {
            latitude: member.us_states?.latitude || 0,
            longitude: member.us_states?.longitude || 0
          },
          members: []
        };
      }
      
      acc[stateName].total_members++;
      acc[stateName].by_status[member.member_status]++;
      acc[stateName].members.push({
        id: member.id,
        status: member.member_status,
        city: member.city,
        join_date: member.join_date,
        company: member.companies?.name || 'Not linked'
      });
      
      return acc;
    }, {});

    // Membership status summary
    const statusSummary = data.reduce((acc: any, member: any) => {
      const status = member.member_status;
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          states: new Set(),
          avg_annual_fee: 0,
          total_fees: 0,
          members: []
        };
      }
      
      acc[status].count++;
      acc[status].states.add(member.state);
      
      // Extract annual fee from membership details
      if (member.membership_level_details?.annual_fee) {
        acc[status].total_fees += member.membership_level_details.annual_fee;
      }
      
      acc[status].members.push({
        state: member.state,
        city: member.city,
        join_date: member.join_date
      });
      
      return acc;
    }, {});

    // Calculate averages and convert Sets to arrays
    Object.keys(statusSummary).forEach(status => {
      const summary = statusSummary[status];
      summary.avg_annual_fee = summary.count > 0 ? summary.total_fees / summary.count : 0;
      summary.states = Array.from(summary.states);
      summary.unique_states = summary.states.length;
    });

    // Timeline analysis (join dates)
    const joinTimeline = data.reduce((acc: any, member: any) => {
      if (member.join_date) {
        const year = new Date(member.join_date).getFullYear().toString();
        if (!acc[year]) {
          acc[year] = {
            total: 0,
            by_status: {
              Platinum: 0,
              Gold: 0,
              Silver: 0,
              Public: 0
            }
          };
        }
        acc[year].total++;
        acc[year].by_status[member.member_status]++;
      }
      return acc;
    }, {});

    // Geographic center calculation for map display
    const validCoordinates = Object.values(stateDistribution)
      .map((state: any) => state.coordinates)
      .filter((coord: any) => coord.latitude !== 0 && coord.longitude !== 0);
    
    const mapCenter = validCoordinates.length > 0 ? {
      latitude: validCoordinates.reduce((sum: number, coord: any) => sum + coord.latitude, 0) / validCoordinates.length,
      longitude: validCoordinates.reduce((sum: number, coord: any) => sum + coord.longitude, 0) / validCoordinates.length
    } : { latitude: 39.8283, longitude: -98.5795 }; // Default to US center

    return NextResponse.json({
      data,
      state_distribution: stateDistribution,
      status_summary: statusSummary,
      join_timeline: joinTimeline,
      map_center: mapCenter,
      total_members: data.length,
      unique_states: Object.keys(stateDistribution).length,
      filters: {
        member_statuses: Object.keys(statusSummary),
        states: Object.keys(stateDistribution).sort(),
        years: Object.keys(joinTimeline).sort()
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