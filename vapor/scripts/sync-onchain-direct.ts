import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vapor } from "../target/types/vapor";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";

const API_URL = "https://app-rosy-mu.vercel.app/api";

// Get Supabase creds from env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://govhorgdsapyospepgjx.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY env var required");
  process.exit(1);
}

async function main() {
  console.log("🔄 Syncing on-chain data to database");
  console.log("====================================\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Vapor as Program<Vapor>;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch all markets from DB
  const { data: markets, error } = await supabase
    .from("markets")
    .select("*")
    .not("market_address", "is", null);

  if (error) {
    console.error("❌ Database error:", error);
    process.exit(1);
  }

  console.log(`📊 Checking ${markets.length} markets...\n`);

  // Fetch ALL position accounts once (more efficient than per-market queries)
  console.log("🔍 Fetching all position accounts...");
  const allPositions = await program.account.position.all();
  console.log(`   Found ${allPositions.length} total positions\n`);

  // Group by market
  const positionsByMarket = new Map<string, number>();
  for (const pos of allPositions) {
    const marketKey = pos.account.market.toBase58();
    positionsByMarket.set(marketKey, (positionsByMarket.get(marketKey) || 0) + 1);
  }

  let totalSynced = 0;

  for (const market of markets) {
    try {
      const marketPDA = new PublicKey(market.market_address);
      const account = await program.account.market.fetch(marketPDA);
      
      const totalVolume = account.totalVolume.toNumber();
      const yesPool = account.yesPool.toNumber();
      const noPool = account.noPool.toNumber();
      const totalTraders = positionsByMarket.get(marketPDA.toBase58()) || 0;

      console.log(`📈 ${market.project_name.slice(0, 40)}`);
      console.log(`   Volume: ${(totalVolume / 1e9).toFixed(2)} SOL`);
      console.log(`   Traders: ${totalTraders}`);
      console.log(`   Pools: YES=${(yesPool / 1e6).toFixed(2)} NO=${(noPool / 1e6).toFixed(2)}`);

      // Update database directly (skip participants for now - will add via API)
      const { error: updateError } = await supabase
        .from("markets")
        .update({
          total_volume: totalVolume,
          yes_pool: yesPool,
          no_pool: noPool,
        })
        .eq("market_address", market.market_address);

      if (updateError) {
        console.log(`   ⚠️  DB update failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Synced volume & pools to database`);
        
        // Update participants separately via API (it's a computed field)
        try {
          await fetch(`${API_URL}/admin/update-participants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              marketAddress: market.market_address,
              participants: totalTraders,
            }),
          });
          console.log(`   ✅ Updated ${totalTraders} participants\n`);
        } catch (e) {
          console.log(`   ⚠️  Participants update failed\n`);
        }
      }

    } catch (err: any) {
      // Market not deployed on-chain yet
      if (err.message.includes("Account does not exist")) {
        console.log(`⏭️  ${market.project_name.slice(0, 40)} - not deployed yet\n`);
      } else {
        console.log(`❌ ${market.project_name.slice(0, 40)} - ${err.message.slice(0, 60)}\n`);
      }
    }
  }

  console.log("✅ Sync complete!");
  console.log("📊 Check: https://app-rosy-mu.vercel.app/markets");
}

main();
