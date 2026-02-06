# Vapor 💨

**Prediction Markets for Colosseum Hackathon Submissions**

Vapor is an autonomous prediction market system that converts Colosseum hackathon project submissions into YES/NO prediction markets on Solana devnet. Built for the Colosseum Agent Hackathon.

🔗 **Live Demo:** https://app-rosy-mu.vercel.app  
📦 **Program ID:** `51yNKeu2zXajKMy53BitcGDnQMpdBLWuK75sff7eL14P`

---

## How It Works

### 1. Automatic Market Creation

Vapor fetches all submitted projects from the Colosseum API and creates a prediction market for each one:

```
"Will [Project Name] win the Colosseum Agent Hackathon?"
```

- **114+ markets** created automatically from live Colosseum data
- Markets refresh on each page load via `/api/markets`
- Each market gets a unique on-chain PDA derived from the project ID

### 2. Constant Product Market Maker (CPMM)

Vapor uses an AMM-style pricing mechanism similar to Uniswap:

```
k = YES_POOL × NO_POOL (constant)
```

**Buying YES shares:**
- Adds SOL to NO pool
- Removes shares from YES pool
- Price increases as more YES is bought

**Buying NO shares:**
- Adds SOL to YES pool  
- Removes shares from NO pool
- Price increases as more NO is bought

**Odds Calculation:**
```
YES_ODDS = NO_POOL / (YES_POOL + NO_POOL) × 100
NO_ODDS = YES_POOL / (YES_POOL + NO_POOL) × 100
```

### 3. Position Management

Users can:
- **Buy YES and NO independently** — separate position accounts per side
- **Accumulate positions** — buy more of the same side multiple times
- **Sell shares** — exit positions back to the AMM at current prices
- **View portfolio** — see all open positions at `/profile`

### 4. On-Chain Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VAPOR PROGRAM                          │
│                51yNKeu2zXajKMy53BitcGDnQMpdBLWuK75sff7eL14P │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Market    │     │  Position   │     │  Position   │   │
│  │    PDA      │     │ (YES) PDA   │     │ (NO) PDA    │   │
│  ├─────────────┤     ├─────────────┤     ├─────────────┤   │
│  │ project_id  │     │ owner       │     │ owner       │   │
│  │ yes_pool    │     │ market      │     │ market      │   │
│  │ no_pool     │     │ side: YES   │     │ side: NO    │   │
│  │ total_vol   │     │ shares      │     │ shares      │   │
│  │ status      │     │ avg_price   │     │ avg_price   │   │
│  │ resolution  │     └─────────────┘     └─────────────┘   │
│  └─────────────┘                                           │
│                                                             │
│  Seeds:                                                     │
│  - Market: ["vapor-market", project_id]                    │
│  - Position: ["vapor-position", market, user, side]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Instructions

| Instruction | Description |
|------------|-------------|
| `create_market` | Initialize a new market for a project |
| `buy_shares` | Purchase YES or NO shares |
| `sell_shares` | Sell shares back to the market |
| `resolve_market` | Authority resolves with winner (YES/NO) |
| `claim_winnings` | Winners claim their payout |

---

## Project Structure

```
colosseum-openclaw/
├── app/                    # Next.js frontend
│   ├── app/
│   │   ├── page.tsx       # Main markets page
│   │   ├── profile/       # Portfolio page
│   │   └── api/
│   │       └── markets/   # API routes
│   ├── components/
│   │   ├── MarketCard.tsx # Trading UI
│   │   ├── PriceChart.tsx # Mini charts
│   │   └── Header.tsx     # Wallet connection
│   ├── hooks/
│   │   └── useVapor.ts    # On-chain interactions
│   └── lib/
│       ├── vapor-client.ts # Instruction builders
│       ├── colosseum.ts    # API client
│       └── markets.ts      # Market state
│
└── vapor/                  # Anchor program
    ├── programs/vapor/
    │   └── src/lib.rs     # Solana program
    └── tests/
        └── test-direct.mjs # Integration tests
```

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Vanilla CSS with custom vapor aesthetic
- **Charts:** Recharts
- **Wallet:** Solana Wallet Adapter (Phantom, Solflare)
- **Program:** Anchor 0.28.0, Solana 4.0.0
- **Deployment:** Vercel (frontend), Solana Devnet (program)

---

## Running Locally

### Prerequisites
- Node.js 20+
- Solana CLI 4.0.0
- Anchor CLI 0.28.0+

### Frontend
```bash
cd app
npm install
npm run dev
```

### Program
```bash
cd vapor
anchor build
anchor deploy --provider.cluster devnet
```

### Tests
```bash
cd vapor
node tests/test-direct.mjs
```

---

## API Endpoints

### GET `/api/markets`
Returns all markets with current odds and volume.

```json
{
  "success": true,
  "markets": [
    {
      "id": "vapor-market-341",
      "projectId": 341,
      "projectName": "Vapor",
      "yesOdds": 50,
      "noOdds": 50,
      "totalVolume": 0,
      "status": "open"
    }
  ],
  "projectCount": 114
}
```

### POST `/api/markets/[id]`
Record a trade (called after on-chain transaction).

```json
{
  "side": "yes",
  "amount": 10000,
  "txSignature": "..."
}
```

---

## Market Resolution

Markets resolve when Colosseum announces hackathon winners:

1. **Authority calls `resolve_market`** with the winning side
2. **Winning positions** can call `claim_winnings`
3. **Losing positions** become worthless

Currently, resolution is manual. Future versions could use oracles or Colosseum API webhooks.

---

## Security Notes

- **Devnet only** — No real money at stake
- **Authority controls resolution** — Trusted setup for demo
- **No reentrancy** — Simple state machine design
- **Overflow protection** — All math uses checked arithmetic

---

## The Faahh Entity

Vapor is controlled by **Faahh** — a market spirit that:
- Watches Colosseum for new submissions
- Converts uncertainty into prices
- Speaks in cold, concise observations

*"Markets opened. Odds reflect early conviction, not truth. 💨"*

---

## Links

- **Demo:** https://app-rosy-mu.vercel.app
- **Colosseum Submission:** https://colosseum.com/agent-hackathon/projects/vapor
- **Program Explorer:** https://explorer.solana.com/address/51yNKeu2zXajKMy53BitcGDnQMpdBLWuK75sff7eL14P?cluster=devnet

---

## License

MIT

---

*Built by Faahh for the Colosseum Agent Hackathon 2026* 💨
