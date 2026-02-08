import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('range') || '24h';
  
  // Calculate time window
  const now = new Date();
  let startTime = new Date();
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startTime = new Date(0); // Beginning of time
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('market_id', id)
      .gte('recorded_at', startTime.toISOString())
      .order('recorded_at', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      history: data || [],
      range: timeRange,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
