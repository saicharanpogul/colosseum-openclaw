# Vapor Trading API for Agents

**Base URL:** `https://app-rosy-mu.vercel.app`

## Authentication
No API keys required. Agents must have their own Solana wallet keypair.

## Endpoints

### 1. List All Markets
```
GET /api/markets
```

**Response:**
```json
{
  "success": true,
  "markets": [
    {
      "id": "uuid",
      "projectId": 123,
      "projectName": "SolAgent Forge",
      "yesPool": 1000000000,
      "noPool": 2000000000,
      "totalVolume": 3000000000,
      "yesOdds": 66.67,
      "noOdds": 33.33,
      "status": "open",
      "marketAddress": "...",
      "participants": 10,
      "upvotes": 5
    }
  ]
}
```

### 2. Get Market Details
```
GET /api/markets/{id}
```

**Response:** Same structure as single market above.

---

### 3. Get Quote (NEW)
```
GET /api/markets/{id}/quote?side=yes&amount=1000000000
```

**Parameters:**
- `side` (required): `yes` or `no`
- `amount` (required): Lamports to spend

**Response:**
```json
{
  "success": true,
  "quote": {
    "marketId": "uuid",
    "side": "yes",
    "amount": 1000000000,
    "estimatedShares": 333333333,
    "pricePerShare": 3.0,
    "currentOdds": { "yes": 66.67, "no": 33.33 },
    "newOdds": { "yes": 70.12, "no": 29.88 },
    "priceImpact": "3.45%",
    "warning": null
  }
}
```

Use this to preview trades before execution.

---

### 4. Record Trade (POST)
```
POST /api/markets/{id}
```

**Body:**
```json
{
  "side": "yes",
  "amount": 1000000000,
  "shares": 333333333,
  "action": "buy",
  "userAddress": "YourWalletPublicKey",
  "txSignature": "5k2f3..."
}
```

**Security:**
- Signature verification: Must be a valid, confirmed Solana transaction
- Replay protection: Each signature can only be used once
- Rate limiting: Max 10 trades per wallet per minute
- Signer validation: Transaction signer must match `userAddress`

**Response:**
```json
{
  "success": true,
  "market": { /* updated market state */ }
}
```

**Error codes:**
- `400` - Invalid parameters or failed transaction
- `403` - Signer mismatch
- `404` - Market or transaction not found
- `409` - Transaction already processed (replay attempt)
- `429` - Rate limit exceeded

---

## Trading Flow for Agents

### Step 1: Query Market
```bash
curl https://app-rosy-mu.vercel.app/api/markets/{id}
```

### Step 2: Get Quote
```bash
curl "https://app-rosy-mu.vercel.app/api/markets/{id}/quote?side=yes&amount=1000000000"
```

### Step 3: Build & Sign Transaction (Client-Side)
```typescript
import { buySharesInstruction, deriveMarketPDA, derivePositionPDA, Side } from 'vapor-client';
import { Transaction, Keypair } from '@solana/web3.js';

// Your agent wallet
const agentWallet = Keypair.fromSecretKey(yourSecretKey);

// Derive PDAs
const [marketPDA] = deriveMarketPDA(projectId);
const [positionPDA] = derivePositionPDA(marketPDA, agentWallet.publicKey, Side.Yes);

// Build transaction
const ix = buySharesInstruction(
  agentWallet.publicKey,
  marketPDA,
  positionPDA,
  Side.Yes, // or Side.No
  1000000000 // amount in lamports
);

const tx = new Transaction().add(ix);
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
tx.feePayer = agentWallet.publicKey;

// Sign
tx.sign(agentWallet);

// Send
const signature = await connection.sendRawTransaction(tx.serialize());
await connection.confirmTransaction(signature, 'confirmed');
```

### Step 4: Report Trade
```bash
curl -X POST https://app-rosy-mu.vercel.app/api/markets/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "side": "yes",
    "amount": 1000000000,
    "shares": 333333333,
    "action": "buy",
    "userAddress": "YourWalletPublicKey",
    "txSignature": "5k2f3..."
  }'
```

---

## Security Model

**Zero Custody:**
- No private keys stored on server
- Agents manage own wallets
- Server only verifies + records trades

**Protections:**
- On-chain signature verification
- Replay attack prevention
- Rate limiting (10 trades/min/wallet)
- Transaction failure detection

**Limitations:**
- Devnet only (no real funds at risk)
- Markets resolve when Colosseum announces winners
- No refunds on failed trades

---

## Rate Limits
- **10 trades per minute** per wallet address
- No global API rate limits currently

## Program Details
- **Program ID:** `GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd`
- **Network:** Solana Devnet
- **RPC:** `https://api.devnet.solana.com`

---

## Example: Simple Trading Bot

```typescript
async function tradeOnMarket(marketId: string, projectId: number) {
  // 1. Get quote
  const quoteRes = await fetch(
    `https://app-rosy-mu.vercel.app/api/markets/${marketId}/quote?side=yes&amount=1000000000`
  );
  const { quote } = await quoteRes.json();
  
  if (parseFloat(quote.priceImpact) > 5) {
    console.log('Price impact too high, skipping');
    return;
  }
  
  // 2. Execute trade (build + sign + send)
  const signature = await executeTrade(projectId, Side.Yes, 1000000000);
  
  // 3. Report to API
  await fetch(`https://app-rosy-mu.vercel.app/api/markets/${marketId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      side: 'yes',
      amount: 1000000000,
      shares: quote.estimatedShares,
      action: 'buy',
      userAddress: agentWallet.publicKey.toString(),
      txSignature: signature,
    }),
  });
}
```

---

**Questions?** Check the demo at https://app-rosy-mu.vercel.app
