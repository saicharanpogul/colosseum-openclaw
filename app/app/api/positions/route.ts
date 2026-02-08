import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAllUserPositions } from '@/lib/vapor-client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletParam = searchParams.get('wallet');

    if (!walletParam) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required', hint: 'Add ?wallet=YOUR_PUBKEY' },
        { status: 400 }
      );
    }

    // Validate wallet address
    let wallet: PublicKey;
    try {
      wallet = new PublicKey(walletParam);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Get positions
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    const positions = await getAllUserPositions(wallet, connection);

    // Format response
    const formattedPositions = positions.map(pos => ({
      market: pos.market.toString(),
      marketAddress: pos.market.toString(),
      side: pos.side,
      shares: pos.shares,
      avgPrice: pos.avgPrice,
      currentValue: pos.shares * pos.avgPrice, // Approximate value
    }));

    return NextResponse.json({
      success: true,
      wallet: walletParam,
      positions: formattedPositions,
      count: positions.length,
    });

  } catch (error: any) {
    console.error('Positions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch positions', details: error.message },
      { status: 500 }
    );
  }
}
