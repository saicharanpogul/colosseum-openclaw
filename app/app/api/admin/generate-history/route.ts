import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Fetch all markets
    const { data: markets, error: fetchError } = await supabase
      .from('markets')
      .select('*')
      .limit(10);

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!markets || markets.length === 0) {
      return NextResponse.json({ success: false, error: 'No markets found' }, { status: 404 });
    }

    const now = new Date();
    const hoursToGenerate = 24;
    const pointsPerHour = 12; // Every 5 minutes
    const totalPoints = hoursToGenerate * pointsPerHour;

    const allSnapshots = [];

    for (const market of markets) {
      let currentYesOdds = Number(market.yes_odds);
      let currentNoOdds = Number(market.no_odds);
      
      for (let i = totalPoints; i > 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
        
        // Add realistic random movement (-2% to +2%)
        const change = (Math.random() - 0.5) * 4;
        currentYesOdds = Math.max(5, Math.min(95, currentYesOdds + change));
        currentNoOdds = 100 - currentYesOdds;
        
        allSnapshots.push({
          market_id: market.id,
          yes_odds: currentYesOdds.toFixed(2),
          no_odds: currentNoOdds.toFixed(2),
          yes_pool: market.yes_pool,
          no_pool: market.no_pool,
          total_volume: market.total_volume,
          recorded_at: timestamp.toISOString(),
        });
      }
    }

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < allSnapshots.length; i += batchSize) {
      const batch = allSnapshots.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('price_history')
        .insert(batch);

      if (insertError) {
        return NextResponse.json({ 
          success: false, 
          error: `Batch insert failed: ${insertError.message}` 
        }, { status: 500 });
      }
      inserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${inserted} price snapshots for ${markets.length} markets`,
      marketsProcessed: markets.length,
      snapshotsCreated: inserted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
