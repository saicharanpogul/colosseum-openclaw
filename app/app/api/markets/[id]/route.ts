import { NextRequest, NextResponse } from 'next/server';
import { getMarket, buyShares } from '@/lib/markets';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const market = getMarket(id);
  
  if (!market) {
    return NextResponse.json(
      { success: false, error: 'Market not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ success: true, market });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { side, amount } = body;
    
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
    
    const result = buyShares(id, side, amount);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Market not found or closed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      market: result.market,
      shares: result.shares,
      side,
      amount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
