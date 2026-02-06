import { NextRequest, NextResponse } from 'next/server';
import { supabase, recordTrade, updateMarketFromChain } from '@/lib/supabase';
import { getMarketAccount } from '@/lib/vapor-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const { data: market, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !market) {
    return NextResponse.json(
      { success: false, error: 'Market not found' },
      { status: 404 }
    );
  }
  
  // Get trader count
  const { count: participants } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('market_id', id);
  
  return NextResponse.json({ 
    success: true, 
    market: {
      id: market.id,
      projectId: market.project_id,
      projectName: market.project_name,
      question: market.question,
      yesPool: market.yes_pool,
      noPool: market.no_pool,
      totalVolume: market.total_volume,
      yesOdds: market.yes_odds,
      noOdds: market.no_odds,
      status: market.status,
      marketAddress: market.market_address,
      participants: participants || 0,
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { side, amount, shares, action, userAddress, txSignature } = body;
    
    if (!side || !['yes', 'no'].includes(side)) {
      return NextResponse.json(
        { success: false, error: 'Invalid side. Must be "yes" or "no"' },
        { status: 400 }
      );
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Must be positive' },
        { status: 400 }
      );
    }
    
    // Get market
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (marketError || !market) {
      return NextResponse.json(
        { success: false, error: 'Market not found' },
        { status: 404 }
      );
    }
    
    // Record trade if txSignature provided
    if (txSignature && userAddress) {
      await recordTrade({
        marketId: id,
        userAddress,
        side,
        action: action || 'buy',
        amount,
        shares: shares || amount,
        txSignature,
      });
    }
    
    // Fetch fresh on-chain data
    const projectId = market.project_id;
    const onChainData = await getMarketAccount(projectId);
    
    if (onChainData.exists && onChainData.data) {
      await updateMarketFromChain(
        id,
        onChainData.data.yesPool,
        onChainData.data.noPool,
        onChainData.data.totalVolume
      );
    }
    
    // Get updated market
    const { data: updatedMarket } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single();
    
    // Get trader count
    const { count: participants } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', id);
    
    return NextResponse.json({
      success: true,
      market: {
        id: updatedMarket?.id,
        projectId: updatedMarket?.project_id,
        projectName: updatedMarket?.project_name,
        question: updatedMarket?.question,
        yesPool: updatedMarket?.yes_pool,
        noPool: updatedMarket?.no_pool,
        totalVolume: updatedMarket?.total_volume,
        yesOdds: updatedMarket?.yes_odds,
        noOdds: updatedMarket?.no_odds,
        status: updatedMarket?.status,
        marketAddress: updatedMarket?.market_address,
        participants: participants || 0,
      }
    });
  } catch (error) {
    console.error('Trade error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process trade' },
      { status: 500 }
    );
  }
}
