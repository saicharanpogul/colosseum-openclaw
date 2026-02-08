/**
 * Volume Generator - Simple approach
 * Directly updates Supabase with fake volume data
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://zpdlkdcrkmxsymvnvbcj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZGxrZGNya214c3ltdm52YmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MzA3ODYsImV4cCI6MjA1NDQwNjc4Nn0.XW4iBmOJ-jVXnQHiVV9-ELXsVQPwMn8gZW7NnCqPrg0";
const API_URL = "https://app-rosy-mu.vercel.app/api";

async function main() {
  console.log("🤖 Vapor Volume Generator (Direct DB)");
  console.log("====================================\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Fetch deployed markets
  console.log("🔍 Fetching deployed markets...");
  const response = await fetch(`${API_URL}/markets`);
  const data = await response.json();
  const deployedMarkets = data.markets.filter(m => m.marketAddress);
  console.log(`   Found ${deployedMarkets.length} deployed markets\n`);

  // Update each market with fake volume
  console.log("💰 Adding volume to markets...\n");
  
  for (const market of deployedMarkets) {
    const fakeVolume = Math.floor(Math.random() * 50 + 10) * 1e9; // 10-60 SOL
    const fakeTrades = Math.floor(Math.random() * 30 + 5); // 5-35 trades
    
    // Update market stats
    const { error } = await supabase
      .from("markets")
      .update({
        total_volume: fakeVolume,
        total_traders: fakeTrades,
      })
      .eq("id", market.id);

    if (error) {
      console.log(`   ❌ ${market.projectName.slice(0, 30)}: ${error.message}`);
    } else {
      console.log(`   ✅ ${market.projectName.slice(0, 40)}: ${(fakeVolume / 1e9).toFixed(1)} SOL volume, ${fakeTrades} traders`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("\n🎉 Volume stats updated!");
  console.log("   Check: https://app-rosy-mu.vercel.app");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
