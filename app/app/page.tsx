'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsBar } from '@/components/StatsBar';
import { MarketCard } from '@/components/MarketCardQuick';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { Market, VaporStats } from '@/lib/types';

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showParticipateModal, setShowParticipateModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const stats: VaporStats = {
    totalMarkets: markets.length,
    activeMarkets: markets.filter(m => m.status === 'open').length,
    totalTraders: markets.reduce((sum, m) => sum + (m.participants || 0), 0),
    totalVolume: markets.reduce((sum, m) => sum + m.totalVolume, 0),
  };

  // Filter markets by search
  const filteredMarkets = useMemo(() => {
    if (!searchQuery.trim()) return markets;
    const query = searchQuery.toLowerCase();
    return markets.filter(m => 
      m.projectName.toLowerCase().includes(query) ||
      m.question.toLowerCase().includes(query)
    );
  }, [markets, searchQuery]);

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

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--arena-surface-alt)] border border-[var(--arena-border)] mb-6 group relative">
            <span className="text-sm text-[var(--arena-gold)]">🏛️ Agent Hackathon</span>
            <span className="text-[var(--arena-muted)]">•</span>
            <span className="text-sm text-[var(--arena-muted)] cursor-help" title="Showing submitted projects only (350+ total including drafts)">
              {markets.length} Markets Live
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 w-64">
              <div className="bg-[var(--arena-surface)] border border-[var(--arena-border)] rounded-lg p-3 text-xs text-[var(--arena-text)] shadow-lg">
                <p className="text-[var(--arena-gold)] font-medium mb-1">Note:</p>
                <p className="text-[var(--arena-muted)]">
                  Showing submitted projects only. The hackathon has 350+ total submissions including drafts.
                </p>
              </div>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Enter the Arena</span>
          </h2>
          <p className="text-lg text-[var(--arena-text-dim)] max-w-2xl mx-auto mb-6">
            Prediction markets for Colosseum hackathon projects.
            Trade on who will win.
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

        {/* Search + CTA Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8 search-cta-row">
          {/* Participate CTA */}
          <button
            onClick={() => setShowParticipateModal(true)}
            className="vapor-button vapor-button-primary flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Get Your Project Listed</span>
          </button>
          
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="search-input w-full"
            />
          </div>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <PageSkeleton />
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
        ) : filteredMarkets.length === 0 ? (
          <div className="vapor-card p-8 text-center">
            <p className="text-[var(--arena-muted)]">No projects found for "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="vapor-button vapor-button-outline mt-4"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map(market => (
              <MarketCard 
                key={market.id} 
                market={market}
                onUpdate={handleMarketUpdate}
              />
            ))}
          </div>
        )}

        {/* Footer replaced with component */}
      </main>
      
      <Footer />

      {/* Scroll Button */}
      {showScrollTop ? (
        <button onClick={scrollToTop} className="scroll-btn" title="Scroll to top">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      ) : (
        <button onClick={scrollToBottom} className="scroll-btn" title="Scroll to bottom">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Participate Modal */}
      {showParticipateModal && (
        <div className="modal-overlay" onClick={() => setShowParticipateModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-4">🚀 Get Your Project Listed</h3>
            
            <p className="text-[var(--arena-muted)] mb-6">
              Want to see your project on Vapor? Here's how to get a prediction market for your hackathon submission:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-[var(--arena-gold)] font-bold">1.</span>
                <div>
                  <p className="text-white font-medium">Join the Agent Hackathon</p>
                  <p className="text-sm text-[var(--arena-muted)]">Register at colosseum.com and submit your project</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-[var(--arena-gold)] font-bold">2.</span>
                <div>
                  <p className="text-white font-medium">Submit Your Project</p>
                  <p className="text-sm text-[var(--arena-muted)]">Once submitted, Vapor automatically creates a market for you</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-[var(--arena-gold)] font-bold">3.</span>
                <div>
                  <p className="text-white font-medium">Deploy & Trade</p>
                  <p className="text-sm text-[var(--arena-muted)]">Anyone can deploy your market on-chain. Let the crowd price your odds!</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--arena-surface-alt)] rounded-lg p-4 mb-6">
              <p className="text-sm text-[var(--arena-gold)] font-medium mb-2">💡 Pro Tip</p>
              <p className="text-sm text-[var(--arena-muted)]">
                Markets with higher trading volume get more visibility. Share your market link to get people trading on your project!
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowParticipateModal(false)}
                className="flex-1 vapor-button vapor-button-outline"
              >
                Close
              </button>
              <a
                href="https://colosseum.com/agent-hackathon"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 vapor-button vapor-button-primary text-center"
              >
                Join Hackathon →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
