import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://govhorgdsapyospepgjx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_7o3XrwP-mc2_tw7u4BmqCg_JNrIfoqN';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types matching our schema
export interface DbMarket {
  id: string;
  project_id: number;
  project_name: string;
  project_slug: string;
  question: string;
  yes_pool: number;
  no_pool: number;
  total_volume: number;
  yes_odds: number;
  no_odds: number;
  status: 'open' | 'resolved';
  resolution: string | null;
  market_address: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface DbTrade {
  id: string;
  market_id: string;
  user_address: string;
  side: 'yes' | 'no';
  action: 'buy' | 'sell';
  amount: number;
  shares: number;
  tx_signature: string;
  created_at: string;
}

export interface DbPosition {
  id: string;
  market_id: string;
  user_address: string;
  side: 'yes' | 'no';
  shares: number;
  avg_price: number;
  updated_at: string;
}

// Initialize market in Supabase
export async function upsertMarket(market: {
  id: string;
  projectId: number;
  projectName: string;
  projectSlug?: string;
  question: string;
  yesPool: number;
  noPool: number;
  totalVolume: number;
  yesOdds: number;
  noOdds: number;
  status: string;
  marketAddress: string;
  upvotes?: number;
}): Promise<void> {
  const { error } = await supabase
    .from('markets')
    .upsert({
      id: market.id,
      project_id: market.projectId,
      project_name: market.projectName,
      project_slug: market.projectSlug || market.projectName.toLowerCase().replace(/\s+/g, '-'),
      question: market.question,
      yes_pool: market.yesPool,
      no_pool: market.noPool,
      total_volume: market.totalVolume,
      yes_odds: market.yesOdds,
      no_odds: market.noOdds,
      status: market.status,
      market_address: market.marketAddress,
      upvotes: market.upvotes || 0,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });

  if (error) console.error('Failed to upsert market:', error);
}

// Update market with on-chain data
export async function updateMarketFromChain(
  marketId: string,
  yesPool: number,
  noPool: number,
  totalVolume: number
): Promise<void> {
  const total = yesPool + noPool;
  const yesOdds = total > 0 ? Math.round((noPool / total) * 100) : 50;
  const noOdds = total > 0 ? Math.round((yesPool / total) * 100) : 50;

  const { error } = await supabase
    .from('markets')
    .update({
      yes_pool: yesPool,
      no_pool: noPool,
      total_volume: totalVolume,
      yes_odds: yesOdds,
      no_odds: noOdds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', marketId);

  if (error) console.error('Failed to update market:', error);
}

// Record a trade
export async function recordTrade(trade: {
  marketId: string;
  userAddress: string;
  side: 'yes' | 'no';
  action: 'buy' | 'sell';
  amount: number;
  shares: number;
  txSignature: string;
}): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .insert({
      market_id: trade.marketId,
      user_address: trade.userAddress,
      side: trade.side,
      action: trade.action,
      amount: trade.amount,
      shares: trade.shares,
      tx_signature: trade.txSignature,
    });

  if (error) console.error('Failed to record trade:', error);
}

// Update position
export async function upsertPosition(position: {
  marketId: string;
  userAddress: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
}): Promise<void> {
  const id = `${position.marketId}-${position.userAddress}-${position.side}`;
  
  const { error } = await supabase
    .from('positions')
    .upsert({
      id,
      market_id: position.marketId,
      user_address: position.userAddress,
      side: position.side,
      shares: position.shares,
      avg_price: position.avgPrice,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });

  if (error) console.error('Failed to upsert position:', error);
}

// Get all markets from Supabase
export async function getMarketsFromDb(): Promise<DbMarket[]> {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .order('total_volume', { ascending: false });

  if (error) {
    console.error('Failed to get markets:', error);
    return [];
  }

  return data || [];
}

// Get unique traders count for a market
export async function getTraderCount(marketId: string): Promise<number> {
  const { count, error } = await supabase
    .from('trades')
    .select('user_address', { count: 'exact', head: true })
    .eq('market_id', marketId);

  if (error) return 0;
  return count || 0;
}

// Get user positions
export async function getUserPositions(userAddress: string): Promise<DbPosition[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_address', userAddress)
    .gt('shares', 0);

  if (error) {
    console.error('Failed to get positions:', error);
    return [];
  }

  return data || [];
}

// Subscribe to market updates (realtime)
export function subscribeToMarketUpdates(
  marketId: string,
  callback: (market: DbMarket) => void
) {
  return supabase
    .channel(`market-${marketId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'markets',
        filter: `id=eq.${marketId}`,
      },
      (payload) => {
        callback(payload.new as DbMarket);
      }
    )
    .subscribe();
}

// Subscribe to all market updates
export function subscribeToAllMarkets(
  callback: (market: DbMarket) => void
) {
  return supabase
    .channel('all-markets')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'markets',
      },
      (payload) => {
        callback(payload.new as DbMarket);
      }
    )
    .subscribe();
}

// Get total stats
export async function getStats(): Promise<{
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  totalTrades: number;
}> {
  const { data: markets } = await supabase
    .from('markets')
    .select('status, total_volume');

  const { count: totalTrades } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true });

  const totalMarkets = markets?.length || 0;
  const activeMarkets = markets?.filter(m => m.status === 'open').length || 0;
  const totalVolume = markets?.reduce((sum, m) => sum + (m.total_volume || 0), 0) || 0;

  return {
    totalMarkets,
    activeMarkets,
    totalVolume,
    totalTrades: totalTrades || 0,
  };
}
