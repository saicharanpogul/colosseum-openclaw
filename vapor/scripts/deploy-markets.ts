import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vapor } from "../target/types/vapor";
import { PublicKey } from "@solana/web3.js";

const API_URL = "https://app-rosy-mu.vercel.app/api";

async function main() {
  console.log("🚀 Deploying Markets to On-Chain");
  console.log("=================================\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Vapor as Program<Vapor>;
  const authority = provider.wallet.publicKey;

  console.log(`📝 Authority: ${authority.toBase58()}\n`);

  // Fetch markets that need deployment
  const response = await fetch(`${API_URL}/markets`);
  const data: any = await response.json();
  const markets = data.markets.filter((m: any) => m.marketAddress && !m.deployed);
  
  console.log(`Found ${markets.length} markets to deploy\n`);

  // Deploy first 10 markets (to avoid running out of SOL)
  const toDeploy = markets.slice(0, 10);
  
  for (let i = 0; i < toDeploy.length; i++) {
    const market = toDeploy[i];
    const projectId = new anchor.BN(market.projectId);
    const resolutionTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
    
    try {
      const [marketPDA, marketBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("vapor-market"), projectId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Verify PDA matches database
      if (marketPDA.toBase58() !== market.marketAddress) {
        console.log(`❌ ${i+1}/${toDeploy.length}: PDA mismatch for ${market.projectName.slice(0, 30)}`);
        continue;
      }

      const tx = await program.methods
        .createMarket(projectId, market.projectName, resolutionTimestamp, marketBump)
        .accounts({
          authority: authority,
          market: marketPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`✅ ${i+1}/${toDeploy.length}: ${market.projectName.slice(0, 40)} - ${tx.slice(0, 8)}...`);
      
      // Small delay between deployments
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.log(`❌ ${i+1}/${toDeploy.length}: ${market.projectName.slice(0, 30)} - ${err.message.slice(0, 60)}`);
    }
  }

  console.log("\n🎉 Deployment complete!");
  console.log(`   Check: https://app-rosy-mu.vercel.app/markets`);
}

main();
