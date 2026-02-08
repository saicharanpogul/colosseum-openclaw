/**
 * Volume Generator - Create realistic trading activity
 * Uses Anchor program directly for real on-chain trades
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = require("@solana/web3.js");
const fs = require("fs");

// Load IDL
const idl = JSON.parse(fs.readFileSync("./target/idl/vapor.json", "utf-8"));

const PROGRAM_ID = new PublicKey("GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd");
const RPC_URL = "https://api.devnet.solana.com";
const API_URL = "https://app-rosy-mu.vercel.app/api";

async function main() {
  console.log("🤖 Vapor Volume Generator (On-Chain)");
  console.log("====================================\n");

  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
  const walletKeypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || "/Users/saicharan/.config/solana/id.json", "utf-8")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new anchor.Program(idl, PROGRAM_ID, provider);

  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Main wallet: ${walletKeypair.publicKey.toBase58()}`);
  console.log(`   Balance: ${(balance / 1e9).toFixed(2)} SOL\n`);

  if (balance < 10e9) {
    console.log("❌ Need at least 10 SOL");
    process.exit(1);
  }

  // Create trader bots
  const numTraders = 8;
  const traders = [];
  const strategies = ["bullish", "bearish", "random", "contrarian"];

  console.log(`📦 Creating ${numTraders} trader bots...`);
  for (let i = 0; i < numTraders; i++) {
    const kp = anchor.web3.Keypair.generate();
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
  const solPerTrader = 3;
  for (const trader of traders) {
    try {
      const tx = new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: trader.keypair.publicKey,
          lamports: solPerTrader * 1e9,
        })
      );
      await provider.sendAndConfirm(tx);
      console.log(`   ✅ ${trader.name}: ${solPerTrader} SOL`);
    } catch (err) {
      console.log(`   ❌ ${trader.name}: ${err.message}`);
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
    console.log("❌ No deployed markets");
    process.exit(1);
  }

  // Generate trades
  const numTrades = 80;
  console.log(`🎲 Generating ${numTrades} on-chain trades...\n`);

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

    const amount = (Math.random() * 0.9 + 0.1).toFixed(2);
    const amountLamports = Math.floor(parseFloat(amount) * 1e9);

    try {
      const marketPubkey = new PublicKey(market.marketAddress);

      // Derive position PDA
      const side = buyYes ? { yes: {} } : { no: {} };
      const [positionPda, positionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          marketPubkey.toBuffer(),
          trader.keypair.publicKey.toBuffer(),
          Buffer.from(buyYes ? "yes" : "no"),
        ],
        program.programId
      );

      // Create trader provider
      const traderWallet = new anchor.Wallet(trader.keypair);
      const traderProvider = new anchor.AnchorProvider(connection, traderWallet, { commitment: "confirmed" });
      const traderProgram = new anchor.Program(idl, PROGRAM_ID, traderProvider);

      await traderProgram.methods
        .buyShares(side, new anchor.BN(amountLamports), positionBump)
        .accounts({
          market: marketPubkey,
          position: positionPda,
          user: trader.keypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const outcome = buyYes ? "YES" : "NO";
      console.log(`✅ Trade ${i + 1}/${numTrades}: ${trader.name} bought ${outcome} for ${amount} SOL on "${market.projectName.slice(0, 35)}..."`);

      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (err) {
      console.log(`❌ Trade ${i + 1} failed: ${err.message.slice(0, 80)}`);
    }
  }

  console.log("\n🎉 Volume generation complete!");
  console.log("   Leaderboard: https://app-rosy-mu.vercel.app/leaderboard");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
