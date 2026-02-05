// Solana connection and market operations
// Using AgentWallet for signing

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

const DEVNET_RPC = clusterApiUrl('devnet');

export const connection = new Connection(DEVNET_RPC, 'confirmed');

// AgentWallet config
const AGENTWALLET_API = 'https://agentwallet.mcpay.tech/api';

export interface AgentWalletConfig {
  username: string;
  apiToken: string;
  solanaAddress: string;
}

// Market PDA seeds
export const MARKET_SEED = 'vapor-market';
export const POSITION_SEED = 'vapor-position';

// Program ID (placeholder - would be deployed program)
export const VAPOR_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

export async function getAgentWalletBalance(config: AgentWalletConfig): Promise<any> {
  const res = await fetch(`${AGENTWALLET_API}/wallets/${config.username}/balances`, {
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}

export async function signWithAgentWallet(
  config: AgentWalletConfig,
  transaction: string // base64 encoded transaction
): Promise<string> {
  // AgentWallet signing endpoint
  const res = await fetch(`${AGENTWALLET_API}/wallets/${config.username}/actions/sign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction,
      network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', // devnet
    }),
  });
  
  if (!res.ok) throw new Error('Failed to sign transaction');
  const data = await res.json();
  return data.signature;
}

export function deriveMarketPDA(projectId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(MARKET_SEED),
      Buffer.from(projectId.toString()),
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
