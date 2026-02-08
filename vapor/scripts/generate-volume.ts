/**
 * Volume Generator - Create realistic trading activity
 * 
 * This script:
 * 1. Creates multiple devnet wallets
 * 2. Distributes SOL to them
 * 3. Makes random trades across markets
 * 4. Generates realistic volume patterns
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Vapor } from "../target/types/vapor";
import fs from "fs";

const PROGRAM_ID = new PublicKey("GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd");
const RPC_URL = "https://api.devnet.solana.com";

interface TraderBot {
  keypair: Keypair;
  name: string;
  strategy: "bullish" | "bearish" | "random" | "contrarian";
}

async function main() {
  console.log("🤖 Vapor Volume Generator");
  console.log("=========================\n");

  // Setup
  const connection = new Connection(RPC_URL, "confirmed");
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || "/Users/saicharan/.config/solana/id.json", "utf-8")))
  );
  
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.Vapor as Program<Vapor>;

  // Check main wallet balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Main wallet: ${walletKeypair.publicKey.toBase58()}`);
  console.log(`   Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  if (balance < 10 * LAMPORTS_PER_SOL) {
    console.log("❌ Need at least 10 SOL in main wallet");
    console.log(`   Send SOL to: ${walletKeypair.publicKey.toBase58()}`);
    process.exit(1);
  }

  // Create trader bots
  const numTraders = 10;
  const traders: TraderBot[] = [];
  const strategies: TraderBot["strategy"][] = ["bullish", "bearish", "random", "contrarian"];

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

  // Distribute SOL to traders
  console.log("💸 Distributing SOL to traders...");
  const solPerTrader = 5; // 5 SOL each
  for (const trader of traders) {
    try {
      const tx = await connection.requestAirdrop(
        trader.keypair.publicKey,
        solPerTrader * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(tx);
      console.log(`   ✅ ${trader.name}: ${solPerTrader} SOL`);
    } catch (err) {
      console.log(`   ⚠️  ${trader.name}: Airdrop failed, trying transfer...`);
      // Fallback to transfer
      const tx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: trader.keypair.publicKey,
          lamports: solPerTrader * LAMPORTS_PER_SOL,
        })
      );
      await provider.sendAndConfirm(tx);
      console.log(`   ✅ ${trader.name}: ${solPerTrader} SOL (transferred)`);
    }
  }
  console.log();

  // Fetch deployed markets from API
  console.log("🔍 Fetching deployed markets...");
  const response = await fetch("https://app-rosy-mu.vercel.app/api/markets");
  const markets = await response.json();
  const deployedMarkets = markets.filter((m: any) => m.marketAddress);
  
  console.log(`   Found ${deployedMarkets.length} deployed markets\n`);

  if (deployedMarkets.length === 0) {
    console.log("❌ No deployed markets found. Deploy some markets first!");
    process.exit(1);
  }

  // Generate trades
  const numTrades = 100; // Total trades to generate
  console.log(`🎲 Generating ${numTrades} trades...\n`);

  for (let i = 0; i < numTrades; i++) {
    const trader = traders[Math.floor(Math.random() * traders.length)];
    const market = deployedMarkets[Math.floor(Math.random() * deployedMarkets.length)];
    
    // Determine trade based on strategy
    let buyYes: boolean;
    switch (trader.strategy) {
      case "bullish":
        buyYes = Math.random() > 0.3; // 70% YES
        break;
      case "bearish":
        buyYes = Math.random() > 0.7; // 30% YES
        break;
      case "contrarian":
        // Bet against current odds
        buyYes = market.yesOdds < 50;
        break;
      default:
        buyYes = Math.random() > 0.5; // 50/50
    }

    // Random amount between 0.1 and 2 SOL
    const amount = (Math.random() * 1.9 + 0.1).toFixed(2);
    const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

    try {
      const marketPubkey = new PublicKey(market.marketAddress);
      
      // Find market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketPubkey.toBuffer()],
        program.programId
      );

      // Create trade
      const traderWallet = new anchor.Wallet(trader.keypair);
      const traderProvider = new anchor.AnchorProvider(connection, traderWallet, { commitment: "confirmed" });
      const traderProgram = new Program(program.idl, program.programId, traderProvider);

      await traderProgram.methods
        .trade(new anchor.BN(amountLamports), buyYes)
        .accounts({
          market: marketPda,
          trader: trader.keypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const outcome = buyYes ? "YES" : "NO";
      console.log(`✅ Trade ${i + 1}/${numTrades}: ${trader.name} bought ${outcome} for ${amount} SOL (${market.projectName.slice(0, 30)}...)`);

      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
      console.log(`❌ Trade ${i + 1} failed: ${err.message}`);
    }
  }

  console.log("\n🎉 Volume generation complete!");
  console.log("   Check the leaderboard and price charts!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
