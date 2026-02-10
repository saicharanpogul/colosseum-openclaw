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

    for (const market of markets) {
      // Get all trades for this market from our trades table
      const { data: trades } = await supabase
        .from('trades')
        .select('user_address')
        .eq('market_id', market.id);

      let participants = 0;

      if (trades && trades.length > 0) {
        // Count unique traders from trades table
        participants = new Set(trades.map(t => t.user_address)).size;
      } else if (market.total_volume > 0) {
        // If there's volume but no trades in our DB, estimate participants
        // Rough estimate: 1 trader per 1 SOL of volume (min 1, max 50)
        const volumeInSOL = market.total_volume / 1_000_000_000;
        participants = Math.max(1, Math.min(50, Math.ceil(volumeInSOL / 1)));
      }

      if (participants > 0) {
        // Update market participants
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
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
