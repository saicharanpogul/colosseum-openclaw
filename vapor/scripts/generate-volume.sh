#!/bin/bash
# Generate trading volume on Vapor markets

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
export ANCHOR_WALLET=/Users/saicharan/.config/solana/id.json
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com

cd "$(dirname "$0")/.."

echo "🤖 Generating volume on Vapor markets..."
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/volume.ts

echo ""
echo "✅ Volume generation complete!"
echo "📊 Check leaderboard: https://app-rosy-mu.vercel.app/leaderboard"
