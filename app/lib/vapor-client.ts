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

// Simple BigInt to LE Buffer helper (replaces bn.js)
function numberToLeBuffer(num: number | bigint, length: number): Buffer {
  const buf = Buffer.alloc(length);
  const bigNum = BigInt(num);
  for (let i = 0; i < length; i++) {
    buf[i] = Number((bigNum >> BigInt(8 * i)) & BigInt(0xff));
  }
  return buf;
}

// Program constants
export const VAPOR_PROGRAM_ID = new PublicKey('GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd');
export const MARKET_SEED = Buffer.from('vapor-market');
export const POSITION_SEED = Buffer.from('vapor-position');

// Get RPC endpoint - prefer Helius if configured
function getRpcEndpoint(): string {
  if (typeof window !== 'undefined') {
    const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    if (heliusKey) {
      return `https://devnet.helius-rpc.com/?api-key=${heliusKey}`;
    }
  }
  return clusterApiUrl('devnet');
}

// Devnet connection
export const connection = new Connection(getRpcEndpoint(), 'confirmed');

// Side enum matching the program
export enum Side {
  Yes = 0,
  No = 1,
}

// Derive market PDA
export function deriveMarketPDA(projectId: number): [PublicKey, number] {
  const projectIdBuffer = Buffer.alloc(8);
  projectIdBuffer.writeBigUInt64LE(BigInt(projectId));
  
  return PublicKey.findProgramAddressSync(
    [MARKET_SEED, projectIdBuffer],
    VAPOR_PROGRAM_ID
  );
}

// Derive position PDA
export function derivePositionPDA(
  marketPDA: PublicKey,
  userWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POSITION_SEED, marketPDA.toBuffer(), userWallet.toBuffer()],
    VAPOR_PROGRAM_ID
  );
}

// Instruction discriminators (first 8 bytes of SHA256 hash of instruction name)
const DISCRIMINATORS = {
  createMarket: Buffer.from([103, 226, 97, 235, 200, 188, 183, 149]),
  buyShares: Buffer.from([153, 238, 44, 87, 109, 153, 106, 160]),
  resolveMarket: Buffer.from([155, 23, 50, 152, 52, 192, 110, 144]),
  claimWinnings: Buffer.from([156, 39, 166, 139, 213, 100, 219, 16]),
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
  const projectIdBuffer = numberToLeBuffer(projectId, 8);
  const timestampBuffer = numberToLeBuffer(resolutionTimestamp, 8);
  
  // String encoding: 4-byte length prefix + utf8 bytes
  const nameBytes = Buffer.from(projectName, 'utf8');
  const nameLen = Buffer.alloc(4);
  nameLen.writeUInt32LE(nameBytes.length);
  
  const data = Buffer.concat([
    DISCRIMINATORS.createMarket,
    projectIdBuffer,
    nameLen,
    nameBytes,
    timestampBuffer,
    Buffer.from([bump]),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: VAPOR_PROGRAM_ID,
    data,
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
  const amountBuffer = numberToLeBuffer(amount, 8);
  
  const data = Buffer.concat([
    DISCRIMINATORS.buyShares,
    Buffer.from([side]),
    amountBuffer,
    Buffer.from([positionBump]),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: true },
      { pubkey: positionPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: VAPOR_PROGRAM_ID,
    data,
  });
}

// Resolve market instruction
export function resolveMarketInstruction(
  authority: PublicKey,
  marketPDA: PublicKey,
  winner: Side
): TransactionInstruction {
  const data = Buffer.concat([
    DISCRIMINATORS.resolveMarket,
    Buffer.from([winner]),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: true },
    ],
    programId: VAPOR_PROGRAM_ID,
    data,
  });
}

// Claim winnings instruction
export function claimWinningsInstruction(
  user: PublicKey,
  marketPDA: PublicKey,
  positionPDA: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: marketPDA, isSigner: false, isWritable: false },
      { pubkey: positionPDA, isSigner: false, isWritable: true },
    ],
    programId: VAPOR_PROGRAM_ID,
    data: DISCRIMINATORS.claimWinnings,
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
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
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
    
    // Parse market data (simplified)
    // Full parsing would decode the entire struct
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

// Get position for a user
export async function getPositionAccount(
  projectId: number,
  userWallet: PublicKey
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
  const [positionPDA] = derivePositionPDA(marketPDA, userWallet);
  
  try {
    const accountInfo = await connection.getAccountInfo(positionPDA);
    
    if (!accountInfo || accountInfo.data.length < 8) {
      return { exists: false, address: positionPDA.toBase58() };
    }
    
    // Parse position data (skip 8-byte discriminator)
    const data = accountInfo.data;
    // owner: 32, market: 32, side: 1, shares: 8, avg_price: 8, bump: 1
    const side = data[8 + 32 + 32] as Side;
    const shares = Number(data.readBigUInt64LE(8 + 32 + 32 + 1));
    const avgPrice = Number(data.readBigUInt64LE(8 + 32 + 32 + 1 + 8));
    
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
