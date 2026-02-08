import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate historical price data for the last 24 hours
 * Creates realistic-looking price movements
 */
async function generateHistoricalData() {
  try {
    // Fetch all markets
    const { data: markets, error: fetchError } = await supabase
      .from('markets')
      .select('*')
      .limit(10); // Generate for first 10 markets to keep it quick

    if (fetchError) {
      console.error('Failed to fetch markets:', fetchError);
      return;
    }

    if (!markets || markets.length === 0) {
      console.log('No markets found');
      return;
    }

    console.log(`Generating historical data for ${markets.length} markets...`);

    const now = new Date();
    const hoursToGenerate = 24;
    const pointsPerHour = 12; // Every 5 minutes
    const totalPoints = hoursToGenerate * pointsPerHour;

    const allSnapshots = [];

    for (const market of markets) {
      console.log(`Generating ${totalPoints} points for market: ${market.project_name}`);
      
      let currentYesOdds = Number(market.yes_odds);
      let currentNoOdds = Number(market.no_odds);
      
      for (let i = totalPoints; i > 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000)); // 5 minutes back
        
        // Add some realistic random movement (-2% to +2%)
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

    console.log(`Inserting ${allSnapshots.length} snapshots...`);

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < allSnapshots.length; i += batchSize) {
      const batch = allSnapshots.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('price_history')
        .insert(batch);

      if (insertError) {
        console.error(`Failed to insert batch ${i / batchSize + 1}:`, insertError);
      } else {
        console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} rows)`);
      }
    }

    console.log('✅ Historical data generation complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

generateHistoricalData().then(() => {
  console.log('Done!');
  process.exit(0);
});
