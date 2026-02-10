import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { estimateShares, Side, calculateOdds } from '@/lib/vapor-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  
  const side = searchParams.get('side');
  const amountStr = searchParams.get('amount');
  
  if (!side || !['yes', 'no'].includes(side.toLowerCase())) {
    return NextResponse.json(
      { success: false, error: 'Invalid side. Must be "yes" or "no"' },
      { status: 400 }
    );
  }
  
  if (!amountStr) {
    return NextResponse.json(
      { success: false, error: 'Missing amount parameter' },
      { status: 400 }
    );
  }
  
  const amount = parseFloat(amountStr);
  
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: 'Invalid amount. Must be positive number' },
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
  
  if (market.status !== 'open') {
    return NextResponse.json(
      { success: false, error: 'Market is not open for trading' },
      { status: 400 }
    );
  }
  
  const tradeSide = side.toLowerCase() === 'yes' ? Side.Yes : Side.No;
  
  // Calculate expected shares
  const estimatedShares = estimateShares(
    market.yes_pool,
    market.no_pool,
    amount,
    tradeSide
  );
  
  // Calculate new pools and odds after trade
  const newYesPool = tradeSide === Side.Yes 
    ? market.yes_pool - estimatedShares 
    : market.yes_pool;
  const newNoPool = tradeSide === Side.No 
    ? market.no_pool - estimatedShares 
    : market.no_pool;
  const newOppositePool = tradeSide === Side.Yes 
    ? market.no_pool + amount 
    : market.yes_pool + amount;
  
  const newOdds = calculateOdds(
    tradeSide === Side.Yes ? newYesPool : newYesPool,
    tradeSide === Side.No ? newNoPool : newOppositePool
  );
  
  // Calculate price impact
  const currentOdds = calculateOdds(market.yes_pool, market.no_pool);
  const priceImpact = tradeSide === Side.Yes
    ? Math.abs(newOdds.yes - currentOdds.yes)
    : Math.abs(newOdds.no - currentOdds.no);
  
  return NextResponse.json({
    success: true,
    quote: {
      marketId: id,
      side: side.toLowerCase(),
      amount,
      estimatedShares,
      pricePerShare: amount / estimatedShares,
      currentOdds: {
        yes: currentOdds.yes,
        no: currentOdds.no,
      },
      newOdds: {
        yes: newOdds.yes,
        no: newOdds.no,
      },
      priceImpact: `${priceImpact.toFixed(2)}%`,
      warning: priceImpact > 5 ? 'High price impact. Consider splitting order.' : null,
    }
  });
}
