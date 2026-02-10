import { NextRequest, NextResponse } from 'next/server';
import { supabase, recordTrade, updateMarketFromChain } from '@/lib/supabase';
import { getMarketAccount, connection } from '@/lib/vapor-client';

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
      status: market.status || 'open', // Default to 'open' if null
      marketAddress: market.market_address,
      participants: participants || 0,
    }
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { action, marketAddress } = body;
    
    if (action === 'deploy' && marketAddress) {
      // Update market address
      const { error } = await supabase
        .from('markets')
        .update({ 
          market_address: marketAddress,
          status: 'open',
          // Reset pools to initial state if needed? No, chain has state.
        })
        .eq('id', id);
        
      if (error) throw error;
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update market' },
      { status: 500 }
    );
  }
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
    
    if (!txSignature || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing txSignature or userAddress' },
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
    
    // Check for replay attack - signature already used
    const { data: existingTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('tx_signature', txSignature)
      .single();
    
    if (existingTrade) {
      return NextResponse.json(
        { success: false, error: 'Transaction already processed' },
        { status: 409 }
      );
    }
    
    // Verify transaction on-chain
    try {
      const tx = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      
      if (!tx) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found on-chain' },
          { status: 404 }
        );
      }
      
      if (tx.meta?.err) {
        return NextResponse.json(
          { success: false, error: 'Transaction failed on-chain' },
          { status: 400 }
        );
      }
      
      // Verify signer matches userAddress
      const signerPubkey = tx.transaction.message.staticAccountKeys[0]?.toString();
      if (signerPubkey !== userAddress) {
        return NextResponse.json(
          { success: false, error: 'Transaction signer does not match userAddress' },
          { status: 403 }
        );
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify transaction' },
        { status: 500 }
      );
    }
    
    // Rate limiting - check trades from this wallet in last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentTrades } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_address', userAddress)
      .gte('created_at', oneMinuteAgo);
    
    if (recentTrades && recentTrades >= 10) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Max 10 trades per minute.' },
        { status: 429 }
      );
    }
    
    // Record trade
    await recordTrade({
      marketId: id,
      userAddress,
      side,
      action: action || 'buy',
      amount,
      shares: shares || amount,
      txSignature,
    });
    
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
        status: updatedMarket?.status || 'open', // Default to 'open' if null
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
