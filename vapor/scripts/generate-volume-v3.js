/**
 * Volume Generator - Simpler approach
 * Just track trades in the database for now
 */

const { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } = require("@solana/web3.js");
const fs = require("fs");

const RPC_URL = "https://api.devnet.solana.com";
const API_URL = "https://app-rosy-mu.vercel.app/api";

async function main() {
  console.log("🤖 Vapor Volume Generator (DB + Simulation)");
  console.log("==========================================\n");

  const connection = new Connection(RPC_URL, "confirmed");
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("/Users/saicharan/.config/solana/id.json", "utf-8")))
  );

  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Main wallet: ${walletKeypair.publicKey.toBase58()}`);
  console.log(`   Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL\n`);

  // Create trader bots
  const numTraders = 15;
  const traders = [];
  const strategies = ["bullish", "bearish", "random", "contrarian"];

  console.log(`📦 Creating ${numTraders} trader bots...`);
  for (let i = 0; i < numTraders; i++) {
    const kp = Keypair.generate();
    traders.push({
      address: kp.publicKey.toBase58(),
      name: `Trader-${i + 1}`,
      strategy: strategies[i % strategies.length],
    });
    console.log(`   ${traders[i].name}: ${traders[i].address} (${traders[i].strategy})`);
  }
  console.log();

  // Fetch deployed markets
  console.log("🔍 Fetching deployed markets...");
  const response = await fetch(`${API_URL}/markets`);
  const data = await response.json();
  const deployedMarkets = data.markets.filter(m => m.marketAddress);
  console.log(`   Found ${deployedMarkets.length} deployed markets\n`);

  if (deployedMarkets.length === 0) {
    console.log("❌ No deployed markets");
    process.exit(1);
  }

  // Generate simulated trades and record in DB via admin endpoint
  const numTrades = 150;
  console.log(`🎲 Simulating ${numTrades} trades (recording in DB)...\n`);

  const trades = [];
  for (let i = 0; i < numTrades; i++) {
    const trader = traders[Math.floor(Math.random() * traders.length)];
    const market = deployedMarkets[Math.floor(Math.random() * deployedMarkets.length)];

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

    const amount = parseFloat((Math.random() * 1.9 + 0.1).toFixed(2));

    trades.push({
      marketId: market.id,
      walletAddress: trader.address,
      side: buyYes ? "yes" : "no",
      amount: amount,
      timestamp: Date.now() - Math.floor(Math.random() * 86400000), // Random in last 24h
    });

    const outcome = buyYes ? "YES" : "NO";
    console.log(`   Trade ${i + 1}/${numTrades}: ${trader.name} → ${outcome} ${amount} SOL on "${market.projectName.slice(0, 30)}..."`);
  }

  console.log(`\n💾 Sending ${trades.length} trades to database...`);
  
  // Send in batches
  const batchSize = 20;
  for (let i = 0; i < trades.length; i += batchSize) {
    const batch = trades.slice(i, i + batchSize);
    try {
      const res = await fetch(`${API_URL}/admin/seed-trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: batch }),
      });
      
      if (res.ok) {
        console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} trades recorded`);
      } else {
        const error = await res.text();
        console.log(`   ❌ Batch failed: ${error.slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`   ❌ Batch failed: ${err.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log("\n🎉 Volume generation complete!");
  console.log("   Leaderboard: https://app-rosy-mu.vercel.app/leaderboard");
  console.log("\n⚠️  Note: These are simulated trades in the database.");
  console.log("   For real on-chain volume, you need the full Anchor setup.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
