import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { trades } = await request.json();

    if (!Array.isArray(trades)) {
      return NextResponse.json({ error: "trades must be an array" }, { status: 400 });
    }

    // Insert trades into positions table
    const positions = trades.map((trade) => ({
      market_id: trade.marketId,
      wallet_address: trade.walletAddress,
      side: trade.side,
      shares: trade.amount * 1e9, // Convert SOL to lamports
      avg_price: 0.5, // Placeholder
      created_at: new Date(trade.timestamp).toISOString(),
    }));

    const { data, error } = await supabase
      .from("positions")
      .insert(positions);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also update market stats
    for (const trade of trades) {
      const { data: market } = await supabase
        .from("markets")
        .select("*")
        .eq("id", trade.marketId)
        .single();

      if (market) {
        const amountLamports = trade.amount * 1e9;
        const newVolume = (market.total_volume || 0) + amountLamports;

        await supabase
          .from("markets")
          .update({
            total_volume: newVolume,
            yes_pool: trade.side === "yes" 
              ? (market.yes_pool || 10e9) - amountLamports * 0.5
              : (market.yes_pool || 10e9) + amountLamports,
            no_pool: trade.side === "no"
              ? (market.no_pool || 10e9) - amountLamports * 0.5
              : (market.no_pool || 10e9) + amountLamports,
          })
          .eq("id", trade.marketId);
      }
    }

    return NextResponse.json({ 
      success: true, 
      inserted: trades.length 
    });
  } catch (error: any) {
    console.error("Error seeding trades:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
