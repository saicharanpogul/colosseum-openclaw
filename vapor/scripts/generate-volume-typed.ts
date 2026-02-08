/**
 * Volume Generator - Using generated TypeScript types
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vapor } from "../target/types/vapor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd");
const RPC_URL = "https://api.devnet.solana.com";
const API_URL = "https://app-rosy-mu.vercel.app/api";

async function main() {
  console.log("🤖 Vapor Volume Generator (TypeScript)");
  console.log("======================================\n");

  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("/Users/saicharan/.config/solana/id.json", "utf-8")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  
  // Load IDL and create program manually
  const idl = JSON.parse(fs.readFileSync("./target/idl/vapor.json", "utf-8"));
  const program = new Program(idl as any, PROGRAM_ID, provider);

  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Main wallet: ${walletKeypair.publicKey.toBase58()}`);
  console.log(`   Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL\n`);

  // Create 5 trader bots
  const numTraders = 5;
  const traders = [];
  const strategies = ["bullish", "bearish", "random"];

  console.log(`📦 Creating ${numTraders} trader bots...`);
  for (let i = 0; i < numTraders; i++) {
    const kp = Keypair.generate();
    traders.push({
      keypair: kp,
      name: `Trader-${i + 1}`,
      strategy: strategies[i % strategies.length],
    });
    console.log(`   ${traders[i].name}: ${kp.publicKey.toBase58()} (${traders[i].strategy})`);
  }
  console.log();

  // Distribute SOL
  console.log("💸 Distributing SOL to traders...");
  const solPerTrader = 2;
  for (const trader of traders) {
    try {
      const tx = new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: trader.keypair.publicKey,
          lamports: solPerTrader * LAMPORTS_PER_SOL,
        })
      );
      await provider.sendAndConfirm(tx);
      console.log(`   ✅ ${trader.name}: ${solPerTrader} SOL`);
    } catch (err: any) {
      console.log(`   ❌ ${trader.name}: ${err.message}`);
    }
  }
  console.log();

  // Wait for confirmations
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Fetch markets
  console.log("🔍 Fetching deployed markets...");
  const response = await fetch(`${API_URL}/markets`);
  const data: any = await response.json();
  const deployedMarkets = data.markets.filter((m: any) => m.marketAddress);
  console.log(`   Found ${deployedMarkets.length} deployed markets\n`);

  if (deployedMarkets.length === 0) {
    console.log("❌ No deployed markets");
    process.exit(1);
  }

  // Generate 20 trades
  const numTrades = 20;
  console.log(`🎲 Generating ${numTrades} on-chain trades...\n`);

  for (let i = 0; i < numTrades; i++) {
    const trader = traders[Math.floor(Math.random() * traders.length)];
    const market = deployedMarkets[Math.floor(Math.random() * deployedMarkets.length)];

    let buyYes: boolean;
    switch (trader.strategy) {
      case "bullish":
        buyYes = Math.random() > 0.3;
        break;
      case "bearish":
        buyYes = Math.random() > 0.7;
        break;
      default:
        buyYes = Math.random() > 0.5;
    }

    const amount = parseFloat((Math.random() * 0.4 + 0.1).toFixed(2));
    const amountLamports = Math.floor(amount * LAMPORTS_PER_SOL);

    try {
      const marketPubkey = new PublicKey(market.marketAddress);

      // Derive position PDA with correct seeds
      const side = buyYes ? 0 : 1;
      const [positionPda, positionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vapor-position"),
          marketPubkey.toBuffer(),
          trader.keypair.publicKey.toBuffer(),
          Buffer.from([side]),
        ],
        program.programId
      );

      // Create trader provider
      const traderWallet = new anchor.Wallet(trader.keypair);
      const traderProvider = new anchor.AnchorProvider(connection, traderWallet, { commitment: "confirmed" });
      const traderProgram = new Program(idl as any, PROGRAM_ID, traderProvider);

      // Call buyShares with correct Side enum format
      const sideEnum = buyYes ? { yes: {} } : { no: {} };
      await traderProgram.methods
        .buyShares(sideEnum, new anchor.BN(amountLamports), positionBump)
        .accounts({
          user: trader.keypair.publicKey,
          market: marketPubkey,
          position: positionPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const outcome = buyYes ? "YES" : "NO";
      console.log(`✅ Trade ${i + 1}/${numTrades}: ${trader.name} bought ${outcome} for ${amount} SOL on "${market.projectName.slice(0, 30)}..."`);

      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (err: any) {
      console.log(`❌ Trade ${i + 1} failed: ${err.message.slice(0, 100)}`);
    }
  }

  console.log("\n🎉 Volume generation complete!");
  console.log("   Check: https://app-rosy-mu.vercel.app/leaderboard");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
