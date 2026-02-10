import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Get all markets
    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('id');

    if (marketsError) {
      return NextResponse.json(
        { success: false, error: marketsError.message },
        { status: 500 }
      );
    }

    if (!markets || markets.length === 0) {
      return NextResponse.json({ success: false, error: 'No markets found' }, { status: 404 });
    }

    let updated = 0;

    for (const market of markets) {
      // Get all trades for this market
      const { data: trades } = await supabase
        .from('trades')
        .select('user_address')
        .eq('market_id', market.id);

      if (trades && trades.length > 0) {
        // Count unique traders
        const uniqueTraders = new Set(trades.map(t => t.user_address)).size;

        // Update market participants
        await supabase
          .from('markets')
          .update({ participants: uniqueTraders })
          .eq('id', market.id);

        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated participants count for ${updated} markets`,
      marketsProcessed: markets.length,
      marketsUpdated: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
