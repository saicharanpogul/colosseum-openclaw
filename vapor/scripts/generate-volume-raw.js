/**
 * Volume Generator - Raw Web3.js (no Anchor)
 * Directly calls program instructions
 */

const { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } = require("@solana/web3.js");
const fs = require("fs");
const borsh = require("borsh");

const PROGRAM_ID = new PublicKey("GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd");
const RPC_URL = "https://api.devnet.solana.com";
const API_URL = "https://app-rosy-mu.vercel.app/api";

// Instruction discriminators from IDL
const BUY_SHARES_DISCRIMINATOR = Buffer.from([40, 239, 138, 154, 8, 37, 106, 108]);

// Borsh schema for Side enum: 0 = Yes, 1 = No
// buy_shares args: (Side, u64 amount, u8 position_bump)
function serializeBuyShares(isYes, amount, positionBump) {
  const data = Buffer.alloc(1 + 8 + 1);
  data.writeUInt8(isYes ? 0 : 1, 0);  // Side enum
  data.writeBigUInt64LE(BigInt(amount), 1);  // u64 amount
  data.writeUInt8(positionBump, 9);  // u8 bump
  return Buffer.concat([BUY_SHARES_DISCRIMINATOR, data]);
}

function findProgramAddress(seeds, programId) {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

async function main() {
  console.log("🤖 Vapor Volume Generator (Raw Web3)");
  console.log("====================================\n");

  const connection = new Connection(RPC_URL, "confirmed");
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("/Users/saicharan/.config/solana/id.json", "utf-8")))
  );

  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Main wallet: ${walletKeypair.publicKey.toBase58()}`);
  console.log(`   Balance: ${(balance / 1e9).toFixed(2)} SOL\n`);

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
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: trader.keypair.publicKey,
          lamports: solPerTrader * 1e9,
        })
      );
      await connection.sendTransaction(tx, [walletKeypair]);
      console.log(`   ✅ ${trader.name}: ${solPerTrader} SOL`);
    } catch (err) {
      console.log(`   ❌ ${trader.name}: ${err.message}`);
    }
  }
  console.log();

  // Wait for transfers
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Fetch markets
  console.log("🔍 Fetching deployed markets...");
  const response = await fetch(`${API_URL}/markets`);
  const data = await response.json();
  const deployedMarkets = data.markets.filter(m => m.marketAddress);
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

    let buyYes;
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

    const amount = (Math.random() * 0.4 + 0.1).toFixed(2);
    const amountLamports = Math.floor(parseFloat(amount) * 1e9);

    try {
      const marketPubkey = new PublicKey(market.marketAddress);

      // Derive position PDA
      const sideStr = buyYes ? "yes" : "no";
      const [positionPda, positionBump] = findProgramAddress(
        [
          Buffer.from("position"),
          marketPubkey.toBuffer(),
          trader.keypair.publicKey.toBuffer(),
          Buffer.from(sideStr),
        ],
        PROGRAM_ID
      );

      // Serialize instruction data
      const data = serializeBuyShares(buyYes, amountLamports, positionBump);

      // Create instruction
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: trader.keypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: marketPubkey, isSigner: false, isWritable: true },
          { pubkey: positionPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      });

      const tx = new Transaction().add(instruction);
      const sig = await connection.sendTransaction(tx, [trader.keypair]);
      await connection.confirmTransaction(sig);

      const outcome = buyYes ? "YES" : "NO";
      console.log(`✅ Trade ${i + 1}/${numTrades}: ${trader.name} bought ${outcome} for ${amount} SOL on "${market.projectName.slice(0, 30)}..."`);

      await new Promise(resolve => setTimeout(resolve, 800));
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
