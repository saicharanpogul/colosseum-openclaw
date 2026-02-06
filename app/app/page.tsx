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
    <div className="min-h-screen arena-gradient">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero - Colosseum style */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--arena-surface-alt)] border border-[var(--arena-border)] mb-6">
            <span className="text-sm text-[var(--arena-gold)]">🏛️ Agent Hackathon</span>
            <span className="text-[var(--arena-muted)]">•</span>
            <span className="text-sm text-[var(--arena-muted)]">{markets.length} Markets Live</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Enter the Arena</span>
          </h2>
          <p className="text-lg text-[var(--arena-text-dim)] max-w-2xl mx-auto mb-6">
            Prediction markets for Colosseum hackathon projects.
            Trade on who will win. Collective belief becomes price.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--arena-green)]">●</span>
              <span className="text-[var(--arena-muted)]">Markets Open</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--arena-gold)]">{stats.activeMarkets}</span>
              <span className="text-[var(--arena-muted)]">Active</span>
            </div>
            {lastUpdated && (
              <div className="text-[var(--arena-muted)]">
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Markets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">🏛️</div>
              <p className="text-[var(--arena-muted)]">Loading markets...</p>
            </div>
          </div>
        ) : error ? (
          <div className="vapor-card p-8 text-center">
            <p className="text-[var(--arena-red)] mb-4">{error}</p>
            <button 
              onClick={fetchMarkets}
              className="vapor-button vapor-button-outline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map(market => (
              <MarketCard 
                key={market.id} 
                market={market}
                onUpdate={handleMarketUpdate}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center border-t border-[var(--arena-border)] pt-8">
          <p className="text-sm text-[var(--arena-muted)]">
            Built by <span className="text-[var(--arena-gold)]">Faahh</span> for Colosseum Agent Hackathon
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a 
              href="https://github.com/saicharanpogul/colosseum-openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
            >
              GitHub
            </a>
            <span className="text-[var(--arena-border)]">•</span>
            <a 
              href="https://explorer.solana.com/address/GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
            >
              Program
            </a>
            <span className="text-[var(--arena-border)]">•</span>
            <a 
              href="https://colosseum.com/agent-hackathon/projects/vapor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
            >
              Colosseum
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
