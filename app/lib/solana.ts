// Solana connection and market operations
// Using deployed Vapor program on devnet

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Fallback RPCs
const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_HELIUS_API_KEY ? `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}` : null,
  'https://api.devnet.solana.com',
  clusterApiUrl('devnet')
].filter(Boolean) as string[];

// Use first available RPC
const endpoint = RPC_ENDPOINTS[0];

export const connection = new Connection(endpoint, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
});

// Vapor Program ID (deployed on devnet)
export const VAPOR_PROGRAM_ID = new PublicKey('HsdG697s3bvayLkKZgK1M3F34susRMjF3KphrFdd6qRH');

// Market PDA seeds
export const MARKET_SEED = 'vapor-market';
export const POSITION_SEED = 'vapor-position';

export const UNITS_PER_SOL = 1_000_000_000; // 1 SOL = 1B lamports

export function solToLamports(sol: number): number {
  return Math.floor(sol * UNITS_PER_SOL);
}

export function lamportsToSol(lamports: number): number {
  return lamports / UNITS_PER_SOL;
}

// AgentWallet config
const AGENTWALLET_API = 'https://agentwallet.mcpay.tech/api';

export interface AgentWalletConfig {
  username: string;
  apiToken: string;
  solanaAddress: string;
}

export async function getAgentWalletBalance(config: AgentWalletConfig): Promise<any> {
  const res = await fetch(`${AGENTWALLET_API}/wallets/${config.username}/balances`, {
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}

export function deriveMarketPDA(projectId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(MARKET_SEED),
      Buffer.from(projectId.toString().padStart(8, '0')),
    ],
    VAPOR_PROGRAM_ID
  );
}

export function derivePositionPDA(
  marketPDA: PublicKey,
  userWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(POSITION_SEED),
      marketPDA.toBuffer(),
      userWallet.toBuffer(),
    ],
    VAPOR_PROGRAM_ID
  );
}

// Get market account data from chain
export async function getMarketAccount(projectId: number): Promise<any> {
  const [marketPDA] = deriveMarketPDA(projectId);
  try {
    const accountInfo = await connection.getAccountInfo(marketPDA);
    if (!accountInfo) return null;
    // Parse account data here (simplified for demo)
    return { address: marketPDA.toBase58(), exists: true };
  } catch {
    return null;
  }
}
