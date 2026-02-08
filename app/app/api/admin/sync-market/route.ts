import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { marketAddress, totalVolume, totalTraders, yesPool, noPool } = await request.json();

    if (!marketAddress) {
      return NextResponse.json({ error: "marketAddress required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update market stats
    const { data, error } = await supabase
      .from("markets")
      .update({
        total_volume: totalVolume,
        total_traders: totalTraders,
        yes_pool: yesPool,
        no_pool: noPool,
        deployed: new Date().toISOString(),
      })
      .eq("market_address", marketAddress)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
