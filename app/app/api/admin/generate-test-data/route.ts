import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://govhorgdsapyospepgjx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmhvcmdkc2FweW9zcGVwZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyODc0NjMsImV4cCI6MjA1NDg2MzQ2M30.5lNKGJBQ-BFBDuuQa5lXYd_KDL9q_DjVBUDPaJiNY5w';

// Fake wallet addresses
const WALLETS = [
  'EwdqGaZHkibd1VX6yUqndbRyBFubFNfBufWTtkkHSHNE',
  'GVXRSBjFk5e7QbeY3n4ie53N7W7m37vzBYvbDk1cyR9R',
  'Cv8EwkzMJohii2RZhjt4bQpmwCxrSQgQvvdDVwCgK7dW',
  'DgHoDbEfVc5ZrAXLMwUqYBPbzR3niwTWJthNu7F6JpqW',
  'F7v2EtgNWkQVYqXLgJstRdqDvE3mWTBsw9eXqP8RcHuy',
  'HtQwYnF5VXeDqPR8cWUz3vNg7bJwLKuY2sEpTMq9Xhv4',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export async function POST(request: NextRequest) {
  try {
    const { marketCount = 30 } = await request.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get markets
    const { data: markets, error: fetchError } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'open')
      .limit(100);
    
    if (fetchError || !markets) {
      return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
    }
    
    // Select random markets
    const selectedMarkets = markets
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(marketCount, markets.length));
    
    let totalTradesCreated = 0;
    const results = [];
    
    for (const market of selectedMarkets) {
      // Number of trades for this market (5-30)
      const numTrades = randomInt(5, 30);
      
      // Starting pools (1B lamports each)
      let yesPool = 1_000_000_000;
      let noPool = 1_000_000_000;
      let totalVolume = 0;
      
      const trades = [];
      const priceHistory = [];
      
      // Generate trades over the past 48 hours
      const now = Date.now();
      const startTime = now - (48 * 60 * 60 * 1000);
      
      for (let i = 0; i < numTrades; i++) {
        const wallet = randomElement(WALLETS);
        const side = Math.random() > 0.5 ? 'yes' : 'no';
        
        // Trade size: 0.1 to 5 SOL
        const amountSol = randomFloat(0.1, 5);
        const amountLamports = Math.floor(amountSol * 1e9);
        
        // Calculate shares using CPMM formula
        const k = yesPool * noPool;
        let shares: number;
        
        if (side === 'yes') {
          const newNoPool = noPool + amountLamports;
          const newYesPool = Math.floor(k / newNoPool);
          shares = yesPool - newYesPool;
          yesPool = newYesPool;
          noPool = newNoPool;
        } else {
          const newYesPool = yesPool + amountLamports;
          const newNoPool = Math.floor(k / newYesPool);
          shares = noPool - newNoPool;
          noPool = newNoPool;
          yesPool = newYesPool;
        }
        
        totalVolume += amountLamports;
        
        // Timestamp spread over 48 hours
        const timestamp = new Date(startTime + (i / numTrades) * (now - startTime));
        
        // Generate fake signature
        const fakeSignature = `seed${market.id}${i}${Date.now()}${Math.random().toString(36).substring(7)}`;
        
        trades.push({
          market_id: market.id,
          user_address: wallet,
          side,
          action: 'buy',
          amount: amountLamports,
          shares,
          tx_signature: fakeSignature,
          created_at: timestamp.toISOString(),
        });
        
        // Record price point every few trades
        if (i % 3 === 0 || i === numTrades - 1) {
          const total = yesPool + noPool;
          const yesOdds = Math.round((noPool / total) * 100);
          
          priceHistory.push({
            market_id: market.id,
            yes_odds: yesOdds,
            no_odds: 100 - yesOdds,
            yes_pool: yesPool,
            no_pool: noPool,
            total_volume: totalVolume,
            recorded_at: timestamp.toISOString(),
          });
        }
      }
      
      // Insert trades
      const { error: tradesError } = await supabase
        .from('trades')
        .insert(trades);
      
      if (tradesError) {
        console.error(`Trades error for ${market.project_name}:`, tradesError);
        continue;
      }
      
      // Insert price history
      const { error: historyError } = await supabase
        .from('price_history')
        .insert(priceHistory);
      
      if (historyError) {
        console.error(`History error for ${market.project_name}:`, historyError);
      }
      
      // Update market with final state
      const total = yesPool + noPool;
      const yesOdds = Math.round((noPool / total) * 100);
      const noOdds = 100 - yesOdds;
      
      // Count unique traders
      const uniqueTraders = new Set(trades.map(t => t.user_address)).size;
      
      const { error: updateError } = await supabase
        .from('markets')
        .update({
          yes_pool: yesPool,
          no_pool: noPool,
          total_volume: totalVolume,
          yes_odds: yesOdds,
          no_odds: noOdds,
          participants: uniqueTraders,
          updated_at: new Date().toISOString(),
        })
        .eq('id', market.id);
      
      if (updateError) {
        console.error(`Update error for ${market.project_name}:`, updateError);
        continue;
      }
      
      totalTradesCreated += numTrades;
      results.push({
        project: market.project_name,
        trades: numTrades,
        volume: (totalVolume / 1e9).toFixed(2),
        odds: `${yesOdds}% YES / ${noOdds}% NO`,
      });
    }
    
    return NextResponse.json({
      success: true,
      marketsSeeded: selectedMarkets.length,
      totalTrades: totalTradesCreated,
      results,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
