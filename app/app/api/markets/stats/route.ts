import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all markets to calculate aggregated stats
    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('status, total_volume, participants');

    if (marketsError) {
      return NextResponse.json(
        { success: false, error: marketsError.message },
        { status: 500 }
      );
    }

    if (!markets) {
      return NextResponse.json({
        success: true,
        stats: {
          totalMarkets: 0,
          activeMarkets: 0,
          totalVolume: 0,
          totalTraders: 0,
        }
      });
    }

    // Calculate stats from actual market data
    const totalMarkets = markets.length;
    const activeMarkets = markets.filter(m => m.status === 'open').length;
    const totalVolume = markets.reduce((sum, m) => sum + (m.total_volume || 0), 0);
    const totalTraders = markets.reduce((sum, m) => sum + (m.participants || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalMarkets,
        activeMarkets,
        totalVolume,
        totalTraders,
      }
    });
  } catch (error) {
    console.error('Failed to fetch market stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
