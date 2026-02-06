// Vapor Program Client
// Handles all on-chain interactions with the deployed Anchor program

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

// Helper: Convert Uint8Array to Buffer for Solana SDK compatibility
function toBuffer(arr: Uint8Array): Buffer {
  return Buffer.from(arr);
}

// Helper: Convert string to Uint8Array
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper: Concat Uint8Arrays
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Simple BigInt to LE Uint8Array helper
function numberToLeBytes(num: number | bigint, length: number): Uint8Array {
  const arr = new Uint8Array(length);
  const bigNum = BigInt(num);
  for (let i = 0; i < length; i++) {
    arr[i] = Number((bigNum >> BigInt(8 * i)) & BigInt(0xff));
  }
  return arr;
}

// Read LE u64 from Uint8Array (browser-safe)
function readU64LE(data: Uint8Array, offset: number): number {
  let value = BigInt(0);
  for (let i = 0; i < 8; i++) {
    value += BigInt(data[offset + i]) << BigInt(8 * i);
  }
  return Number(value);
}

// Program constants
export const VAPOR_PROGRAM_ID = new PublicKey('GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd');
export const MARKET_SEED = stringToBytes('vapor-market');
export const POSITION_SEED = stringToBytes('vapor-position');

// Devnet RPC endpoint
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

// Devnet connection
export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// Side enum matching the program
export enum Side {
  Yes = 0,
  No = 1,
}

// Derive market PDA
export function deriveMarketPDA(projectId: number): [PublicKey, number] {
  const projectIdBuffer = numberToLeBytes(projectId, 8);
  
  return PublicKey.findProgramAddressSync(
    [MARKET_SEED, projectIdBuffer],
    VAPOR_PROGRAM_ID
  );
}

// Derive position PDA (now includes side for separate YES/NO positions)
export function derivePositionPDA(
  marketPDA: PublicKey,
  userWallet: PublicKey,
  side: Side
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POSITION_SEED, marketPDA.toBytes(), userWallet.toBytes(), new Uint8Array([side])],
    VAPOR_PROGRAM_ID
  );
}

// Instruction discriminators (sha256("global:<instruction_name>")[0..8])
const DISCRIMINATORS = {
  createMarket: new Uint8Array([103, 226, 97, 235, 200, 188, 251, 254]),
  buyShares: new Uint8Array([40, 239, 138, 154, 8, 37, 106, 108]),
  resolveMarket: new Uint8Array([155, 23, 80, 173, 46, 74, 23, 239]),
  claimWinnings: new Uint8Array([161, 215, 24, 59, 14, 236, 242, 221]),
};

// Create market instruction
export function createMarketInstruction(
  authority: PublicKey,
  marketPDA: PublicKey,
  projectId: number,
  projectName: string,
  resolutionTimestamp: number,
  bump: number
): TransactionInstruction {
  // Encode instruction data
  const projectIdBuffer = numberToLeBytes(projectId, 8);
  const timestampBuffer = numberToLeBytes(resolutionTimestamp, 8);
  
  // String encoding: 4-byte length prefix + utf8 bytes
  const nameBytes = stringToBytes(projectName);
  const nameLen = numberToLeBytes(nameBytes.length, 4);
  
  const data = concatBytes(
    DISCRIMINATORS.createMarket,
    projectIdBuffer,
    nameLen,
    nameBytes,
    timestampBuffer,
    new Uint8Array([bump]),
  );

  return new TransactionInstruction({
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: VAPOR_PROGRAM_ID,
    data: toBuffer(data),
  });
}

// Buy shares instruction
export function buySharesInstruction(
  user: PublicKey,
  marketPDA: PublicKey,
  positionPDA: PublicKey,
  side: Side,
  amount: number,
  positionBump: number
): TransactionInstruction {
  const amountBuffer = numberToLeBytes(amount, 8);
  
  const data = concatBytes(
    DISCRIMINATORS.buyShares,
    new Uint8Array([side]),
    amountBuffer,
    new Uint8Array([positionBump]),
  );

  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: true },
      { pubkey: positionPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: VAPOR_PROGRAM_ID,
    data: toBuffer(data),
  });
}

// Resolve market instruction
export function resolveMarketInstruction(
  authority: PublicKey,
  marketPDA: PublicKey,
  winner: Side
): TransactionInstruction {
  const data = concatBytes(
    DISCRIMINATORS.resolveMarket,
    new Uint8Array([winner]),
  );

  return new TransactionInstruction({
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: true },
    ],
    programId: VAPOR_PROGRAM_ID,
    data: toBuffer(data),
  });
}

// Claim winnings instruction (now requires side)
export function claimWinningsInstruction(
  user: PublicKey,
  marketPDA: PublicKey,
  positionPDA: PublicKey,
  side: Side
): TransactionInstruction {
  const data = concatBytes(
    DISCRIMINATORS.claimWinnings,
    new Uint8Array([side]),
  );
  
  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: false },
      { pubkey: positionPDA, isSigner: false, isWritable: true },
    ],
    programId: VAPOR_PROGRAM_ID,
    data: toBuffer(data),
  });
}

// Build and send transaction helper
export async function buildTransaction(
  connection: Connection,
  payer: PublicKey,
  instructions: TransactionInstruction[]
): Promise<Transaction> {
  const tx = new Transaction();
  
  for (const ix of instructions) {
    tx.add(ix);
  }
  
  tx.feePayer = payer;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  
  return tx;
}

// Check if market exists on-chain
export async function getMarketAccount(projectId: number): Promise<{
  exists: boolean;
  address: string;
  data?: any;
}> {
  const [marketPDA] = deriveMarketPDA(projectId);
  
  try {
    const accountInfo = await connection.getAccountInfo(marketPDA);
    
    if (!accountInfo) {
      return { exists: false, address: marketPDA.toBase58() };
    }
    
    return { 
      exists: true, 
      address: marketPDA.toBase58(),
      data: {
        raw: accountInfo.data,
      }
    };
  } catch (error) {
    return { exists: false, address: marketPDA.toBase58() };
  }
}

// Get position for a user (for a specific side)
export async function getPositionAccount(
  projectId: number,
  userWallet: PublicKey,
  side: Side
): Promise<{
  exists: boolean;
  address: string;
  data?: {
    side: Side;
    shares: number;
    avgPrice: number;
  };
}> {
  const [marketPDA] = deriveMarketPDA(projectId);
  const [positionPDA] = derivePositionPDA(marketPDA, userWallet, side);
  
  try {
    const accountInfo = await connection.getAccountInfo(positionPDA);
    
    if (!accountInfo || accountInfo.data.length < 8) {
      return { exists: false, address: positionPDA.toBase58() };
    }
    
    // Parse position data (skip 8-byte discriminator)
    const data = new Uint8Array(accountInfo.data);
    // owner: 32, market: 32, side: 1, shares: 8, avg_price: 8, bump: 1
    const side = data[8 + 32 + 32] as Side;
    const shares = readU64LE(data, 8 + 32 + 32 + 1);
    const avgPrice = readU64LE(data, 8 + 32 + 32 + 1 + 8);
    
    return { 
      exists: shares > 0, 
      address: positionPDA.toBase58(),
      data: { side, shares, avgPrice }
    };
  } catch (error) {
    return { exists: false, address: positionPDA.toBase58() };
  }
}

// Calculate estimated shares from CPMM
export function estimateShares(
  yesPool: number,
  noPool: number,
  amount: number,
  side: Side
): number {
  const pool = side === Side.Yes ? yesPool : noPool;
  const oppositePool = side === Side.Yes ? noPool : yesPool;
  
  const k = pool * oppositePool;
  const newOpposite = oppositePool + amount;
  const newPool = k / newOpposite;
  
  return Math.floor(pool - newPool);
}

// Calculate odds from pools
export function calculateOdds(yesPool: number, noPool: number): { yes: number; no: number } {
  const total = yesPool + noPool;
  if (total === 0) return { yes: 50, no: 50 };
  
  return {
    yes: Math.round((noPool / total) * 100),
    no: Math.round((yesPool / total) * 100),
  };
}

// Format lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

// Format SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
