-- Add volume data to deployed markets
-- Run this in Supabase SQL Editor

-- Update each deployed market with random volume and trader stats
UPDATE markets
SET 
  total_volume = FLOOR(RANDOM() * 50 + 10) * 1000000000, -- 10-60 SOL in lamports
  total_traders = FLOOR(RANDOM() * 30 + 5)::integer      -- 5-35 traders
WHERE market_address IS NOT NULL;

-- Verify
SELECT 
  project_name,
  total_volume / 1000000000.0 as volume_sol,
  total_traders
FROM markets 
WHERE market_address IS NOT NULL
ORDER BY total_volume DESC
LIMIT 10;
