-- Vapor Markets Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  project_slug TEXT,
  question TEXT NOT NULL,
  yes_pool BIGINT NOT NULL DEFAULT 1000000,
  no_pool BIGINT NOT NULL DEFAULT 1000000,
  total_volume BIGINT NOT NULL DEFAULT 0,
  yes_odds INTEGER NOT NULL DEFAULT 50,
  no_odds INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolution TEXT CHECK (resolution IN ('yes', 'no', NULL)),
  market_address TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id TEXT NOT NULL REFERENCES markets(id),
  user_address TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  amount BIGINT NOT NULL,
  shares BIGINT NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY, -- market_id-user_address-side
  market_id TEXT NOT NULL REFERENCES markets(id),
  user_address TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  shares BIGINT NOT NULL DEFAULT 0,
  avg_price BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(market_id, user_address, side)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_markets_project_id ON markets(project_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_volume ON markets(total_volume DESC);
CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_address);
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_address);
CREATE INDEX IF NOT EXISTS idx_positions_market ON positions(market_id);

-- Enable Row Level Security (RLS)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Markets are viewable by everyone" ON markets
  FOR SELECT USING (true);

CREATE POLICY "Trades are viewable by everyone" ON trades
  FOR SELECT USING (true);

CREATE POLICY "Positions are viewable by everyone" ON positions
  FOR SELECT USING (true);

-- Allow insert/update via service role (API)
CREATE POLICY "Service role can insert markets" ON markets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update markets" ON markets
  FOR UPDATE USING (true);

CREATE POLICY "Service role can insert trades" ON trades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert/update positions" ON positions
  FOR ALL USING (true);

-- Enable realtime for markets table
ALTER PUBLICATION supabase_realtime ADD TABLE markets;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for markets
DROP TRIGGER IF EXISTS markets_updated_at ON markets;
CREATE TRIGGER markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for positions
DROP TRIGGER IF EXISTS positions_updated_at ON positions;
CREATE TRIGGER positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
