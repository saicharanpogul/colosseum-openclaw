import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vapor } from "../target/types/vapor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("volume-generator", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Vapor as Program<Vapor>;

  it("Generates volume on existing markets", async () => {
    console.log("\n🤖 Generating volume...\n");
    
    // Fetch markets from API
    const response = await fetch("https://app-rosy-mu.vercel.app/api/markets");
    const data: any = await response.json();
    const allMarkets = data.markets.filter((m: any) => m.marketAddress);
    
    // Verify which markets are actually deployed on-chain
    const deployedMarkets = [];
    console.log(`🔍 Checking ${allMarkets.length} markets on-chain...`);
    
    for (const market of allMarkets) {
      try {
        const marketPDA = new PublicKey(market.marketAddress);
        const account = await program.account.market.fetch(marketPDA);
        if (account) {
          deployedMarkets.push(market);
        }
      } catch (e) {
        // Market not deployed, skip
      }
    }
    
    console.log(`✅ Found ${deployedMarkets.length} deployed markets\n`);

    // Create traders and fund them from main wallet
    const traders = [];
    const mainWallet = provider.wallet.publicKey;
    
    console.log(`💰 Main wallet: ${mainWallet.toBase58()}`);
    const balance = await provider.connection.getBalance(mainWallet);
    console.log(`   Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL\n`);
    
    for (let i = 0; i < 5; i++) {
      const kp = Keypair.generate();
      traders.push({ kp, name: `Trader-${i+1}` });
    }
    
    // Fund all traders in one go
    console.log("💸 Funding traders from main wallet...");
    for (const trader of traders) {
      try {
        const tx = new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: mainWallet,
            toPubkey: trader.kp.publicKey,
            lamports: 2 * LAMPORTS_PER_SOL,
          })
        );
        await provider.sendAndConfirm(tx);
        console.log(`✅ ${trader.name}: 2 SOL`);
      } catch (e) {
        console.log(`❌ ${trader.name}: ${e.message.slice(0, 50)}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`🎲 Making ${50} trades...\n`);

    // Make 50 trades
    for (let i = 0; i < 50; i++) {
      const trader = traders[Math.floor(Math.random() * traders.length)];
      const market = deployedMarkets[Math.floor(Math.random() * deployedMarkets.length)];
      const buyYes = Math.random() > 0.5;
      const amount = new anchor.BN(Math.floor((Math.random() * 0.4 + 0.1) * LAMPORTS_PER_SOL));

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
          .buyShares(buyYes ? { yes: {} } : { no: {} }, amount, positionBump)
          .accounts({
            user: trader.kp.publicKey,
            market: marketPDA,
            position: positionPDA,
          })
          .signers([trader.kp])
          .rpc();

        console.log(`✅ ${i+1}/50: ${trader.name} ${buyYes ? "YES" : "NO"} ${(amount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
      } catch (err: any) {
        console.log(`❌ ${i+1}/50: ${err.message.slice(0, 80)}`);
      }
    }

    console.log("\n🎉 Volume generation complete!");
  });
});
