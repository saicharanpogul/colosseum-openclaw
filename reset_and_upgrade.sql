-- UPGRADE VAPOR TO V2 (Real SOL + Secure Resolution)

-- 1. Add new fields for payout calculation
ALTER TABLE markets ADD COLUMN IF NOT EXISTS net_sol_deposited BIGINT DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolved_pot_size BIGINT DEFAULT 0;

-- 2. Reset all markets (since Program ID changed, old PDAs are invalid)
UPDATE markets 
SET 
  market_address = NULL, 
  yes_pool = 1000000, 
  no_pool = 1000000, 
  total_volume = 0, 
  status = 'open', 
  resolution = NULL, 
  net_sol_deposited = 0, 
  resolved_pot_size = 0;

-- 3. Clear old trades and positions
TRUNCATE TABLE trades;
TRUNCATE TABLE positions;
