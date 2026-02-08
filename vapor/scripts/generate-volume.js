/**
 * Volume Generator - Create realistic trading activity
 * Simplified version using direct web3.js
 */

const { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } = require("@solana/web3.js");
const fs = require("fs");

const PROGRAM_ID = new PublicKey("GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd");
const RPC_URL = "https://api.devnet.solana.com";
const API_URL = "https://app-rosy-mu.vercel.app/api";

async function main() {
  console.log("🤖 Vapor Volume Generator");
  console.log("=========================\n");

  const connection = new Connection(RPC_URL, "confirmed");
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || "/Users/saicharan/.config/solana/id.json", "utf-8")))
  );

  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Main wallet: ${walletKeypair.publicKey.toBase58()}`);
  console.log(`   Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  if (balance < 50 * LAMPORTS_PER_SOL) {
    console.log("❌ Need at least 50 SOL in main wallet");
    process.exit(1);
  }

  // Create trader bots
  const numTraders = 10;
  const traders = [];
  const strategies = ["bullish", "bearish", "random", "contrarian"];

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
  const solPerTrader = 5;
  for (const trader of traders) {
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: trader.keypair.publicKey,
          lamports: solPerTrader * LAMPORTS_PER_SOL,
        })
      );
      const sig = await connection.sendTransaction(tx, [walletKeypair]);
      await connection.confirmTransaction(sig);
      console.log(`   ✅ ${trader.name}: ${solPerTrader} SOL`);
    } catch (err) {
      console.log(`   ❌ ${trader.name}: Failed - ${err.message}`);
    }
  }
  console.log();

  // Fetch deployed markets
  console.log("🔍 Fetching deployed markets...");
  const response = await fetch(`${API_URL}/markets`);
  const data = await response.json();
  const deployedMarkets = data.markets.filter(m => m.marketAddress);
  
  console.log(`   Found ${deployedMarkets.length} deployed markets\n`);

  if (deployedMarkets.length === 0) {
    console.log("❌ No deployed markets found!");
    process.exit(1);
  }

  // Generate trades via API
  const numTrades = 100;
  console.log(`🎲 Generating ${numTrades} trades via API...\n`);

  for (let i = 0; i < numTrades; i++) {
    const trader = traders[Math.floor(Math.random() * traders.length)];
    const market = deployedMarkets[Math.floor(Math.random() * deployedMarkets.length)];
    
    // Determine trade
    let buyYes;
    switch (trader.strategy) {
      case "bullish":
        buyYes = Math.random() > 0.3;
        break;
      case "bearish":
        buyYes = Math.random() > 0.7;
        break;
      case "contrarian":
        buyYes = market.yesOdds < 50;
        break;
      default:
        buyYes = Math.random() > 0.5;
    }

    const amount = (Math.random() * 1.9 + 0.1).toFixed(2);

    try {
      // Use the agent API to place trade
      const tradeResponse = await fetch(`${API_URL}/markets/${market.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: trader.keypair.publicKey.toBase58(),
          amount: parseFloat(amount),
          side: buyYes ? "yes" : "no",
        }),
      });

      if (tradeResponse.ok) {
        const outcome = buyYes ? "YES" : "NO";
        console.log(`✅ Trade ${i + 1}/${numTrades}: ${trader.name} bought ${outcome} for ${amount} SOL on "${market.projectName.slice(0, 40)}..."`);
      } else {
        const error = await tradeResponse.text();
        console.log(`❌ Trade ${i + 1} failed: ${error.slice(0, 100)}`);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (err) {
      console.log(`❌ Trade ${i + 1} failed: ${err.message}`);
    }
  }

  console.log("\n🎉 Volume generation complete!");
  console.log("   Check leaderboard: https://app-rosy-mu.vercel.app/leaderboard");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
