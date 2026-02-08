-- Create price_history table for storing historical market odds
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  yes_odds DECIMAL(5,2) NOT NULL,
  no_odds DECIMAL(5,2) NOT NULL,
  yes_pool BIGINT NOT NULL,
  no_pool BIGINT NOT NULL,
  total_volume BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for fast queries
  CONSTRAINT fk_market FOREIGN KEY (market_id) REFERENCES markets(id)
);

-- Index for fast market lookups
CREATE INDEX IF NOT EXISTS idx_price_history_market_id ON price_history(market_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- Composite index for market + time queries
CREATE INDEX IF NOT EXISTS idx_price_history_market_time ON price_history(market_id, recorded_at DESC);

-- Add comment
COMMENT ON TABLE price_history IS 'Historical price snapshots for market charts';
