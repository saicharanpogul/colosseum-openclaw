# Volume Generator

Automated script to generate realistic trading activity on Vapor markets.

## Setup

1. **Send devnet SOL to main wallet:**
   ```
   EwdqGaZHkibd1VX6yUqndbRyBFubFNfBufWTtkkHSHNE
   ```
   Need at least **100 SOL** for full simulation

2. **Run the script:**
   ```bash
   cd vapor
   npm run generate-volume
   ```

## What it does

1. **Creates 10 trader bots** with different strategies:
   - **Bullish:** 70% YES trades
   - **Bearish:** 70% NO trades  
   - **Random:** 50/50
   - **Contrarian:** Bets against current odds

2. **Distributes SOL** to each bot (5 SOL per bot)

3. **Generates 100 trades** across random markets:
   - Random amounts (0.1 - 2 SOL)
   - Real on-chain transactions
   - Populates price history
   - Updates leaderboard

## Results

- ✅ Price history charts show real movement
- ✅ Leaderboard populated with P&L data
- ✅ Market stats show volume and traders
- ✅ Tests agent API in production

## Configuration

Edit `scripts/generate-volume.ts` to adjust:
- `numTraders`: Number of bot wallets (default: 10)
- `solPerTrader`: SOL per bot (default: 5)
- `numTrades`: Total trades (default: 100)
- Trade amounts, strategies, etc.

## Notes

- Uses real devnet transactions
- Requires deployed markets (checks via API)
- Waits 500ms between trades to avoid rate limiting
- Fallback to manual transfer if airdrops fail
