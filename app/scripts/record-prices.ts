import { supabase } from '../lib/supabase';

/**
 * Records current price snapshot for all open markets
 * Run this script periodically (e.g., every 5 minutes via cron)
 */
async function recordPrices() {
  try {
    // Fetch all open markets
    const { data: markets, error: fetchError } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'open');

    if (fetchError) {
      console.error('Failed to fetch markets:', fetchError);
      return;
    }

    if (!markets || markets.length === 0) {
      console.log('No open markets found');
      return;
    }

    console.log(`Recording prices for ${markets.length} markets...`);

    // Insert price snapshots
    const snapshots = markets.map(market => ({
      market_id: market.id,
      yes_odds: market.yes_odds,
      no_odds: market.no_odds,
      yes_pool: market.yes_pool,
      no_pool: market.no_pool,
      total_volume: market.total_volume,
      recorded_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('price_history')
      .insert(snapshots);

    if (insertError) {
      console.error('Failed to insert price snapshots:', insertError);
      return;
    }

    console.log(`✅ Successfully recorded ${snapshots.length} price snapshots`);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run immediately if called directly
if (require.main === module) {
  recordPrices().then(() => {
    console.log('Done!');
    process.exit(0);
  });
}

export { recordPrices };
