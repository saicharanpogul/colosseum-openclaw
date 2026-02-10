import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get total count of markets
    const { count: totalMarkets, error: countError } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    // Get count of active (open) markets
    const { count: activeMarkets, error: activeError } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (activeError) {
      return NextResponse.json(
        { success: false, error: activeError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalMarkets: totalMarkets || 0,
        activeMarkets: activeMarkets || 0,
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
