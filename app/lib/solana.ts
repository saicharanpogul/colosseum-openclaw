// Solana connection and market operations
// Using deployed Vapor program on devnet

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

const DEVNET_RPC = clusterApiUrl('devnet');

export const connection = new Connection(DEVNET_RPC, 'confirmed');

// Vapor Program ID (deployed on devnet)
export const VAPOR_PROGRAM_ID = new PublicKey('GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd');

// Market PDA seeds
export const MARKET_SEED = 'vapor-market';
export const POSITION_SEED = 'vapor-position';

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
