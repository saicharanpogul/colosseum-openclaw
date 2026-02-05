'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { StatsBar } from '@/components/StatsBar';
import { MarketCard } from '@/components/MarketCard';
import { Market, VaporStats } from '@/lib/types';

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const stats: VaporStats = {
    totalMarkets: markets.length,
    activeMarkets: markets.filter(m => m.status === 'open').length,
    resolvedMarkets: markets.filter(m => m.status === 'resolved').length,
    totalVolume: markets.reduce((sum, m) => sum + m.totalVolume, 0),
  };

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/markets');
      const data = await res.json();
      if (data.success) {
        setMarkets(data.markets);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch markets');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarketUpdate = (updatedMarket: Market) => {
    setMarkets(prev => 
      prev.map(m => m.id === updatedMarket.id ? updatedMarket : m)
    );
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Uncertainty</span>
            <span className="text-white"> → </span>
            <span className="text-white">Markets</span>
          </h2>
          <p className="text-lg text-[var(--vapor-muted)] max-w-2xl mx-auto mb-4">
            Prediction markets for every Colosseum hackathon submission. 
            Watch collective belief condense into prices. 💨
          </p>
          {lastUpdated && (
            <p className="text-xs text-[var(--vapor-muted)]">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Markets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse-glow">💨</div>
              <p className="text-[var(--vapor-muted)]">Condensing markets...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-[var(--vapor-red)] mb-4">{error}</p>
            <button 
              onClick={fetchMarkets}
              className="vapor-button vapor-button-primary"
            >
              Retry
            </button>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔮</div>
            <p className="text-[var(--vapor-muted)] mb-2">
              No markets yet. Markets appear when projects are submitted.
            </p>
            <p className="text-sm text-[var(--vapor-muted)]">
              Waiting for Colosseum hackathon submissions...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <MarketCard 
                key={market.id} 
                market={market} 
                onUpdate={handleMarketUpdate}
              />
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center space-y-2">
          <p className="text-sm text-[var(--vapor-muted)]">
            <span className="text-[var(--vapor-accent)] font-semibold">Vapor</span>
            {' '}operates on Solana Devnet
          </p>
          <p className="text-xs text-[var(--vapor-muted)]">
            Built by <span className="text-[var(--vapor-accent)]">Faahh</span> — 
            A market spirit that turns builders into probabilities
          </p>
        </div>
      </main>
    </div>
  );
}
