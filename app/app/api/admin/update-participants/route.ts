import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Get all markets
    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('id, total_volume');

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
    let fromPositions = 0;
    let fromTrades = 0;
    let estimated = 0;

    for (const market of markets) {
      let participants = 0;

      // 1. Try positions table first (most accurate - shows who currently has shares)
      const { data: positions } = await supabase
        .from('positions')
        .select('user_address')
        .eq('market_id', market.id)
        .gt('shares', 0); // Only count positions with actual shares

      if (positions && positions.length > 0) {
        participants = new Set(positions.map(p => p.user_address)).size;
        fromPositions++;
      } else {
        // 2. Fall back to trades table
        const { data: trades } = await supabase
          .from('trades')
          .select('user_address')
          .eq('market_id', market.id);

        if (trades && trades.length > 0) {
          participants = new Set(trades.map(t => t.user_address)).size;
          fromTrades++;
        } else if (market.total_volume > 0) {
          // 3. Last resort: estimate from volume
          const volumeInSOL = market.total_volume / 1_000_000_000;
          participants = Math.max(1, Math.min(50, Math.ceil(volumeInSOL / 1)));
          estimated++;
        }
      }

      if (participants > 0) {
        await supabase
          .from('markets')
          .update({ participants })
          .eq('id', market.id);

        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated participants count for ${updated} markets`,
      marketsProcessed: markets.length,
      marketsUpdated: updated,
      breakdown: {
        fromPositions,
        fromTrades,
        estimated,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
