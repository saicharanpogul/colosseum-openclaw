'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Market } from '@/lib/types';
import { MarketCard } from '@/components/MarketCard';

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await fetch(`/api/markets/${marketId}`);
        const data = await res.json();
        
        if (data.success) {
          setMarket(data.market);
        } else {
          setError(data.error || 'Market not found');
        }
      } catch (err) {
        setError('Failed to load market');
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  if (loading) {
    return (
      <div className="min-h-screen arena-gradient">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">💨</div>
              <p className="text-[var(--arena-muted)]">Loading market...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen arena-gradient">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="vapor-card p-8 text-center">
            <p className="text-[var(--arena-red)] mb-4">{error || 'Market not found'}</p>
            <button 
              onClick={() => router.push('/')}
              className="vapor-button vapor-button-outline"
            >
              ← Back to Markets
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen arena-gradient">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
          >
            ← Back to Markets
          </button>
        </div>

        {/* Market Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {market.projectName}
              </h1>
              <p className="text-lg text-[var(--arena-text-dim)]">
                {market.question}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {market.status === 'open' && (
                <span className="px-3 py-1 rounded-full bg-[var(--arena-green)] bg-opacity-20 border border-[var(--arena-green)] text-[var(--arena-green)] text-sm font-medium">
                  Open
                </span>
              )}
              {market.status === 'resolved' && (
                <span className="px-3 py-1 rounded-full bg-[var(--arena-gold)] bg-opacity-20 border border-[var(--arena-gold)] text-[var(--arena-gold)] text-sm font-medium">
                  Resolved
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">YES Odds</p>
              <p className="text-2xl font-bold text-[var(--arena-green)]">
                {market.yesOdds.toFixed(1)}%
              </p>
            </div>
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">NO Odds</p>
              <p className="text-2xl font-bold text-[var(--arena-red)]">
                {market.noOdds.toFixed(1)}%
              </p>
            </div>
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">Volume</p>
              <p className="text-2xl font-bold text-white">
                {market.totalVolume.toFixed(2)} SOL
              </p>
            </div>
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">Traders</p>
              <p className="text-2xl font-bold text-white">
                {market.participants || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trading */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart Placeholder */}
            <div className="vapor-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Price History</h2>
              <div className="bg-[var(--arena-surface-alt)] rounded-lg p-8 text-center">
                <p className="text-[var(--arena-muted)] mb-2">📊</p>
                <p className="text-sm text-[var(--arena-muted)]">
                  Price history charts coming soon
                </p>
                <p className="text-xs text-[var(--arena-text-dim)] mt-2">
                  We're collecting price data for historical charts
                </p>
              </div>
            </div>

            {/* Trading Card */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Trade</h2>
              <MarketCard 
                market={market} 
                onUpdate={setMarket}
              />
            </div>

            {/* Market Info */}
            <div className="vapor-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Market Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[var(--arena-border)]">
                  <span className="text-[var(--arena-muted)]">Project ID</span>
                  <span className="text-white font-mono text-sm">{market.projectId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--arena-border)]">
                  <span className="text-[var(--arena-muted)]">Status</span>
                  <span className="text-white capitalize">{market.status}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--arena-border)]">
                  <span className="text-[var(--arena-muted)]">Created</span>
                  <span className="text-white">
                    {market.createdAt ? new Date(market.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                {market.marketAddress && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[var(--arena-muted)]">On-Chain Address</span>
                    <a 
                      href={`https://explorer.solana.com/address/${market.marketAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--arena-gold)] hover:underline text-sm font-mono"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Activity */}
          <div className="space-y-6">
            {/* Top Traders Placeholder */}
            <div className="vapor-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top Traders</h3>
              <div className="text-center py-8">
                <p className="text-sm text-[var(--arena-muted)]">
                  Leaderboard coming soon
                </p>
              </div>
            </div>

            {/* Related Markets Placeholder */}
            <div className="vapor-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Related Markets</h3>
              <div className="text-center py-8">
                <p className="text-sm text-[var(--arena-muted)]">
                  Similar markets coming soon
                </p>
              </div>
            </div>

            {/* Share */}
            <div className="vapor-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Share</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const text = `Check out this prediction market: "${market.projectName}" on Vapor 💨\n\nhttps://app-rosy-mu.vercel.app/market/${marketId}`;
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full vapor-button vapor-button-outline flex items-center justify-center gap-2"
                >
                  <span>𝕏</span>
                  <span>Share on X</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://app-rosy-mu.vercel.app/market/${marketId}`);
                  }}
                  className="w-full vapor-button vapor-button-outline"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
