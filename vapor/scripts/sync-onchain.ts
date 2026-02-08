import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vapor } from "../target/types/vapor";
import { PublicKey } from "@solana/web3.js";

const API_URL = "https://app-rosy-mu.vercel.app/api";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log("🔄 Syncing on-chain data to database");
  console.log("====================================\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Vapor as Program<Vapor>;

  // Fetch all markets from DB
  const response = await fetch(`${API_URL}/markets`);
  const data: any = await response.json();
  const markets = data.markets.filter((m: any) => m.marketAddress);

  console.log(`📊 Checking ${markets.length} markets...\n`);

  for (const market of markets) {
    try {
      const marketPDA = new PublicKey(market.marketAddress);
      const account = await program.account.market.fetch(marketPDA);
      
      const totalVolume = account.totalVolume.toNumber();
      const totalTraders = account.totalTraders;
      const yesPool = account.yesPool.toNumber();
      const noPool = account.noPool.toNumber();

      console.log(`📈 ${market.projectName.slice(0, 40)}`);
      console.log(`   Volume: ${(totalVolume / 1e9).toFixed(2)} SOL`);
      console.log(`   Traders: ${totalTraders}`);
      console.log(`   Pools: YES=${(yesPool / 1e6).toFixed(2)} NO=${(noPool / 1e6).toFixed(2)}`);

      // Update database
      const updateRes = await fetch(`${API_URL}/admin/sync-market`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketAddress: market.marketAddress,
          totalVolume,
          totalTraders,
          yesPool,
          noPool,
        }),
      });

      if (updateRes.ok) {
        console.log(`   ✅ Synced to database\n`);
      } else {
        console.log(`   ⚠️  DB update failed: ${updateRes.statusText}\n`);
      }

    } catch (err: any) {
      // Market not deployed on-chain yet
      if (err.message.includes("Account does not exist")) {
        console.log(`⏭️  ${market.projectName.slice(0, 40)} - not deployed yet\n`);
      } else {
        console.log(`❌ ${market.projectName.slice(0, 40)} - ${err.message.slice(0, 60)}\n`);
      }
    }
  }

  console.log("✅ Sync complete!");
}

main();
