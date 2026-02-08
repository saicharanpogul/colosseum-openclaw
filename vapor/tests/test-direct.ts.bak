// Direct test script for Vapor program on devnet
// Run with: npx ts-node tests/test-direct.ts

import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const PROGRAM_ID = new PublicKey('GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd');
const MARKET_SEED = Buffer.from('vapor-market');
const POSITION_SEED = Buffer.from('vapor-position');

// Helper functions
function numberToLeBytes(num: number | bigint, length: number): Uint8Array {
  const arr = new Uint8Array(length);
  const bigNum = BigInt(num);
  for (let i = 0; i < length; i++) {
    arr[i] = Number((bigNum >> BigInt(8 * i)) & BigInt(0xff));
  }
  return arr;
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function concatBytes(...arrays: Uint8Array[]): Buffer {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return Buffer.from(result);
}

// Discriminators (sha256("global:<name>")[0..8])
const DISCRIMINATORS = {
  createMarket: new Uint8Array([103, 226, 97, 235, 200, 188, 251, 254]),
  buyShares: new Uint8Array([40, 239, 138, 154, 8, 37, 106, 108]),
  resolveMarket: new Uint8Array([155, 23, 80, 173, 46, 74, 23, 239]),
  claimWinnings: new Uint8Array([161, 215, 24, 59, 14, 236, 242, 221]),
};

async function main() {
  console.log('🔥 Vapor Program Test Suite');
  console.log('============================\n');
  
  // Load keypair
  const keypairPath = path.join(process.env.HOME!, '.config/solana/id.json');
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  const authority = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  console.log('Authority:', authority.publicKey.toBase58());
  
  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(authority.publicKey);
  console.log('Balance:', balance / LAMPORTS_PER_SOL, 'SOL\n');
  
  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.log('❌ Insufficient balance. Need at least 0.1 SOL');
    return;
  }
  
  // Random project ID for this test
  const projectId = Math.floor(Math.random() * 1000000);
  const projectName = 'TestProject' + projectId;
  const resolutionTimestamp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  
  console.log('Test Project ID:', projectId);
  console.log('Test Project Name:', projectName);
  
  // Derive Market PDA
  const [marketPDA, marketBump] = PublicKey.findProgramAddressSync(
    [MARKET_SEED, numberToLeBytes(projectId, 8)],
    PROGRAM_ID
  );
  console.log('\nMarket PDA:', marketPDA.toBase58());
  
  // Derive Position PDA
  const [positionPDA, positionBump] = PublicKey.findProgramAddressSync(
    [POSITION_SEED, marketPDA.toBuffer(), authority.publicKey.toBuffer()],
    PROGRAM_ID
  );
  console.log('Position PDA:', positionPDA.toBase58());
  
  // Test 1: Create Market
  console.log('\n--- Test 1: Create Market ---');
  try {
    const nameBytes = stringToBytes(projectName);
    const nameLen = numberToLeBytes(nameBytes.length, 4);
    
    const createMarketData = concatBytes(
      DISCRIMINATORS.createMarket,
      numberToLeBytes(projectId, 8),
      nameLen,
      nameBytes,
      numberToLeBytes(resolutionTimestamp, 8),
      new Uint8Array([marketBump]),
    );
    
    const createMarketIx = new TransactionInstruction({
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: marketPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: createMarketData,
    });
    
    const tx1 = new Transaction().add(createMarketIx);
    const sig1 = await sendAndConfirmTransaction(connection, tx1, [authority]);
    console.log('✅ Create Market TX:', sig1);
    
    // Verify market created
    const marketAccount = await connection.getAccountInfo(marketPDA);
    if (marketAccount) {
      console.log('✅ Market account exists, size:', marketAccount.data.length, 'bytes');
    }
  } catch (err: any) {
    console.log('❌ Create Market failed:', err.message);
    if (err.logs) console.log('Logs:', err.logs);
    return;
  }
  
  // Test 2: Buy YES shares
  console.log('\n--- Test 2: Buy YES Shares ---');
  try {
    const amount = 100_000; // 0.0001 SOL
    const side = 0; // Yes = 0
    
    const buySharesData = concatBytes(
      DISCRIMINATORS.buyShares,
      new Uint8Array([side]),
      numberToLeBytes(amount, 8),
      new Uint8Array([positionBump]),
    );
    
    const buySharesIx = new TransactionInstruction({
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: marketPDA, isSigner: false, isWritable: true },
        { pubkey: positionPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: buySharesData,
    });
    
    const tx2 = new Transaction().add(buySharesIx);
    const sig2 = await sendAndConfirmTransaction(connection, tx2, [authority]);
    console.log('✅ Buy Shares TX:', sig2);
    
    // Verify position created
    const positionAccount = await connection.getAccountInfo(positionPDA);
    if (positionAccount) {
      console.log('✅ Position account exists, size:', positionAccount.data.length, 'bytes');
    }
  } catch (err: any) {
    console.log('❌ Buy Shares failed:', err.message);
    if (err.logs) console.log('Logs:', err.logs);
    return;
  }
  
  // Test 3: Resolve Market
  console.log('\n--- Test 3: Resolve Market ---');
  try {
    const winner = 0; // Yes = 0
    
    const resolveData = concatBytes(
      DISCRIMINATORS.resolveMarket,
      new Uint8Array([winner]),
    );
    
    const resolveIx = new TransactionInstruction({
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: marketPDA, isSigner: false, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: resolveData,
    });
    
    const tx3 = new Transaction().add(resolveIx);
    const sig3 = await sendAndConfirmTransaction(connection, tx3, [authority]);
    console.log('✅ Resolve Market TX:', sig3);
  } catch (err: any) {
    console.log('❌ Resolve Market failed:', err.message);
    if (err.logs) console.log('Logs:', err.logs);
    return;
  }
  
  // Test 4: Claim Winnings
  console.log('\n--- Test 4: Claim Winnings ---');
  try {
    const claimIx = new TransactionInstruction({
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: marketPDA, isSigner: false, isWritable: false },
        { pubkey: positionPDA, isSigner: false, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.claimWinnings),
    });
    
    const tx4 = new Transaction().add(claimIx);
    const sig4 = await sendAndConfirmTransaction(connection, tx4, [authority]);
    console.log('✅ Claim Winnings TX:', sig4);
  } catch (err: any) {
    console.log('❌ Claim Winnings failed:', err.message);
    if (err.logs) console.log('Logs:', err.logs);
    return;
  }
  
  console.log('\n============================');
  console.log('🎉 All tests passed!');
  console.log('============================');
}

main().catch(console.error);
