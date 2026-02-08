import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vapor } from "../target/types/vapor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const API_URL = "https://app-rosy-mu.vercel.app/api";

async function main() {
  console.log("🤖 Vapor Volume Generator");
  console.log("=========================\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Vapor as Program<Vapor>;

  // Create traders
  const traders = [];
  for (let i = 0; i < 5; i++) {
    traders.push({
      kp: Keypair.generate(),
      strategy: ["bullish", "bearish", "random"][i % 3],
    });
  }

  console.log("📦 Created 5 traders");
  
  // Fetch markets
  const response = await fetch(`${API_URL}/markets`);
  const data: any = await response.json();
  const markets = data.markets.filter((m: any) => m.marketAddress);
  console.log(`🔍 Found ${markets.length} markets\n`);

  // Generate 20 trades
  for (let i = 0; i < 20; i++) {
    const trader = traders[Math.floor(Math.random() * traders.length)];
    const market = markets[Math.floor(Math.random() * markets.length)];
    
    const buyYes = Math.random() > 0.5;
    const amount = Math.floor((Math.random() * 0.4 + 0.1) * LAMPORTS_PER_SOL);
    
    try {
      const marketPDA = new PublicKey(market.marketAddress);
      const side = buyYes ? 0 : 1;
      
      const [positionPDA, positionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vapor-position"),
          marketPDA.toBuffer(),
          trader.kp.publicKey.toBuffer(),
          Buffer.from([side]),
        ],
        program.programId
      );

      await program.methods
        .buyShares(buyYes ? { yes: {} } : { no: {} }, new anchor.BN(amount), positionBump)
        .accounts({
          user: trader.kp.publicKey,
          market: marketPDA,
          position: positionPDA,
        })
        .signers([trader.kp])
        .rpc();

      console.log(`✅ ${i + 1}/20: ${buyYes ? "YES" : "NO"} ${(amount / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
    } catch (err: any) {
      console.log(`❌ ${i + 1}/20: ${err.message.slice(0, 60)}`);
    }
  }

  console.log("\n🎉 Done!");
}

main();
