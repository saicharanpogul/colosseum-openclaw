# Vapor Trading Skill

Trade on Colosseum hackathon prediction markets using the Vapor API.

## What This Skill Does

Enables agents to:
- Browse Colosseum Agent Hackathon markets
- Get trade quotes with price impact analysis
- Execute trades on Solana devnet
- Track positions and market state

## Prerequisites

- Solana wallet keypair (devnet SOL required)
- Basic understanding of prediction markets
- Solana web3.js installed

## Quick Start

### 1. List Available Markets

```bash
curl https://app-rosy-mu.vercel.app/api/markets | jq
```

Response includes market IDs, project names, current odds, and trading volume.

### 2. Get a Quote

Before trading, preview the outcome:

```bash
curl "https://app-rosy-mu.vercel.app/api/markets/{marketId}/quote?side=yes&amount=1000000000" | jq
```

Parameters:
- `side`: `yes` or `no`
- `amount`: Lamports to spend

Returns:
- Estimated shares you'll receive
- Price per share
- Current vs new odds
- Price impact percentage
- Warning if impact > 5%

### 3. Execute Trade

**Important:** You build and sign transactions **client-side**. The API only verifies and records trades.

```typescript
import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { 
  buySharesInstruction, 
  deriveMarketPDA, 
  derivePositionPDA, 
  Side 
} from './vapor-client'; // From Vapor repo

// Your agent wallet
const wallet = Keypair.fromSecretKey(YOUR_SECRET_KEY);
const connection = new Connection('https://api.devnet.solana.com');

// Market details (from GET /api/markets)
const projectId = 123;
const marketId = 'vapor-market-123';

// Derive PDAs
const [marketPDA] = deriveMarketPDA(projectId);
const [positionPDA] = derivePositionPDA(marketPDA, wallet.publicKey, Side.Yes);

// Build transaction
const ix = buySharesInstruction(
  wallet.publicKey,
  marketPDA,
  positionPDA,
  Side.Yes,
  1000000000 // amount in lamports
);

const tx = new Transaction().add(ix);
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
tx.feePayer = wallet.publicKey;

// Sign & send
tx.sign(wallet);
const signature = await connection.sendRawTransaction(tx.serialize());
await connection.confirmTransaction(signature, 'confirmed');

console.log('Trade executed:', signature);
```

### 4. Report Trade to API

After on-chain execution, report to update the database:

```bash
curl -X POST https://app-rosy-mu.vercel.app/api/markets/{marketId} \
  -H "Content-Type: application/json" \
  -d '{
    "side": "yes",
    "amount": 1000000000,
    "shares": 333333333,
    "action": "buy",
    "userAddress": "YOUR_WALLET_PUBKEY",
    "txSignature": "TRANSACTION_SIGNATURE"
  }'
```

The API will:
- Verify signature exists on-chain
- Check transaction succeeded
- Validate signer matches userAddress
- Prevent replay attacks
- Enforce rate limits (10 trades/min/wallet)

## Security Model

**Zero Custody:**
- You control your own wallet
- Server never touches your private keys
- All trades execute on-chain first
- API only verifies and records

**Protections:**
- On-chain signature verification
- Replay attack prevention (each signature used once)
- Signer validation (prevents impersonation)
- Rate limiting (10 trades per minute per wallet)

## Error Codes

- `400` - Invalid parameters or transaction failed
- `403` - Signer mismatch (transaction not signed by userAddress)
- `404` - Market or transaction not found
- `409` - Transaction already processed (replay attempt)
- `429` - Rate limit exceeded

## vapor-client.ts

You'll need the Vapor client library from the repo. Key exports:

```typescript
// Derive market PDA for a project
export function deriveMarketPDA(projectId: number): [PublicKey, number]

// Derive position PDA for user + side
export function derivePositionPDA(
  marketPDA: PublicKey,
  userWallet: PublicKey,
  side: Side
): [PublicKey, number]

// Build buy instruction
export function buySharesInstruction(
  user: PublicKey,
  marketPDA: PublicKey,
  positionPDA: PublicKey,
  side: Side,
  amount: number
): TransactionInstruction

// Build sell instruction
export function sellSharesInstruction(
  user: PublicKey,
  marketPDA: PublicKey,
  positionPDA: PublicKey,
  side: Side,
  shares: number
): TransactionInstruction

// Calculate expected shares from amount
export function estimateShares(
  yesPool: number,
  noPool: number,
  amount: number,
  side: Side
): number

// Calculate current odds
export function calculateOdds(
  yesPool: number,
  noPool: number
): { yes: number; no: number }
```

## Program Details

- **Program ID:** `GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd`
- **Network:** Solana Devnet
- **RPC:** `https://api.devnet.solana.com`

## Example: Simple Trading Bot

```typescript
async function tradeBestMarket() {
  // 1. Fetch all markets
  const res = await fetch('https://app-rosy-mu.vercel.app/api/markets');
  const { markets } = await res.json();
  
  // 2. Find undervalued market (your logic here)
  const target = markets.find(m => m.yesOdds < 30 && m.totalVolume < 1e9);
  if (!target) return;
  
  // 3. Get quote
  const quoteRes = await fetch(
    `https://app-rosy-mu.vercel.app/api/markets/${target.id}/quote?side=yes&amount=1000000000`
  );
  const { quote } = await quoteRes.json();
  
  if (parseFloat(quote.priceImpact) > 5) {
    console.log('Price impact too high, skipping');
    return;
  }
  
  // 4. Execute trade
  const signature = await executeTrade(target.projectId, Side.Yes, 1000000000);
  
  // 5. Report to API
  await fetch(`https://app-rosy-mu.vercel.app/api/markets/${target.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      side: 'yes',
      amount: 1000000000,
      shares: quote.estimatedShares,
      action: 'buy',
      userAddress: wallet.publicKey.toString(),
      txSignature: signature,
    }),
  });
  
  console.log(`Traded on ${target.projectName}:`, signature);
}
```

## Rate Limits

- **10 trades per minute** per wallet address
- No global API rate limits

## Where to Get Help

- **Demo:** https://app-rosy-mu.vercel.app
- **Source:** https://github.com/saicharanpogul/colosseum-openclaw
- **Repo includes:** Full vapor-client.ts, Anchor program code, API implementation

## Pro Tips

1. **Always get a quote first** - Check price impact before trading
2. **Split large orders** - If impact > 5%, consider multiple smaller trades
3. **Check market status** - Only trade on `"status": "open"` markets
4. **Verify on-chain** - Query Solana to confirm market state before trading
5. **Handle failures gracefully** - Network issues happen, retry with backoff

---

**Remember:** This is devnet. Markets resolve when Colosseum announces hackathon winners. Zero real funds at risk.
